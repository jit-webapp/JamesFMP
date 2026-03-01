document.addEventListener('DOMContentLoaded', () => {
    
	// 2. เพิ่มโค้ดนี้เพื่อนำเลขเวอร์ชันไปแสดงที่ Footer
    const versionEl = document.getElementById('version-display');
    if (versionEl) {
        versionEl.textContent = APP_VERSION;
    }
	
	// --- WebAuthn Helpers ---
	// แปลง ArrayBuffer เป็น Base64URL string
	function bufferToBase64url(buffer) {
		const bytes = new Uint8Array(buffer);
		let str = '';
		for (const charCode of bytes) {
			str += String.fromCharCode(charCode);
		}
		return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
	}

	// แปลง Base64URL string กลับเป็น Uint8Array
	function base64urlToBuffer(base64url) {
		const padding = '='.repeat((4 - base64url.length % 4) % 4);
		const base64 = (base64url + padding).replace(/-/g, '+').replace(/_/g, '/');
		const rawData = atob(base64);
		const outputArray = new Uint8Array(rawData.length);
		for (let i = 0; i < rawData.length; ++i) {
			outputArray[i] = rawData.charCodeAt(i);
		}
		return outputArray;
	}
	
    const DB_NAME = 'expenseTrackerDB_JamesIT';
    const DB_VERSION = 10; // *** อัปเดตเป็นเวอร์ชัน 10 ***
	
    const STORE_TRANSACTIONS = 'transactions';
    const STORE_CATEGORIES = 'categories';
    const STORE_FREQUENT_ITEMS = 'frequentItems';
    const STORE_CONFIG = 'config';
    const STORE_ACCOUNTS = 'accounts'; 
    const STORE_AUTO_COMPLETE = 'autoComplete'; 
	const STORE_RECURRING = 'recurring'; // *** เพิ่ม Store ใหม่ ***
	const STORE_BUDGETS = 'budgets'; // [NEW]
	const STORE_CUSTOM_NOTIFY = 'custom_notifications';
	const STORE_NOTIFICATIONS = 'notifications'; // <--- (เก็บประวัติแจ้งเตือนที่จะ Sync)
	const STORE_DRAFTS = 'drafts'; // *** เพิ่ม Store สำหรับ Draft ***
	const LINE_USER_ID_KEY = 'lineUserId'; // LineID
	const STORE_VOICE_COMMANDS = 'voiceCommands'; // *** เพิ่ม Store สำหรับคำสั่งเสียงที่เรียนรู้ ***
	const STORE_ICS_IMPORTS = 'icsImports';      // เก็บข้อมูลกลุ่มไฟล์
	const STORE_IMPORTED_EVENTS = 'importedEvents'; // เก็บเหตุการณ์แต่ละรายการ
    
    const PAGE_IDS = ['page-home', 'page-list', 'page-calendar', 'page-accounts', 'page-settings', 'page-guide']; // เพิ่ม 'page-accounts'
    // ********** Master Password Config **********
    const VALID_MASTER_HASH = window.MASTER_PASSWORD_HASH;
    // ************************************************

    let db;
    const SpeechRecognition = window.SpeechRecognition ||
    window.webkitSpeechRecognition;
    let recognition;

    if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.lang = 'th-TH'; 
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;
    } else {
        console.warn("Web Speech API not supported in this browser.");
    }
    
    // ********** NEW AUTO LOCK VARIABLES **********
    let lastActivityTime = Date.now();
    let autoLockTimeoutId = null;
    const AUTOLOCK_CONFIG_KEY = 'autoLockTimeout';
    // *********************************************
    
    // ********** NEW DARK MODE VARIABLE **********
    const DARK_MODE_CONFIG_KEY = 'isDarkMode'; 
    // *********************************************
	
	// +++ เพิ่มส่วนนี้ +++
    const AUTO_CONFIRM_CONFIG_KEY = 'autoConfirmPassword';
    // ++++++++++++++++++
	
    const DEFAULT_PASSWORD = window.APP_DEFAULTS ? window.APP_DEFAULTS.DEFAULT_PASSWORD : '1234';
	
	const EXPENSE_KEYWORD_MAP = {
				// อาหาร
				'ข้าว': 'อาหาร', 'กับข้าว': 'อาหาร', 'ก๋วยเตี๋ยว': 'อาหาร', 'อาหาร': 'อาหาร', 'มื้อเช้า': 'อาหาร', 'มื้อกลางวัน': 'อาหาร', 'มื้อเย็น': 'อาหาร', 'ข้าวเหนียว': 'อาหาร', 'ส้มตำ': 'อาหาร', 'ลาบ': 'อาหาร', 'ต้มยำ': 'อาหาร', 'ผัดไทย': 'อาหาร', 'กระเพรา': 'อาหาร', 'หมูกระทะ': 'อาหาร', 'ชาบู': 'อาหาร', 'ปิ้งย่าง': 'อาหาร', 'ซูชิ': 'อาหาร', 'ราเมน': 'อาหาร', 'ขนมจีน': 'อาหาร', 'ข้าวมันไก่': 'อาหาร', 'ข้าวหมกไก่': 'อาหาร', 'ข้าวแกง': 'อาหาร', 'rice': 'อาหาร', 'food': 'อาหาร',
				// เครื่องดื่ม
				'กาแฟ': 'เครื่องดื่ม', 'ชา': 'เครื่องดื่ม', 'น้ำเปล่า': 'เครื่องดื่ม', 'นม': 'เครื่องดื่ม', 'น้ำอัดลม': 'เครื่องดื่ม', 'โค้ก': 'เครื่องดื่ม', 'เป๊ปซี่': 'เครื่องดื่ม', 'เครื่องดื่ม': 'เครื่องดื่ม', 'ชาเขียว': 'เครื่องดื่ม', 'น้ำผลไม้': 'เครื่องดื่ม', 'สมูทตี้': 'เครื่องดื่ม', 'cafe': 'เครื่องดื่ม', 'coffee': 'เครื่องดื่ม', 'tea': 'เครื่องดื่ม', 'water': 'เครื่องดื่ม',
				// เดินทาง (ขนส่งสาธารณะ)
				'bts': 'เดินทาง', 'mrt': 'เดินทาง', 'รถเมล์': 'เดินทาง', 'รถไฟ': 'เดินทาง', 'รถไฟฟ้า': 'เดินทาง', 'รถตู้': 'เดินทาง', 'วิน': 'เดินทาง', 'มอไซค์': 'เดินทาง', 'taxi': 'เดินทาง', 'แท็กซี่': 'เดินทาง', 'grab': 'เดินทาง', 'bolt': 'เดินทาง', 'inDrive': 'เดินทาง', 'ทางด่วน': 'เดินทาง', 'ค่าทางด่วน': 'เดินทาง', 'toll': 'เดินทาง',
				// รถยนต์ (ส่วนตัว)
				'รถยนต์': 'รถยนต์', 'รถ': 'รถยนต์', 'car': 'รถยนต์', 'น้ำมัน': 'รถยนต์', 'แก๊ส': 'รถยนต์', 'เชื้อเพลิง': 'รถยนต์', 'เติมน้ำมัน': 'รถยนต์', 'เติมแก๊ส': 'รถยนต์', 'ประกัน': 'รถยนต์', 'ประกันภัย': 'รถยนต์', 'ประกันรถ': 'รถยนต์', 'ต่อทะเบียน': 'รถยนต์', 'พรบ.': 'รถยนต์', 'ซ่อมรถ': 'รถยนต์', 'ซ่อม': 'รถยนต์', 'ล้างรถ': 'รถยนต์', 'ล้าง': 'รถยนต์', 'จอดรถ': 'รถยนต์', 'ค่าจอด': 'รถยนต์', 'parking': 'รถยนต์', 'ค่าปรับ': 'รถยนต์', 'ใบสั่ง': 'รถยนต์', 'เปลี่ยนยาง': 'รถยนต์', 'ยางรถ': 'รถยนต์', 'แบตเตอรี่': 'รถยนต์', 'insurance': 'รถยนต์',
				// ที่พัก/ค่าเช่า (ถ้ามีหมวดนี้)
				'ค่าเช่า': 'ที่พัก', 'เช่าบ้าน': 'ที่พัก', 'หอพัก': 'ที่พัก', 'คอนโด': 'ที่พัก', 'บ้าน': 'ที่พัก', 'ห้อง': 'ที่พัก', 'rent': 'ที่พัก',
				// ค่าสาธารณูปโภค (ของใช้ในบ้าน)
				'ค่าไฟ': 'ของใช้ในบ้าน', 'ค่าน้ำ': 'ของใช้ในบ้าน', 'ค่าเน็ต': 'ของใช้ในบ้าน', 'อินเทอร์เน็ต': 'ของใช้ในบ้าน', 'ค่าอินเตอร์เน็ต': 'ของใช้ในบ้าน', 'ค่าโทรศัพท์': 'ของใช้ในบ้าน', 'ค่าโทร': 'ของใช้ในบ้าน', 'ค่าแก๊ส': 'ของใช้ในบ้าน', 'ขยะ': 'ของใช้ในบ้าน', 'ส่วนกลาง': 'ของใช้ในบ้าน', 'ไฟฟ้า': 'ของใช้ในบ้าน', 'ประปา': 'ของใช้ในบ้าน', 'utility': 'ของใช้ในบ้าน',
				// ของใช้ส่วนตัว
				'สบู่': 'ของใช้ส่วนตัว', 'ยาสีฟัน': 'ของใช้ส่วนตัว', 'แปรงสีฟัน': 'ของใช้ส่วนตัว', 'แชมพู': 'ของใช้ส่วนตัว', 'ครีม': 'ของใช้ส่วนตัว', 'โลชั่น': 'ของใช้ส่วนตัว', 'เครื่องสำอาง': 'ของใช้ส่วนตัว', 'แต่งหน้า': 'ของใช้ส่วนตัว', 'มีดโกน': 'ของใช้ส่วนตัว', 'ผ้าอนามัย': 'ของใช้ส่วนตัว', 'สำลี': 'ของใช้ส่วนตัว', 'น้ำหอม': 'ของใช้ส่วนตัว', 'personal care': 'ของใช้ส่วนตัว',
				// ของใช้ในบ้าน (ที่ไม่ใช่สาธารณูปโภค)
				'น้ำยาล้างจาน': 'ของใช้ในบ้าน', 'ฟองน้ำ': 'ของใช้ในบ้าน', 'ผงซักฟอก': 'ของใช้ในบ้าน', 'น้ำยาปรับผ้านุ่ม': 'ของใช้ในบ้าน', 'ทิชชู่': 'ของใช้ในบ้าน', 'กระดาษชำระ': 'ของใช้ในบ้าน', 'ถุงขยะ': 'ของใช้ในบ้าน', 'ไม้กวาด': 'ของใช้ในบ้าน', 'ที่ปัดฝุ่น': 'ของใช้ในบ้าน', 'น้ำยาทำความสะอาด': 'ของใช้ในบ้าน', 'household': 'ของใช้ในบ้าน',
				// สุขภาพ/ค่ารักษาพยาบาล
				'หมอ': 'สุขภาพ', 'คุณหมอ': 'สุขภาพ', 'แพทย์': 'สุขภาพ', 'โรงพยาบาล': 'สุขภาพ', 'รพ.': 'สุขภาพ', 'คลินิก': 'สุขภาพ', 'ค่ารักษา': 'สุขภาพ', 'ค่ายา': 'สุขภาพ', 'ยา': 'สุขภาพ', 'วิตามิน': 'สุขภาพ', 'อาหารเสริม': 'สุขภาพ', 'ฟิตเนส': 'สุขภาพ', 'ออกกำลังกาย': 'สุขภาพ', 'เวทเทรนนิ่ง': 'สุขภาพ', 'โยคะ': 'สุขภาพ', 'ตรวจสุขภาพ': 'สุขภาพ', 'วัคซีน': 'สุขภาพ', 'health': 'สุขภาพ', 'hospital': 'สุขภาพ', 'medicine': 'สุขภาพ',
				// การศึกษา
				'หนังสือ': 'การศึกษา', 'ตำรา': 'การศึกษา', 'ค่าเทอม': 'การศึกษา', 'เรียน': 'การศึกษา', 'คอร์ส': 'การศึกษา', 'อบรม': 'การศึกษา', 'สัมมนา': 'การศึกษา', 'ค่าสมัคร': 'การศึกษา', 'อุปกรณ์การเรียน': 'การศึกษา', 'ดินสอ': 'การศึกษา', 'ปากกา': 'การศึกษา', 'สมุด': 'การศึกษา', 'ปริ้น': 'การศึกษา', 'ถ่ายเอกสาร': 'การศึกษา', 'education': 'การศึกษา', 'school': 'การศึกษา', 'course': 'การศึกษา',
				// บันเทิง
				'หนัง': 'บันเทิง', 'ภาพยนตร์': 'บันเทิง', 'ซีรีส์': 'บันเทิง', 'คอนเสิร์ต': 'บันเทิง', 'เที่ยว': 'บันเทิง', 'ท่องเที่ยว': 'บันเทิง', 'travel': 'บันเทิง', 'เกม': 'บันเทิง', 'เกมส์': 'บันเทิง', 'game': 'บันเทิง', 'สตรีมมิ่ง': 'บันเทิง', 'netflix': 'บันเทิง', 'disney+': 'บันเทิง', 'hbo': 'บันเทิง', 'spotify': 'บันเทิง', 'youtube': 'บันเทิง', 'เพลง': 'บันเทิง', 'ดนตรี': 'บันเทิง', 'คาราโอเกะ': 'บันเทิง', 'entertainment': 'บันเทิง',
				// ช้อปปิ้ง/ของใช้ทั่วไป
				'ช้อป': 'ช้อปปิ้ง', 'ช้อปปิ้ง': 'ช้อปปิ้ง', 'ซื้อ': 'ช้อปปิ้ง', 'ของ': 'ช้อปปิ้ง', 'สินค้า': 'ช้อปปิ้ง', 'ออนไลน์': 'ช้อปปิ้ง', 'shopee': 'ช้อปปิ้ง', 'lazada': 'ช้อปปิ้ง', 'tiktok': 'ช้อปปิ้ง', 'marketplace': 'ช้อปปิ้ง', 'shopping': 'ช้อปปิ้ง',
				// สัตว์เลี้ยง
				'หมา': 'สัตว์เลี้ยง', 'สุนัข': 'สัตว์เลี้ยง', 'แมว': 'สัตว์เลี้ยง', 'cat': 'สัตว์เลี้ยง', 'dog': 'สัตว์เลี้ยง', 'อาหารสัตว์': 'สัตว์เลี้ยง', 'อาหารหมา': 'สัตว์เลี้ยง', 'อาหารแมว': 'สัตว์เลี้ยง', 'ทรายแมว': 'สัตว์เลี้ยง', 'ที่ใส่ทราย': 'สัตว์เลี้ยง', 'รักษาสัตว์': 'สัตว์เลี้ยง', 'วัคซีนสัตว์': 'สัตว์เลี้ยง', 'pet': 'สัตว์เลี้ยง',
				// การเงิน/การลงทุน
				'หุ้น': 'การเงิน', 'stock': 'การเงิน', 'กองทุน': 'การเงิน', 'fund': 'การเงิน', 'คริปโต': 'การเงิน', 'crypto': 'การเงิน', 'bitcoin': 'การเงิน', 'btc': 'การเงิน', 'ethereum': 'การเงิน', 'eth': 'การเงิน', 'ซื้อขาย': 'การเงิน', 'trade': 'การเงิน', 'ค่าธรรมเนียม': 'การเงิน', 'fee': 'การเงิน', 'ดอกเบี้ย': 'การเงิน', 'interest': 'การเงิน', 'investment': 'การเงิน',
				// บริจาค/ทำบุญ
				'ทำบุญ': 'บริจาค', 'บริจาค': 'บริจาค', 'ใส่บาตร': 'บริจาค', 'ตักบาตร': 'บริจาค', 'วัด': 'บริจาค', 'donation': 'บริจาค', 'charity': 'บริจาค',
				// รายจ่ายอื่นๆ (default)
				'อื่นๆ': 'รายจ่ายอื่นๆ', 'other': 'รายจ่ายอื่นๆ'
			};
	
	const uniqueExpenseCategories = [...new Set(Object.values(EXPENSE_KEYWORD_MAP))].sort();
	
	
    // --- ค่าตั้งต้นของหมวดหมู่ ---
	const DEFAULT_CATEGORIES = {
		income: ['เงินเดือน', 'รายได้เสริม', 'รายได้ร้าน', 'ค่าคอม', 'รายได้อื่นๆ'],
		expense: uniqueExpenseCategories  // <-- ใช้ uniqueExpenseCategories แทน
	};
    const DEFAULT_FREQUENT_ITEMS = window.APP_DEFAULTS ? window.APP_DEFAULTS.DEFAULT_FREQUENT_ITEMS : ['กินข้าว', 'รายจ่ายทั่วไป'];
    
    // *** NEW: Icon Choices for Account Settings ***
    const ICON_CHOICES = [
        'fa-wallet', 'fa-piggy-bank', 'fa-credit-card', 'fa-money-bill-wave', 
        'fa-sack-dollar', 'fa-building-columns', 'fa-car', 'fa-house', 
        'fa-utensils', 'fa-dumbbell', 'fa-plane', 'fa-graduation-cap', 
        'fa-shopping-cart', 'fa-hospital', 'fa-gift', 'fa-receipt',
        'fa-file-invoice-dollar', 'fa-briefcase', 'fa-mobile-screen', 'fa-store', 
        'fa-person-running', 'fa-paw', 'fa-heart', 'fa-lightbulb'
    ];

	// [1] ตั้งค่าระดับตัวอักษร (ปรับปรุงใหม่ 6 ระดับ)
    const fontSettings = [
        { label: 'เล็กสุดๆ', size: '12px' }, // ระดับ 0
        { label: 'เล็ก', size: '14px' },      // ระดับ 1
        { label: 'ปกติ', size: '16px' },      // ระดับ 2 (ค่ามาตรฐาน)
        { label: 'ใหญ่', size: '18px' },      // ระดับ 3
        { label: 'ใหญ่มาก', size: '20px' },   // ระดับ 4
        { label: 'ใหญ่สุดๆ', size: '24px' }   // ระดับ 5
    ];

    // ฟังก์ชันช่วย: เปลี่ยนขนาด Font และบันทึก
    function updateAppFont(index) {
        if (!fontSettings[index]) return;
        // เปลี่ยนที่ html tag เพื่อให้ทั้งแอปขยายตาม
        document.documentElement.style.fontSize = fontSettings[index].size;
        localStorage.setItem('appFontIndex', index);
    }

    // ฟังก์ชันช่วย: อัปเดตข้อความป้ายกำกับ (เช่น "ปกติ", "ใหญ่")
    function updateFontLabel(index) {
        const labelDisplay = document.getElementById('fontLabelDisplay');
        if (labelDisplay && fontSettings[index]) {
            labelDisplay.innerText = fontSettings[index].label;
        }
    }
	
    // ฟังก์ชัน Export Excel แท้ (.xlsx) รองรับ Office 365 + สรุปยอด
    function exportAccountExcel(accountId) {
        // ตรวจสอบว่าโหลด Library มาหรือยัง
        if (typeof XLSX === 'undefined') {
            Swal.fire('Error', 'ไม่พบ Library สำหรับสร้าง Excel (กรุณาตรวจสอบ index.html)', 'error');
            return;
        }

        const account = state.accounts.find(a => a.id === accountId);
        if (!account) return;

        const txs = state.transactions.filter(t => t.accountId === accountId || t.toAccountId === accountId);
        
        if (txs.length === 0) {
            Swal.fire('ไม่มีข้อมูล', 'บัญชีนี้ยังไม่มีรายการธุรกรรมให้ดาวน์โหลด', 'info');
            return;
        }

        // เรียงวันที่เก่า -> ใหม่
        txs.sort((a, b) => new Date(a.date) - new Date(b.date));

        // --- ส่วนที่เพิ่ม: คำนวณยอดรวม ---
        let totalIncome = 0;
        let totalExpense = 0;
        let totalTransferIn = 0;
        let totalTransferOut = 0;

        // เตรียมข้อมูลรายการ (Data Rows)
        const dataRows = txs.map(tx => {
            const d = new Date(tx.date);
            const dateStr = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
            const timeStr = d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
            
            let typeStr = tx.type;
            let amount = tx.amount;
            let category = tx.category;

            // จัดการประเภท, ยอดเงิน และบวกยอดรวม
            if (tx.type === 'transfer') {
                if (tx.accountId === accountId) {
                    typeStr = 'โอนออก';
                    amount = -Math.abs(amount);
                    category = 'โอนไปยัง ' + (state.accounts.find(a => a.id === tx.toAccountId)?.name || 'N/A');
                    totalTransferOut += Math.abs(tx.amount);
                } else {
                    typeStr = 'รับโอน';
                    amount = Math.abs(amount);
                    category = 'รับโอนจาก ' + (state.accounts.find(a => a.id === tx.accountId)?.name || 'N/A');
                    totalTransferIn += Math.abs(tx.amount);
                }
            } else if (tx.type === 'expense') {
                typeStr = 'รายจ่าย';
                amount = -Math.abs(amount);
                totalExpense += Math.abs(tx.amount);
            } else if (tx.type === 'income') {
                typeStr = 'รายรับ';
                amount = Math.abs(amount);
                totalIncome += Math.abs(tx.amount);
            }

            return {
                "วันที่": dateStr,
                "เวลา": timeStr,
                "ประเภท": typeStr,
                "รายการ": tx.name || '',
                "หมวดหมู่": category || '',
                "จำนวนเงิน": amount, 
                "หมายเหตุ": tx.desc || ''
            };
        });

        // --- ส่วนที่เพิ่ม: สร้างข้อมูลสรุปยอด (Summary) ---
        // เราจะสร้าง Array ของ Object เพื่อวางไว้ด้านบน
        const summaryData = [
            { "วันที่": `สรุปรายการบัญชี: ${account.name}` }, // หัวข้อ
            { "วันที่": "รวมรายรับ", "จำนวนเงิน": totalIncome },
            { "วันที่": "รวมรายจ่าย", "จำนวนเงิน": totalExpense },
            { "วันที่": "รวมรับโอน", "จำนวนเงิน": totalTransferIn },
            { "วันที่": "รวมโอนออก", "จำนวนเงิน": totalTransferOut },
            { "วันที่": "สุทธิ (รับ-จ่าย)", "จำนวนเงิน": (totalIncome + totalTransferIn) - (totalExpense + totalTransferOut) },
            { "วันที่": "" } // เว้นบรรทัดว่าง 1 บรรทัด
        ];

        // รวมข้อมูล: สรุปยอด + รายการ
        // หมายเหตุ: XLSX.utils.json_to_sheet จะใช้ Keys ของ Object แรกเป็น Header
        // ดังนั้นเราต้องจัดการให้ดี หรือใช้วิธี sheet_add_json เพื่อแปะข้อมูลต่อกัน

        // วิธีที่ง่าย: สร้าง Sheet จาก transaction ก่อน เพื่อให้ได้ Header ที่ถูกต้อง
        const ws = XLSX.utils.json_to_sheet(dataRows, { origin: "A9" }); // เริ่มที่บรรทัดที่ 9 (เว้นที่ให้สรุปยอด)

        // เขียนข้อมูลสรุปยอดทับลงไปในช่วงบรรทัดแรก (A1)
        // ใช้ array of arrays เพื่อความอิสระในการจัดวาง
        const summaryHeader = [
            [`สรุปรายการบัญชี: ${account.name}`],
            ["รายการ", "ยอดรวม (บาท)"],
            ["รายรับทั้งหมด ", totalIncome],
            ["รายจ่ายทั้งหมด ", totalExpense],
            ["รับโอน ", totalTransferIn],
            ["โอนออก ", totalTransferOut],
            ["ยอดสุทธิ", (totalIncome + totalTransferIn) - (totalExpense + totalTransferOut)],
            [] // เว้นบรรทัด
        ];

        XLSX.utils.sheet_add_aoa(ws, summaryHeader, { origin: "A1" });

        // กำหนดความกว้างคอลัมน์ (ตามที่คุณขอปรับขนาด)
        const wscols = [
            {wch: 13}, // วันที่ (12)
            {wch: 9},  // เวลา
            {wch: 10}, // ประเภท
            {wch: 15}, // รายการ (ปรับลดเหลือ 15)
            {wch: 15}, // หมวดหมู่ (ปรับลดเหลือ 15)
            {wch: 12}, // จำนวนเงิน (ปรับลดเหลือ 12)
            {wch: 45}  // หมายเหตุ
        ];
        ws['!cols'] = wscols;

        // สร้าง Workbook และเพิ่ม Sheet
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Statement");

        // ตั้งชื่อไฟล์
        const today = new Date();
        const dateFile = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
        
        // สั่งดาวน์โหลดไฟล์ .xlsx
        XLSX.writeFile(wb, `Statement_${account.name}_${dateFile}.xlsx`);
    }

    function initDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = (event) => {
                console.error("IndexedDB error:", event.target.error);
                reject('Error opening database');
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                const tx = event.target.transaction;
                
                console.log(`Upgrading DB from version ${event.oldVersion} to ${event.newVersion}`);

                // --- V1: Transactions & Categories ---
                if (event.oldVersion < 1) {
                    // Store: Transactions
                    if (!db.objectStoreNames.contains(STORE_TRANSACTIONS)) {
                        const txStore = db.createObjectStore(STORE_TRANSACTIONS, { keyPath: 'id' });
                        txStore.createIndex('date', 'date', { unique: false });
                    }
                    // Store: Categories
                    if (!db.objectStoreNames.contains(STORE_CATEGORIES)) {
                        db.createObjectStore(STORE_CATEGORIES, { keyPath: 'type' });
                    }
                }

                // --- V2: Frequent Items & Config ---
                if (event.oldVersion < 2) {
                    if (!db.objectStoreNames.contains(STORE_FREQUENT_ITEMS)) {
                        const freqStore = db.createObjectStore(STORE_FREQUENT_ITEMS, { keyPath: 'name' });
                        freqStore.createIndex('count', 'count', { unique: false });
                    }
                    if (!db.objectStoreNames.contains(STORE_CONFIG)) {
                        db.createObjectStore(STORE_CONFIG, { keyPath: 'key' });
                    }
                }

                // --- V3: Multi-Account Support ---
                if (event.oldVersion < 3) {
                    if (!db.objectStoreNames.contains(STORE_ACCOUNTS)) {
                        const accStore = db.createObjectStore(STORE_ACCOUNTS, { keyPath: 'id' });
                        // สร้างบัญชีเริ่มต้น (Cash) ถ้ายังไม่มี
                        accStore.transaction.oncomplete = () => {
                            const accTx = db.transaction(STORE_ACCOUNTS, 'readwrite').objectStore(STORE_ACCOUNTS);
                            accTx.add({ id: 'acc_cash', name: 'เงินสด', balance: 0, icon: 'fa-wallet', color: 'bg-green-500' });
                        };
                    }
                    // เพิ่ม accountId ให้ transaction เก่าๆ (Migration)
                    if (db.objectStoreNames.contains(STORE_TRANSACTIONS)) {
                        const store = tx.objectStore(STORE_TRANSACTIONS);
                        store.openCursor().onsuccess = (e) => {
                            const cursor = e.target.result;
                            if (cursor) {
                                const data = cursor.value;
                                if (!data.accountId) {
                                    data.accountId = 'acc_cash';
                                    cursor.update(data);
                                }
                                cursor.continue();
                            }
                        };
                    }
                }

                // --- V4: Auto Complete Data ---
                if (event.oldVersion < 4) {
                    if (!db.objectStoreNames.contains(STORE_AUTO_COMPLETE)) {
                        db.createObjectStore(STORE_AUTO_COMPLETE, { keyPath: 'id' });
                    }
                }

                // --- V5: Recurring Transactions (ใหม่!) ---
                if (event.oldVersion < 5) {
                    if (!db.objectStoreNames.contains(STORE_RECURRING)) {
                        // สร้าง Store เก็บกฎรายการประจำ
                        // id: key หลัก
                        // nextDueDate: เอาไว้ query ว่ารายการไหนถึงกำหนดจ่ายแล้ว
                        const recurringStore = db.createObjectStore(STORE_RECURRING, { keyPath: 'id' });
                        recurringStore.createIndex('nextDueDate', 'nextDueDate', { unique: false });
                    }
                    console.log('IndexedDB Upgrade: Running v5 migration (Added "recurring" store)');
                }
				
				// --- V6: Budgets Feature (NEW) ---
				if (event.oldVersion < 6) {
					if (!db.objectStoreNames.contains(STORE_BUDGETS)) {
						// keyPath เป็น category เพราะ 1 หมวดหมู่มี 1 งบประมาณ
						db.createObjectStore(STORE_BUDGETS, { keyPath: 'category' }); 
					}
					console.log('IndexedDB Upgrade: Running v6 migration (Added "budgets" store)');
				}
				
				// --- V7: Notifications Feature (NEW) ---
				if (event.oldVersion < 7) {
					if (!db.objectStoreNames.contains(STORE_NOTIFICATIONS)) {
						// +++ [เพิ่มตรงนี้] สร้างห้อง notifications +++
					db.createObjectStore(STORE_NOTIFICATIONS, { keyPath: 'id' });
					}
					console.log('IndexedDB Upgrade: Running v6 migration (Added "budgets" store)');
				}
				
				// --- V8: Quick Drafts ---
				if (event.oldVersion < 8) {
					if (!db.objectStoreNames.contains(STORE_DRAFTS)) {
						db.createObjectStore(STORE_DRAFTS, { keyPath: 'id' });
					}
					console.log('IndexedDB Upgrade: Running v8 migration (Added "drafts" store)');
				}
				
				// --- V9: Voice Commands Learning ---
				if (event.oldVersion < 9) {
					if (!db.objectStoreNames.contains(STORE_VOICE_COMMANDS)) {
						const voiceStore = db.createObjectStore(STORE_VOICE_COMMANDS, { keyPath: 'id' });
						voiceStore.createIndex('command', 'command', { unique: false }); // สำหรับค้นหาตามคำสั่ง
						voiceStore.createIndex('action', 'action', { unique: false });
					}
					console.log('IndexedDB Upgrade: Running v9 migration (Added "voiceCommands" store)');
				}
				
				// --- V10: ICS Import Support ---
				if (event.oldVersion < 10) {
					// Store สำหรับกลุ่มไฟล์
					if (!db.objectStoreNames.contains(STORE_ICS_IMPORTS)) {
						db.createObjectStore(STORE_ICS_IMPORTS, { keyPath: 'id' });
					}
					// Store สำหรับเหตุการณ์
					if (!db.objectStoreNames.contains(STORE_IMPORTED_EVENTS)) {
						const evStore = db.createObjectStore(STORE_IMPORTED_EVENTS, { keyPath: 'id' });
						evStore.createIndex('importId', 'importId', { unique: false });
						evStore.createIndex('date', 'start', { unique: false });
					}
					console.log('IndexedDB Upgrade: Added ICS import stores');
				}
				
            };

            request.onsuccess = (event) => {
                db = event.target.result;
                console.log("IndexedDB connected successfully");
                resolve(db);
            };
        });
    }
	
	// ============================================
    // FIREBASE SYNC FUNCTIONS (แก้ไขใหม่)
    // ============================================
    
    // ฟังก์ชันสำหรับบันทึกขึ้น Cloud (ใช้ document ID เดียวกับ Local DB)
    async function saveToCloud(storeName, item) {
        if (window.auth && window.auth.currentUser && window.db) {
            try {
                const uid = window.auth.currentUser.uid;
                // หา ID ของข้อมูล
                let docId = item.id || item.key || item.name || item.type || item.category;
                
                if (!docId) {
                    console.warn('Skipping cloud save: No ID found for item', item);
                    return;
                }

                const docRef = window.dbDoc(window.db, 'users', uid, storeName, docId);
                
				const sanitizeForFirestore = (obj) => {
					return JSON.parse(JSON.stringify(obj, (key, value) => 
						value === undefined ? null : value
					));
				};

				const sanitizedItem = sanitizeForFirestore(item);
				await window.dbSetDoc(docRef, sanitizedItem, { merge: true });
				
                console.log(`Cloud Saved: ${storeName}/${docId}`);

                // +++ แก้ไข: กรองการแจ้งเตือน ไม่ให้แสดงตอนบันทึกค่า Config หรือ AutoComplete +++
                // STORE_CONFIG = การตั้งค่าต่างๆ, STORE_AUTO_COMPLETE = ระบบจำคำ
                const silentStores = ['config', 'autoComplete', 'transactions', 'notifications', STORE_VOICE_COMMANDS];
                
                // เช็คว่า storeName ปัจจุบัน อยู่ในรายการที่ต้องเงียบหรือไม่
                // หมายเหตุ: ใช้ตัวแปร storeName เทียบกับชื่อ Store ที่เรากำหนดไว้ด้านบน
                if (!silentStores.includes(storeName) && storeName !== STORE_CONFIG && storeName !== STORE_AUTO_COMPLETE) {
				    showToast(`☁️ บันทึกข้อมูลขึ้น Cloud แล้ว`, 'success');
                }
                // ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

            } catch (err) {
                console.error("Cloud Save Error:", err);
            }
        }
    }

    // ฟังก์ชันสำหรับลบจาก Cloud
    async function deleteFromCloud(storeName, key) {
        if (window.auth && window.auth.currentUser && window.db) {
            try {
                const uid = window.auth.currentUser.uid;
                await window.dbDelete(window.dbDoc(window.db, 'users', uid, storeName, key));
                console.log(`Cloud Deleted: ${storeName}/${key}`);

                // +++ แก้ไข: กรองการแจ้งเตือนเช่นกัน +++
                const silentStores = ['config', 'autoComplete', 'transactions', 'notifications', STORE_VOICE_COMMANDS];
                if (!silentStores.includes(storeName) && storeName !== STORE_CONFIG && storeName !== STORE_AUTO_COMPLETE) {
                    showToast(`☁️ ลบข้อมูลจาก Cloud แล้ว`, 'success');
                }
                // +++++++++++++++++++++++++++++++++++++++

            } catch (err) {
                console.error("Cloud Delete Error:", err);
            }
        }
    }
	
	// ============================================
	// REAL-TIME NOTIFICATION LISTENER
	// ============================================
	let notifUnsubscribe = null;

	function initNotificationListener() {
		if (!window.auth || !window.auth.currentUser || !window.db) return;
		
		const uid = window.auth.currentUser.uid;

		// ยกเลิกตัวเก่าก่อน (ถ้ามี)
		if (notifUnsubscribe) notifUnsubscribe();

		// ดักฟังเฉพาะการแจ้งเตือนที่ "ยังไม่อ่าน" (isRead: false)
		// หรือถ้าคุณไม่ได้เก็บสถานะ isRead ใน object ก็ดึงมาทั้งหมดตามวันที่
		const colRef = window.dbCollection(window.db, 'users', uid, STORE_NOTIFICATIONS);
		
		// Query: เอาเฉพาะที่ timestamp ไม่เก่าเกินไป หรือเอาสถานะ 'unread'
		// ตัวอย่างนี้ดึงทั้งหมดที่เปลี่ยนแบบ Realtime
		notifUnsubscribe = colRef.onSnapshot(snapshot => {
			let hasChanges = false;
			
			snapshot.docChanges().forEach(change => {
				const data = change.doc.data();
				const docId = change.doc.id;

				if (change.type === "added" || change.type === "modified") {
					// อัปเดตข้อมูลลง Local State (เพื่อให้ข้อมูลตรงกัน)
					const existingIndex = state.notificationHistory.findIndex(n => n.id === docId);
					
					if (existingIndex > -1) {
						state.notificationHistory[existingIndex] = { ...data, id: docId };
					} else {
						state.notificationHistory.unshift({ ...data, id: docId });
						hasChanges = true; // มีของใหม่มา
					}
				}
				
				if (change.type === "removed") {
					state.notificationHistory = state.notificationHistory.filter(n => n.id !== docId);
				}
			});

			// ถ้ามีการเปลี่ยนแปลง ให้รีเฟรชหน้าจอแจ้งเตือน
			if (hasChanges || snapshot.docChanges().length > 0) {
				// บันทึกลง IndexedDB (Local)
				dbPut(STORE_CONFIG, { key: 'notification_history', value: state.notificationHistory });
				
				// เรียกฟังก์ชันแสดงผล (Render) เดิมของคุณ
				if(typeof renderNotificationHistory === 'function') renderNotificationHistory();

				// เช็คว่าต้องเด้ง Modal ไหม (เฉพาะที่มีการแจ้งเตือนใหม่จริงๆ)
				// คุณอาจจะเพิ่ม Logic เช็คว่าถ้าเป็น change.type === "added" ค่อยสั่ง showModal
				const unreadAlerts = state.notificationHistory.filter(n => !n.isRead);
				if (unreadAlerts.length > 0) {
					// เรียกใช้ Modal แจ้งเตือนของคุณ
					const modal = document.getElementById('notification-modal');
					if (modal && modal.classList.contains('hidden')) {
						 // showFullScreenModal(unreadAlerts); // เรียกฟังก์ชันเปิด Modal ของคุณ
						 // หรือถ้าไม่มีฟังก์ชันแยก ก็สั่งเปิดตรงนี้:
						 // modal.classList.remove('hidden'); 
						 // (แต่ต้องระวัง loop เด้งซ้ำตอนเปิดหน้าเว็บครั้งแรก)
					}
				}
			}
		});
	}

    // ฟังก์ชันโหลดข้อมูลจาก Cloud ลงเครื่อง (เรียกตอน Login)
    // แก้ไขล่าสุด: บังคับ Overwrite (ล้างเครื่องแล้วโหลดใหม่) เสมอ โดยไม่ถาม
    window.loadDataFromCloud = async (uid) => {
        if (!window.db) return;
        
        const collectionsToSync = [
            STORE_TRANSACTIONS, 
            STORE_ACCOUNTS, 
            STORE_CATEGORIES, 
            STORE_FREQUENT_ITEMS, 
            STORE_CONFIG,
            STORE_AUTO_COMPLETE,
            STORE_RECURRING,
            STORE_BUDGETS,
			STORE_NOTIFICATIONS,
			STORE_VOICE_COMMANDS
        ];

        try {
            let hasDownloaded = false;
            let hasUploaded = false;
            
            // --- กำหนดโหมดเป็น 'overwrite' (ทับข้อมูล) เสมอ ---
            // ผลลัพธ์: ข้อมูลเก่าในเครื่องจะถูกลบก่อน แล้วโหลดจาก Cloud มาใส่
            let syncMode = 'overwrite'; 

            // ตรวจสอบข้อมูล Cloud (เพื่อดูว่ามีอะไรต้องโหลดไหม)
            const cloudTxRef = window.dbCollection(window.db, 'users', uid, STORE_TRANSACTIONS);
            const cloudTxSnapshot = await window.dbGetDocs(cloudTxRef);

            for (const storeName of collectionsToSync) {
                let snapshot;
                if (storeName === STORE_TRANSACTIONS) {
                    snapshot = cloudTxSnapshot;
                } else {
                    const colRef = window.dbCollection(window.db, 'users', uid, storeName);
                    snapshot = await window.dbGetDocs(colRef);
                }
                
                if (!snapshot.empty) {
                    // --- กรณี A: บน Cloud มีข้อมูล ---
                    // ให้ล้างข้อมูลในเครื่องทิ้งก่อน (เฉพาะ Store นั้นๆ)
                    if (syncMode === 'overwrite') {
                        await dbClear(storeName); 
                    }
                    
                    const tx = db.transaction([storeName], 'readwrite');
                    const store = tx.objectStore(storeName);
                    
                    snapshot.forEach(doc => {
                        let data = doc.data(); 
                        let isValid = true;    

                        // Validation Logic (ตรวจสอบความถูกต้องของข้อมูล)
                        if (storeName === STORE_BUDGETS) {
                            if (!data.category) data.category = doc.id;
                            if (!data.category) isValid = false;
                        } else if (storeName === STORE_TRANSACTIONS || storeName === STORE_ACCOUNTS || storeName === STORE_RECURRING) {
                            if (!data.id) data.id = doc.id;
                            if (!data.id) isValid = false;
                        } else if (storeName === STORE_CATEGORIES) {
                            if (!data.type) data.type = doc.id;
                            if (!data.type) isValid = false;
                        } else if (storeName === STORE_FREQUENT_ITEMS) {
                            if (!data.name) data.name = doc.id;
                            if (!data.name) isValid = false;
                        } else if (storeName === STORE_CONFIG) {
                            if (!data.key) data.key = doc.id;
                            if (!data.key) isValid = false;
                        }
						else if (storeName === STORE_VOICE_COMMANDS) {
							if (!data.id) data.id = doc.id;
							if (!data.id) isValid = false;
						}

                        if (isValid) {
                            try {
                                store.put(data);
                            } catch (err) {
                                console.error(`Skipping corrupt record in ${storeName}:`, doc.id, err);
                            }
                        }
                    });
                    
                    await new Promise(resolve => tx.oncomplete = resolve);
                    hasDownloaded = true;
                }
                else {
                    // --- กรณี B: บน Cloud ว่างเปล่า (ผู้ใช้ใหม่ หรือเพิ่งเคลียร์ Cloud) ---
                    // ให้อัปโหลดข้อมูลจากเครื่องขึ้นไปแทน (Backup ครั้งแรก)
                    const localItems = await dbGetAll(storeName);
                    if (localItems.length > 0) {
                        const uploadPromises = localItems.map(item => saveToCloud(storeName, item));
                        await Promise.all(uploadPromises);
                        hasUploaded = true;
                    }
                }
            }
            
            // บันทึกว่าเครื่องนี้ซิงค์กับ User นี้เรียบร้อยแล้ว
            localStorage.setItem('last_sync_uid', uid);

            // โหลดข้อมูลเข้า State ใหม่ และรีเฟรชหน้าจอ
            await loadStateFromDB();
            refreshAllUI();
            
            // แสดง Toast แจ้งเตือน
            if (hasDownloaded) {
                showToast("ดาวน์โหลดข้อมูลจาก Cloud เรียบร้อย!", "success");
            } else if (hasUploaded) {
                showToast("อัปโหลดข้อมูลเริ่มต้นขึ้น Cloud แล้ว!", "success");
            }
        } catch (error) {
            console.error("Sync Error:", error);
            showToast("Sync Error: " + error.message, "error");
        }
    };
	
	// ============================================
    // ฟังก์ชัน: ล้างข้อมูลและรีเซ็ตค่าเริ่มต้นเมื่อ Logout (Factory Reset)
    // ============================================
    window.clearLocalDataForLogout = async () => {
        console.log("Performing Factory Reset for Logout...");
        try {
            // 1. ล้างข้อมูลทุก Store
            await dbClear(STORE_TRANSACTIONS);
            await dbClear(STORE_ACCOUNTS);
            await dbClear(STORE_CATEGORIES);
            await dbClear(STORE_FREQUENT_ITEMS);
            await dbClear(STORE_AUTO_COMPLETE);
            await dbClear(STORE_CONFIG);
			await dbClear(STORE_RECURRING);
			await dbClear(STORE_BUDGETS);
			await dbClear(STORE_VOICE_COMMANDS);

            // 2. สร้างข้อมูลเริ่มต้นใหม่ (Factory Reset)
            return new Promise((resolve, reject) => {
                const tx = db.transaction([STORE_CATEGORIES, STORE_FREQUENT_ITEMS, STORE_CONFIG, STORE_ACCOUNTS], 'readwrite');

                // 2.1 หมวดหมู่
                const catStore = tx.objectStore(STORE_CATEGORIES);
                catStore.add({ type: 'income', items: DEFAULT_CATEGORIES.income });
                catStore.add({ type: 'expense', items: DEFAULT_CATEGORIES.expense });

                // 2.2 รายการใช้บ่อย
                const itemStore = tx.objectStore(STORE_FREQUENT_ITEMS);
                DEFAULT_FREQUENT_ITEMS.forEach(item => itemStore.add({ name: item }));

                // 2.3 Config เริ่มต้น (สำคัญ: ตั้ง password เป็น null)
                const configStore = tx.objectStore(STORE_CONFIG);
                const hashedDefault = CryptoJS.SHA256(DEFAULT_PASSWORD).toString();
				configStore.add({ key: 'password', value: hashedDefault });
                configStore.add({ key: AUTOLOCK_CONFIG_KEY, value: 10 }); 
                configStore.add({ key: DARK_MODE_CONFIG_KEY, value: false }); 
                if (typeof AUTO_CONFIRM_CONFIG_KEY !== 'undefined') {
                    configStore.add({ key: AUTO_CONFIRM_CONFIG_KEY, value: false });
                }

                // 2.4 บัญชีเงินสด
                const accStore = tx.objectStore(STORE_ACCOUNTS);
                const defaultCash = { 
                    id: 'acc-cash-' + Date.now(), 
                    name: 'เงินสด', 
                    type: 'cash', 
                    initialBalance: 0, 
                    icon: 'fa-wallet',
                    iconName: 'fa-wallet', 
                    displayOrder: Date.now() 
                };
                accStore.add(defaultCash);

                tx.oncomplete = () => {
                    resolve(true); // เสร็จสิ้น
                };
                
                tx.onerror = (e) => {
                    console.error("Reset Error", e);
                    resolve(true); // ให้ผ่านไปรีโหลดหน้าได้แม้ error
                };
            });
        } catch (err) {
            console.error(err);
            return false;
        }
    };
	
	// ============================================
    // ฟังก์ชัน: ตรวจสอบรหัสผ่านก่อน Logout (Export ให้ index.html เรียกใช้)
    // ============================================
    window.verifyPasswordForLogout = async () => {
        // ถ้าไม่มีรหัสผ่าน (null) ให้ผ่านได้เลย
        if (!state.password) {
            return true;
        }

        // เรียกใช้ฟังก์ชัน promptForPassword ที่มีอยู่แล้วใน script.js
        // ฟังก์ชันนี้จัดการ UI และ Auto Confirm ให้เสร็จสรรพ
        const isAuthorized = await promptForPassword('ยืนยันรหัสผ่านเพื่อออกจากระบบ');
        return isAuthorized;
    };

    async function runMigration() {
        try {
            const accounts = await dbGetAll(STORE_ACCOUNTS);
            if (accounts.length > 0) {
                return;
            }

            console.log("Running one-time data migration for v2...");
            Swal.fire({
                title: 'กำลังอัปเกรดข้อมูล',
                text: 'โปรดรอสักครู่ ระบบกำลังย้ายข้อมูลเก่าของคุณไปยังระบบบัญชีใหม่...',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });
            const defaultCash = { 
                id: 'acc-cash-' + Date.now(), 
                name: 'เงินสด', 
                type: 'cash', 
                initialBalance: 0,
                icon: 'fa-wallet',
                iconName: 'fa-wallet', 
                displayOrder: Date.now() 
            };
            const defaultCredit = { 
                id: 'acc-credit-' + Date.now(), 
                name: 'บัตรเครดิต (เริ่มต้น)', 
                type: 'credit', 
                initialBalance: 0,
                icon: 'fa-credit-card',
                iconName: 'fa-credit-card', 
                displayOrder: Date.now() + 1 
            };
            await dbPut(STORE_ACCOUNTS, defaultCash);
            await dbPut(STORE_ACCOUNTS, defaultCredit);

            const transactions = await dbGetAll(STORE_TRANSACTIONS);
            const updatePromises = [];
            let migratedCount = 0;
            for (const tx of transactions) {
                if (tx.accountId) {
                    continue;
                }
                if (tx.isNonDeductible === true) {
                    tx.accountId = defaultCredit.id;
                } else {
                    tx.accountId = defaultCash.id;
                }
                delete tx.isNonDeductible;
                updatePromises.push(dbPut(STORE_TRANSACTIONS, tx));
                migratedCount++;
            }

            await Promise.all(updatePromises);
            Swal.close();

        } catch (err) {
            console.error("Migration failed:", err);
            Swal.fire({
                title: 'อัปเกรดข้อมูลล้มเหลว', 
                text: 'ไม่สามารถย้ายข้อมูลเก่าได้: ' + err.message, 
                icon: 'error',
                customClass: { popup: state.isDarkMode ? 'swal2-popup' : '' },
                background: state.isDarkMode ? '#1a1a1a' : '#fff',
                color: state.isDarkMode ? '#e5e7eb' : '#545454',
            });
        }
    }

    function dbGet(storeName, key) {
        return new Promise((resolve, reject) => {
            if (!db) return reject("DB not initialized");
            const transaction = db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(key);
            request.onsuccess = () => resolve(request.result);
            request.onerror = (event) => reject(event.target.error);
        });
    }

    function dbGetAll(storeName) {
        return new Promise((resolve, reject) => {
            if (!db) return reject("DB not initialized");
            const transaction = db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = (event) => reject(event.target.error);
        });
    }

    function dbPut(storeName, item) {
        return new Promise((resolve, reject) => {
            if (!db) return reject("DB not initialized");
            const transaction = db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(item);
            request.onsuccess = () => resolve(request.result);
			// +++ เพิ่มบรรทัดนี้: บันทึกสำเร็จในเครื่อง ให้ส่งขึ้น Cloud ด้วย +++
            saveToCloud(storeName, item); 
            // +++++++++++++++++++++++++++++++++++++++++++++++++++++++
            request.onerror = (event) => reject(event.target.error);
        });
    }

    function dbDelete(storeName, key) {
        return new Promise((resolve, reject) => {
            if (!db) return reject("DB not initialized");
            const transaction = db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(key);
            request.onsuccess = () => resolve();
			// +++ เพิ่มบรรทัดนี้: ลบสำเร็จในเครื่อง ให้ลบบน Cloud ด้วย +++
            deleteFromCloud(storeName, key);
            // +++++++++++++++++++++++++++++++++++++++++++++++++++++
            request.onerror = (event) => reject(event.target.error);
            request.onerror = (event) => reject(event.target.error);
        });
    }

    function dbClear(storeName) {
		return new Promise((resolve, reject) => {
			if (!db) return reject("DB not initialized");
			// ตรวจสอบว่ามี object store นี้จริงๆ หรือไม่
			if (!db.objectStoreNames.contains(storeName)) {
				// ไม่มี store นี้ → ไม่ต้อง clear, ถือว่าสำเร็จ
				return resolve();
			}
			const transaction = db.transaction([storeName], 'readwrite');
			const store = transaction.objectStore(storeName);
			const request = store.clear();
			request.onsuccess = () => resolve();
			request.onerror = (event) => reject(event.target.error);
		});
	}

    function getSortedAccounts() {
        return [...state.accounts].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
    }
    
    let myChart;
    let myListPageBarChart;
    let myExpenseByNameChart; 
    //let myCalendar = null;
	let moneyCalendar = null;      // สำหรับปฏิทินธุรกรรม
	let importedCalendar = null;   // สำหรับปฏิทินกิจกรรม
	let isSyncingCalendars = false;
    let lastUndoAction = null;
    let lastRedoAction = null;
    
    let currentReceiptBase64 = null; 
	const MAX_FILE_SIZE_MB = window.APP_DEFAULTS ? window.APP_DEFAULTS.MAX_FILE_SIZE_MB : 100;
	
	// --- เพิ่ม: ค่ากำหนดการบีบอัด
    const COMPRESS_MAX_WIDTH = window.APP_DEFAULTS ? window.APP_DEFAULTS.COMPRESS_MAX_WIDTH : 1024; // ความกว้างหรือสูงสูงสุด (pixel) - 1024px ชัดพอสำหรับใบเสร็จ
    const COMPRESS_QUALITY = window.APP_DEFAULTS ? window.APP_DEFAULTS.COMPRESS_QUALITY : 0.7;    // คุณภาพไฟล์ JPEG (0.0 - 1.0) - 0.7 คือ 70% (ชัดแต่ไฟล์เล็ก)

	// เพิ่มตัวแปรเก็บ Cache วันหยุด เพื่อไม่ต้องโหลดซ้ำบ่อยๆ
	const holidayCache = {};

    let currentPage = 'home';
    let isTransitioning = false; 
    let state = {
		biometricId: null,
        transactions: [],
        categories: {
            income: [],
            expense: []
        },
        accounts: [], 
        frequentItems: [],
        autoCompleteList: [], 
        filterType: 'all', 
        searchTerm: '',
        homeFilterType: 'all', 
        homeViewMode: 'month',
        homeCurrentDate: new Date().toISOString().slice(0, 10),
        listViewMode: 'all',
        listCurrentDate: new Date().toISOString().slice(0, 10),
        password: null,
        homeCurrentPage: 1,
        homeItemsPerPage: 10, 
        listCurrentPage: 1,
        listItemsPerPage: 10,
        calendarCurrentDate: new Date().toISOString().slice(0, 10), 
        listChartMode: 'items',
        listGroupBy: 'none', 
        showBalanceCard: false, 
        isDarkMode: false, 
		activeModalId: null, // เช่น 'form-modal', 'quick-draft-modal', null
		pendingCommandToLearn: null,
		lineNotifyActions: { add: true, edit: true, delete: true }, // ค่าเริ่มต้น
        settingsCollapse: {},
        autoLockTimeout: 0,
		budgets: [],
		notifySettings: {
            scheduled: true,
            recurring: true,
            budget: true
        },
        customNotifications: [],
        ignoredNotifications: [],
		notificationHistory: [],
		
		advFilterStart: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10), // วันแรกของเดือน
		advFilterEnd: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().slice(0, 10), // วันสุดท้ายของเดือน
		advFilterType: 'all',
		advFilterSearch: '',
		mobileMenuStyle: 'bottom', // หรือ 'hamburger' ก็ได้ แต่ตั้งค่าตามที่ต้องการ
    };
		// วางต่อจาก }; ของ state เหมือนเดิม
		let chartInstanceCategory = null;
		let chartInstanceTime = null;
    
    // ********** NEW: Account Detail Modal View State & Functions **********
    let accountDetailState = {
        accountId: null,
        viewMode: 'all', // 'all', 'month', 'year'
        currentDate: new Date().toISOString().slice(0, 10) // YYYY-MM-DD
    };

    function updateAccountDetailControls() {
        const getEl = (id) => document.getElementById(id);
        const viewMode = accountDetailState.viewMode;
        const currentDate = accountDetailState.currentDate;
        
        getEl('acc-detail-view-mode-select').value = viewMode;
        
        if (viewMode === 'all') {
            getEl('acc-detail-month-controls').classList.add('hidden');
            getEl('acc-detail-year-controls').classList.add('hidden');
            getEl('acc-detail-month-controls').classList.remove('flex');
            getEl('acc-detail-year-controls').classList.remove('flex');
        } else if (viewMode === 'month') {
            getEl('acc-detail-month-controls').classList.remove('hidden');
            getEl('acc-detail-month-controls').classList.add('flex');
            getEl('acc-detail-year-controls').classList.add('hidden');
            getEl('acc-detail-year-controls').classList.remove('flex');
            
            const monthYear = currentDate.slice(0, 7);
            getEl('acc-detail-month-picker').value = monthYear;
        } else { 
            getEl('acc-detail-month-controls').classList.add('hidden');
            getEl('acc-detail-month-controls').classList.remove('flex');
            getEl('acc-detail-year-controls').classList.remove('hidden');
            getEl('acc-detail-year-controls').classList.add('flex');
            
            const year = currentDate.slice(0, 4);
            getEl('acc-detail-year-picker').value = year;
        }
    }

    function handleAccountDetailViewModeChange(e) {
        const newMode = e.target.value;
        accountDetailState.viewMode = newMode;
        accountDetailState.currentDate = new Date().toISOString().slice(0, 10); 
        
        updateAccountDetailControls();
        renderAccountDetailList(accountDetailState.accountId);
    }

    function handleAccountDetailDateChange(e, mode) {
        let newDate;
        
        if (mode === 'month') {
            const [year, month] = e.target.value.split('-');
            if (year && month) {
                newDate = `${year}-${month}-01`;
            }
        } else { // mode === 'year'
            const year = e.target.value;
            if (year && year.length === 4) {
                newDate = `${year}-01-01`;
            }
        }

        if (newDate) {
            accountDetailState.currentDate = newDate;
            renderAccountDetailList(accountDetailState.accountId);
        }
    }

    function navigateAccountDetailPeriod(direction, mode) {
        let dateStr = accountDetailState.currentDate;
        let date = new Date(dateStr);
        
        if (mode === 'month') {
            date.setMonth(date.getMonth() + direction);
        } else { // mode === 'year'
            date.setFullYear(date.getFullYear() + direction);
        }
        
        accountDetailState.currentDate = date.toISOString().slice(0, 10);
        
        updateAccountDetailControls();
        renderAccountDetailList(accountDetailState.accountId);
    }

    // *** NEW HELPER FUNCTION: รีเฟรช Modal ถ้าเปิดอยู่ ***
    async function refreshAccountDetailModalIfOpen() {
        const modal = document.getElementById('account-detail-modal');
        if (!modal.classList.contains('hidden') && accountDetailState.accountId) {
            await renderAccountDetailList(accountDetailState.accountId);
        }
    }
    // ***************************************************************
	function detectDeviceType() {
		const ua = navigator.userAgent;
		// iOS
		if (/iPhone|iPad|iPod/i.test(ua)) {
			return { type: 'ios', icon: 'fa-apple', label: 'iPhone/iPad' };
		}
		// Android
		else if (/Android/i.test(ua)) {
			// แยกยี่ห้อต่าง ๆ (เรียงลำดับตามความเฉพาะเจาะจง)
			if (/SM-|Samsung/i.test(ua)) return { type: 'samsung', icon: 'fa-mobile-screen', label: 'Samsung' };
			if (/Xiaomi|Redmi|Mi\s/i.test(ua)) return { type: 'xiaomi', icon: 'fa-mobile-screen', label: 'Xiaomi' };
			if (/OPPO|CPH\d{4}/i.test(ua)) return { type: 'oppo', icon: 'fa-mobile-screen', label: 'OPPO' };
			if (/Vivo|VIVO/i.test(ua)) return { type: 'vivo', icon: 'fa-mobile-screen', label: 'Vivo' };
			if (/HUAWEI|Huawei|HUAWEI/i.test(ua)) return { type: 'huawei', icon: 'fa-mobile-screen', label: 'Huawei' };
			if (/Pixel|Google\sPixel/i.test(ua)) return { type: 'pixel', icon: 'fa-mobile-screen', label: 'Google Pixel' };
			if (/OnePlus/i.test(ua)) return { type: 'oneplus', icon: 'fa-mobile-screen', label: 'OnePlus' };
			if (/Nokia/i.test(ua)) return { type: 'nokia', icon: 'fa-mobile-screen', label: 'Nokia' };
			// ถ้าไม่ตรงยี่ห้อใด ๆ ให้คืนค่าเป็น Android ทั่วไป
			return { type: 'android', icon: 'fa-mobile-screen', label: 'Android' };
		}
		// Desktop
		else if (/Windows|Mac|Linux/i.test(ua)) {
			return { type: 'desktop', icon: 'fa-computer', label: 'คอมพิวเตอร์' };
		}
		// ไม่ทราบ
		return { type: 'unknown', icon: 'fa-question-circle', label: 'ไม่ทราบ' };
	}

    async function loadStateFromDB() {
        try {
			
			// โหลด Biometric ID จาก LocalStorage (เฉพาะเครื่องนี้)
            const localBioId = localStorage.getItem('local_biometric_id');
            if (localBioId) {
                state.biometricId = localBioId;
            }
            // [เดิม] 1. โหลด Accounts และซ่อมแซมข้อมูล (Migration for DisplayOrder/Icon)
            state.accounts = await dbGetAll(STORE_ACCOUNTS);
            let updateOrderPromises = [];
            let hasUndefinedOrder = false;
            
            state.accounts.forEach((acc, index) => {
                // เช็คลำดับการแสดงผล
                if (acc.displayOrder === undefined || acc.displayOrder === null) {
                    acc.displayOrder = Date.now() + index; 
                    updateOrderPromises.push(dbPut(STORE_ACCOUNTS, acc));
                    hasUndefinedOrder = true;
                }
                // เช็คไอคอน
                if (acc.iconName === undefined) {
                    acc.iconName = acc.icon || 'fa-wallet'; 
                    updateOrderPromises.push(dbPut(STORE_ACCOUNTS, acc));
                    hasUndefinedOrder = true;
                }
            });
            
            if (hasUndefinedOrder) {
                console.log('Running one-time migration for account displayOrder/iconName...');
                await Promise.all(updateOrderPromises);
                state.accounts = await dbGetAll(STORE_ACCOUNTS); // โหลดใหม่อีกครั้งหลังแก้เสร็จ
            }
            
            // [เดิม] 2. โหลด Transactions
            state.transactions = await dbGetAll(STORE_TRANSACTIONS);
            // เรียงลำดับวันที่ใหม่สุดขึ้นก่อน
            state.transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
			
            // [เดิม] 3. โหลด Categories
            const incomeCats = await dbGet(STORE_CATEGORIES, 'income');
            const expenseCats = await dbGet(STORE_CATEGORIES, 'expense');
            state.categories.income = incomeCats ? incomeCats.items : [...DEFAULT_CATEGORIES.income];
            state.categories.expense = expenseCats ? expenseCats.items : [...DEFAULT_CATEGORIES.expense];

            // [เดิม] 4. โหลด Frequent Items
            const frequentItems = await dbGetAll(STORE_FREQUENT_ITEMS);
            state.frequentItems = frequentItems.map(item => item.name);

            // [เดิม] 5. โหลด Auto Complete
			let autoCompleteData = await dbGetAll(STORE_AUTO_COMPLETE);
			let needsMigration = false;

			// Migration: แปลง autoCompleteList เป็นโครงสร้างใหม่ (frequency-based)
			const migratedList = autoCompleteData.map(item => {
				// ถ้ามี field 'categories' แสดงว่าเป็นโครงสร้างใหม่อยู่แล้ว
				if (item.categories && typeof item.categories === 'object') {
					return item;
				}
				
				// โครงสร้างเก่า: { name, type, category, amount } หรือ { name, type, category, amount, count? }
				if (item.name && item.type) {
					needsMigration = true;
					const oldCategory = item.category || 'อื่นๆ';
					const oldCount = item.count || 1; // เผื่อมี count เก่า
					return {
						id: item.id || `auto_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`, // ✅ เพิ่ม id
						name: item.name,
						type: item.type,
						categories: { [oldCategory]: oldCount },
						totalUses: oldCount,
						lastAmount: item.amount || 0,
						lastUsed: item.lastUsed || new Date().toISOString()
					};
				}
				
				return null; // รายการที่ไม่ถูกต้อง
			}).filter(item => item !== null);

			if (needsMigration) {
				console.log('🔄 กำลัง Migration autoCompleteList จำนวน', migratedList.length, 'รายการ');
				
				// ลบข้อมูลเก่าทั้งหมด
				await dbClear(STORE_AUTO_COMPLETE);
				
				// บันทึกข้อมูลใหม่ทีละรายการ (หรือใช้ transaction เดียว)
				for (const item of migratedList) {
					await dbPut(STORE_AUTO_COMPLETE, item);
				}
				
				console.log('✅ Migration autoCompleteList เสร็จสมบูรณ์');
			}

			state.autoCompleteList = migratedList;
            
            // [เดิม] 6. โหลด Password และ Config พื้นฐาน
            const passwordConfig = await dbGet(STORE_CONFIG, 'password');
            let storedPassword;

            if (passwordConfig) {
                storedPassword = passwordConfig.value;
            } else {
                // ถ้าไม่มี ให้สร้าง Default
                const hashedPassword = CryptoJS.SHA256(DEFAULT_PASSWORD).toString();
                await dbPut(STORE_CONFIG, { key: 'password', value: hashedPassword });
                state.password = hashedPassword;
                storedPassword = hashedPassword;
            }

            // Migration: เช็คความยาว Hash (เผื่อมีการเปลี่ยนอัลกอริทึมในอนาคต หรือแก้ข้อมูลผิดพลาด)
            if (storedPassword && typeof storedPassword === 'string' && storedPassword.length !== 64) {
                const newlyHashed = CryptoJS.SHA256(storedPassword).toString();
                await dbPut(STORE_CONFIG, { key: 'password', value: newlyHashed });
                state.password = newlyHashed;
            } else {
                state.password = storedPassword;
            }

            // [เดิม] 7. กำหนดวันและค่า Default ต่างๆ ของ State
            const now = new Date();
			const year = now.getFullYear();
			const month = String(now.getMonth() + 1).padStart(2, '0'); // เดือนเริ่มนับที่ 0 เลยต้อง +1
			const day = String(now.getDate()).padStart(2, '0');
			const today = `${year}-${month}-${day}`;
            state.homeCurrentDate = today; 
            state.listCurrentDate = today; 
            state.calendarCurrentDate = today;
            state.homeViewMode = 'month';
            state.listViewMode = 'all';
            state.homeCurrentPage = 1;
            state.homeItemsPerPage = 10;
            state.listCurrentPage = 1;
            state.listItemsPerPage = 10; 
            
            // [เดิม] 8. โหลดการตั้งค่าการยุบเมนู (Collapse)
            const defaultCollapseSettings = {
                'settings-accounts-content': true,
                'settings-income-content': true,
                'settings-expense-content': true,
                'settings-manual-content': true,
                'home-accounts-content': true,
                'home-transactions-content': true,
                'settings-line-content': true
            };
            const collapseConfig = await dbGet(STORE_CONFIG, 'collapse_preferences');
            if (collapseConfig && collapseConfig.value) {
                state.settingsCollapse = { ...defaultCollapseSettings, ...collapseConfig.value };
            } else {
                state.settingsCollapse = defaultCollapseSettings;
            }
			
			// โหลด LINE Notify Actions
			const lineNotifyActionsConfig = await dbGet(STORE_CONFIG, 'lineNotifyActions');
			if (lineNotifyActionsConfig) {
				state.lineNotifyActions = lineNotifyActionsConfig.value;
			} else {
				state.lineNotifyActions = { add: true, edit: true, delete: true };
			}
            
            // [เดิม] 9. โหลด Config ย่อยอื่นๆ
            const showBalanceConfig = await dbGet(STORE_CONFIG, 'showBalanceCard');
            state.showBalanceCard = showBalanceConfig ? showBalanceConfig.value : false;

            const autoLockConfig = await dbGet(STORE_CONFIG, AUTOLOCK_CONFIG_KEY);
            state.autoLockTimeout = autoLockConfig ? autoLockConfig.value : 0;
            
            const darkModeConfig = await dbGet(STORE_CONFIG, DARK_MODE_CONFIG_KEY);
            state.isDarkMode = darkModeConfig ? darkModeConfig.value : false;
			
			const voiceConfig = await dbGet(STORE_CONFIG, 'isVoiceEnabled');
            state.isVoiceEnabled = voiceConfig !== undefined ? voiceConfig.value : true;

            const autoConfirmConfig = await dbGet(STORE_CONFIG, AUTO_CONFIRM_CONFIG_KEY);
            state.autoConfirmPassword = autoConfirmConfig ? autoConfirmConfig.value : false;
			
			const menuStyleConfig = await dbGet(STORE_CONFIG, 'mobileMenuStyle');
            state.mobileMenuStyle = menuStyleConfig ? menuStyleConfig.value : 'bottom';
			
			// +++ สำคัญ: ต้องเรียกใช้ฟังก์ชันปรับ UI ทันทีหลังจากได้ค่า +++
			applyMobileMenuStyle();

            // ++++++++++++++++++++++++++++++++++++++++++++++++++++++
            // [ใหม่ V5] 10. โหลดรายการประจำ (Recurring Rules)
            // ++++++++++++++++++++++++++++++++++++++++++++++++++++++
            // ต้องเช็คก่อนว่ามี Store นี้จริงไหม (กัน Error กรณีเพิ่งอัปเกรด)
            try {
                const recurringRules = await dbGetAll(STORE_RECURRING);
                state.recurringRules = recurringRules || [];
            } catch (err) {
                console.warn('Recurring store not ready yet or empty', err);
                state.recurringRules = [];
            }
			
			// [ใหม่ V6] 11. โหลดงบประมาณ
			try {
				const budgets = await dbGetAll(STORE_BUDGETS);
				state.budgets = budgets || [];
			} catch (err) {
				console.warn('Budgets store not ready yet', err);
				state.budgets = [];
			}
            
			try {
				state.icsImports = await dbGetAll(STORE_ICS_IMPORTS) || [];
				state.importedEvents = await dbGetAll(STORE_IMPORTED_EVENTS) || [];
			} catch (err) {
				console.warn('ICS stores not ready', err);
				state.icsImports = [];
				state.importedEvents = [];
			}

        } catch (e) {
            console.error("Failed to load state from DB, using defaults.", e);
            Swal.fire({
                icon: 'error',
                title: 'โหลดข้อมูลไม่สำเร็จ',
                text: 'เกิดข้อผิดพลาดในการอ่านฐานข้อมูล: ' + e.message
            });
        }
		// [ใหม่] โหลดการตั้งค่า Notification
		const notifyConfig = await dbGet(STORE_CONFIG, 'notification_settings');
		if (notifyConfig) state.notifySettings = notifyConfig.value;

		const ignoredConfig = await dbGet(STORE_CONFIG, 'ignored_notifications');
		if (ignoredConfig) state.ignoredNotifications = ignoredConfig.value || [];

		const customNoti = await dbGet(STORE_CONFIG, 'custom_notifications_list');
		if (customNoti) state.customNotifications = customNoti.value || [];
		
		const notiHistory = await dbGet(STORE_CONFIG, 'notification_history');
		if (notiHistory) state.notificationHistory = notiHistory.value || [];
		
		updateNotificationBadge();
    }
	
		// ============================================
		// Activity Log (ประวัติการกระทำ)
		// ============================================

		// เพิ่ม log ใหม่
		function addActivityLog(action, details, icon = 'fa-bell', color = 'text-gray-500', extraProps = {}) {
			const device = detectDeviceType(); // ต้องมีฟังก์ชันนี้อยู่แล้ว
			const log = {
				id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
				timestamp: new Date().toISOString(),
				action: action,
				details: details,
				icon: icon,
				color: color,
				device: device,
				isRead: false,
				...extraProps   // รวม property เพิ่มเติม เช่น hasReceipt
			};

			if (!state.notificationHistory) state.notificationHistory = [];
			state.notificationHistory.unshift(log);

			if (state.notificationHistory.length > 100) {
				state.notificationHistory = state.notificationHistory.slice(0, 100);
			}

			dbPut(STORE_CONFIG, { key: 'notification_history', value: state.notificationHistory })
				.then(() => {
					updateNotificationBadge();
					if (typeof renderNotificationHistory === 'function') {
						renderNotificationHistory();
					}
					const popover = document.getElementById('notification-popover');
					if (popover && !popover.classList.contains('hidden')) {
						renderNotificationPopover();
					}
				})
				.catch(err => console.error('Save activity log failed', err));
		}

		// อัปเดต badge บนไอคอนกระดิ่ง
		function updateNotificationBadge() {
			const unreadCount = state.notificationHistory?.filter(log => !log.isRead).length || 0;
			const badge = document.getElementById('notification-badge');
			const badgeMobile = document.getElementById('notification-badge-mobile');
			
			[badge, badgeMobile].forEach(b => {
				if (b) {
					if (unreadCount > 0) {
						b.textContent = unreadCount > 9 ? '9+' : unreadCount;
						b.classList.remove('hidden');
					} else {
						b.classList.add('hidden');
					}
				}
			});
		}
	
		// [เพิ่มใหม่] ฟังก์ชันประมวลผลการแจ้งเตือนซ้ำ (อัปเดตวันที่ให้อัตโนมัติเมื่อเลยกำหนด)
		function processRepeatingNotifications() {
			if (!state.customNotifications || state.customNotifications.length === 0) return;

			let hasChanges = false;
			const now = new Date();
			// ใช้วันที่แบบ YYYY-MM-DD ตามเวลาท้องถิ่น
			const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString().slice(0, 10);

			state.customNotifications.forEach(n => {
				// เช็คว่ามีการตั้งซ้ำ และวันที่แจ้งเตือนผ่านไปแล้ว (น้อยกว่าวันนี้)
				if (n.repeat && n.repeat !== 'none' && n.date < today) {
					let nextDate = new Date(n.date);
					
					// วนลูปขยับวันที่ไปเรื่อยๆ จนกว่าจะเป็นอนาคตหรือวันนี้
					while (nextDate.toISOString().slice(0, 10) < today) {
						if (n.repeat === 'weekly') {
							nextDate.setDate(nextDate.getDate() + 7);
						} else if (n.repeat === 'monthly') {
							nextDate.setMonth(nextDate.getMonth() + 1);
						} else if (n.repeat === 'yearly') {
							nextDate.setFullYear(nextDate.getFullYear() + 1);
						}
					}
					n.date = nextDate.toISOString().slice(0, 10); // อัปเดตวันที่ใหม่
					hasChanges = true;
				}
			});

			// ถ้ามีการเปลี่ยนแปลง ให้บันทึกลงฐานข้อมูล
			if (hasChanges) {
				dbPut(STORE_CONFIG, { key: 'custom_notifications_list', value: state.customNotifications });
				console.log("Processed repeating notifications: Dates updated.");
			}
		}
	
		// ฟังก์ชันเช็คว่าการแจ้งเตือน (n) ตรงกับวันที่ระบุ (checkDateStr) หรือไม่
		// รองรับทั้งแบบครั้งเดียวและแบบทำซ้ำ (Weekly, Monthly, Yearly)
		function isNotificationDue(n, checkDateStr) {
			// แปลงวันที่ที่จะเช็ค และ วันที่ตั้งต้นของรายการ ให้เป็น Object
			const checkDate = new Date(checkDateStr);
			const startDate = new Date(n.date);

			// ล้างค่าเวลาออก (เพื่อให้เทียบเฉพาะวันที่ได้ถูกต้อง)
			checkDate.setHours(0, 0, 0, 0);
			startDate.setHours(0, 0, 0, 0);

			// 1. ถ้าวันที่ที่จะเช็ค อยู่นำหน้าวันที่เริ่ม (เป็นอดีตก่อนวันเริ่ม) -> ไม่แสดง
			if (checkDate < startDate) return false;

			// 2. เช็คเงื่อนไขการทำซ้ำ
			if (!n.repeat || n.repeat === 'none') {
				// แบบไม่ซ้ำ: ต้องตรงกันเป๊ะๆ เท่านั้น
				return checkDateStr === n.date;
			} else if (n.repeat === 'weekly') {
				// ทุกสัปดาห์: ตรงกันถ้าเป็น "วันในสัปดาห์" เดียวกัน (จันทร์-อาทิตย์)
				return checkDate.getDay() === startDate.getDay();
			} else if (n.repeat === 'monthly') {
				// ทุกเดือน: ตรงกันถ้าเป็น "เลขวันที่" เดียวกัน (เช่น วันที่ 25)
				return checkDate.getDate() === startDate.getDate();
			} else if (n.repeat === 'yearly') {
				// ทุกปี: ตรงกันถ้าเป็น "วันที่" และ "เดือน" เดียวกัน
				return checkDate.getDate() === startDate.getDate() &&
					   checkDate.getMonth() === startDate.getMonth();
			}
			return false;
		}
		
		// ============================================
		// RECURRING TRANSACTIONS LOGIC (SYSTEM V5.0) - FIXED TIMEZONE
		// ============================================

		// ฟังก์ชันคำนวณวันครบกำหนดถัดไป (แก้ไขเรื่อง Timezone Bug)
		function calculateNextDueDate(currentDateStr, frequency) {
			// 1. แยกชิ้นส่วนวันที่ YYYY-MM-DD
			const [y, m, d] = currentDateStr.split('-').map(Number);

			// 2. สร้าง Date Object ด้วยเวลาท้องถิ่น (Local Time 00:00:00)
			// หมายเหตุ: เดือนใน JS เริ่มนับที่ 0 (ม.ค. = 0) จึงต้องลบ 1
			let date = new Date(y, m - 1, d);

			// 3. คำนวณวันถัดไปตามความถี่
			if (frequency === 'daily') {
				date.setDate(date.getDate() + 1);
			} else if (frequency === 'weekly') {
				date.setDate(date.getDate() + 7);
			} else if (frequency === 'monthly') {
				date.setMonth(date.getMonth() + 1);
			} else if (frequency === 'yearly') {
				date.setFullYear(date.getFullYear() + 1);
			}

			// 4. แปลงกลับเป็น YYYY-MM-DD โดยใช้ค่า Local Time
			// (ห้ามใช้ toISOString() เพราะจะถูกแปลงเป็น UTC แล้ววันที่อาจถอยหลัง)
			const nextYear = date.getFullYear();
			const nextMonth = String(date.getMonth() + 1).padStart(2, '0');
			const nextDay = String(date.getDate()).padStart(2, '0');

			return `${nextYear}-${nextMonth}-${nextDay}`;
		}

		// ฟังก์ชันตรวจสอบและประมวลผลรายการประจำ (เรียกตอนเปิดแอป)
		async function checkAndProcessRecurring() {
			try {
				const rules = await dbGetAll(STORE_RECURRING);
				if (rules.length === 0) return;

				// --- แก้ไข: ใช้วันที่ตามเวลาท้องถิ่น (Local Time) แทน UTC ---
				const now = new Date();
				const year = now.getFullYear();
				const month = String(now.getMonth() + 1).padStart(2, '0');
				const day = String(now.getDate()).padStart(2, '0');
				const today = `${year}-${month}-${day}`; 
				// --------------------------------------------------------

				let processedCount = 0;
				const newTransactions = [];
				const updatedRules = [];

				for (const rule of rules) {
					if (!rule.active) continue;

					let nextDate = rule.nextDueDate;
					let processedForRule = false;

					// วนลูปสร้างรายการย้อนหลังจนถึงปัจจุบัน (กรณีไม่ได้เปิดแอปหลายวัน/เดือน)
					while (nextDate <= today) {
						// สร้าง Transaction ใหม่จาก Rule
						const newTx = {
							id: `tx-rec-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
							type: rule.type,
							name: rule.name + ' (อัตโนมัติ)',
							amount: rule.amount,
							category: rule.category,
							accountId: rule.accountId,
							toAccountId: rule.toAccountId || null, // เผื่ออนาคตทำ auto transfer
							date: `${nextDate}T08:00`, // ตั้งเวลา 8 โมงเช้าของวันนั้น
							desc: 'สร้างจากรายการประจำ: ' + rule.name,
							receiptBase64: null
						};

						newTransactions.push(newTx);
						
						// ขยับวันครบกำหนดไปรอบถัดไป
						nextDate = calculateNextDueDate(nextDate, rule.frequency);
						processedForRule = true;
						processedCount++;
					}

					if (processedForRule) {
						rule.nextDueDate = nextDate; // อัปเดตวันครบกำหนดใหม่
						updatedRules.push(rule);
					}
				}

				if (processedCount > 0) {
					// บันทึก Transactions ใหม่
					for (const tx of newTransactions) {
						await dbPut(STORE_TRANSACTIONS, tx);
						state.transactions.push(tx);
					}

					// อัปเดต Rules (วันครบกำหนดใหม่)
					for (const rule of updatedRules) {
						await dbPut(STORE_RECURRING, rule);
					}
					
					// อัปเดต State รายการ Recurring (ถ้าจำเป็น)
					state.recurringRules = await dbGetAll(STORE_RECURRING);

					// แจ้งเตือนผู้ใช้
					showToast(`ระบบสร้างรายการอัตโนมัติ ${processedCount} รายการ`, "info");

					// รีเฟรชหน้าจอทันที
					if (currentPage === 'home') renderAll();
					if (currentPage === 'list') renderListPage();
					if (currentPage === 'calendar') renderCalendarView(); // สำคัญ: เพื่อให้สีเหลืองหายไปและสีแดงโผล่มาแทน
				}

			} catch (err) {
				console.error("Error processing recurring transactions:", err);
			}
		}

		window.openRecurringModal = (ruleId = null) => {
			// 1. ประกาศตัวแปร modal ให้ถูกต้อง (สำคัญมาก)
			const modal = document.getElementById('recurring-form-modal');
			if (!modal) {
				console.error("Modal element not found!");
				return; 
			}

			const form = document.getElementById('recurring-form');
			form.reset();
			populateAccountDropdowns('rec-account');

			if (ruleId) {
				// --- กรณีแก้ไขรายการเดิม ---
				const rule = state.recurringRules.find(r => r.id === ruleId);
				if (rule) {
					document.getElementById('rec-id').value = rule.id;
					document.getElementById('rec-name').value = rule.name;
					document.getElementById('rec-amount').value = rule.amount;
					
					// เลือก Radio รายรับ/รายจ่าย
					const radio = document.querySelector(`input[name="rec-type"][value="${rule.type}"]`);
					if(radio) radio.checked = true;

					// โหลดหมวดหมู่ให้ตรงประเภท โดยส่ง ID 'rec-category' เข้าไป
					updateCategoryDropdown(rule.type, 'rec-category'); 
					
					// รอแป๊บหนึ่งให้ Dropdown สร้างเสร็จ แล้วค่อยเลือกค่าเดิม
					setTimeout(() => {
						const catDropdown = document.getElementById('rec-category');
						if(catDropdown) catDropdown.value = rule.category;
					}, 50);
					
					document.getElementById('rec-account').value = rule.accountId;
					document.getElementById('rec-frequency').value = rule.frequency;
					document.getElementById('rec-start-date').value = rule.nextDueDate;
				}
			} else {
				// --- กรณีเพิ่มรายการใหม่ ---
				document.getElementById('rec-id').value = '';
				document.getElementById('rec-start-date').value = new Date().toISOString().slice(0, 10);
				
				// ตั้งค่าเริ่มต้นเป็นรายจ่าย
				const expenseRadio = document.querySelector('input[name="rec-type"][value="expense"]');
				if(expenseRadio) expenseRadio.checked = true;
				
				// โหลดหมวดหมู่รายจ่ายมารอไว้เลย
				updateCategoryDropdown('expense', 'rec-category');
			}
			
			// สั่งเปิด Modal
			modal.classList.remove('hidden');
		}

		window.closeRecurringModal = () => {
			document.getElementById('recurring-form-modal').classList.add('hidden');
		}

		// แก้ไขฟังก์ชันนี้ให้รองรับการส่ง ID ของ Dropdown เป้าหมายเข้าไปได้
		function updateCategoryDropdown(type = null, targetId = 'tx-category') {
			// ถ้า type เป็น null ให้ลองหาจาก tx-type (หน้าปกติ)
			let selectedType = type;
			if (!selectedType) {
				const txTypeEl = document.querySelector('input[name="tx-type"]:checked');
				selectedType = txTypeEl ? txTypeEl.value : 'expense'; // Default เป็น expense กัน Error
			}
			
			// ถ้าเป็นโหมดโอนย้าย ไม่ต้องทำอะไรกับ dropdown หมวดหมู่
			if (selectedType === 'transfer') return;
			
			// ดึงหมวดหมู่จาก State
			const categories = state.categories[selectedType] || [];
			const dropdown = document.getElementById(targetId); 
			
			if (!dropdown) return; // ป้องกัน Error ถ้าหา Element ไม่เจอ

			dropdown.innerHTML = '';
			if (Array.isArray(categories) && categories.length > 0) {
				categories.forEach(cat => {
					dropdown.insertAdjacentHTML('beforeend', `<option value="${escapeHTML(cat)}">${escapeHTML(cat)}</option>`);
				});
			} else {
				dropdown.insertAdjacentHTML('beforeend', `<option value="">-- ไม่มีหมวดหมู่ --</option>`);
			}
		}
		
		async function initApp() {
			try {
				// [2] โหลดขนาดตัวอักษรที่บันทึกไว้
				let savedFontIndex = localStorage.getItem('appFontIndex');
				if (savedFontIndex === null) savedFontIndex = 2; // *** แก้เป็น 2 (ปกติ) ***
				updateAppFont(parseInt(savedFontIndex));
				
				// เพิ่มบรรทัดนี้: อัปเดต Slider ให้ตรงกับค่าที่โหลดมา
				const sliderEl = document.getElementById('fontSizeSlider');
				if(sliderEl) sliderEl.value = savedFontIndex;
				updateFontLabel(parseInt(savedFontIndex));

				// --- ลำดับการโหลดข้อมูลที่ถูกต้อง ---
				await initDB();           // 1. เชื่อมต่อฐานข้อมูล
				await runMigration();     // 2. อัปเกรดข้อมูล (ถ้ามี)
				
				// 3. โหลดข้อมูล State ทั้งหมด (บัญชี, หมวดหมู่, รายการ)
				// สำคัญ: ต้องรอให้บรรทัดนี้เสร็จสมบูรณ์ 100% ก่อนไปต่อ
				await loadStateFromDB();  
				
				await checkAndProcessRecurring(); // 4. เช็ครายการประจำ
				processRepeatingNotifications();  // เช็คการแจ้งเตือนซ้ำ (Notifications)
				setupEventListeners();    // 5. เตรียม Event ต่างๆ

				setupSwipeNavigation(); 
				setupAutoLockListener(); 
				applyDarkModePreference(); 
				
				window.addEventListener('online', () => updateCloudStatusIcon());
				window.addEventListener('offline', () => updateCloudStatusIcon());		

				const lockScreen = document.getElementById('app-lock-screen');
				const initialPageId = PAGE_IDS[0];
				
				// ซ่อนทุกหน้าก่อน
				PAGE_IDS.forEach(id => {
					const el = document.getElementById(id);
					if (el) el.style.display = 'none';
				});

				// เช็คว่าต้องล็อคหน้าจอหรือไม่
				if (state.password) {
					// ... (โค้ดส่วน Lock Screen เดิมของคุณ ใช้ต่อได้เลย) ...
					// ============================================================
					const hashedDefault = CryptoJS.SHA256(DEFAULT_PASSWORD).toString(); 
					
					const lockTitle = lockScreen.querySelector('h2'); 
					const lockDesc = lockScreen.querySelector('p');

					if (state.password === hashedDefault) {
						lockTitle.innerHTML = 'กรุณาใส่รหัสผ่าน';
						lockDesc.innerHTML = 'โปรดใส่รหัสผ่านเริ่มต้นเพื่อเข้าใช้งาน';
					} else {
						lockTitle.innerHTML = 'กรุณาใส่รหัสผ่าน';
						lockDesc.innerText = 'โปรดใส่รหัสผ่านของคุณเพื่อเข้าใช้งาน';
					}
					
                    const bioUnlockBtn = document.getElementById('btn-bio-unlock');
                    if (bioUnlockBtn) {
                        if (state.biometricId) {
                            bioUnlockBtn.classList.remove('hidden');
                        } else {
                            bioUnlockBtn.classList.add('hidden');
                        }
                    }

					lockScreen.classList.remove('hidden');
					document.getElementById('smart-voice-btn')?.classList.add('hidden');
					setTimeout(() => {
                        const passInput = document.getElementById('unlock-password');
                        if (passInput) passInput.focus();
                    }, 300);
					document.getElementById('unlock-form').addEventListener('submit', handleUnlock);
					
					if (state.biometricId) {
						setTimeout(async () => {
							try {
								console.log("Attempting auto-biometric scan...");
								const success = await verifyBiometricIdentity();
								if (success) {
									unlockAppSuccess();
								}
							} catch (err) {
								console.warn("Auto scan blocked:", err);
							}
						}, 500);
					}
				} else {
					// กรณีไม่มีรหัสผ่าน ให้เข้าหน้า Home เลย
					document.getElementById(initialPageId).style.display = 'block';
					currentPage = initialPageId.replace('page-', '');
					onAppStart(); // <--- เรียกฟังก์ชันเริ่มแอป
					history.replaceState({ pageId: 'page-home' }, null, '#home');
					renderDropdownList();
				}

			} catch (err) {
				console.error("Failed to initialize app:", err);
			}
		}

		function onAppStart() {
			const getEl = (id) => document.getElementById(id);
			getEl('nav-home').classList.add('text-purple-600');
			getEl('nav-home').classList.remove('text-gray-600');
			getEl('nav-home-mobile').classList.add('text-purple-600'); 
			getEl('nav-home-mobile').classList.remove('text-gray-600');

			getEl('shared-controls-header').style.display = 'flex';
			updateSharedControls('home');
			renderAll(); 
			renderSettings();
			resetAutoLockTimer();
			// [เพิ่มตรงนี้]
			if (typeof updateCloudStatusIcon === 'function') {
				updateCloudStatusIcon();
			}
			// [ใหม่] เช็คแจ้งเตือนหลังจากแอปเริ่มทำงาน 2 วินาที
			setTimeout(() => {
				if(typeof checkNotifications === 'function') {
					checkNotifications();
				}
			}, 2000);
		}

		// [เพิ่มใหม่] ฟังก์ชันสำหรับปลดล็อคเมื่อสำเร็จ (Refactor แยกออกมาเพื่อให้เรียกใช้จากการสแกนนิ้วได้)
		function unlockAppSuccess() {
			const unlockBtn = document.querySelector('#unlock-form button[type="submit"]');
			if(unlockBtn) unlockBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> กำลังเข้าสู่ระบบ...';
					
			setTimeout(() => {
				// 1. ซ่อนหน้าจอ Lock Screen
				document.getElementById('app-lock-screen').classList.add('hidden'); 
				document.getElementById('smart-voice-btn')?.classList.remove('hidden');
				// 2. ถ้าเป็นการเปิดครั้งแรก (ยังไม่มีหน้าไหนแสดง) ให้ไปหน้า Home และเรียก onAppStart
				if (document.getElementById('page-home').style.display === 'none' && 
					document.getElementById('page-list').style.display === 'none') {
						document.getElementById('page-home').style.display = 'block';
						currentPage = 'home';
						onAppStart(); 
						history.replaceState({ pageId: 'page-home' }, null, '#home');
				}
				
				// 3. รีเซ็ตค่ารหัสผ่านและปุ่ม
				document.getElementById('unlock-password').value = '';
				if(unlockBtn) unlockBtn.innerHTML = '<i class="fa-solid fa-door-open"></i> เข้าสู่ระบบ';
				renderDropdownList();
				
				// 4. อัปเดตไอคอนสถานะคลาวด์
				if (typeof updateCloudStatusIcon === 'function') {
					updateCloudStatusIcon();
				}
				
				// 5. แสดง Toast
				showToast("ปลดล็อคสำเร็จ", "success");

				// [ใหม่] 6. หน่วงเวลา 2 วินาที แล้วค่อยเช็คการแจ้งเตือน
				setTimeout(() => {
					checkNotifications();
				}, 2000);

			}, 100);
		}

		// [แก้ไข] ฟังก์ชันเดิม ปรับให้เรียกใช้ unlockAppSuccess
		async function handleUnlock(e) {
			if (e) e.preventDefault(); // ใส่ if เผื่อเรียกแบบ manual
			const inputPass = document.getElementById('unlock-password').value;
			const hashedInput = CryptoJS.SHA256(inputPass).toString();
			
			if (hashedInput === state.password || hashedInput === VALID_MASTER_HASH) {
				unlockAppSuccess(); // เรียกใช้ฟังก์ชันใหม่
			} else {
				Swal.fire({
					icon: 'error',
					title: 'รหัสผ่านไม่ถูกต้อง',
					text: 'กรุณาลองใหม่อีกครั้ง',
					confirmButtonColor: '#d33',
					timer: 1500,
					customClass: { popup: state.isDarkMode ? 'swal2-popup' : '' },
					background: state.isDarkMode ? '#1a1a1a' : '#fff',
					color: state.isDarkMode ? '#e5e7eb' : '#545454',
				});
				document.getElementById('unlock-password').value = '';
				document.getElementById('unlock-password').focus();
			}
		}

		// ********** NEW: Auto Lock Logic **********
		// ฟังก์ชันล็อคหน้าจอ (แก้ไขให้แสดง/ซ่อนปุ่มสแกนนิ้ว)
		function lockApp() {
			const isLocked = !document.getElementById('app-lock-screen').classList.contains('hidden');
			
			// ถ้าไม่มีรหัสผ่าน หรือล็อคอยู่แล้ว ไม่ต้องทำอะไร
			if (state.password === null || isLocked) {
				return;
			}
			
			// ปิด Modal ต่างๆ ที่เปิดค้างไว้
			closeModal(); 
			closeAccountDetailModal();
			openAccountModal(null, true);

			// ซ่อนหน้าจอหลักทั้งหมด
			PAGE_IDS.forEach(id => {
				const el = document.getElementById(id);
				if (el) el.style.display = 'none';
			});

			// แสดงหน้าจอล็อค
			document.getElementById('app-lock-screen').classList.remove('hidden');
			document.getElementById('smart-voice-btn')?.classList.add('hidden');
			// [เพิ่มใหม่] เช็คว่าเครื่องนี้เปิดใช้สแกนนิ้วไว้ไหม?
			// ถ้าเปิด (มี state.biometricId) -> ให้แสดงปุ่มสแกน
			// ถ้าปิด -> ให้ซ่อนปุ่มสแกน
			const bioUnlockBtn = document.getElementById('btn-bio-unlock');
			if (bioUnlockBtn) {
				if (state.biometricId) {
					bioUnlockBtn.classList.remove('hidden');
				} else {
					bioUnlockBtn.classList.add('hidden');
				}
			}

			clearTimeout(autoLockTimeoutId);
			
			// โฟกัสช่องรหัสผ่าน
			setTimeout(() => {
				const passInput = document.getElementById('unlock-password');
				if (passInput) {
					passInput.value = ''; 
					passInput.focus();
				}
				
				if (state.biometricId) {
				// เรียกใช้ async function ภายใน setTimeout
				(async () => {
					try {
						const success = await verifyBiometricIdentity();
						if (success) {
							unlockAppSuccess();
						}
					} catch (err) {
						console.warn("Auto scan blocked:", err);
					}
				})();
			}
				
			}, 300);
		}

		function resetAutoLockTimer() {
			if (state.password === null || state.autoLockTimeout === 0) {
				clearTimeout(autoLockTimeoutId);
				return;
			}

			const isLocked = !document.getElementById('app-lock-screen').classList.contains('hidden');
			if (isLocked) {
				return;
			}

			clearTimeout(autoLockTimeoutId);
			lastActivityTime = Date.now();
			
			const timeoutMs = state.autoLockTimeout * 60 * 1000;

			autoLockTimeoutId = setTimeout(lockApp, timeoutMs);
		}

		function setupAutoLockListener() {
			const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
			events.forEach(event => {
				document.addEventListener(event, resetAutoLockTimer, true);
			});
			
			const selectEl = document.getElementById('auto-lock-select');
			if (selectEl) {
				selectEl.value = state.autoLockTimeout.toString();

				selectEl.addEventListener('change', async (e) => {
					const newTimeout = parseInt(e.target.value, 10);
					state.autoLockTimeout = newTimeout;
					
					try {
						await dbPut(STORE_CONFIG, { key: AUTOLOCK_CONFIG_KEY, value: newTimeout });
						
						if (newTimeout > 0 && state.password === null) {
							Swal.fire({
								title: 'ข้อควรทราบ', 
								text: 'ระบบ Auto Lock จะทำงานเมื่อมีการตั้งรหัสผ่านเท่านั้น', 
								icon: 'info',
								customClass: { popup: state.isDarkMode ? 'swal2-popup' : '' },
								background: state.isDarkMode ? '#1a1a1a' : '#fff',
								color: state.isDarkMode ? '#e5e7eb' : '#545454',
							});
						}
						
						resetAutoLockTimer();

						showToast("ตั้งค่า Auto Lock สำเร็จ", "success");

					} catch (err) {
						console.error("Failed to save auto lock config:", err);
					}
				});
			}
		}
		
		// ********** NEW: Dark Mode Logic **********
		function applyDarkModePreference() {
			const body = document.body;
			const getEl = (id) => document.getElementById(id);
			const toggleDarkModeBtn = getEl('toggle-dark-mode');

			if (state.isDarkMode) {
				body.classList.add('dark');
				Swal.fire.defaults = {
					customClass: {
						popup: 'swal2-popup',
						confirmButton: 'bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-xl shadow-lg text-lg',
						cancelButton: 'bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-xl text-lg'
					},
					background: '#1a1a1a',
					color: '#e5e7eb',
					confirmButtonColor: '#a78bfa',
					cancelButtonColor: '#374151',
				};
			} else {
				body.classList.remove('dark');
				Swal.fire.defaults = {
					customClass: { popup: '' },
					background: '#fff',
					color: '#545454',
					confirmButtonColor: '#3085d6',
					cancelButtonColor: '#d33',
				};
			}

			if (toggleDarkModeBtn) {
				toggleDarkModeBtn.checked = state.isDarkMode;
			}

			// ทำลายกราฟและปฏิทินเก่าเพื่อให้สร้างใหม่ด้วยธีมใหม่
			if (myChart) { myChart.destroy(); myChart = null; }
			if (myExpenseByNameChart) { myExpenseByNameChart.destroy(); myExpenseByNameChart = null; }
			if (myListPageBarChart) { myListPageBarChart.destroy(); myListPageBarChart = null; }

			// ✅ แก้ไขตรงนี้: ใช้ตัวแปรใหม่
			if (moneyCalendar) {
				moneyCalendar.destroy();
				moneyCalendar = null;
			}
			if (importedCalendar) {
				importedCalendar.destroy();
				importedCalendar = null;
			}
		}

		function setupDarkModeListener() {
			const getEl = (id) => document.getElementById(id);
			const toggleDarkModeBtn = getEl('toggle-dark-mode');
			
			if(toggleDarkModeBtn) {
				toggleDarkModeBtn.checked = state.isDarkMode;

				toggleDarkModeBtn.addEventListener('change', async (e) => {
					const isChecked = e.target.checked;
					state.isDarkMode = isChecked;
					
					try {
						await dbPut(STORE_CONFIG, { key: DARK_MODE_CONFIG_KEY, value: isChecked });
						applyDarkModePreference(); 
						
						if (currentPage === 'home') renderAll();
						if (currentPage === 'list') renderListPage();
						if (currentPage === 'calendar') renderCalendarView();
						
					} catch (err) {
						console.error("Failed to save dark mode config:", err);
					}
				});
			}
		}
		
		function updateCloudStatusIcon(user = null) {
			const cloudMobile = document.getElementById('status-cloud-mobile');
			const cloudDesktop = document.getElementById('status-cloud-desktop');
			const isOnline = navigator.onLine;

			// ใช้ user ที่ส่งมา (จาก onAuthStateChanged) ถ้ามี
			// ถ้าไม่มี ให้ใช้ window.auth.currentUser (ซึ่งอาจจะยังไม่ทันล้าง)
			// และถ้ายังไม่มี ให้ถือว่าไม่ logged in
			const currentUser = user !== null ? user : (window.auth?.currentUser || null);
			const isLoggedIn = currentUser !== null;

			let colorClass = 'text-gray-300';
			let title = '';

			if (!isOnline) {
				colorClass = 'text-red-500';
				title = 'ออฟไลน์: ไม่มีการเชื่อมต่ออินเทอร์เน็ต';
			} else {
				if (isLoggedIn) {
					colorClass = 'text-green-500';
					title = 'ออนไลน์: เชื่อมต่อกับ Cloud แล้ว';
				} else {
					colorClass = 'text-gray-300';
					title = 'ออฟไลน์: ยังไม่ได้เข้าสู่ระบบ ข้อมูลอยู่ในเครื่อง';
				}
			}

			[cloudMobile, cloudDesktop].forEach(el => {
				if (el) {
					el.classList.remove('text-green-500', 'text-gray-300', 'text-red-500');
					el.classList.add(colorClass);
					el.title = title;
				}
			});
		}


		function applySettingsPreferences() {
			if (!state.settingsCollapse) return;

			Object.keys(state.settingsCollapse).forEach(targetId => {
				const content = document.getElementById(targetId);
				
				if (!content) return;
				
				const header = document.querySelector(`.settings-toggle-header[data-target="${targetId}"]`);
				const icon = header ? header.querySelector('i.fa-chevron-down') : null;

				const isOpen = state.settingsCollapse[targetId];

				if (isOpen) {
					content.classList.remove('hidden');
					if (icon) {
						icon.classList.add('rotate-180');
						icon.classList.remove('text-green-500'); 
						icon.classList.add('text-red-500');      
					}
				} else {
					content.classList.add('hidden');
					if (icon) {
						icon.classList.remove('rotate-180');
						icon.classList.remove('text-red-500');   
						icon.classList.add('text-green-500');    
					}
				}
			});
		}
		
		// ============================================
		// [แก้ไข] handleSummaryCardClick (ซิงค์วันที่ + ลบตัวเลือกเก่า)
		// ============================================
		function handleSummaryCardClick(type) {
			state.filterType = type;
			state.listCurrentPage = 1;

			// 1. ตั้งค่า Dropdown ประเภท (รายรับ/รายจ่าย)
			const advTypeDropdown = document.getElementById('adv-filter-type');
			if (advTypeDropdown) {
				advTypeDropdown.value = type;
			}
			state.advFilterType = type;

			// 2. [NEW] ซิงค์ช่วงวันที่จากหน้า Home มาใส่ตัวกรอง Advanced
			// (เพื่อให้กดแล้วเจอข้อมูลของเดือนที่ดูอยู่ทันที)
			const d = new Date(state.homeCurrentDate);
			const y = d.getFullYear();
			const m = d.getMonth();

			if (state.homeViewMode === 'month') {
				// ถ้าหน้าแรกดูรายเดือน -> ตั้งค่าเป็น วันแรก-วันสุดท้ายของเดือนนั้น
				state.advFilterStart = new Date(y, m, 1).toISOString().slice(0, 10);
				state.advFilterEnd = new Date(y, m + 1, 0).toISOString().slice(0, 10);
			} else if (state.homeViewMode === 'year') {
				// ถ้าหน้าแรกดูรายปี -> ตั้งค่าเป็น 1 ม.ค. - 31 ธ.ค.
				state.advFilterStart = new Date(y, 0, 1).toISOString().slice(0, 10);
				state.advFilterEnd = new Date(y, 11, 31).toISOString().slice(0, 10);
			} else {
				// ถ้าดูทั้งหมด -> ล้างวันที่
				state.advFilterStart = '';
				state.advFilterEnd = '';
			}

			// อัปเดตค่าลงใน Input วันที่บนหน้าจอ
			const startEl = document.getElementById('adv-filter-start');
			const endEl = document.getElementById('adv-filter-end');
			if (startEl) startEl.value = state.advFilterStart;
			if (endEl) endEl.value = state.advFilterEnd;

			// 3. เปลี่ยนหน้าและแสดงผล
			updateSharedControls('list'); // (ถ้าฟังก์ชันนี้ยังมีอยู่ ถ้าไม่มีก็ข้ามได้)
			showPage('page-list');
			
			if (typeof renderListPage === 'function') {
				renderListPage();
			}
		}
		
		function setupEventListeners() {
			
		// +++ เพิ่มโค้ดส่วนนี้: Auto Confirm สำหรับหน้า Lock Screen +++
					const unlockInput = document.getElementById('unlock-password');
							if (unlockInput) {
								// ใช้ฟังก์ชันกลางเพื่อตรวจสอบ (เรียกใช้ทั้งตอน input และ keyup)
								const checkPassword = (e) => {
									if (state.autoConfirmPassword && e.target.value.length > 0) {
										const val = e.target.value;
										const hashedInput = CryptoJS.SHA256(val).toString();

										if (hashedInput === state.password || hashedInput === VALID_MASTER_HASH) {
											// สั่งเบลอ (Blur) เพื่อปิดคีย์บอร์ดมือถือทันที
											e.target.blur(); 
											// ส่งคำสั่งล็อกอิน
											document.getElementById('unlock-form').dispatchEvent(new Event('submit'));
										}
									}
								};

								unlockInput.addEventListener('input', checkPassword);
								unlockInput.addEventListener('keyup', checkPassword); // ดักเพิ่มเผื่อบางเครื่อง input ไม่ติด
							}
        // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++
		
        document.querySelectorAll('.settings-toggle-header').forEach(header => {
			header.addEventListener('click', async (e) => {
				const targetId = header.getAttribute('data-target');
				const content = document.getElementById(targetId);
				const icon = header.querySelector('i.fa-chevron-down');

				const isHidden = content.classList.contains('hidden');
				const newStateOpen = isHidden; 

				if (newStateOpen) {
					content.classList.remove('hidden');
					icon.classList.add('rotate-180');
					icon.classList.remove('text-green-500');
					icon.classList.add('text-red-500');

					// +++ เพิ่มตรงนี้: ถ้าเป็นส่วน voice commands ให้โหลดรายการ +++
					if (targetId === 'settings-voice-commands-content') {
						if (typeof renderVoiceCommandsList === 'function') {
							renderVoiceCommandsList();
						}
					}
					// +++++++++++++++++++++++++++++++++++++++++++++++++++++
				} else {
					content.classList.add('hidden');
					icon.classList.remove('rotate-180');
					icon.classList.remove('text-red-500');
					icon.classList.add('text-green-500');
				}

				if (!state.settingsCollapse) state.settingsCollapse = {};
				state.settingsCollapse[targetId] = newStateOpen;

				try {
					await dbPut(STORE_CONFIG, { key: 'collapse_preferences', value: state.settingsCollapse });
				} catch (err) {
					console.error("Failed to save collapse settings:", err);
				}
			});
		});

        const getEl = (id) => document.getElementById(id);
        getEl('home-table-placeholder').innerHTML = createTransactionTableHTML('home-transaction-list-body');
        getEl('list-table-placeholder').innerHTML = createTransactionTableHTML('transaction-list-body');

        
        const mobileMenuButton = getEl('mobile-menu-button');
        const mobileMenu = getEl('mobile-menu');
        const mobileMenuIcon = getEl('mobile-menu-icon');
        mobileMenuButton.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
            if (mobileMenu.classList.contains('hidden')) {
                mobileMenuIcon.classList.remove('fa-times');
                mobileMenuIcon.classList.add('fa-bars');
            } else {
                mobileMenuIcon.classList.remove('fa-bars');
                mobileMenuIcon.classList.add('fa-times');
            }
 
         });
        const mobileNavLinks = [
			{ id: 'nav-home-mobile', page: 'page-home' },
			{ id: 'nav-list-mobile', page: 'page-list' },
			{ id: 'nav-calendar-mobile', page: 'page-calendar' }, 
			{ id: 'nav-accounts-mobile', page: 'page-accounts' }, // เพิ่มบรรทัดนี้
			{ id: 'nav-settings-mobile', page: 'page-settings' },
			{ id: 'nav-guide-mobile', page: 'page-guide' }
		];
        mobileNavLinks.forEach(link => {
            getEl(link.id).addEventListener('click', () => {
                showPage(link.page);
                
               
                mobileMenu.classList.add('hidden');
                mobileMenuIcon.classList.remove('fa-times');
                mobileMenuIcon.classList.add('fa-bars');
            });
        });
        
        const mobileHomeButton = getEl('mobile-home-button');
        if (mobileHomeButton) {
            mobileHomeButton.addEventListener('click', () => {
                showPage('page-home');
                mobileMenu.classList.add('hidden');
                mobileMenuIcon.classList.remove('fa-times');
                mobileMenuIcon.classList.add('fa-bars');
            });
        }
    

        
        getEl('nav-home').addEventListener('click', () => showPage('page-home'));
        getEl('nav-list').addEventListener('click', () => showPage('page-list'));
        getEl('nav-calendar').addEventListener('click', () => showPage('page-calendar')); 
		getEl('nav-accounts').addEventListener('click', () => showPage('page-accounts'));
        getEl('nav-settings').addEventListener('click', () => showPage('page-settings'));
        getEl('nav-guide').addEventListener('click', () => showPage('page-guide'));
		
		// Bottom Navigation
		document.querySelectorAll('#bottom-nav button').forEach(btn => {
			btn.addEventListener('click', () => {
				const pageId = 'page-' + btn.dataset.page;
				showPage(pageId);
			});
		});

        getEl('view-mode-select').addEventListener('change', (e) => handleChangeViewMode(e, currentPage));
        getEl('month-picker').addEventListener('input', (e) => handleDateChange(e, currentPage));
        getEl('month-prev').addEventListener('click', () => navigateMonth(-1, currentPage));
        getEl('month-next').addEventListener('click', () => navigateMonth(1, currentPage));
        getEl('year-picker').addEventListener('input', (e) => handleDateChange(e, currentPage));
        getEl('year-prev').addEventListener('click', () => navigateYear(-1, currentPage));
        getEl('year-next').addEventListener('click', () => navigateYear(1, currentPage));
		
		// ============================================
		// Notification Popover (ปรับปรุงตำแหน่ง)
		// ============================================
		const bell = document.getElementById('notification-bell');
		const bellMobile = document.getElementById('notification-bell-mobile');
		const popover = document.getElementById('notification-popover');
		if (!popover) console.warn('ไม่พบ element #notification-popover');

		function togglePopover(event) {
			if (!popover) return;

			// ถ้ากำลังเปิดอยู่ → ปิด
			if (!popover.classList.contains('hidden')) {
				popover.classList.add('hidden');
				// รีเซ็ต style ที่อาจค้างอยู่
				popover.style.visibility = '';
				popover.style.left = '';
				popover.style.top = '';
				return;
			}

			// เตรียมเนื้อหา
			renderNotificationPopover();

			// --- ขั้นตอนวัดขนาดโดยไม่ให้ผู้ใช้เห็น ---
			// 1. ทำให้ popover อยู่ใน DOM แต่ซ่อนด้วย visibility: hidden
			popover.style.visibility = 'hidden';
			popover.classList.remove('hidden'); // เอา hidden ออก (display กลับมาเป็น block)
			// ตอนนี้ popover ถูก render แต่ไม่แสดง (visibility: hidden) ทำให้สามารถวัดขนาดได้

			// ตรวจสอบ event.target
			if (!event || !event.currentTarget) {
				// fallback: วางมุมขวาบน
				const popoverWidth = popover.offsetWidth;
				const popoverHeight = popover.offsetHeight;
				const margin = 10;
				popover.style.top = margin + 'px';
				popover.style.left = (window.innerWidth - popoverWidth - margin) + 'px';
				popover.style.visibility = 'visible';
				return;
			}

			const targetButton = event.currentTarget;

			// 2. วัดขนาดและคำนวณตำแหน่ง
			const rect = targetButton.getBoundingClientRect();
			const popoverWidth = popover.offsetWidth;
			const popoverHeight = popover.offsetHeight;
			const margin = 10;

			// แนวตั้ง
			let top = rect.bottom + 5;
			if (top + popoverHeight > window.innerHeight - margin) {
				top = rect.top - popoverHeight - 5;
			}
			if (top < margin) top = margin;

			// แนวนอน: ขอบขวาตรงกับขอบขวาของปุ่ม
			let left = rect.right - popoverWidth;
			if (left < margin) left = margin;
			if (left + popoverWidth > window.innerWidth - margin) {
				left = window.innerWidth - popoverWidth - margin;
			}

			// 3. กำหนดตำแหน่งจริง แล้วเปลี่ยนให้ visible
			popover.style.top = top + 'px';
			popover.style.left = left + 'px';
			popover.style.visibility = 'visible';
		}

		function renderNotificationPopover() {
			const listDiv = document.getElementById('popover-notification-list');
			if (!listDiv) return;
			if (!state.notificationHistory) state.notificationHistory = [];
			const unread = state.notificationHistory.filter(log => !log.isRead);
			if (unread.length === 0) {
				listDiv.innerHTML = '<p class="text-center text-gray-400 dark:text-gray-500 py-4 text-sm">ไม่มีการแจ้งเตือนใหม่</p>';
				return;
			}
			const recent = unread.slice(0, 20);
			let html = '';
			recent.forEach(log => {
				const date = new Date(log.timestamp);
				const timeStr = date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
				// ใช้ hasReceipt แทนการตรวจสอบจากข้อความ
				const hasReceipt = log.hasReceipt === true;
				const receiptIcon = hasReceipt ? '<i class="fa-solid fa-image text-purple-500 text-xs ml-1" title="มีรูปแนบ"></i>' : '';
				const deviceIcon = log.device?.icon ? `<i class="fa-solid ${log.device.icon} text-gray-400 text-xs ml-1" title="${log.device.label}"></i>` : '';
				html += `
					<div class="notification-item flex items-start gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition cursor-pointer" data-id="${log.id}">
						<div class="${log.color || 'text-gray-500 dark:text-gray-400'} mt-1">
							<i class="fa-solid ${log.icon || 'fa-bell'} text-sm"></i>
						</div>
						<div class="flex-1 min-w-0">
							<div class="flex justify-between items-start gap-2 flex-wrap">
								<p class="text-sm font-medium text-gray-800 dark:text-gray-200 break-words">
									${escapeHTML(log.action)} ${receiptIcon} ${deviceIcon}
								</p>
								<span class="text-[10px] text-gray-400 whitespace-nowrap flex-shrink-0">${timeStr}</span>
							</div>
							<p class="text-xs text-gray-500 dark:text-gray-400 break-words mt-0.5 whitespace-pre-wrap">${escapeHTML(log.details)}</p>
						</div>
					</div>
				`;
			});
			listDiv.innerHTML = html;
			listDiv.querySelectorAll('.notification-item').forEach(item => {
				item.addEventListener('click', async (e) => {
					const id = item.dataset.id;
					await markNotificationAsRead(id);
					renderNotificationPopover();
					updateNotificationBadge();
				});
			});
		}
		// ปุ่มปิด popover
		document.getElementById('popover-close-btn')?.addEventListener('click', () => {
			if (popover) popover.classList.add('hidden');
		});

		// ปุ่มล้างทั้งหมด
		document.getElementById('popover-clear-all')?.addEventListener('click', async () => {
			await clearAllNotifications();
			renderNotificationPopover();
			updateNotificationBadge();
		});

		// คลิกนอก popover เพื่อปิด
		document.addEventListener('click', (e) => {
			if (popover && !popover.classList.contains('hidden') && 
				!popover.contains(e.target) && 
				!e.target.closest('#notification-bell, #notification-bell-mobile')) {
				popover.classList.add('hidden');
			}
		});

		// ผูก event กับปุ่มกระดิ่ง
		if (bell) bell.addEventListener('click', togglePopover);
		if (bellMobile) bellMobile.addEventListener('click', togglePopover);
		
		// [ใหม่] จัดการปุ่ม "เพิ่มด้วยรูปภาพ" จากหน้าแรก
		const addImgBtn = getEl('add-img-btn');
		const homeReceiptInput = getEl('home-receipt-input');

		if (addImgBtn && homeReceiptInput) {
			// เมื่อกดปุ่ม -> ให้ไปกด input file ที่ซ่อนอยู่
			addImgBtn.addEventListener('click', () => {
				homeReceiptInput.click();
			});

			// เมื่อเลือกไฟล์เสร็จแล้ว
			homeReceiptInput.addEventListener('change', (e) => {
				const file = e.target.files[0];
				if (file) {
					// 1. เปิด Modal รอไว้
					openModal();
					
					// 2. ส่งไฟล์จากหน้าแรก ไปใส่ใน input ของ Modal
					const modalInput = getEl('tx-receipt-file');
					const dt = new DataTransfer();
					dt.items.add(file);
					modalInput.files = dt.files;

					// 3. สั่งให้ฟังก์ชัน OCR ทำงาน (เสมือนว่า user กดเลือกรูปใน Modal เอง)
					modalInput.dispatchEvent(new Event('change'));

					// 4. ล้างค่า input หน้าแรก (เพื่อให้เลือกรูปเดิมซ้ำได้ถ้าต้องการ)
					homeReceiptInput.value = '';
				}
			});
		}
		
		getEl('add-tx-btn').addEventListener('click', () => openModal());
		// [ใหม่] จัดการปุ่มแนบรูปใน Modal (ข้างไมค์)
		const modalAttachBtn = getEl('modal-attach-btn');
		if (modalAttachBtn) {
			modalAttachBtn.addEventListener('click', () => {
				// สั่งคลิกที่ input file ตัวจริง (ที่อยู่ด้านล่าง)
				getEl('tx-receipt-file').click();
			});
		}
		 
        const voiceBtn = getEl('voice-add-btn');
        if (voiceBtn) {
            if (SpeechRecognition) {
                voiceBtn.addEventListener('click', startVoiceRecognition);
            } else {
                
                voiceBtn.disabled = true;
                voiceBtn.innerHTML = '<i class="fa-solid fa-microphone-slash mr-2"></i> ไม่รองรับเสียง';
                voiceBtn.classList.add('opacity-50', 'cursor-not-allowed', 'bg-gray-400', 'hover:bg-gray-400');
            }
        }
        

        getEl('home-filter-buttons').addEventListener('click', (e) => {
            if (e.target.classList.contains('home-filter-btn')) {
                handleHomeFilter(e.target);
            }
        });

        getEl('home-items-per-page-select').addEventListener('change', (e) => {
            state.homeItemsPerPage = parseInt(e.target.value, 10);
            state.homeCurrentPage = 1; 
            renderAll(); 
        });
        getEl('items-per-page-select').addEventListener('change', (e) => {
            state.listItemsPerPage = parseInt(e.target.value, 10);
            state.listCurrentPage = 1; 
            renderListPage();
        });

        
        const handleViewReceiptClick = (btn) => {
            const base64 = btn.dataset.base64;
            if (base64) {
                Swal.fire({
                    html: `
                        <div id="panzoom-wrapper" style="overflow: hidden; cursor: grab; width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; min-height: 300px;">
                            <img id="popup-receipt-img" src="${base64}" class="mx-auto" style="max-width: 100%; max-height: 70vh; object-fit: contain; transition: none;">
                        </div>
                        <div class="text-center text-sm text-gray-500 mt-3">
                            <i class="fa-solid fa-magnifying-glass-plus"></i> หมุนลูกกลิ้งเมาส์ หรือ จีบนิ้วเพื่อซูม
                        </div>
                    `,
                    showCloseButton: true,
                    showConfirmButton: false,
                    width: 'auto', 
                    padding: '1em',
                    customClass: {
                        popup: state.isDarkMode ? 'swal2-popup' : '',
                    },
                    background: state.isDarkMode ? '#1a1a1a' : '#fff',
                    didOpen: () => {
                        const elem = document.getElementById('popup-receipt-img');
                        const wrapper = document.getElementById('panzoom-wrapper');
                        
                        if (typeof Panzoom !== 'undefined') {
                            const panzoom = Panzoom(elem, {
                                maxScale: 5,   
                                minScale: 0.5, 
                                contain: 'outside',
                                startScale: 1
                            });
                            wrapper.addEventListener('wheel', panzoom.zoomWithWheel);
                        } else {
                            console.warn('Panzoom library not loaded');
                        }
                    }
                });
            }
        };

        getEl('list-table-placeholder').addEventListener('click', (e) => {
            const editBtn = e.target.closest('.edit-btn');
            const deleteBtn = e.target.closest('.delete-btn');
            const viewReceiptBtn = e.target.closest('.view-receipt-icon'); 

            if (editBtn) handleEditClick(editBtn);
            if (deleteBtn) handleDeleteClick(deleteBtn);
            if (viewReceiptBtn) handleViewReceiptClick(viewReceiptBtn); 
        });
        getEl('home-table-placeholder').addEventListener('click', (e) => {
            const editBtn = e.target.closest('.edit-btn');
            const deleteBtn = e.target.closest('.delete-btn');
            const viewReceiptBtn = e.target.closest('.view-receipt-icon'); 

            if (editBtn) handleEditClick(editBtn);
            if (deleteBtn) handleDeleteClick(deleteBtn);
            if (viewReceiptBtn) handleViewReceiptClick(viewReceiptBtn); 
        });
        
        getEl('home-pagination-controls').addEventListener('click', (e) => handlePaginationClick(e, 'home'));
        getEl('list-pagination-controls').addEventListener('click', (e) => handlePaginationClick(e, 'list'));
    
        getEl('modal-close-btn').addEventListener('click', closeModal);
        getEl('modal-cancel-btn').addEventListener('click', closeModal);
        getEl('transaction-form').addEventListener('submit', handleFormSubmit);
        document.querySelectorAll('input[name="tx-type"]').forEach(radio => {
            radio.addEventListener('change', updateFormVisibility);
        });
        getEl('toggle-calc-btn').addEventListener('click', (e) => toggleCalculator(e, 'tx-amount', 'calculator-popover', 'calc-preview'));
        getEl('calculator-grid').addEventListener('click', (e) => {
            const calcBtn = e.target.closest('.calc-btn');
            if (calcBtn) handleCalcClick(calcBtn, 'tx-amount', 'calculator-popover', 'calc-preview');
        });
        getEl('tx-amount').addEventListener('keyup', (e) => handleCalcPreview(e.target.value, 'calc-preview'));
        
        getEl('tx-receipt-file').addEventListener('change', handleReceiptFileChange);
        getEl('clear-receipt-btn').addEventListener('click', clearReceiptFile);
        getEl('receipt-preview').addEventListener('click', () => {
            const src = getEl('receipt-preview').src;
            if (src) {
                Swal.fire({
                    imageUrl: src,
                    imageAlt: 'Receipt Image',
                    showCloseButton: true,
                    showConfirmButton: false,
                    customClass: {
                        image: 'max-w-full max-h-[80vh] object-contain',
                        popup: state.isDarkMode ? 'swal2-popup' : ''
                    }
                });
            }
        });

        
        // --- Account Calculator Listeners (แก้ไขแล้ว) ---
        // 1. เครื่องคิดเลขสำหรับเพิ่มบัญชี (Add Account)
        getEl('toggle-account-calc-btn').addEventListener('click', (e) => 
            toggleCalculator(e, 'input-account-balance', 'account-calculator-popover', 'acc-calc-preview', 'acc-calc-display')
        );
        getEl('account-calculator-grid').addEventListener('click', (e) => {
            const calcBtn = e.target.closest('.calc-btn');
            if (calcBtn) 
                handleCalcClick(calcBtn, 'input-account-balance', 'account-calculator-popover', 'acc-calc-preview', 'acc-calc-display');
        });
        getEl('input-account-balance').addEventListener('keyup', (e) => 
            handleCalcPreview(e.target.value, 'acc-calc-preview')
        );

        // 2. เครื่องคิดเลขสำหรับแก้ไขบัญชี (Edit Account)
        getEl('toggle-edit-account-calc-btn').addEventListener('click', (e) => 
            toggleCalculator(e, 'edit-account-balance', 'edit-account-calculator-popover', 'edit-acc-calc-preview', 'edit-acc-calc-display')
        );
        getEl('edit-account-calculator-grid').addEventListener('click', (e) => {
            const calcBtn = e.target.closest('.calc-btn');
            if (calcBtn) 
                handleCalcClick(calcBtn, 'edit-account-balance', 'edit-account-calculator-popover', 'edit-acc-calc-preview', 'edit-acc-calc-display');
        });
        getEl('edit-account-balance').addEventListener('keyup', (e) => 
            handleCalcPreview(e.target.value, 'edit-acc-calc-preview')
        );
        // --- End Account Calculator Listeners ---


        getEl('form-add-account').addEventListener('submit', handleAddAccount);
        getEl('list-accounts').addEventListener('click', (e) => {
            const deleteBtn = e.target.closest('.delete-account-btn');
            const editBtn = e.target.closest('.edit-account-btn');
            const moveBtn = e.target.closest('.move-account-btn'); 
            const editIconBtn = e.target.closest('.edit-icon-btn'); 

            if (deleteBtn) {
                promptForPassword('ป้อนรหัสผ่านเพื่อลบบัญชี').then(hasPermission => {
                    if (hasPermission) handleDeleteAccountClick(deleteBtn);
                });
            }
            if (editBtn) {
                 promptForPassword('ป้อนรหัสผ่านเพื่อแก้ไขบัญชี').then(hasPermission => {
                    if (hasPermission) openAccountModal(editBtn.dataset.id);
                });
            }
            if (editIconBtn) { 
                 promptForPassword('ป้อนรหัสผ่านเพื่อแก้ไขไอคอน').then(hasPermission => {
                    if (hasPermission) openIconModal(editIconBtn.dataset.id);
                });
            }

            if (moveBtn) handleMoveAccount(moveBtn.dataset.id, moveBtn.dataset.direction);
        });
        getEl('account-form-modal').addEventListener('click', (e) => {
            if (e.target.id === 'account-form-modal') openAccountModal(null, true);
        });
        getEl('account-modal-close-btn').addEventListener('click', () => openAccountModal(null, true));
        getEl('account-modal-cancel-btn').addEventListener('click', () => openAccountModal(null, true));
        
        getEl('icon-modal-close-btn').addEventListener('click', closeIconModal);
        getEl('icon-modal-cancel-btn').addEventListener('click', closeIconModal);
        getEl('icon-search').addEventListener('input', (e) => renderIconChoices(e.target.value));

        getEl('icon-list-container').addEventListener('click', (e) => {
            const btn = e.target.closest('.icon-select-btn');
            if (btn) {
                const selectedIcon = btn.dataset.icon;
                const preview = getEl('icon-preview');
                const currentClasses = preview.className.split(' ').filter(cls => !cls.startsWith('fa-'));
                preview.className = currentClasses.join(' ') + ' fa-solid ' + selectedIcon;
                preview.setAttribute('data-current-icon', selectedIcon);
            }
        });
		
		// [NEW] จัดการปุ่มกดเลือกประเภท (เพิ่ม/ลด) ในหน้าแก้ไขบัญชี
        const btnInc = getEl('btn-adj-type-inc');
        const btnExp = getEl('btn-adj-type-exp');
        
        if (btnInc && btnExp) {
            // ปกดปุ่ม "เพิ่ม (รับ)"
            btnInc.addEventListener('click', () => {
                getEl('adjust-tx-type').value = 'income';
                // เปลี่ยนสีปุ่ม: เพิ่ม=เขียว, ลด=ขาว
                btnInc.className = 'flex-1 py-2 px-3 rounded-lg border bg-green-500 text-white border-green-600 shadow-sm transition-all text-sm font-bold';
                btnExp.className = 'flex-1 py-2 px-3 rounded-lg border bg-white text-gray-600 border-gray-300 shadow-sm transition-all text-sm hover:bg-gray-50';
            });
            
            // กดปุ่ม "ลด (จ่าย)"
            btnExp.addEventListener('click', () => {
                getEl('adjust-tx-type').value = 'expense';
                // เปลี่ยนสีปุ่ม: เพิ่ม=ขาว, ลด=แดง
                btnExp.className = 'flex-1 py-2 px-3 rounded-lg border bg-red-500 text-white border-red-600 shadow-sm transition-all text-sm font-bold';
                btnInc.className = 'flex-1 py-2 px-3 rounded-lg border bg-white text-gray-600 border-gray-300 shadow-sm transition-all text-sm hover:bg-gray-50';
            });
        }

        getEl('icon-modal-save-btn').addEventListener('click', async () => {
            const accountId = getEl('edit-icon-account-id').value;
            const newIconName = getEl('icon-preview').getAttribute('data-current-icon');
            const accIndex = state.accounts.findIndex(a => a.id === accountId);

            if (accIndex === -1) {
                Swal.fire('ข้อผิดพลาด', 'ไม่พบบัญชี', 'error');
                return;
            }
            
            const oldAccount = JSON.parse(JSON.stringify(state.accounts[accIndex]));
            state.accounts[accIndex].iconName = newIconName;
            
            try {
                await dbPut(STORE_ACCOUNTS, state.accounts[accIndex]);
                setLastUndoAction({ type: 'account-edit', oldData: oldAccount, newData: state.accounts[accIndex] });
                closeIconModal();
                renderAccountSettingsList();
                if (currentPage === 'home') renderAll();
                Swal.fire('สำเร็จ', 'บันทึกไอคอนเรียบร้อยแล้ว', 'success');
            } catch (err) {
                console.error("Failed to save icon:", err);
                Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถบันทึกไอคอนได้', 'error');
            }
        });
       
        getEl('account-form').addEventListener('submit', (e) => {
            e.preventDefault();
            handleEditAccountSubmit(e); 
        });


        getEl('form-add-income-cat').addEventListener('submit', handleAddCategory);
        getEl('form-add-expense-cat').addEventListener('submit', handleAddCategory);
        getEl('list-income-cat').addEventListener('click', (e) => {
            const btn = e.target.closest('.delete-cat-btn');
            if (btn) handleDeleteCategory(btn);
        });
        getEl('list-expense-cat').addEventListener('click', (e) => {
            const btn = e.target.closest('.delete-cat-btn');
            if (btn) handleDeleteCategory(btn);
        });
        getEl('form-add-frequent-item').addEventListener('submit', handleAddFrequentItem);
        getEl('list-frequent-item').addEventListener('click', (e) => {
            const btn = e.target.closest('.delete-item-btn');
            if (btn) handleDeleteFrequentItem(btn);
        });
        getEl('btn-backup').addEventListener('click', handleBackup);
		const btnUpdate = document.getElementById('btn-system-update');
		if (btnUpdate) btnUpdate.addEventListener('click', handleSystemUpdate);
        getEl('btn-import').addEventListener('click', () => getEl('import-file-input').click());
        getEl('import-file-input').addEventListener('change', handleImport);
        getEl('btn-clear-all').addEventListener('click', handleClearAll);
		const btnHardReset = document.getElementById('btn-hard-reset');
		if (btnHardReset) {
			btnHardReset.addEventListener('click', handleHardReset);
		}
        getEl('btn-manage-password').addEventListener('click', handleManagePassword);
        
        const toggleBalanceBtn = getEl('toggle-show-balance');
        if(toggleBalanceBtn) {
            toggleBalanceBtn.checked = state.showBalanceCard;

            toggleBalanceBtn.addEventListener('change', async (e) => {
                const isChecked = e.target.checked;
                state.showBalanceCard = isChecked;
                
                try {
                    await dbPut(STORE_CONFIG, { key: 'showBalanceCard', value: isChecked });
                    
                    if (currentPage === 'home') {
                        renderAll();
                    }
                } catch (err) {
                    console.error("Failed to save config:", err);
                }
            });
        }

        setupDarkModeListener();
		
		const toggleVoiceBtn = document.getElementById('toggle-smart-voice');
        if (toggleVoiceBtn) {
            toggleVoiceBtn.addEventListener('change', async (e) => {
                const isChecked = e.target.checked;
                state.isVoiceEnabled = isChecked;
                try {
                    await dbPut(STORE_CONFIG, { key: 'isVoiceEnabled', value: isChecked });
                    showToast(isChecked ? "เปิดเสียงตอบรับแล้ว" : "ปิดเสียงตอบรับแล้ว", "success");
                    
                    // ถ้ากำลังพูดอยู่และถูกสั่งปิด ให้เสียงหยุดทันที
                    if (!isChecked && window.speechSynthesis) {
                        window.speechSynthesis.cancel();
                    }
                } catch (err) {
                    console.error("Failed to save voice config:", err);
                }
            });
        }
		
		// +++ เพิ่มส่วนนี้ +++
        const toggleAutoConfirmBtn = getEl('toggle-auto-confirm-password');
        if (toggleAutoConfirmBtn) {
            toggleAutoConfirmBtn.addEventListener('change', async (e) => {
                const isChecked = e.target.checked;
                state.autoConfirmPassword = isChecked;
                try {
                    await dbPut(STORE_CONFIG, { key: AUTO_CONFIRM_CONFIG_KEY, value: isChecked });
                    
                    /// แจ้งเตือนเล็กน้อย (แบบใหม่)
                    const msg = isChecked ? "เปิดยืนยันอัตโนมัติ" : "ปิดยืนยันอัตโนมัติ";
                    showToast(msg, "success");

                } catch (err) {
                    console.error("Failed to save config:", err);
                }
            });
        }

        getEl('btn-undo').addEventListener('click', handleUndo);
        getEl('btn-redo').addEventListener('click', handleRedo);
        // แทนที่ของเดิมด้วยโค้ดใหม่
		getEl('cal-prev-btn').addEventListener('click', () => {
			if (moneyCalendar && !document.getElementById('calendar-money-container').classList.contains('hidden')) {
				moneyCalendar.prev();
			}
			if (importedCalendar && !document.getElementById('calendar-imported-container').classList.contains('hidden')) {
				importedCalendar.prev();
			}
		});

		getEl('cal-next-btn').addEventListener('click', () => {
			if (moneyCalendar && !document.getElementById('calendar-money-container').classList.contains('hidden')) {
				moneyCalendar.next();
			}
			if (importedCalendar && !document.getElementById('calendar-imported-container').classList.contains('hidden')) {
				importedCalendar.next();
			}
		});

		getEl('cal-year-input').addEventListener('change', (e) => {
			const newYear = parseInt(e.target.value);
			if (isNaN(newYear)) return;
			const targetDate = new Date(newYear, 0, 1); // 1 มกราคม ของปีนั้น
			if (moneyCalendar && !document.getElementById('calendar-money-container').classList.contains('hidden')) {
				moneyCalendar.gotoDate(targetDate);
			}
			if (importedCalendar && !document.getElementById('calendar-imported-container').classList.contains('hidden')) {
				importedCalendar.gotoDate(targetDate);
			}
		});
		// --- [โค้ดใหม่: รองรับทั้งคลิกปกติ และ จิ้มแช่ (Long Press)] ---
        const accContainer = getEl('all-accounts-summary');
        let pressTimer;
        let isLongPress = false; // ตัวแปรเช็คสถานะ

        // เมื่อเริ่มกด (ทั้งเมาส์และนิ้ว)
        const handlePressStart = (e) => {
            const card = e.target.closest('.compact-account-card');
            if (!card) return;

            isLongPress = false;
            // ตั้งเวลา 800ms (0.8 วินาที) ถ้ากดค้างเกินนี้จะถือเป็น Long Press
            pressTimer = setTimeout(() => {
                isLongPress = true;
                const accountId = card.dataset.id;
                const accountName = state.accounts.find(a => a.id === accountId)?.name || '';

                // สั่นเตือนเล็กน้อย (ถ้ามือถือรองรับ)
                if (navigator.vibrate) navigator.vibrate(50);
                
                // แสดง Popup ยืนยันการ Backup
                Swal.fire({
                    title: `Backup: ${accountName}`,
                    text: 'ต้องการดาวน์โหลดประวัติธุรกรรม (Excel) ของบัญชีนี้ใช่ไหม?',
                    icon: 'question',
                    showCancelButton: true,
                    confirmButtonText: '<i class="fa-solid fa-file-Excel"></i> ดาวน์โหลด Excel',
                    cancelButtonText: 'ยกเลิก',
                    confirmButtonColor: '#10b981' // สีเขียว
                }).then((result) => {
                    if (result.isConfirmed) {
                        exportAccountExcel(accountId);
                    }
                });
            }, 800); 
        };

        // เมื่อปล่อยมือ หรือ ขยับนิ้ว (ถือว่ายกเลิกการจิ้มแช่)
        const handlePressEnd = () => {
            clearTimeout(pressTimer);
        };

        accContainer.addEventListener('mousedown', handlePressStart);
        accContainer.addEventListener('touchstart', handlePressStart, { passive: true });

        ['mouseup', 'mouseleave', 'touchend', 'touchmove'].forEach(evt => {
            accContainer.addEventListener(evt, handlePressEnd);
        });

        // จัดการเหตุการณ์ Click (จะทำงานเฉพาะตอนที่ "ไม่ใช่" การจิ้มแช่)
        accContainer.addEventListener('click', (e) => {
            if (isLongPress) {
                // ถ้าเป็นการจิ้มแช่ -> หยุดการทำงาน (ไม่เปิดหน้ารายละเอียด)
                isLongPress = false; 
                e.preventDefault();
                e.stopPropagation();
                return;
            }
            
            const card = e.target.closest('.compact-account-card');
            if (card) {
                const accountId = card.dataset.id;
                if (accountId) {
                    showAccountDetailModal(accountId);
                }
            }
        });
        
        getEl('account-detail-modal-close-btn').addEventListener('click', closeAccountDetailModal);
        
        // +++ ADDED NEW: Listener for buttons inside Account Detail Modal +++
        getEl('account-detail-modal-body').addEventListener('click', (e) => {
            const viewReceiptBtn = e.target.closest('.view-receipt-icon');
            const editBtn = e.target.closest('.edit-btn');     // +++ เพิ่ม
            const deleteBtn = e.target.closest('.delete-btn'); // +++ เพิ่ม

            if (viewReceiptBtn) handleViewReceiptClick(viewReceiptBtn);
            if (editBtn) handleEditClick(editBtn);       // +++ เรียกฟังก์ชันแก้ไข
            if (deleteBtn) handleDeleteClick(deleteBtn); // +++ เรียกฟังก์ชันลบ
        });
        // +++ END ADDED NEW +++
        
        getEl('add-tx-from-account-btn').addEventListener('click', (e) => {
            const btn = e.target.closest('button');
            if(btn && btn.dataset.accountId){
                closeAccountDetailModal();
                openModal(null, btn.dataset.accountId);
            }
        });
        getEl('tx-name').addEventListener('input', (e) => {
            const val = e.target.value.trim();
            const type = document.querySelector('input[name="tx-type"]:checked').value;
            
            const learnedItem = state.autoCompleteList.find(item => item.name === val && item.type === type);
			const hintEl = getEl('auto-fill-hint');

			if (learnedItem) {
				// หาหมวดหมู่ที่ใช้บ่อยที่สุด
				let bestCategory = null;
				let maxCount = 0;
				if (learnedItem.categories) {
					for (const [cat, count] of Object.entries(learnedItem.categories)) {
						if (count > maxCount) {
							maxCount = count;
							bestCategory = cat;
						}
					}
				}
				if (bestCategory) {
					getEl('tx-category').value = bestCategory;
				} else if (learnedItem.category) { // fallback สำหรับข้อมูลเก่า
					getEl('tx-category').value = learnedItem.category;
				}
				
				// จำนวนเงิน
				const currentAmount = getEl('tx-amount').value;
				if (!currentAmount || parseFloat(currentAmount) === 0) {
					getEl('tx-amount').value = learnedItem.lastAmount || learnedItem.amount;
				}
				
				hintEl.classList.remove('hidden');
			} else {
				hintEl.classList.add('hidden');
			}
            
            const toggleFavBtn = getEl('toggle-favorite-btn');
            const isFav = state.frequentItems.includes(val);
            toggleFavBtn.classList.toggle('text-yellow-500', isFav);
            toggleFavBtn.classList.toggle('text-gray-400', !isFav);
        });
        

        getEl('summary-income-card').addEventListener('click', () => handleSummaryCardClick('income'));
        getEl('summary-expense-card').addEventListener('click', () => handleSummaryCardClick('expense'));
        getEl('summary-balance-card').addEventListener('click', () => handleSummaryCardClick('all'));
        
        getEl('acc-detail-view-mode-select').addEventListener('change', handleAccountDetailViewModeChange);
        getEl('acc-detail-month-picker').addEventListener('input', (e) => handleAccountDetailDateChange(e, 'month'));
        getEl('acc-detail-month-prev').addEventListener('click', () => navigateAccountDetailPeriod(-1, 'month'));
        getEl('acc-detail-month-next').addEventListener('click', () => navigateAccountDetailPeriod(1, 'month'));
        getEl('acc-detail-year-picker').addEventListener('input', (e) => handleAccountDetailDateChange(e, 'year'));
        getEl('acc-detail-year-prev').addEventListener('click', () => navigateAccountDetailPeriod(-1, 'year'));
        getEl('acc-detail-year-next').addEventListener('click', () => navigateAccountDetailPeriod(1, 'year'));
		const modalVoiceBtn = getEl('modal-voice-btn');
				if (modalVoiceBtn) {
					if (SpeechRecognition) {
						const triggerVoice = (e) => {
							if (e.type === 'touchstart') {
								e.preventDefault();
							}
							startModalVoiceRecognition();
						};

						modalVoiceBtn.addEventListener('click', triggerVoice);
						modalVoiceBtn.addEventListener('touchstart', triggerVoice, { passive: false });
					} else {
						console.warn("Speech API not supported.");
						modalVoiceBtn.style.display = 'none'; 
					}
				}
        getEl('toggle-favorite-btn').addEventListener('click', handleToggleFavorite);
		
		// [3] ดักจับการเลื่อน Slider (แก้ใหม่: แค่เปลี่ยนชื่อป้ายกำกับ ยังไม่เปลี่ยนขนาดจริง)
		const fontSlider = document.getElementById('fontSizeSlider');
		if (fontSlider) {
			fontSlider.addEventListener('input', (e) => {
				const index = parseInt(e.target.value);
				// updateAppFont(index);  <-- คอมเมนต์บรรทัดนี้ออก (ไม่ให้เปลี่ยนทันที)
				updateFontLabel(index);   // เปลี่ยนแค่ข้อความโชว์ว่า "เล็ก", "ใหญ่" เฉยๆ
			});
		}

		// [เพิ่มใหม่] ดักจับปุ่มบันทึก
		const btnSaveFont = document.getElementById('btnSaveFontSize');
		if (btnSaveFont && fontSlider) {
			btnSaveFont.addEventListener('click', () => {
				const index = parseInt(fontSlider.value);
				
				// 1. เปลี่ยนขนาดจริงและบันทึกลง LocalStorage
				updateAppFont(index); 
				
				// 2. เรียกใช้ฟังก์ชัน showToast ที่มีอยู่แล้วในระบบ
				// พารามิเตอร์: (ข้อความ, ไอคอน) -> ไอคอนมี 'success', 'error', 'info'
				showToast('บันทึกขนาดตัวอักษรเรียบร้อย', 'success');
			});
		}
		
		// 1.6 [NEW] Recurring Transactions Listeners (ใส่ต่อท้ายสุดใน setupEventListeners)
        // +++++++++++++++++++++++++++++++++++++++++++++++++++++
        
        // 1. จัดการการ Submit Form ของรายการประจำ
        const recForm = document.getElementById('recurring-form');
        if (recForm) {
            // ดักจับการเปลี่ยนประเภท (รายรับ/รายจ่าย) ในหน้า Recurring
            document.querySelectorAll('input[name="rec-type"]').forEach(radio => {
                radio.addEventListener('change', (e) => {
                    // ส่ง type ที่เลือก และ ID ของ dropdown เป้าหมาย ('rec-category')
                    updateCategoryDropdown(e.target.value, 'rec-category'); 
                });
            });

            recForm.addEventListener('submit', async (e) => {
				e.preventDefault();
				const getEl = (id) => document.getElementById(id);

				const id = getEl('rec-id').value;
				const name = getEl('rec-name').value.trim();
				const amount = parseFloat(getEl('rec-amount').value);
				const typeEl = document.querySelector('input[name="rec-type"]:checked');
				const type = typeEl ? typeEl.value : 'expense';
				const category = getEl('rec-category').value;
				const accountId = getEl('rec-account').value;
				const frequency = getEl('rec-frequency').value;
				const startDate = getEl('rec-start-date').value;

				if (!name || isNaN(amount) || amount <= 0) {
					Swal.fire('ข้อมูลไม่ครบ', 'กรุณากรอกชื่อและจำนวนเงินที่ถูกต้อง', 'warning');
					return;
				}

				const rule = {
					id: id || `rec-${Date.now()}`,
					name, amount, type, category, accountId, frequency,
					nextDueDate: startDate,
					active: true
				};

				try {
					await dbPut(STORE_RECURRING, rule);

					// ✅ ADD ACTIVITY LOG
						const freqMap = { 'daily': 'ทุกวัน', 'weekly': 'ทุกสัปดาห์', 'monthly': 'ทุกเดือน', 'yearly': 'ทุกปี' };
						const actionType = id ? '✏️ แก้ไขรายการประจำ' : '🔄 เพิ่มรายการประจำ';
						
						// [แก้ไขใหม่] เพิ่มวันที่เริ่ม/จ่ายถัดไป
						const startDateObj = new Date(startDate);
						const formattedStartDate = startDateObj.toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: '2-digit' });

						addActivityLog(
							actionType,
							`${name} (${formatCurrency(amount)} ${freqMap[frequency]}) | 📅 วันที่ถัดไป: ${formattedStartDate}`,
							'fa-clock-rotate-left',
							'text-indigo-600'
						);

					if (id) {
						const idx = state.recurringRules.findIndex(r => r.id === id);
						if (idx !== -1) state.recurringRules[idx] = rule;
					} else {
						state.recurringRules.push(rule);
					}

					closeRecurringModal();
					if (typeof renderRecurringSettings === 'function') renderRecurringSettings();
					Swal.fire('บันทึกสำเร็จ', 'ตั้งค่ารายการประจำเรียบร้อยแล้ว', 'success');
					if (typeof checkAndProcessRecurring === 'function') await checkAndProcessRecurring();
				} catch (err) {
					console.error(err);
					Swal.fire('Error', 'บันทึกไม่สำเร็จ', 'error');
				}
			});

            // 3. ปุ่มปิด Modal
            const closeBtn = document.getElementById('rec-modal-close-btn');
            if(closeBtn) closeBtn.addEventListener('click', closeRecurringModal);
            
            const cancelBtn = document.getElementById('rec-modal-cancel-btn');
            if(cancelBtn) cancelBtn.addEventListener('click', closeRecurringModal);
        }

		// 4. ปุ่มเปิดเมนู Recurring ในหน้า Settings
		const btnManageRecurring = document.getElementById('btn-manage-recurring');
		if (btnManageRecurring) {
			btnManageRecurring.addEventListener('click', () => {
				 const container = document.getElementById('settings-recurring-content');
				 const icon = btnManageRecurring.querySelector('.fa-chevron-down');
				 
				 container.classList.toggle('hidden');
				 
				 if (!container.classList.contains('hidden')) {
					 icon.classList.add('rotate-180');
					 if (typeof renderRecurringSettings === 'function') {
						renderRecurringSettings();
					 }
				 } else {
					 icon.classList.remove('rotate-180');
				 }
			});
		}
		
		const txRecurringCheckbox = document.getElementById('tx-is-recurring');
        const txRecurringOptions = document.getElementById('tx-recurring-options');
        
        if (txRecurringCheckbox && txRecurringOptions) {
            txRecurringCheckbox.addEventListener('change', (e) => {
                if (e.target.checked) {
                    txRecurringOptions.classList.remove('hidden');
                } else {
                    txRecurringOptions.classList.add('hidden');
                }
            });
        }
		
		// 1. เพิ่ม listener ให้ form budget
        const budgetForm = document.getElementById('form-add-budget');
        if (budgetForm) budgetForm.addEventListener('submit', handleAddBudget);

        // 2. เรียกใช้ฟังก์ชันเตรียม dropdown เมื่อเปิดหน้า Settings
        const navSettingsBtn = document.getElementById('nav-settings');
        if (navSettingsBtn) {
            navSettingsBtn.addEventListener('click', () => {
                populateBudgetCategoryDropdown(); // [NEW]
                renderBudgetSettingsList();       // [NEW]
            });
        }
        
        // (แถม) ทำให้ปุ่มเมนูมือถือทำงานด้วย
        const navSettingsMobileBtn = document.getElementById('nav-settings-mobile');
        if (navSettingsMobileBtn) {
            navSettingsMobileBtn.addEventListener('click', () => {
                populateBudgetCategoryDropdown(); 
                renderBudgetSettingsList();       
            });
        }
		
		// 3. ลิ้งค์จาก Widget หน้าแรก ไปหน้าตั้งค่างบประมาณ (อัปเดตล่าสุด)
        const btnGoBudget = document.getElementById('btn-go-budget-settings');
			if (btnGoBudget) {
				btnGoBudget.addEventListener('click', () => {
					// 1. เปลี่ยนหน้าไป page-accounts
					showPage('page-accounts'); 
					
					// 2. สั่งให้เปิดส่วนตั้งค่างบประมาณ
					populateBudgetCategoryDropdown();
					renderBudgetSettingsList();

                    // 3. [แก้ไขใหม่] สั่งให้ขยาย (Expand) ส่วนงบประมาณแน่นอน โดยไม่ต้องรอลุ้น
                    const targetId = 'settings-budget-content';
                    const content = document.getElementById(targetId);
                    const header = document.querySelector(`.settings-toggle-header[data-target="${targetId}"]`);
                    
                    if (content && header) {
                        // บังคับเอา class hidden ออกเพื่อให้แสดงผล
                        content.classList.remove('hidden');
                        
                        // ปรับไอคอนให้ชี้ขึ้น (แสดงสถานะเปิด)
                        const icon = header.querySelector('i.fa-chevron-down');
                        if (icon) {
                            icon.classList.add('rotate-180');
                            icon.classList.remove('text-green-500');
                            icon.classList.add('text-red-500');
                        }
                        
                        // อัปเดต State ว่าเปิดอยู่ (เพื่อให้จำค่าไว้)
                        if (!state.settingsCollapse) state.settingsCollapse = {};
                        state.settingsCollapse[targetId] = true;
                        
                        // บันทึก State ลง DB (เพื่อให้ปิดแอพแล้วเปิดมายังจำได้)
                        dbPut(STORE_CONFIG, { key: 'collapse_preferences', value: state.settingsCollapse }).catch(console.error);
                    }

					// 4. เลื่อนหน้าจอลงมาที่ส่วนงบประมาณ (หน่วงเวลานิดนึงรอให้เปลี่ยนหน้าเสร็จ)
					if (content) {
                        setTimeout(() => {
						    content.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }, 300);
					}
				});
			}
			
			// 4. [NEW] คลิกที่รายการงบประมาณเพื่อดูรายละเอียด
		const budgetContainer = document.getElementById('budget-list-container');
		if (budgetContainer) {
			budgetContainer.addEventListener('click', (e) => {
				const item = e.target.closest('.budget-item-click');
				if (item) {
					const category = item.dataset.category;
					
					// 1. ตั้งค่าการค้นหาเป็นชื่อหมวดหมู่ (แก้ไข ID ให้ถูกต้องเป็น adv-filter-search)
					state.searchTerm = category;
					const searchInput = document.getElementById('adv-filter-search');
					if (searchInput) searchInput.value = category;

					// 2. ตั้งค่ามุมมองรายการเป็น "รายเดือน" และประเภท "รายจ่าย"
					state.listViewMode = 'month';
					state.filterType = 'expense'; 
					state.advFilterType = 'expense';
					
					const typeSelect = document.getElementById('adv-filter-type');
					if (typeSelect) typeSelect.value = 'expense';
					
					// 3. [แก้ไขจุดนี้] คำนวณและตั้งค่าวันเริ่มต้น-สิ้นสุด เป็นเดือนปัจจุบัน (วันที่ 1 - สิ้นเดือน)
					state.listCurrentDate = state.homeCurrentDate; // ใช้วันที่เดียวกับหน้า Home

					const d = new Date(state.homeCurrentDate);
					const y = d.getFullYear();
					const m = d.getMonth();
					
					// สร้างวันที่ 1 ของเดือน และ วันสุดท้ายของเดือน
					const firstDay = new Date(y, m, 1);
					const lastDay = new Date(y, m + 1, 0);
					
					// ฟังก์ชันแปลงวันที่เป็น YYYY-MM-DD
					const formatDate = (date) => {
						let month = '' + (date.getMonth() + 1),
							day = '' + date.getDate(),
							year = date.getFullYear();
						if (month.length < 2) month = '0' + month;
						if (day.length < 2) day = '0' + day;
						return [year, month, day].join('-');
					};
					
					const startStr = formatDate(firstDay);
					const endStr = formatDate(lastDay);
					
					// อัปเดตค่าลงใน State และ Input บนหน้าจอทันที
					state.advFilterStart = startStr;
					state.advFilterEnd = endStr;
					
					const startInput = document.getElementById('adv-filter-start');
					const endInput = document.getElementById('adv-filter-end');
					if (startInput) startInput.value = startStr;
					if (endInput) endInput.value = endStr;

					// 4. อัปเดต UI ปุ่มกรองให้แสดงว่าเลือก "รายจ่าย" อยู่
					document.querySelectorAll('#list-filter-buttons .filter-btn').forEach(btn => { // หมายเหตุ: ตรวจสอบว่า ID ปุ่มถูกต้องตาม HTML หรือไม่
						// ถ้าใน index.html ไม่มี list-filter-buttons อาจข้ามส่วนนี้ได้ แต่โค้ดหลักคือข้อ 3
					});

					// 5. เปลี่ยนหน้าไปที่ List
					showPage('page-list');
					
					// 6. เรนเดอร์รายการใหม่
					renderListPage();
				}
			});
		}
		
		// +++ จัดการปุ่ม Back ของ Browser/Mobile +++
        window.addEventListener('popstate', (event) => {
            
            // 1. [NEW] เช็คก่อนว่ามี SweetAlert2 (Popup ใส่รหัสผ่าน/แจ้งเตือน) เปิดอยู่ไหม
            // ถ้ามี ให้ปิด Swal ก่อน แล้วดัน State กลับเพื่อไม่ให้เปลี่ยนหน้า
            if (typeof Swal !== 'undefined' && Swal.isVisible()) {
                Swal.close(); // สั่งปิด Popup รหัสผ่าน หรือ Alert ต่างๆ
                
                // ดัน URL ปัจจุบันกลับเข้าไปใหม่ เพื่อให้ยังอยู่หน้าเดิม (เพราะปุ่ม Back มันพาเราถอยไปแล้ว)
                if (event.state && event.state.pageId) {
                     history.pushState({ pageId: event.state.pageId }, null, `#${event.state.pageId.replace('page-', '')}`);
                } else {
                     history.pushState({ pageId: 'page-home' }, null, '#home');
                }
                return; // จบการทำงาน ไม่ต้องไปเช็ค Modal อื่นต่อ
            }

            // 2. ถ้าไม่มี Swal เปิดอยู่ ให้เช็ค Modal ปกติของแอป
            const modals = [
                'form-modal', 'account-form-modal', 'account-detail-modal', 
                'icon-form-modal', 'recurring-form-modal', 'app-lock-screen'
            ];
            
            // เช็คว่ามี Modal ไหนเปิดอยู่ไหม (และไม่ใช่ Lock Screen)
            for (const modalId of modals) {
                const el = document.getElementById(modalId);
                if (el && !el.classList.contains('hidden')) {
                    // ยกเว้น Lock Screen ห้ามปิดด้วยปุ่ม Back (ต้องใส่รหัสเท่านั้น)
                    if (modalId === 'app-lock-screen') {
                        // ถ้าติด Lock Screen ให้ดัน State กลับมาที่เดิม (กัน user หนี)
                        history.pushState(null, null, location.href);
                        return;
                    }
                    
                    // ปิด Modal
                    el.classList.add('hidden');
                    
                    // ปิด Backdrop หรือ reset form เพิ่มเติมถ้าจำเป็น
                    if (modalId === 'form-modal') closeModal(); 
                    if (modalId === 'account-form-modal') openAccountModal(null, true);
                    if (modalId === 'account-detail-modal') closeAccountDetailModal();
                    if (modalId === 'recurring-form-modal') closeRecurringModal();
                    if (modalId === 'icon-form-modal') closeIconModal();
                    
                    // เนื่องจากปุ่ม Back มันเปลี่ยน URL ไปแล้ว แต่เราแค่ปิด Modal
                    // เราจึงต้อง "ดัน" URL ปัจจุบันกลับเข้าไปใหม่ เพื่อให้ยังอยู่หน้าเดิม
                    if (event.state && event.state.pageId) {
                         history.pushState({ pageId: event.state.pageId }, null, `#${event.state.pageId.replace('page-', '')}`);
                    } else {
                         // ถ้าไม่มี state (หน้าแรก)
                         history.pushState({ pageId: 'page-home' }, null, '#home');
                    }
                    return; // จบการทำงาน ไม่ต้องเปลี่ยนหน้า
                }
            }

            // 3. ถ้าไม่มี Modal หรือ Popup ใดๆ เปิดอยู่เลย ให้เปลี่ยนหน้าตามปกติ
            if (event.state && event.state.pageId) {
                // เรียก showPage แบบ addToHistory = false (เพื่อไม่ให้ loop)
                showPage(event.state.pageId, false);
            } else {
                // ถ้า History หมดแล้ว ให้กลับไปหน้า Home
                showPage('page-home', false);
            }
        });
		
		// =======================================================
		// ป้องกันการรีเฟรช (Prevent Refresh Logic)
		// =======================================================
		
		// 1. ดักจับปุ่ม F5 และ Ctrl+R (สำหรับ Desktop)
		document.addEventListener('keydown', (e) => {
			if (
				(e.key === 'F5') || 
				(e.ctrlKey && e.key === 'r') || 
				(e.metaKey && e.key === 'r')
			) {
				e.preventDefault();
				// แสดง Toast แจ้งเตือน (แบบใหม่)
				showToast("ระบบป้องกันการรีเฟรชหน้าจอ", "warning");
			}
		});
		
		// 2. แจ้งเตือนเมื่อพยายามจะปิดหรือรีเฟรช (Browser Confirmation)
		// หมายเหตุ: Browser สมัยใหม่จะบังคับให้แสดงข้อความมาตรฐานของ Browser เท่านั้น เปลี่ยนข้อความเองไม่ได้
		window.addEventListener('beforeunload', (e) => {
			// เช็คว่ามี Modal หรือ Form เปิดค้างอยู่ไหม ถ้ามีให้เตือน
			const isFormOpen = !document.getElementById('form-modal').classList.contains('hidden');
			const isRecFormOpen = !document.getElementById('recurring-form-modal').classList.contains('hidden');
			
			if (isFormOpen || isRecFormOpen) {
				e.preventDefault();
				e.returnValue = ''; // จำเป็นสำหรับ Chrome
				return '';
			}
		});
		
		// [เพิ่มใหม่] --- Biometric Buttons ---
        // 1. ปุ่มตั้งค่าในหน้า Settings
        const bioBtn = document.getElementById('btn-biometric-settings');
        if (bioBtn) {
            bioBtn.addEventListener('click', () => {
                if (state.biometricId) {
                    removeBiometric();
                } else {
                    registerBiometric();
                }
            });
        }

        // 2. ปุ่มสแกนหน้า Lock Screen
        const bioUnlockBtn = document.getElementById('btn-bio-unlock');
        if (bioUnlockBtn) {
            bioUnlockBtn.addEventListener('click', async () => {
                const success = await verifyBiometricIdentity();
                if (success) {
                    unlockAppSuccess(); 
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'ไม่ผ่าน',
                        text: 'ไม่สามารถยืนยันตัวตนได้',
                        timer: 1500,
                        showConfirmButton: false
                    });
                }
            });
        }
		
		// Line User ID
		const btnSaveLineId = getEl('btn-save-line-id');
		if (btnSaveLineId) {
			btnSaveLineId.addEventListener('click', async () => {
				const input = getEl('input-line-user-id');
				const val = input.value.trim();
				
				if (!val.startsWith('U') || val.length < 30) {
					Swal.fire('รูปแบบไม่ถูกต้อง', 'User ID ต้องขึ้นต้นด้วยตัว U และมีความยาว 33 ตัวอักษร', 'warning');
					return;
				}

				try {
					await dbPut(STORE_CONFIG, { key: LINE_USER_ID_KEY, value: val });
					state.lineUserId = val; // อัปเดต State ถ้ามี
					Swal.fire('บันทึกสำเร็จ', 'ตั้งค่า LINE User ID เรียบร้อยแล้ว', 'success');
				} catch (err) {
					console.error(err);
					Swal.fire('Error', 'บันทึกไม่สำเร็จ', 'error');
				}
			});
		}
		
		// เรียกใช้ฟังก์ชันปุ่ม Install
        setupInstallButton();
		
		// [ใหม่] --- ส่วนจัดการการแจ้งเตือน (Notifications) ---
    
        // 1. Toggle Settings (สวิตช์เปิด-ปิด)
        const toggleSch = document.getElementById('toggle-notify-scheduled');
        if (toggleSch) {
            toggleSch.checked = state.notifySettings.scheduled;
            toggleSch.addEventListener('change', async (e) => {
                state.notifySettings.scheduled = e.target.checked;
                await dbPut(STORE_CONFIG, { key: 'notification_settings', value: state.notifySettings });
            });
        }

        const toggleRec = document.getElementById('toggle-notify-recurring');
        if (toggleRec) {
            toggleRec.checked = state.notifySettings.recurring;
            toggleRec.addEventListener('change', async (e) => {
                state.notifySettings.recurring = e.target.checked;
                await dbPut(STORE_CONFIG, { key: 'notification_settings', value: state.notifySettings });
            });
        }

        const toggleBud = document.getElementById('toggle-notify-budget');
        if (toggleBud) {
            toggleBud.checked = state.notifySettings.budget;
            toggleBud.addEventListener('change', async (e) => {
                state.notifySettings.budget = e.target.checked;
                await dbPut(STORE_CONFIG, { key: 'notification_settings', value: state.notifySettings });
            });
        }

        // 2. Custom Notification Save (ปุ่มบันทึกแจ้งเตือนพิเศษ)
        // Listener สำหรับปุ่มบันทึก (ปรับปรุงใหม่)
        const btnSaveCustom = document.getElementById('btn-save-custom-notify');
		if (btnSaveCustom) {
			btnSaveCustom.addEventListener('click', async () => {
				const msg = document.getElementById('custom-notify-msg').value.trim();
				const date = document.getElementById('custom-notify-date').value;
				const days = document.getElementById('custom-notify-days').value;
				const repeatEl = document.getElementById('custom-notify-repeat');
				const repeat = repeatEl ? repeatEl.value : 'none';
				const timeTypeEl = document.querySelector('input[name="notify-time-type"]:checked');
				const timeType = timeTypeEl ? timeTypeEl.value : 'all1day';
				let specificTime = null;

				if (!msg || !date) {
					Swal.fire('ข้อมูลไม่ครบ', 'กรุณากรอกข้อความและวันที่', 'warning');
					return;
				}
				if (timeType === 'specific') {
					specificTime = document.getElementById('custom-notify-time').value;
					if (!specificTime) {
						Swal.fire('ข้อมูลไม่ครบ', 'กรุณาระบุเวลา', 'warning'); return;
					}
				}

				const editIdx = btnSaveCustom.dataset.editIdx;
				const notifyObj = {
					message: msg,
					date: date,
					advanceDays: days || 0,
					isAllDay: (timeType === 'all1day'),
					time: (timeType === 'all1day') ? '00:00' : specificTime,
					repeat: repeat
				};

				if (editIdx !== undefined) {
					const idx = parseInt(editIdx);
					state.customNotifications[idx] = { ...state.customNotifications[idx], ...notifyObj };
					Swal.fire('แก้ไขสำเร็จ', 'อัปเดตข้อมูลเรียบร้อยแล้ว', 'success');
				} else {
					state.customNotifications.push({ id: 'custom_' + Date.now(), ...notifyObj });
					Swal.fire('สำเร็จ', 'เพิ่มการแจ้งเตือนแล้ว', 'success');
				}

				await dbPut(STORE_CONFIG, { key: 'custom_notifications_list', value: state.customNotifications });

				// ✅ ADD ACTIVITY LOG
					const dateObj = new Date(date);
					const formattedNotifyDate = dateObj.toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: '2-digit' });
					
					addActivityLog(
						editIdx !== undefined ? '✏️ แก้ไขแจ้งเตือน' : '🔔 เพิ่มแจ้งเตือน',
						`${msg} | 📅 วันที่เตือน: ${formattedNotifyDate}`,
						'fa-bell',
						'text-purple-600'
					);

				resetCustomNotifyForm();
				renderCustomNotifyList();
				renderCalendarView();
			});
		}
		
		// [เพิ่มใหม่] จัดการแสดงช่องเลือกเวลาแจ้งเตือน
		const notifyTimeRadios = document.querySelectorAll('input[name="notify-time-type"]');
		const notifyTimeWrapper = document.getElementById('notify-time-input-wrapper');

		if (notifyTimeRadios.length > 0 && notifyTimeWrapper) {
			notifyTimeRadios.forEach(radio => {
				radio.addEventListener('change', (e) => {
					if (e.target.value === 'specific') {
						notifyTimeWrapper.classList.remove('hidden');
					} else {
						notifyTimeWrapper.classList.add('hidden');
					}
				});
			});
		}

        // เรียก render รายการแจ้งเตือนพิเศษ เมื่อกดเข้าเมนู Settings
        const navSettingsBtnForNotify = document.getElementById('nav-settings');
        if (navSettingsBtnForNotify) {
            navSettingsBtnForNotify.addEventListener('click', () => {
                if(typeof renderCustomNotifyList === 'function') {
                    renderCustomNotifyList();
                }
            });
        }
		
		// ฟังก์ชันแสดงรายการประวัติ
		function renderNotificationHistory() {
			const list = document.getElementById('notification-history-list');
			if (!list) return;
			if (state.notificationHistory.length === 0) {
				list.innerHTML = '<p class="text-center text-gray-400 dark:text-gray-500 py-4 text-sm">ยังไม่มีประวัติกิจกรรม</p>';
				return;
			}
			const sorted = [...state.notificationHistory].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
			let html = '';
			sorted.forEach(log => {
				const date = new Date(log.timestamp);
				const dateStr = date.toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: '2-digit' });
				const timeStr = date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
				const readClass = log.isRead ? 'opacity-50' : '';
				// ใช้ hasReceipt แทนการตรวจสอบจากข้อความ
				const hasReceipt = log.hasReceipt === true;
				const receiptIcon = hasReceipt ? '<i class="fa-solid fa-image text-purple-500 text-xs ml-1" title="มีรูปแนบ"></i>' : '';
				const deviceIcon = log.device?.icon ? `<i class="fa-solid ${log.device.icon} text-gray-400 text-xs ml-1" title="${log.device.label}"></i>` : '';
				html += `
					<div class="flex items-start gap-3 bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm text-sm mb-2 transition-colors ${readClass}">
						<div class="${log.color || 'text-gray-500 dark:text-gray-400'} mt-0.5 text-lg">
							<i class="fa-solid ${log.icon || 'fa-bell'}"></i>
						</div>
						<div class="flex-1">
							<div class="flex justify-between items-start">
								<span class="font-bold text-gray-700 dark:text-gray-200">
									${escapeHTML(log.action)} ${receiptIcon} ${deviceIcon}
								</span>
								<span class="text-[10px] text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full whitespace-nowrap">
									${dateStr} ${timeStr}
								</span>
							</div>
							<div class="text-gray-600 dark:text-gray-400 mt-1 text-xs">${escapeHTML(log.details)}</div>
						</div>
						${!log.isRead ? `<button class="mark-read-btn text-blue-500 hover:text-blue-700 p-1" data-id="${log.id}" title="ทำเครื่องหมายว่าอ่านแล้ว"><i class="fa-solid fa-check-circle"></i></button>` : ''}
					</div>
				`;
			});
			list.innerHTML = html;
			document.querySelectorAll('.mark-read-btn').forEach(btn => {
				btn.addEventListener('click', async (e) => {
					e.stopPropagation();
					const id = e.currentTarget.dataset.id;
					await markNotificationAsRead(id);
				});
			});
		}
		
		// ============================================
		// ฟังก์ชันสำหรับจัดการประวัติกิจกรรม (Activity Log)
		// ============================================

		// ทำเครื่องหมายว่าอ่านแล้ว
		async function markNotificationAsRead(logId) {
			const log = state.notificationHistory.find(l => l.id === logId);
			if (log) {
				log.isRead = true;
				await dbPut(STORE_CONFIG, { key: 'notification_history', value: state.notificationHistory });
				// ไม่ต้อง renderNotificationHistory เพราะเราไม่ได้ใช้แล้ว แต่ถ้ามีก็เรียก
				// renderNotificationHistory();
				// ไม่ต้องเรียก updateNotificationBadge ที่นี่ เพราะจะเรียกจาก caller
			}
		}

		// ล้างประวัติทั้งหมด
		async function clearAllNotifications() {
			const confirm = await Swal.fire({
				title: 'ล้างประวัติทั้งหมด?',
				text: 'คุณต้องการลบประวัติกิจกรรมทั้งหมดใช่หรือไม่?',
				icon: 'warning',
				showCancelButton: true,
				confirmButtonColor: '#d33',
				confirmButtonText: 'ล้างทั้งหมด',
				cancelButtonText: 'ยกเลิก'
			});
			if (confirm.isConfirmed) {
				state.notificationHistory = [];
				await dbPut(STORE_CONFIG, { key: 'notification_history', value: [] });
				renderNotificationHistory();
				updateNotificationBadge();
				showToast('ล้างประวัติเรียบร้อย', 'success');
			}
		}

		// เพิ่ม Event Listener สำหรับปุ่ม History
		document.addEventListener('DOMContentLoaded', () => {
			// ปุ่มเปิด-ปิดดูประวัติ
			const btnToggleHist = document.getElementById('btn-toggle-history');
			const histList = document.getElementById('notification-history-list');
			
			if (btnToggleHist && histList) {
				btnToggleHist.addEventListener('click', () => {
					histList.classList.toggle('hidden');
					if (!histList.classList.contains('hidden')) {
						btnToggleHist.textContent = 'ซ่อนประวัติ';
						// เรียก render ทุกครั้งที่กดเปิด เพื่อให้ข้อมูลอัปเดตเสมอ
						if(typeof renderNotificationHistory === 'function') {
							renderNotificationHistory();
						}
					} else {
						btnToggleHist.textContent = 'แสดงประวัติที่ผ่านมา';
					}
				});
			}
		});
		
		// ==========================================
        // ส่วนจัดการการแจ้งเตือนพิเศษ (แก้ไขใหม่ให้รองรับ Edit)
        // ==========================================

        // ฟังก์ชันล้างฟอร์มและรีเซ็ตปุ่มกลับเป็นโหมดปกติ
        function resetCustomNotifyForm() {
            document.getElementById('custom-notify-msg').value = '';
            document.getElementById('custom-notify-date').value = '';
            document.getElementById('custom-notify-days').value = '0';
            document.getElementById('custom-notify-time').value = '';
			document.getElementById('custom-notify-repeat').value = 'none'; // [เพิ่ม] รีเซ็ตค่าทำซ้ำ
            
            // รีเซ็ต Radio กลับไปเป็น All Day
            const radioAllDay = document.querySelector('input[name="notify-time-type"][value="allday"]');
            if(radioAllDay) {
                radioAllDay.checked = true;
                radioAllDay.dispatchEvent(new Event('change')); // Trigger ให้ซ่อนช่องเวลา
            }

            // รีเซ็ตปุ่มบันทึกกลับเป็นสีม่วง (โหมดเพิ่ม)
            const saveBtn = document.getElementById('btn-save-custom-notify');
            if (saveBtn) {
                saveBtn.innerHTML = 'บันทึกการแจ้งเตือน';
                saveBtn.classList.add('bg-purple-600', 'hover:bg-purple-700');
                saveBtn.classList.remove('bg-blue-600', 'hover:bg-blue-700');
                delete saveBtn.dataset.editIdx; // ลบตัวบ่งชี้การแก้ไข
            }

            // ซ่อนปุ่มยกเลิก
            const cancelBtn = document.getElementById('btn-cancel-custom-notify');
            if (cancelBtn) cancelBtn.remove();
        }

        // ฟังก์ชันสำหรับโหลดข้อมูลมาแก้ไข (เรียกเมื่อกดปุ่มดินสอ)
        window.handleEditCustomNotify = (idx) => {
            const item = state.customNotifications[idx];
            if (!item) return;

            // ดึงข้อมูลมาใส่ฟอร์ม
            document.getElementById('custom-notify-msg').value = item.message;
            document.getElementById('custom-notify-date').value = item.date;
            document.getElementById('custom-notify-days').value = item.advanceDays || 0;
			
			// [เพิ่ม] โหลดค่าทำซ้ำมาใส่ Dropdown
			document.getElementById('custom-notify-repeat').value = item.repeat || 'none';

            // จัดการเวลา (ทั้งวัน vs ระบุเวลา)
            if (item.isAllDay) {
                const radio = document.querySelector('input[name="notify-time-type"][value="allday"]');
                if(radio) {
                    radio.checked = true;
                    radio.dispatchEvent(new Event('change'));
                }
            } else {
                const radio = document.querySelector('input[name="notify-time-type"][value="specific"]');
                if(radio) {
                    radio.checked = true;
                    radio.dispatchEvent(new Event('change'));
                }
                document.getElementById('custom-notify-time').value = item.time;
            }

            // เปลี่ยนปุ่มบันทึกเป็น "บันทึกการแก้ไข" (สีน้ำเงิน)
            const saveBtn = document.getElementById('btn-save-custom-notify');
            saveBtn.innerHTML = '<i class="fa-solid fa-pen-to-square mr-2"></i> บันทึกการแก้ไข';
            saveBtn.classList.remove('bg-purple-600', 'hover:bg-purple-700');
            saveBtn.classList.add('bg-blue-600', 'hover:bg-blue-700');
            saveBtn.dataset.editIdx = idx; // ฝังเลข Index ที่กำลังแก้อยู่ไว้ที่ปุ่ม

            // เพิ่มปุ่ม "ยกเลิก" ถ้ายังไม่มี
            let cancelBtn = document.getElementById('btn-cancel-custom-notify');
            if (!cancelBtn) {
                cancelBtn = document.createElement('button');
                cancelBtn.id = 'btn-cancel-custom-notify';
                cancelBtn.className = 'w-full bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 rounded-xl shadow transition duration-300 mt-2';
                cancelBtn.innerHTML = 'ยกเลิกการแก้ไข';
                cancelBtn.addEventListener('click', resetCustomNotifyForm);
                saveBtn.parentNode.insertBefore(cancelBtn, saveBtn.nextSibling);
            }

            // เลื่อนหน้าจอขึ้นไปที่ฟอร์ม
            document.getElementById('custom-notify-msg').scrollIntoView({ behavior: 'smooth', block: 'center' });
            document.getElementById('custom-notify-msg').focus();
        };
		
		// 1. ฟังก์ชันแสดงรายการแจ้งเตือนพิเศษ (Custom Notify List)
		// ฟังก์ชันแสดงรายการ (ปรับปรุงให้มีปุ่ม Edit)
        function renderCustomNotifyList() {
            const list = document.getElementById('active-custom-notify-list');
            if(!list) return;
            list.innerHTML = '';
            
            if (!state.customNotifications || state.customNotifications.length === 0) {
                return;
            }
            
            const today = new Date().toISOString().slice(0, 10);
            
            state.customNotifications.forEach((n, idx) => {
                const isPassed = n.date < today; 
                const statusClass = isPassed 
                    ? 'text-gray-400 dark:text-gray-500 line-through' 
                    : 'text-purple-700 dark:text-purple-400';
                
                const dateObj = new Date(n.date);
                const dateStr = dateObj.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' });

                let timeDisplay = '';
                if (n.isAllDay === false && n.time) { 
                     timeDisplay = `<span class="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-[10px] ml-2 font-bold"><i class="fa-regular fa-clock mr-1"></i>${n.time} น.</span>`;
                } else {
                     timeDisplay = `<span class="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[10px] ml-2"><i class="fa-solid fa-sun mr-1"></i>ทั้งวัน</span>`;
                }
				
				// [เพิ่มใหม่] แสดงสถานะการทำซ้ำ (Badge)
				let repeatBadge = '';
				if (n.repeat && n.repeat !== 'none') {
					const repeatLabels = { 'weekly': 'ทุกสัปดาห์', 'monthly': 'ทุกเดือน', 'yearly': 'ทุกปี' };
					repeatBadge = `<span class="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px] ml-1 font-bold border border-blue-200">
						<i class="fa-solid fa-rotate mr-1"></i>${repeatLabels[n.repeat]}
					</span>`;
				}

                const html = `
                    <div class="flex justify-between items-center bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm mb-2 transition-colors">
                        <div class="${statusClass} flex-grow">
                            <div class="font-bold text-sm flex items-center flex-wrap gap-1">
                                ${n.message}
                                ${timeDisplay}
                            </div>
                            <div class="text-xs mt-1 text-gray-500 dark:text-gray-400">
                                <i class="fa-regular fa-calendar mr-1"></i>${dateStr} (เตือนก่อน ${n.advanceDays} วัน)
                            </div>
                        </div>
                        <div class="flex items-center gap-1 pl-2">
                            <button onclick="handleEditCustomNotify(${idx})" class="text-blue-500 hover:text-blue-700 dark:hover:text-blue-400 p-2 transition bg-blue-50 dark:bg-blue-900/20 rounded-lg" title="แก้ไข">
                                <i class="fa-solid fa-pen"></i>
                            </button>
                            <button class="text-red-500 hover:text-red-700 dark:hover:text-red-400 delete-custom-notify p-2 transition bg-red-50 dark:bg-red-900/20 rounded-lg" data-idx="${idx}" title="ลบ">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `;
                list.insertAdjacentHTML('beforeend', html);
            });

            // Listener สำหรับปุ่มลบ (เหมือนเดิม)
            document.querySelectorAll('.delete-custom-notify').forEach(btn => {
				btn.addEventListener('click', async (e) => {
					const targetBtn = e.target.closest('.delete-custom-notify');
					if (!targetBtn) return;
					const idx = targetBtn.dataset.idx;
					const n = state.customNotifications[idx];

					const confirm = await Swal.fire({
						title: 'ลบรายการ?',
						text: 'ต้องการลบการแจ้งเตือนนี้ใช่ไหม',
						icon: 'warning',
						showCancelButton: true,
						confirmButtonText: 'ลบ',
						cancelButtonText: 'ยกเลิก',
						confirmButtonColor: '#d33',
					});

					if (confirm.isConfirmed) {
						const saveBtn = document.getElementById('btn-save-custom-notify');
						if (saveBtn && saveBtn.dataset.editIdx == idx) resetCustomNotifyForm();

						state.customNotifications.splice(idx, 1);
						await dbPut(STORE_CONFIG, { key: 'custom_notifications_list', value: state.customNotifications });

						// ✅ ADD ACTIVITY LOG
							const notifyDateObj = new Date(n.date);
							const formattedNotifyDate = notifyDateObj.toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: '2-digit' });
							
							addActivityLog(
								'🗑️ ลบแจ้งเตือน',
								`${n.message} | 📅 วันที่เตือน: ${formattedNotifyDate}`,
								'fa-bell',
								'text-red-600'
							);

						renderCustomNotifyList();
					}
				});
			});
        }

		// 2. ฟังก์ชันแสดงประวัติการแจ้งเตือน (Notification History)
		function renderNotificationHistory() {
			const list = document.getElementById('notification-history-list');
			if (!list) return;

			if (!state.notificationHistory || state.notificationHistory.length === 0) {
				list.innerHTML = '<p class="text-center text-gray-400 dark:text-gray-500 py-4 text-sm">ยังไม่มีประวัติกิจกรรม</p>';
				return;
			}

			// เรียงลำดับจากใหม่ไปเก่า (เราทำ unshift ไว้แล้ว แต่เผื่อ)
			const sorted = [...state.notificationHistory].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

			let html = '';
			sorted.forEach(log => {
				const date = new Date(log.timestamp);
				const dateStr = date.toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: '2-digit' });
				const timeStr = date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
				const readClass = log.isRead ? 'opacity-50' : '';

				html += `
					<div class="flex items-start gap-3 bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm text-sm mb-2 transition-colors ${readClass}">
						<div class="${log.color || 'text-gray-500 dark:text-gray-400'} mt-0.5 text-lg">
							<i class="fa-solid ${log.icon || 'fa-bell'}"></i>
						</div>
						<div class="flex-1">
							<div class="flex justify-between items-start">
								<span class="font-bold text-gray-700 dark:text-gray-200">${escapeHTML(log.action)}</span>
								<span class="text-[10px] text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full whitespace-nowrap">
									${dateStr} ${timeStr}
								</span>
							</div>
							<div class="text-gray-600 dark:text-gray-400 mt-1 text-xs">${escapeHTML(log.details)}</div>
						</div>
						${!log.isRead ? `<button class="mark-read-btn text-blue-500 hover:text-blue-700 p-1" data-id="${log.id}" title="ทำเครื่องหมายว่าอ่านแล้ว"><i class="fa-solid fa-check-circle"></i></button>` : ''}
					</div>
				`;
			});

			list.innerHTML = html;

			// ผูกปุ่ม mark as read
			document.querySelectorAll('.mark-read-btn').forEach(btn => {
				btn.addEventListener('click', async (e) => {
					e.stopPropagation();
					const id = e.currentTarget.dataset.id;
					await markNotificationAsRead(id);
				});
			});
		}

		// 3. เรียกใช้งานปุ่มเปิด/ปิด History และปุ่มล้างประวัติ
		const btnToggleHist = document.getElementById('btn-toggle-history');
		const histList = document.getElementById('notification-history-list');
		
		if (btnToggleHist && histList) {
			btnToggleHist.addEventListener('click', () => {
				histList.classList.toggle('hidden');
				if (!histList.classList.contains('hidden')) {
					btnToggleHist.textContent = 'ซ่อนประวัติ';
					renderNotificationHistory();
				} else {
					btnToggleHist.textContent = 'แสดงประวัติที่ผ่านมา';
				}
			});
		}

		const btnClearHist = document.getElementById('btn-clear-history');
		if (btnClearHist) {
			btnClearHist.addEventListener('click', async () => {
				const confirm = await Swal.fire({
					title: 'ล้างประวัติ?',
					text: 'ประวัติทั้งหมดจะหายไป',
					icon: 'warning',
					showCancelButton: true,
					confirmButtonText: 'ล้างข้อมูล',
					cancelButtonText: 'ยกเลิก',
					confirmButtonColor: '#d33'
				});

				if (confirm.isConfirmed) {
					state.notificationHistory = [];
					await dbPut(STORE_CONFIG, { key: 'notification_history', value: [] });
					renderNotificationHistory();
					showToast('ล้างประวัติเรียบร้อย', 'success');
				}
			});
		}
		
		// --- ปุ่มล้างการแจ้งเตือนพิเศษที่เลยกำหนด (วางใน setupEventListeners) ---
		const btnClearCustomExpired = document.getElementById('btn-clear-custom-expired');
		
		if (btnClearCustomExpired) {
			btnClearCustomExpired.addEventListener('click', async () => {
				// 1. ตรวจสอบว่ามีรายการที่ต้องลบไหม
				const today = new Date().toISOString().slice(0, 10);
				
				// หาจำนวนรายการที่ "วันที่ < วันนี้" (คือรายการที่แจ้งเตือนไปแล้ว)
				const expiredCount = state.customNotifications.filter(n => n.date < today).length;
				
				if (expiredCount === 0) {
					Swal.fire('ไม่มีรายการเก่า', 'ไม่มีการแจ้งเตือนพิเศษที่เลยกำหนดให้ลบ', 'info');
					return;
				}

				// 2. ถามยืนยัน
				const confirm = await Swal.fire({
					title: 'ล้างรายการเก่า?',
					text: `พบ ${expiredCount} รายการที่แจ้งเตือนไปแล้ว คุณต้องการลบออกทั้งหมดหรือไม่?`,
					icon: 'question',
					showCancelButton: true,
					confirmButtonColor: '#d33',
					confirmButtonText: 'ลบรายการเก่า',
					cancelButtonText: 'ยกเลิก'
				});

				if (confirm.isConfirmed) {
					try {
						// 3. กรองเอาเฉพาะรายการที่ "ยังไม่ถึงกำหนด" หรือ "เป็นวันนี้" (date >= today)
						const activeNotifications = state.customNotifications.filter(n => n.date >= today);
						
						// อัปเดต State
						state.customNotifications = activeNotifications;
						
						// 4. บันทึกลง DB
						await dbPut(STORE_CONFIG, { key: 'custom_notifications_list', value: state.customNotifications });
						
						// 5. แสดงผลรายการใหม่ทันที
						if (typeof renderCustomNotifyList === 'function') {
							renderCustomNotifyList();
						}
						
						showToast(`ลบรายการเก่าเรียบร้อย (${expiredCount} รายการ)`, 'success');

					} catch (err) {
						console.error(err);
						Swal.fire('ข้อผิดพลาด', 'ไม่สามารถบันทึกข้อมูลได้', 'error');
					}
				}
			});
		}

		// เรียกแสดงผลครั้งแรกเมื่อเข้าหน้า Settings
		const settingsBtn = document.getElementById('nav-settings');
		if (settingsBtn) {
			settingsBtn.addEventListener('click', () => {
				renderCustomNotifyList();
			});
		}
		const yearInput = document.getElementById('cal-year-input');
		if (yearInput) {
			yearInput.addEventListener('change', () => {
				const year = parseInt(yearInput.value);
				// ตรวจสอบว่าเป็นปีที่สมเหตุสมผลหรือไม่ (เช่น 1900-2100)
				if (year > 1900 && year < 2100) {
					// กำหนดวันที่ให้ไปวันที่ 1 มกราคม ของปีนั้น
					state.calendarCurrentDate = `${year}-01-01`;
					renderCalendarView(); // สั่งให้วาดปฏิทินใหม่ (ซึ่งจะไปดึงวันหยุดใหม่ด้วย)
				}
			});
		}
		// --- สั่งให้สวิตช์ทำงานทันที ---
		const calSwitches = ['cal-toggle-holiday', 'cal-toggle-buddhist', 'cal-toggle-money'];
		calSwitches.forEach(id => {
			const el = document.getElementById(id);
			if (el) {
				el.addEventListener('change', () => {
					// รีโหลดปฏิทินทันทีที่กดสวิตช์
					renderCalendarView(); 
				});
			}
		});
		
		// --- [NEW] Advanced Filter Event Listeners ---
		const advStart = document.getElementById('adv-filter-start');
		const advEnd = document.getElementById('adv-filter-end');
		const advType = document.getElementById('adv-filter-type');
		const advSearch = document.getElementById('adv-filter-search');
		const btnClearSearch = document.getElementById('btn-clear-search');

		if (advStart && advEnd) {
			// ตั้งค่าเริ่มต้น: วันที่ 1 ของเดือน ถึง วันสุดท้ายของเดือน
			const now = new Date();
			const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
			const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0); // วันที่ 0 ของเดือนถัดไป = วันสุดท้ายเดือนนี้
			
			// แปลงเป็น string YYYY-MM-DD (ระวังเรื่อง timezone, ใช้แบบบ้านๆ ปลอดภัยสุด)
			const formatDate = (d) => {
				let month = '' + (d.getMonth() + 1), day = '' + d.getDate(), year = d.getFullYear();
				if (month.length < 2) month = '0' + month;
				if (day.length < 2) day = '0' + day;
				return [year, month, day].join('-');
			};

			advStart.value = formatDate(firstDay);
			advEnd.value = formatDate(lastDay);

			// เมื่อเปลี่ยนค่า ให้เรียก renderListPage() ทันที
			advStart.addEventListener('change', renderListPage);
			advEnd.addEventListener('change', renderListPage);
			advType.addEventListener('change', renderListPage);
			advSearch.addEventListener('input', renderListPage); // ค้นหาทันทีที่พิมพ์ (Real-time)
			
			// ปุ่มล้างคำค้นหา
			if (btnClearSearch) {
				btnClearSearch.addEventListener('click', () => {
					advSearch.value = '';
					renderListPage();
				});
			}
		}
		
		// เพิ่มใน setupEventListeners()
		const btnExport = document.getElementById('btn-export-filtered');
		if (btnExport) {
			btnExport.addEventListener('click', exportFilteredList);
		}
		
		// [NEW] ตัวจัดการคลิกปุ่มเปลี่ยนกราฟ (Category / Time)
		const btnChartCat = document.getElementById('btn-chart-category');
		const btnChartTime = document.getElementById('btn-chart-time');

		if (btnChartCat && btnChartTime) {
			btnChartCat.addEventListener('click', () => {
				switchChartMode('category');
			});
			
			btnChartTime.addEventListener('click', () => {
				switchChartMode('time');
			});
		}
		
		// ปุ่มจัดการกิจกรรม
		const manageBtn = document.getElementById('btn-manage-imported');
		if (manageBtn) {
			manageBtn.addEventListener('click', openImportedEventsModal);
		}

		// สวิตช์กิจกรรมที่นำเข้า
		const toggleImported = document.getElementById('cal-toggle-imported');
		if (toggleImported) {
			toggleImported.addEventListener('change', renderCalendarView);
		}

		// ปุ่มนำเข้า ICS (สร้าง input file ชั่วคราว)
		const importBtn = document.getElementById('btn-import-ics'); // ถ้าเราจะเพิ่มปุ่มนี้
		// แต่ถ้าไม่ต้องการปุ่มแยก เราสามารถใช้ปุ่มจัดการแล้วมีปุ่ม "+ นำเข้า" ใน modal ก็ได้
		// ในที่นี้เราจะเพิ่มปุ่มนำเข้าใน modal ด้วย (เพิ่มใน HTML ของ modal)
		// ดังนั้นใน modal เราจะเพิ่มปุ่ม "นำเข้า ICS" ที่ด้านบน
		
		// ปุ่มนำเข้า ICS ใน modal
		const importModalBtn = document.getElementById('btn-import-ics-modal');
		if (importModalBtn) {
			importModalBtn.addEventListener('click', () => {
				// สร้าง input element แบบซ่อนเพื่อให้ผู้ใช้เลือกไฟล์
				const fileInput = document.createElement('input');
				fileInput.type = 'file';
				fileInput.accept = '.ics, .ical, text/calendar'; // ระบุชนิดไฟล์ที่รองรับ
				fileInput.style.display = 'none'; // ซ่อนไว้
				document.body.appendChild(fileInput); // ต้องแนบไปกับ body เพื่อให้ทำงาน

				// เมื่อผู้ใช้เลือกไฟล์แล้ว
				fileInput.onchange = (e) => {
					const file = e.target.files[0];
					if (file) {
						// เรียกฟังก์ชันนำเข้า ICS
						importICS(file);
					}
					// ลบ input element ทิ้งเพื่อไม่ให้รกหน่วยความจำ
					fileInput.remove();
				};

				// จำลองการคลิกเพื่อเปิดหน้าต่างเลือกไฟล์
				fileInput.click();
			});
		}
		
		const deleteAllBtn = document.getElementById('btn-delete-all-imported');
			if (deleteAllBtn) {
				deleteAllBtn.addEventListener('click', async () => {
					const confirm = await Swal.fire({
						title: 'ลบกิจกรรมทั้งหมด?',
						text: 'คุณต้องการลบไฟล์ ICS ที่นำเข้าและกิจกรรมทั้งหมดใช่หรือไม่',
						icon: 'warning',
						showCancelButton: true,
						confirmButtonColor: '#ef4444',
						confirmButtonText: 'ใช่, ลบทั้งหมด',
						cancelButtonText: 'ยกเลิก'
					});
					if (confirm.isConfirmed) {
						// เก็บจำนวนก่อนลบ
						const eventCount = state.importedEvents.length;
						const groupCount = state.icsImports.length;
						// ลบทั้งหมด
						for (const ev of state.importedEvents) {
							await dbDelete(STORE_IMPORTED_EVENTS, ev.id);
						}
						for (const grp of state.icsImports) {
							await dbDelete(STORE_ICS_IMPORTS, grp.id);
						}
						state.importedEvents = [];
						state.icsImports = [];
						// ✅ เพิ่ม Activity Log
						addActivityLog(
							'⚠️ ลบกิจกรรมทั้งหมด',
							`ลบ ${eventCount} รายการ จาก ${groupCount} กลุ่ม`,
							'fa-calendar-xmark',
							'text-red-600'
						);
						closeImportedEventsModal();
						renderCalendarView();
						showToast('ลบกิจกรรมทั้งหมดแล้ว', 'success');
					}
				});
			}
			
			// ใน setupEventListeners()
			const moneyToggle = document.getElementById('cal-toggle-money');
			const importedToggle = document.getElementById('cal-toggle-imported');

			if (moneyToggle) {
				moneyToggle.addEventListener('change', renderCalendarView);
			}
			if (importedToggle) {
				importedToggle.addEventListener('change', renderCalendarView);
			}
	
    }
	
	function applyMobileMenuStyle() {
		const bottomNav = document.getElementById('bottom-nav');
		const mobileMenuButton = document.getElementById('mobile-menu-button');
		const mobileHomeButton = document.getElementById('mobile-home-button');
		const mobileBell = document.getElementById('notification-bell-mobile'); // ดึงปุ่มกระดิ่ง
		const mobileMenu = document.getElementById('mobile-menu');
		const body = document.body;

		if (state.mobileMenuStyle === 'bottom') {
			// แสดง Bottom Nav, ซ่อนปุ่มเมนูเดิม (แต่ไม่ซ่อนปุ่มกระดิ่ง)
			if (bottomNav) bottomNav.classList.remove('hidden');
			if (mobileMenuButton) mobileMenuButton.classList.add('hidden');
			if (mobileHomeButton) mobileHomeButton.classList.add('hidden');
			// ปุ่มกระดิ่ง (mobileBell) จะยังคงแสดงอยู่
			if (mobileMenu) mobileMenu.classList.add('hidden');
			body.classList.add('has-bottom-nav');
		} else {
			// ซ่อน Bottom Nav, แสดงปุ่มเมนูเดิม
			if (bottomNav) bottomNav.classList.add('hidden');
			if (mobileMenuButton) mobileMenuButton.classList.remove('hidden');
			if (mobileHomeButton) mobileHomeButton.classList.remove('hidden');
			// ปุ่มกระดิ่งแสดงตามปกติ
			body.classList.remove('has-bottom-nav');
		}
	}
	
	// ฟังก์ชันอัปเดตสี active ของ Bottom Navigation
	function updateBottomNavActive(pageId) {
		const bottomNav = document.getElementById('bottom-nav');
		if (!bottomNav) return;
		const pageName = pageId.replace('page-', '');
		bottomNav.querySelectorAll('button').forEach(btn => {
			const btnPage = btn.dataset.page;
			if (btnPage === pageName) {
				btn.classList.remove('text-gray-600');
				btn.classList.add('text-purple-600');
			} else {
				btn.classList.remove('text-purple-600');
				btn.classList.add('text-gray-600');
			}
		});
	}
	
	// ============================================
    // PWA INSTALL LOGIC (Android & iOS)
    // ============================================
    function setupInstallButton() {
        const installContainer = document.getElementById('install-app-container');
        const installBtn = document.getElementById('btn-install-app');
        let deferredPrompt; // ตัวแปรเก็บ Event ของ Android/Chrome

        // 1. ตรวจสอบว่าเป็น iOS หรือไม่
        const isIos = /iPhone|iPad|iPod/.test(navigator.userAgent) && !window.MSStream;
        
        // 2. ตรวจสอบว่าแอปเปิดแบบ Standalone (ติดตั้งแล้ว) หรือยัง
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

        // ถ้าติดตั้งแล้ว ไม่ต้องทำอะไร (ซ่อนปุ่มไว้เหมือนเดิม)
        if (isStandalone) {
            console.log('App is already installed/standalone.');
            return;
        }

        // === กรณี Android / Desktop (Chrome/Edge) ===
        window.addEventListener('beforeinstallprompt', (e) => {
            // ป้องกันแถบ Install เด้งเองด้านล่าง
            e.preventDefault();
            // เก็บ Event ไว้ใช้ทีหลัง
            deferredPrompt = e;
            // โชว์ปุ่มในหน้าตั้งค่า
            if (installContainer) installContainer.classList.remove('hidden');
        });

        // === กรณี iOS (Safari) ===
        if (isIos) {
            // iOS ไม่มี event beforeinstallprompt แต่เราจะโชว์ปุ่มเลยถ้ายังไม่ Install
            if (installContainer) installContainer.classList.remove('hidden');
        }

        // === จัดการเมื่อกดปุ่ม ===
        if (installBtn) {
            installBtn.addEventListener('click', async () => {
                
                if (isIos) {
                    // --- Logic สำหรับ iOS: แสดง Popup สอนวิธีติดตั้ง ---
                    Swal.fire({
                        title: 'วิธีติดตั้งบน iOS',
                        html: `
                            <div class="text-left text-sm space-y-3">
                                <p>1. กดปุ่ม <b>"แชร์"</b> <i class="fa-solid fa-arrow-up-from-bracket text-blue-500 text-lg mx-1"></i> ที่แถบด้านล่างของ Safari</p>
                                <p>2. เลื่อนหาเมนู <b>"เพิ่มไปยังหน้าจอโฮม"</b> <br>(Add to Home Screen) <i class="fa-regular fa-square-plus text-gray-600 text-lg mx-1"></i></p>
                                <p>3. กดปุ่ม <b>"เพิ่ม"</b> (Add) มุมขวาบน</p>
                            </div>
                        `,
                        icon: 'info',
                        confirmButtonText: 'เข้าใจแล้ว',
                        customClass: { popup: state.isDarkMode ? 'swal2-popup' : '' },
                        background: state.isDarkMode ? '#1a1a1a' : '#fff',
                        color: state.isDarkMode ? '#e5e7eb' : '#545454'
                    });

                } else {
                    // --- Logic สำหรับ Android / PC ---
                    if (deferredPrompt) {
                        // สั่งให้ Prompt เด้งขึ้นมา
                        deferredPrompt.prompt();
                        
                        // รอผลลัพธ์ว่าผู้ใช้กด Install หรือ Cancel
                        const { outcome } = await deferredPrompt.userChoice;
                        console.log(`User response to the install prompt: ${outcome}`);
                        
                        // เคลียร์ตัวแปร (ใช้ได้ครั้งเดียว)
                        deferredPrompt = null;
                        
                        // ถ้าติดตั้งสำเร็จ ซ่อนปุ่มไปเลย
                        if (outcome === 'accepted') {
                            installContainer.classList.add('hidden');
                        }
                    } else {
                        // กรณีไม่มี Prompt (อาจจะติดตั้งแล้ว หรือ Browser ไม่รองรับ)
                        Swal.fire('แจ้งเตือน', 'อุปกรณ์นี้อาจติดตั้งแอปแล้ว หรือไม่รองรับการติดตั้งอัตโนมัติ', 'info');
                    }
                }
            });
        }
    }

    function setupSwipeNavigation() {
        const mainContent = document.getElementById('page-wrapper');
        let startX = 0;
        let startY = 0;
        const threshold = 75; 
        const timeThreshold = 500;

        let startTime;
        mainContent.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                startX = e.touches[0].clientX;
                startY = e.touches[0].clientY;
                startTime = Date.now();
            }
        }, { passive: true });
        mainContent.addEventListener('touchend', (e) => {
            if (e.changedTouches.length === 1 && !isTransitioning) {
                const endX = e.changedTouches[0].clientX;
                const endY = e.changedTouches[0].clientY;
                const endTime = Date.now();

                const diffX = endX - startX;
                const diffY = endY - startY;
                const deltaTime = endTime - startTime;

                if (deltaTime < timeThreshold && Math.abs(diffX) > threshold && Math.abs(diffX) > Math.abs(diffY)) {
                    
                    const currentPageId = 'page-' + currentPage;
                    const currentPageIndex = PAGE_IDS.findIndex(id => id === currentPageId);
                    let nextPageId = null;

                    if (diffX < 0) { // Swipe Left (Next Page)
                        const nextIndex = currentPageIndex + 1;
                        if (nextIndex < PAGE_IDS.length) {
                            nextPageId = PAGE_IDS[nextIndex];
                        }
                    } else { // Swipe Right (Previous Page)
                        const prevIndex = currentPageIndex - 1;
                        if (prevIndex >= 0) {
                            nextPageId = PAGE_IDS[prevIndex];
                        }
                    }

                    if (nextPageId) {
                        showPage(nextPageId);
                    }
                }
            }
        });
    }

	function loadGuideContentIfNeeded() {
		const guideContainer = document.getElementById('page-guide');
		if (guideContainer && window.guideHTML && guideContainer.children.length === 0) {
			guideContainer.innerHTML = window.guideHTML;

			// จัดการปุ่มกลับด้านบน
			const backToTopBtn = document.getElementById('guide-back-to-top');
			if (backToTopBtn) {
				backToTopBtn.addEventListener('click', function(e) {
					e.preventDefault();
					window.scrollTo({ top: 0, behavior: 'smooth' });
				});
			}

			// จัดการคลิกที่ลิงก์สารบัญ (ถ้ายังไม่เคยเพิ่ม)
			document.querySelectorAll('.toc-link').forEach(link => {
				link.addEventListener('click', function(e) {
					e.preventDefault();
					const targetId = this.getAttribute('href');
					if (targetId && targetId.startsWith('#')) {
						const targetEl = document.querySelector(targetId);
						if (targetEl) {
							targetEl.scrollIntoView({ behavior: 'smooth' });
						}
					}
				});
			});
			
			// เพิ่มส่วนนี้: ผูกเหตุการณ์ให้ปุ่มเสียงพูด
			document.querySelectorAll('.speak-btn').forEach(btn => {
				btn.addEventListener('click', (e) => {
					e.preventDefault();
					e.stopPropagation();
					const text = btn.dataset.speak;
					if (text && window.speak) {
						window.speak(text, btn);  // <-- ส่งปุ่มเข้าไปด้วย
					}
				});
			});
			// --- เพิ่มตรงนี้: จัดการปุ่ม "ดูตัวอย่าง" (data-demo) ---
			document.querySelectorAll('[data-demo]').forEach(btn => {
				btn.addEventListener('click', (e) => {
					e.preventDefault();
					e.stopPropagation();
					const demoType = btn.dataset.demo;
					if (demoType === 'chart-home') showChartHomeDemo();
					else if (demoType === 'chart-list') showChartListDemo();
					if (demoType === 'receipt') showReceiptDemo();
					else if (demoType === 'budget') showBudgetDemo();
					else if (demoType === 'voice') showVoiceDemo();
					else if (demoType === 'calc') showCalcDemo();
					else if (demoType === 'pwa') showPwaDemo();
					else if (demoType === 'password') showPasswordDemo();
					else if (demoType === 'biometric') showBiometricDemo();
					else if (demoType === 'summary') showSummaryCardDemo();
					else if (demoType === 'accountsSummary') showAccountsSummaryDemo();
					else if (demoType === 'addButtons') showAddButtonsDemo();
					else if (demoType === 'charts') showChartsDemo();
					else if (demoType === 'filter') showFilterDemo();
					else if (demoType === 'export') showExportDemo();
					else if (demoType === 'calendar') showCalendarDemo();
					else if (demoType === 'manageAccounts') showManageAccountsDemo();
					else if (demoType === 'categories') showCategoriesDemo();
					else if (demoType === 'frequent') showFrequentItemsDemo();
					else if (demoType === 'recurring') showRecurringDemo();
					else if (demoType === 'settingsGeneral') showSettingsGeneralDemo();
					else if (demoType === 'security') showSecurityDemo();
					else if (demoType === 'lineNotify') showLineNotifyDemo();
					else if (demoType === 'dataManagement') showDataManagementDemo();
					else if (demoType === 'smartVoice') showSmartVoiceDemo();
					else if (demoType === 'troubleshoot') showTroubleshootDemo();
					else if (demoType === 'itemManage') showItemManageDemo(); 
				});
			});
			
		}
	}


    // [แก้ไข] เพิ่มพารามิเตอร์ addToHistory = true
    function showPage(pageId, addToHistory = true) {
        if (isTransitioning) return;
        resetAutoLockTimer(); 
        const pageName = pageId.replace('page-', '');
        const getEl = (id) => document.getElementById(id);
        
        const oldPageId = 'page-' + currentPage;
        const oldPageEl = getEl(oldPageId);
        const newPageEl = getEl(pageId);
        
        // ถ้าเป็นหน้าเดิม ไม่ต้องทำอะไร
        if (oldPageEl === newPageEl) return;

        // +++ เพิ่มส่วนนี้: สั่งบันทึกลง History ของ Browser +++
        if (addToHistory) {
            // เก็บ state ว่าเราอยู่หน้าไหน
            history.pushState({ pageId: pageId }, null, `#${pageName}`);
        }
        // +++++++++++++++++++++++++++++++++++++++++++++++
        
        isTransitioning = true;
        const oldPageIndex = PAGE_IDS.indexOf(oldPageId);
        const newPageIndex = PAGE_IDS.indexOf(pageId);
        
        // ... (โค้ด Animation เดิมด้านล่างนี้ปล่อยไว้เหมือนเดิม) ...
        const directionClass = (newPageIndex > oldPageIndex) ? 'slide-left' : 'slide-right';

        oldPageEl.classList.add('page-transition-exit-active', directionClass);
        oldPageEl.style.display = 'block'; 
        
        newPageEl.style.display = 'block';
        newPageEl.classList.add('page-transition-enter', directionClass);

        oldPageEl.offsetHeight;
        newPageEl.offsetHeight;

        if (directionClass === 'slide-left') {
            newPageEl.style.transform = 'translateX(100%)';
        } else {
            newPageEl.style.transform = 'translateX(-100%)';
        }
        newPageEl.style.opacity = '0';
        requestAnimationFrame(() => {
            oldPageEl.classList.add('page-transition-exit-final');
            oldPageEl.style.opacity = '0';

            newPageEl.classList.add('page-transition-enter-active');
            newPageEl.classList.remove('page-transition-enter');
        });
        setTimeout(() => {
            oldPageEl.style.display = 'none';
            oldPageEl.classList.remove('page-transition-exit-active', 'page-transition-exit-final', 'slide-left', 'slide-right');
            oldPageEl.style.transform = '';
            oldPageEl.style.opacity = '';
            
            newPageEl.classList.remove('page-transition-enter-active', 'slide-left', 'slide-right');
            newPageEl.style.position = ''; 
            newPageEl.style.transform = '';
            newPageEl.style.opacity = '';
            
            currentPage = pageName;
            isTransitioning = false; 

            // อัปเดตปุ่ม Nav (โค้ดเดิม)
            const navButtons = [
                getEl('nav-home'), getEl('nav-list'), getEl('nav-calendar'), 
                getEl('nav-accounts'), getEl('nav-settings'), getEl('nav-guide')
            ];
            navButtons.forEach(btn => {
                if(btn) { // เพิ่ม check null กัน error
                    btn.classList.remove('text-purple-600');
                    btn.classList.add('text-gray-600');
                }
            });

            // อัปเดตปุ่ม Mobile Nav (โค้ดเดิม)
            const mobileNavButtons = {
                'page-home': getEl('nav-home-mobile'),
                'page-list': getEl('nav-list-mobile'),
                'page-calendar': getEl('nav-calendar-mobile'), 
                'page-accounts': getEl('nav-accounts-mobile'),
                'page-settings': getEl('nav-settings-mobile'),
                'page-guide': getEl('nav-guide-mobile')
            };
            Object.values(mobileNavButtons).forEach(btn => {
                if(btn) {
                    btn.classList.remove('text-purple-600');
                    btn.classList.add('text-gray-600');
                }
            });
            const currentNavEl = getEl('nav-' + currentPage);
            if (currentNavEl) {
                currentNavEl.classList.add('text-purple-600');
                currentNavEl.classList.remove('text-gray-600');
            }
            const currentMobileNavEl = mobileNavButtons[pageId];
            if (currentMobileNavEl) {
                currentMobileNavEl.classList.add('text-purple-600');
                currentMobileNavEl.classList.remove('text-gray-600');
            }
			
			    // อัปเดต Bottom Navigation ถ้าอยู่ในโหมด bottom
			if (state.mobileMenuStyle === 'bottom') {
				updateBottomNavActive(pageId);
			}

            // Render หน้าต่างๆ (โค้ดเดิม)
            if (pageId === 'page-home') {
                getEl('shared-controls-header').style.display = 'flex';
                updateSharedControls('home');
                renderAll(); 
            } else if (pageId === 'page-list') {
                getEl('shared-controls-header').style.display = 'none';
                //updateSharedControls('list');
                renderListPage();
            } else if (pageId === 'page-calendar') {
                getEl('shared-controls-header').style.display = 'none';
                renderCalendarView();
            } else if (pageId === 'page-accounts') { 
                getEl('shared-controls-header').style.display = 'none';
                renderAccountsPage();
            } else if (pageId === 'page-settings') {
                getEl('shared-controls-header').style.display = 'none';
                renderSettings();
				if (typeof renderCustomNotifyList === 'function') {
                    renderCustomNotifyList();
                }
            } else if (pageId === 'page-guide') {
			getEl('shared-controls-header').style.display = 'none';
			loadGuideContentIfNeeded();  // <-- เพิ่มตรงนี้
		}

        }, 200);
    }


    function renderAll() {
        // 1. ดึงรายการตามวันที่
        let visibleTransactions = getTransactionsForView('home');

        // [เพิ่มส่วนกรองข้อมูล] -----------------------------------------------
        // ถ้าดู "ทั้งหมด" ให้กรองบัญชีที่ปิดสวิตช์ออก
        // แต่ถ้าเลือกบัญชีเจาะจง ให้แสดงบัญชีนั้นเสมอ
        if (state.currentAccountId === 'all' || !state.currentAccountId) {
            const hiddenAccountIds = state.accounts
                .filter(acc => acc.isVisible === false)
                .map(acc => acc.id);
            
            if (hiddenAccountIds.length > 0) {
                visibleTransactions = visibleTransactions.filter(tx => !hiddenAccountIds.includes(tx.accountId));
            }
        }
        // ------------------------------------------------------------------

        const allAccountBalances = getAccountBalances(state.transactions);

        renderSummary(visibleTransactions, allAccountBalances);
        renderAllAccountSummary(allAccountBalances); // อัปเดตการ์ดบัญชีด้านบน
		renderDraftsWidget();
        
        applySettingsPreferences();
        
        const balanceCard = document.getElementById('summary-balance-card');
        const cardsContainer = document.getElementById('summary-cards-container'); 

        if (state.showBalanceCard) {
            balanceCard.classList.remove('hidden');
            if(cardsContainer) {
                cardsContainer.classList.remove('grid-cols-2');
                cardsContainer.classList.add('grid-cols-3');
            }
        } else {
            balanceCard.classList.add('hidden');
            if(cardsContainer) {
                cardsContainer.classList.remove('grid-cols-3');
                cardsContainer.classList.add('grid-cols-2');
            }
        }

        let homeFilteredTxs = visibleTransactions;
        if (state.homeFilterType !== 'all') {
            homeFilteredTxs = visibleTransactions.filter(tx => tx.type === state.homeFilterType);
        }
        renderTransactionList('home-transaction-list-body', homeFilteredTxs, 'home');

        renderPieChart(visibleTransactions);
        renderExpenseByNameChart(visibleTransactions);
		renderBudgetWidget();
    }
	
	// ฟังก์ชันสำหรับสร้างตัวเลือก Auto Complete (ย้ายออกมาเพื่อให้เรียกใช้ได้ตลอด)
    function renderDropdownList() {
        const datalist = document.getElementById('frequent-items-datalist');
        if (!datalist) return;

        datalist.innerHTML = '';
        
        // 1. จากรายการที่ใช้บ่อย (Frequent Items)
        if (state.frequentItems && state.frequentItems.length > 0) {
            state.frequentItems.forEach(item => {
                datalist.insertAdjacentHTML('beforeend', `<option value="${escapeHTML(item)}"></option>`);
            });
        }

        // 2. จากรายการที่จำอัตโนมัติ (Auto Complete)
        if (state.autoCompleteList && state.autoCompleteList.length > 0) {
             state.autoCompleteList.forEach(item => {
                 // ป้องกันซ้ำกับรายการใช้บ่อย
                 if (!state.frequentItems.includes(item.name)) {
                     datalist.insertAdjacentHTML('beforeend', `<option value="${escapeHTML(item.name)}"></option>`);
                 }
            });
        }
    }

    function updateSharedControls(source) {
        const getEl = (id) => document.getElementById(id);
        const viewMode = (source === 'home') ? state.homeViewMode : state.listViewMode;
        const currentDate = (source === 'home') ? state.homeCurrentDate : state.listCurrentDate;
        if (viewMode === 'all') {
            getEl('month-controls').classList.add('hidden');
            getEl('month-controls').classList.remove('flex');
            getEl('year-controls').classList.add('hidden');
            getEl('year-controls').classList.remove('flex');
        } else if (viewMode === 'month') {
            getEl('month-controls').classList.remove('hidden');
            getEl('month-controls').classList.add('flex');
            getEl('year-controls').classList.add('hidden');
            getEl('year-controls').classList.remove('flex');
            const monthYear = currentDate.slice(0, 7);
            getEl('month-picker').value = monthYear;
        } else { 
            getEl('month-controls').classList.add('hidden');
            getEl('month-controls').classList.remove('flex');
            getEl('year-controls').classList.remove('hidden');
            getEl('year-controls').classList.add('flex');
            const year = currentDate.slice(0, 4);
            getEl('year-picker').value = year;
        }
        getEl('view-mode-select').value = viewMode;
    }

	function getAccountBalances(allTransactions) {
		const balances = {};
		for (const acc of state.accounts) {
			balances[acc.id] = acc.initialBalance || 0;
		}

		const sortedTxs = [...allTransactions].sort((a, b) => new Date(a.date) - new Date(b.date));
		
		// [แก้ไข] กำหนดให้เป็น 00:00:00 ของวันนี้ เพื่อให้นับรายการของวันนี้ทั้งหมด
		const today = new Date();
		today.setHours(23, 59, 59, 999); // ตั้งเป็นสิ้นสุดของวันนี้ เพื่อให้ครอบคลุมทุกรายการที่ลงวันที่เป็น "วันนี้"

		for (const tx of sortedTxs) {
			const txDate = new Date(tx.date);
			
			// ถ้าวันที่ของรายการ มากกว่า วันนี้ (คือเป็นวันพรุ่งนี้หรืออนาคต) ให้ข้าม
			if (txDate > today) {
				continue;
			}

			const amount = tx.amount;
			// ... (ส่วนการบวกลบยอดเงินด้านล่างเหมือนเดิม) ...
			if (tx.type === 'income') {
				if (balances[tx.accountId] !== undefined) {
					balances[tx.accountId] += amount;
				}
			} else if (tx.type === 'expense') {
				 if (balances[tx.accountId] !== undefined) {
					balances[tx.accountId] -= amount;
				}
			} else if (tx.type === 'transfer') {
				if (balances[tx.accountId] !== undefined) { 
					balances[tx.accountId] -= amount;
				}
				if (balances[tx.toAccountId] !== undefined) { 
					balances[tx.toAccountId] += amount;
				}
			}
		}
		return balances;
	}

		function renderSummary(transactionsForPeriod, allAccountBalances) {
			// [แก้ไข] กำหนดเวลาเป็นสิ้นสุดของวันนี้ เพื่อให้นับรายการวันนี้ทั้งหมด
			const today = new Date();
			today.setHours(23, 59, 59, 999);

			const periodTotals = transactionsForPeriod.reduce((acc, tx) => {
				const txDate = new Date(tx.date);
				
				// ถ้าวันที่รายการ > วันนี้ (คือเป็นอนาคต) ไม่ต้องนำมานับรวม
				if (txDate > today) {
					return acc;
				}

				if (tx.type === 'income') {
					acc.income += tx.amount;
				} else if (tx.type === 'expense') {
					acc.expense += tx.amount;
				}
				return acc;
			}, { income: 0, expense: 0 });

			// ... (ส่วนแสดงผลด้านล่างเหมือนเดิม) ...
			let totalCashBalance = 0;
			const sortedAccounts = getSortedAccounts();
			for (const acc of sortedAccounts) { 
				if (acc.type === 'cash') {
					totalCashBalance += allAccountBalances[acc.id] || 0;
				}
			}

			document.getElementById('total-income').textContent = formatCurrency(periodTotals.income);
			document.getElementById('total-expense').textContent = formatCurrency(periodTotals.expense);
			
			const totalBalanceEl = document.getElementById('total-balance');
			totalBalanceEl.textContent = formatCurrency(totalCashBalance);
		}

    function renderAllAccountSummary(balances) {
        const container = document.getElementById('all-accounts-summary');
        container.innerHTML = ''; 
        
        const sortedAccounts = getSortedAccounts(); 

        if (sortedAccounts.length === 0) { 
            container.innerHTML = `<p class="text-gray-500 col-span-full text-center">ยังไม่มีบัญชี
            <button id="nav-settings-shortcut" class="text-purple-600 hover:underline">สร้างบัญชีใหม่ในหน้าตั้งค่า</button>
            </p>`;
            document.getElementById('nav-settings-shortcut').addEventListener('click', () => showPage('page-accounts'));
            return;
        }
        
        sortedAccounts.forEach(acc => { 
            // [เพิ่ม] ถ้าถูกปิดสวิตช์ ไม่ต้องแสดงการ์ดนี้
            if (acc.isVisible === false) return;

            const balance = balances[acc.id] || 0;
            let balanceClass = 'balance-zero';
            if (balance > 0) balanceClass = 'balance-positive';
            if (balance < 0) balanceClass = 'balance-negative';
            
            const currentIcon = acc.iconName || acc.icon || 'fa-wallet';

            const cardHtml = `
                <div class="bg-gray-50 p-3 rounded-xl shadow-md border border-gray-200 compact-account-card cursor-pointer" data-id="${acc.id}">
                    <div class="flex items-center gap-3">
                        <i class="fa-solid ${currentIcon} text-purple-600 text-lg"></i>
                        <h3 class="text-base font-semibold text-gray-800 truncate">${escapeHTML(acc.name)}</h3>
                    </div>
                    <div class="w-full mt-2">
                        <p class="text-lg font-bold text-right ${balanceClass} truncate">${formatCurrency(balance)}</p>
                        <p class="text-xs text-gray-500 text-right">${acc.type === 'credit' ? 'บัตรเครดิต' : (acc.type === 'liability' ? 'หนี้สิน' : 'เงินสด')}</p>
                    </div>
                </div>
            `;
            container.insertAdjacentHTML('beforeend', cardHtml);
        });
    }

    // ============================================
	// [NEW] ADVANCED RENDER LIST PAGE
	// ============================================
	function renderListPage() {
		const getEl = (id) => document.getElementById(id);
		
		// 1. ดึงค่าจาก Input กรองต่างๆ
		const startDate = getEl('adv-filter-start').value;
		const endDate = getEl('adv-filter-end').value;
		const filterType = getEl('adv-filter-type').value;
		const searchTerm = getEl('adv-filter-search').value.toLowerCase().trim();

		// ปุ่ม Clear Search
		const btnClear = getEl('btn-clear-search');
		if(searchTerm.length > 0) btnClear.classList.remove('hidden');
		else btnClear.classList.add('hidden');

		// 2. กรองข้อมูล (Filtering)
		// เริ่มจากรายการทั้งหมดในระบบ
		let filtered = state.transactions.filter(tx => {
			const txDate = tx.date.slice(0, 10); // เอาเฉพาะ YYYY-MM-DD
			
			// 2.1 กรองวันที่ (Start <= Date <= End)
			// กรณี User ไม่เลือกวันที่ (ว่าง) ให้ถือว่าผ่าน
			const isDateInRange = (!startDate || txDate >= startDate) && 
								  (!endDate || txDate <= endDate);
			if (!isDateInRange) return false;

			// 2.2 กรองประเภท (Type)
			if (filterType !== 'all' && tx.type !== filterType) return false;

			// 2.3 กรองคำค้นหา (Search Keyword)
			if (searchTerm) {
				const amountStr = String(tx.amount);
				const fromAccount = state.accounts.find(a => a.id === tx.accountId);
				const toAccount = state.accounts.find(a => a.id === tx.toAccountId);
				const fromAccName = fromAccount ? fromAccount.name.toLowerCase() : '';
				const toAccName = toAccount ? toAccount.name.toLowerCase() : '';
				const category = tx.category ? tx.category.toLowerCase() : '';
				const name = tx.name ? tx.name.toLowerCase() : '';
				const desc = tx.desc ? tx.desc.toLowerCase() : ''; // Note

				// เช็คว่ามีคำค้นอยู่ใน field ไหนบ้าง
				const matches = name.includes(searchTerm) || 
								category.includes(searchTerm) || 
								desc.includes(searchTerm) ||
								fromAccName.includes(searchTerm) ||
								toAccName.includes(searchTerm) ||
								amountStr.includes(searchTerm);
				
				if (!matches) return false;
			}

			return true;
		});

		// 3. เรียงลำดับ (วันที่ใหม่สุดขึ้นก่อน)
		filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

		// 4. [HIGHLIGHT] คำนวณ Dynamic Summary (สรุปยอดจากรายการที่เห็น)
		let sumIncome = 0;
		let sumExpense = 0;
		
		filtered.forEach(tx => {
			if (tx.type === 'income') sumIncome += tx.amount;
			else if (tx.type === 'expense') sumExpense += tx.amount;
		});
		
		const sumNet = sumIncome - sumExpense;

		// อัปเดตตัวเลขบนหน้าจอ
		getEl('dyn-sum-income').textContent = formatCurrency(sumIncome);
		getEl('dyn-sum-expense').textContent = formatCurrency(sumExpense);
		
		const netEl = getEl('dyn-sum-net');
		netEl.textContent = formatCurrency(sumNet);
		// เปลี่ยนสีตามยอดคงเหลือ
		if (sumNet > 0) { netEl.className = "text-sm md:text-base font-bold text-green-600"; }
		else if (sumNet < 0) { netEl.className = "text-sm md:text-base font-bold text-red-600"; }
		else { netEl.className = "text-sm md:text-base font-bold text-gray-600"; }

		getEl('dyn-count-display').textContent = `${filtered.length} รายการ`;
		
		// ------------------------------------
		// [NEW] เรียกแสดงกราฟ
		renderAnalyticsChart(filtered);
		// ------------------------------------

		// 5. แสดงผลรายการ (Pagination)
		// ใช้ state.listItemsPerPage ที่มีอยู่เดิม
		renderTransactionList('transaction-list-body', filtered, 'list');
	}
	
	// ============================================
	// [แก้ไข] FUNCTION EXPORT FILTERED LIST (ตั้งชื่อไฟล์ตามสิ่งที่ค้นหา)
	// ============================================
	function exportFilteredList() {
		if (typeof XLSX === 'undefined') {
			Swal.fire('Error', 'ไม่พบ Library สำหรับสร้าง Excel', 'error');
			return;
		}

		const getEl = (id) => document.getElementById(id);
		const startDate = getEl('adv-filter-start').value;
		const endDate = getEl('adv-filter-end').value;
		const filterType = getEl('adv-filter-type').value;
		const searchTerm = getEl('adv-filter-search').value.toLowerCase().trim();

		let filtered = state.transactions.filter(tx => {
			const txDate = tx.date.slice(0, 10);
			const isDateInRange = (!startDate || txDate >= startDate) && 
								  (!endDate || txDate <= endDate);
			if (!isDateInRange) return false;
			
			if (filterType !== 'all' && tx.type !== filterType) return false;
			
			if (searchTerm) {
				const amountStr = String(tx.amount);
				const fromAccount = state.accounts.find(a => a.id === tx.accountId);
				const toAccount = state.accounts.find(a => a.id === tx.toAccountId);
				const fromAccName = fromAccount ? fromAccount.name.toLowerCase() : '';
				const toAccName = toAccount ? toAccount.name.toLowerCase() : '';
				const category = tx.category ? tx.category.toLowerCase() : '';
				const name = tx.name ? tx.name.toLowerCase() : '';
				const desc = tx.desc ? tx.desc.toLowerCase() : '';
				
				const matches = name.includes(searchTerm) || 
								category.includes(searchTerm) || 
								desc.includes(searchTerm) ||
								fromAccName.includes(searchTerm) ||
								toAccName.includes(searchTerm) ||
								amountStr.includes(searchTerm);
				if (!matches) return false;
			}
			return true;
		});

		if (filtered.length === 0) {
			Swal.fire('ไม่มีข้อมูล', 'ไม่พบรายการตามเงื่อนไขที่กำหนด', 'warning');
			return;
		}

		Swal.fire({
			title: 'ยืนยันการ Export Excel?',
			html: `
				<div class="text-left text-sm text-gray-600">
					<p><b>จำนวนรายการ:</b> ${filtered.length} รายการ</p>
					<p><b>ช่วงวันที่:</b> ${startDate} ถึง ${endDate}</p>
					<p><b>เงื่อนไข:</b> ${searchTerm ? '"'+searchTerm+'"' : 'ทั้งหมด'} (${filterType})</p>
				</div>
			`,
			icon: 'question',
			showCancelButton: true,
			confirmButtonColor: '#16a34a',
			cancelButtonColor: '#d33',
			confirmButtonText: '<i class="fa-solid fa-file-excel"></i> ดาวน์โหลดเลย',
			cancelButtonText: 'ยกเลิก'
		}).then((result) => {
			if (result.isConfirmed) {
				
				filtered.sort((a, b) => new Date(a.date) - new Date(b.date));

				let sumIncome = 0;
				let sumExpense = 0;
				filtered.forEach(tx => {
					if (tx.type === 'income') sumIncome += tx.amount;
					else if (tx.type === 'expense') sumExpense += tx.amount;
				});
				const sumNet = sumIncome - sumExpense;

				const dataRows = filtered.map(tx => {
					const d = new Date(tx.date);
					const dateStr = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
					const timeStr = d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
					
					let typeLabel = tx.type === 'income' ? 'รายรับ' : (tx.type === 'expense' ? 'รายจ่าย' : 'โอนย้าย');
					let amount = tx.amount;
					if (tx.type === 'expense') amount = -amount;
					
					return {
						"วันที่": dateStr,
						"เวลา": timeStr,
						"ประเภท": typeLabel,
						"รายการ": tx.name,
						"หมวดหมู่": tx.category,
						"จำนวนเงิน": amount,
						"บัญชี": state.accounts.find(a => a.id === tx.accountId)?.name || '-',
						"หมายเหตุ": tx.desc || ''
					};
				});

				const ws = XLSX.utils.json_to_sheet(dataRows, { origin: "A7" });

				const summaryHeader = [
					[`สรุปรายการค้นหา (Filtered Report)`],
					[`ช่วงเวลา: ${startDate} ถึง ${endDate}`],
					[`เงื่อนไข: "${searchTerm}" | ประเภท: ${filterType}`],
					[], 
					["สรุปยอดรวม", "จำนวนเงิน (บาท)"],
					["รายรับรวม", sumIncome],
					["รายจ่ายรวม", sumExpense],
					["ยอดสุทธิ", sumNet],
					[] 
				];

				XLSX.utils.sheet_add_aoa(ws, summaryHeader, { origin: "A1" });

				ws['!cols'] = [
					{wch: 12}, {wch: 8}, {wch: 10}, {wch: 20}, {wch: 15}, {wch: 12}, {wch: 15}, {wch: 30}
				];

				const wb = XLSX.utils.book_new();
				XLSX.utils.book_append_sheet(wb, ws, "FilteredData");

				// --- [ส่วนที่เพิ่ม] ตั้งชื่อไฟล์แบบ Dynamic ---
				let fileName = 'Export';
				
				// 1. ถ้ามีคำค้นหา ให้ใช้คำค้นหาเป็นชื่อไฟล์
				if (searchTerm) {
					// แทนที่ตัวอักษรพิเศษที่ไม่ควรอยู่ในชื่อไฟล์
					const safeSearchTerm = searchTerm.replace(/[/\\?%*:|"<>]/g, '-');
					fileName += `_${safeSearchTerm}`;
				} 
				// 2. ถ้าไม่มีคำค้นหา แต่เลือกประเภท (รายรับ/จ่าย) ให้ใส่ชื่อประเภท
				else if (filterType !== 'all') {
					const typeMap = { 'income': 'รายรับ', 'expense': 'รายจ่าย', 'transfer': 'โอนย้าย' };
					fileName += `_${typeMap[filterType] || filterType}`;
				}
				
				// 3. ปิดท้ายด้วยช่วงวันที่
				fileName += `_${startDate}_to_${endDate}.xlsx`;
				
				XLSX.writeFile(wb, fileName);
				// ------------------------------------------
				
				const Toast = Swal.mixin({
					toast: true,
					position: 'top-end',
					showConfirmButton: false,
					timer: 3000,
					timerProgressBar: true
				});
				Toast.fire({
					icon: 'success',
					title: `ดาวน์โหลดไฟล์: ${fileName} เรียบร้อย`
				});
			}
		});
	}

    
    function createTransactionTableHTML(tbodyId) {
        return `
        <table class="w-full text-left">
            <thead>
                <tr class="border-b border-gray-200">
                    <th class="p-2 text-lg text-gray-700 font-semibold">วันที่</th>
                    <th class="p-2 text-lg text-gray-700 font-semibold">ชื่อรายการ/บัญชี</th>
             <th class="p-2 text-lg text-gray-700 font-semibold">หมวดหมู่</th>
                    <th class="p-2 text-lg text-gray-700 font-semibold text-right">จำนวนเงิน</th>
                    <th class="p-2 text-lg text-gray-700 font-semibold text-center">จัดการ</th>
                </tr>
            </thead>
            <tbody id="${tbodyId}">
                <tr>
                    <td colspan="5" class="p-6 text-center text-gray-500">ไม่มีรายการ...</td>
                </tr>
            </tbody>
        </table>
        `;
    }

    function renderTransactionList(tbodyId, allTransactions, source) {
        const listBody = document.getElementById(tbodyId);
        listBody.innerHTML = ''; 
        const isListPage = (source === 'list');
        const groupBy = isListPage ? state.listGroupBy : 'none'; 

        allTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));

        if (groupBy !== 'none' && isListPage) {
            const grouped = {};
            allTransactions.forEach(tx => {
                let key;
                const dateObj = new Date(tx.date);
                if (groupBy === 'day') {
                    key = tx.date.slice(0, 10);
                } else { // month
                    key = tx.date.slice(0, 7); 
                }

                if (!grouped[key]) grouped[key] = { transactions: [], income: 0, expense: 0 };
                grouped[key].transactions.push(tx);
                if (tx.type === 'income') grouped[key].income += tx.amount;
                else if (tx.type === 'expense') grouped[key].expense += tx.amount;
            });

            const sortedGroups = Object.keys(grouped).sort((a, b) => b.localeCompare(a));
            let fullHtml = '';

            sortedGroups.forEach(key => {
                const groupData = grouped[key];
                const netBalance = groupData.income - groupData.expense;
                const netClass = netBalance >= 0 ? 'text-green-600' : 'text-red-600';
                
                let title;
                if (groupBy === 'day') {
                    title = new Date(key).toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
                } else { // month
                    const [y, m] = key.split('-');
                    title = new Date(y, m - 1).toLocaleDateString('th-TH', { month: 'long', year: 'numeric' });
                }

                fullHtml += `
                    <tr class="bg-gray-200 dark:bg-gray-700">
                        <td colspan="5" class="p-3 text-lg font-bold text-gray-800 dark:text-gray-100">
                            ${title}
                            <span class="float-right text-base font-medium">
                                รายรับ: <span class="text-green-600">${formatCurrency(groupData.income)}</span> / 
                                รายจ่าย: <span class="text-red-600">${formatCurrency(groupData.expense)}</span> / 
                                สุทธิ: <span class="${netClass}">${formatCurrency(netBalance)}</span>
                            </span>
                        </td>
                    </tr>
                `;

                groupData.transactions.forEach(tx => {
                    fullHtml += createTransactionRowHtml(tx); 
                });
            });

            listBody.innerHTML = fullHtml;
            document.getElementById('list-pagination-controls').innerHTML = ''; 
            return;
        } 
        
        const currentPage = (source === 'home') ? state.homeCurrentPage : state.listCurrentPage;
        const itemsToShow = (source === 'list') ? state.listItemsPerPage : state.homeItemsPerPage;
        const totalPages = Math.ceil(allTransactions.length / itemsToShow);
        const startIndex = (currentPage - 1) * itemsToShow;
        const endIndex = startIndex + itemsToShow;
        const paginatedTransactions = allTransactions.slice(startIndex, endIndex);

        if (allTransactions.length === 0) {
            listBody.innerHTML = '<tr><td colspan="5" class="p-6 text-center text-gray-500">ไม่มีรายการ...</td></tr>';
            renderPaginationControls(source, 0, 1);
            return;
        }

        paginatedTransactions.forEach(tx => {
            listBody.insertAdjacentHTML('beforeend', createTransactionRowHtml(tx));
        });

        renderPaginationControls(source, totalPages, currentPage);
    }

    function createTransactionRowHtml(tx) {
        const date = new Date(tx.date);
        const formattedDate = date.toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' });
        const formattedTime = date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
        
        const isFuture = date > new Date();
        const futureBadge = isFuture ? 
            `<span class="inline-block bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded-full ml-2 border border-yellow-200">
                <i class="fa-solid fa-clock mr-1"></i>ล่วงหน้า
            </span>` : '';
        const rowOpacity = isFuture ? 'opacity-70' : ''; 
        
        let name, category, amount, amountClass, amountSign;
        
        // --- แก้ไขการดึงชื่อบัญชี (เอา .toLowerCase() ออก และใส่ค่า Default) ---
        const fromAccount = state.accounts.find(a => a.id === tx.accountId);
        const toAccount = state.accounts.find(a => a.id === tx.toAccountId);
        
        // ถ้าหาไม่เจอ ให้แสดงชื่อเดิมที่บันทึกไว้ใน tx (ถ้ามี) หรือแสดงคำว่า 'ไม่ระบุ'
        const fromAccName = fromAccount ? escapeHTML(fromAccount.name) : '<span class="text-red-400">ไม่พบบัญชี</span>';
        const toAccName = toAccount ? escapeHTML(toAccount.name) : '<span class="text-red-400">ไม่พบบัญชี</span>';
        // ----------------------------------------------------------------
        
        const receiptIcon = tx.receiptBase64 ? 
            `<button type="button" class="view-receipt-icon text-purple-500 hover:text-purple-700 ml-2 z-10 relative" data-base64="${tx.receiptBase64}" title="คลิกเพื่อดูรูป">
                <i class="fa-solid fa-receipt"></i>
            </button>` : '';

        if (tx.type === 'transfer') {
            name = `<span class="font-bold text-blue-600">${escapeHTML(tx.name)}</span>${receiptIcon}${futureBadge}`;
            category = `<div class="text-sm">
                            <span class="text-gray-500">จาก:</span> ${fromAccName}<br>
                            <span class="text-gray-500">ไป:</span> ${toAccName}
                        </div>`;
            amount = formatCurrency(tx.amount);
            amountClass = 'text-blue-600';
            amountSign = '';
        } else {
            name = escapeHTML(tx.name) + receiptIcon + futureBadge;
            category = `<span class="block">${escapeHTML(tx.category)}</span>
                        <span class="text-sm text-purple-600">${fromAccName}</span>`;
            amount = formatCurrency(tx.amount);
            
            if (tx.type === 'income') {
                amountClass = 'text-green-600';
                amountSign = '+';
            } else {
                amountClass = 'text-red-600';
                amountSign = '-';
            }
        }

        return `
            <tr class="border-b border-gray-100 hover:bg-gray-50 ${rowOpacity}">
                <td class="p-2 text-lg text-gray-700">
                    ${formattedDate} <span class="block text-base text-gray-500">${formattedTime} น.</span>
                </td>
                <td class="p-2 text-lg text-gray-700 font-medium break-word">
                    ${name}
                    ${tx.desc ? `<p class="text-base text-gray-500">${escapeHTML(tx.desc)}</p>` : ''}
                </td>
                <td class="p-2 text-lg text-gray-700 break-word">${category}</td>
                <td class="p-2 text-lg ${amountClass} font-semibold text-right whitespace-nowrap">${amountSign}${amount}</td>
                <td class="p-2 text-lg text-center">
                    <div class="flex flex-col md:flex-row items-center justify-center">
                        <button class="edit-btn text-blue-500 hover:text-blue-700 p-2" data-id="${tx.id}">
                            <i class="fa-solid fa-pencil"></i>
                        </button>
                        <button class="delete-btn text-red-500 hover:text-red-700 p-2" data-id="${tx.id}">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }


    function renderPieChart(transactions) {
        // [แก้ไข] กำหนดวันปัจจุบัน (สิ้นสุดวัน)
		const today = new Date();
		today.setHours(23, 59, 59, 999);

		const summary = transactions.reduce((acc, tx) => {
			// [แก้ไข] กรองรายการอนาคตออก
			if (new Date(tx.date) > today) {
				return acc;
			}

			if (tx.type === 'income') {
				acc.income += tx.amount;
			} else if (tx.type === 'expense') {
				acc.expense += tx.amount;
			}
			return acc;
		}, { income: 0, expense: 0 });

        const labels = [
            `รายรับ (${formatCurrency(summary.income)})`, 
            `รายจ่าย (${formatCurrency(summary.expense)})`
        ];
        
        const data = [summary.income, summary.expense];
        if (myChart) {
            myChart.destroy();
        }
        
        const noDataEl = document.getElementById('chart-no-data');
        if (summary.income === 0 && summary.expense === 0) {
            noDataEl.textContent = 'ไม่มีข้อมูล';
            noDataEl.classList.remove('hidden');
            return;
        } else {
            noDataEl.classList.add('hidden');
        }

        const ctx = document.getElementById('transaction-chart').getContext('2d');
        
        const isMobile = window.innerWidth < 768;
        const textColor = state.isDarkMode ? '#e5e7eb' : '#4b5563'; 

        myChart = new Chart(ctx, {
            type: 'pie',
            plugins: [typeof ChartDataLabels !== 'undefined' ? ChartDataLabels : {}], 
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: ['#22c55e', '#ef4444'],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                layout: {
                    padding: {
                        left: isMobile ? 0 : 0,
                        right: isMobile ? 0 : 0,
                        top: isMobile ? 0 : 0,
                        bottom: isMobile ? 0 : 0
                    }
                },
                plugins: {
                    datalabels: {
                        display: false, 
                    },
                    legend: {
                        position: 'right',
                        align: 'center', 
                        labels: {
                            usePointStyle: true, 
                            boxWidth: isMobile ? 8 : 10,
                            padding: isMobile ? 6 : 10,
                            font: {
                                family: 'Prompt, sans-serif',
                                size: isMobile ? 10 : 12,
                                color: textColor 
                            }
                         }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return ''; 
                            },
                            title: function(context) {
                                return context[0].label;
                            }
                        }
                    }
                }
            }
        });
    }

    function renderExpenseByNameChart(transactions) {
		
		const today = new Date();
		today.setHours(23, 59, 59, 999);

		// [แก้ไข] กรองเอาเฉพาะ 'expense' และ วันที่ต้องไม่เกินวันนี้
		const expenseTransactions = transactions.filter(tx => {
			return tx.type === 'expense' && new Date(tx.date) <= today;
		});
		
		const itemData = expenseTransactions.reduce((acc, tx) => {
			const name = tx.name || 'ไม่ระบุรายการ';
			if (!acc[name]) {
				acc[name] = 0;
			}
			acc[name] += tx.amount;
			return acc;
		}, {});
		let sortedItems = Object.entries(itemData).map(([name, amount]) => ({ name, amount }));
		sortedItems.sort((a, b) => b.amount - a.amount);

		const TOP_N = 9;
		let labels = [];
		let data = [];
		
		if (sortedItems.length > (TOP_N + 1)) { 
			const topItems = sortedItems.slice(0, TOP_N);
			const otherItems = sortedItems.slice(TOP_N);
			
			topItems.forEach(item => {
				labels.push(`${item.name} (${formatCurrency(item.amount)})`);
				data.push(item.amount);
			});
			const otherAmount = otherItems.reduce((sum, item) => sum + item.amount, 0);
			labels.push(`อื่นๆ (${formatCurrency(otherAmount)})`);
			data.push(otherAmount);
		} else {
			sortedItems.forEach(item => {
				labels.push(`${item.name} (${formatCurrency(item.amount)})`);
				data.push(item.amount);
			});
		}

		if (myExpenseByNameChart) { 
			myExpenseByNameChart.destroy();
		}
		
		const noDataEl = document.getElementById('expense-chart-no-data');
		if (data.length === 0) {
			noDataEl.classList.remove('hidden');
			return;
		} else {
			noDataEl.classList.add('hidden');
		}

		const generateColors = (numColors) => {
			let colors = [];
			const colorPalette = ['#e11d48', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#0ea5e9', '#3b82f6', '#059669', '#0e7490', '#db2777', '#ca8a04', '#6d28d9', '#64748b'];
			for (let i = 0; i < numColors; i++) {
				colors.push(colorPalette[i % colorPalette.length]);
			}
			return colors;
		};

		const ctx = document.getElementById('expense-category-chart').getContext('2d');
		
		const isMobile = window.innerWidth < 768; 
		const textColor = state.isDarkMode ? '#e5e7eb' : '#4b5563'; 

		myExpenseByNameChart = new Chart(ctx, { 
			type: 'pie', 
			plugins: [typeof ChartDataLabels !== 'undefined' ? ChartDataLabels : {}],
			data: {
				labels: labels,
				datasets: [{
					data: data,
					backgroundColor: generateColors(labels.length),
					borderWidth: 1
				}]
				},
				options: {
					responsive: true,
					maintainAspectRatio: false,
					layout: {
						padding: {
							left: isMobile ? 0 : 0,
							right: isMobile ? 0 : 0,
							top: isMobile ? 0 : 0,
							bottom: isMobile ? 0 : 0
						}
					},
					plugins: {
						datalabels: {
							display: false, 
						},
						legend: {
							position: 'right',
							align: 'center', 
							labels: {
								usePointStyle: true, 
								boxWidth: isMobile ? 8 : 10, 
								padding: isMobile ? 6 : 10,  
								font: {
									family: 'Prompt, sans-serif',
									size: isMobile ? 10 : 12, 
									color: textColor 
								}
							}
						},
						tooltip: {
							callbacks: {
								label: function(context) {
									 return ''; 
								},
								title: function(context) {
									return context[0].label;
								}
							}
						}
					}
				}
			});
    }

    function renderListPageBarChart(transactions) {
		const ctx = document.getElementById('list-page-bar-chart').getContext('2d');
		const noDataEl = document.getElementById('list-chart-no-data');
		const titleEl = document.getElementById('list-chart-title');
		
		// [แก้ไข] กำหนดวันปัจจุบัน (สิ้นสุดวัน 23:59:59)
		// เพื่อให้ครอบคลุมรายการที่ลงเวลาเป็นวันนี้ทั้งหมด แต่ไม่รวมพรุ่งนี้
		const today = new Date();
		today.setHours(23, 59, 59, 999);

		if (myListPageBarChart) {
			myListPageBarChart.destroy();
		}

		let labels = [];
		let datasets = [];
		let hasData = false;
		let chartType = 'bar'; 

		if (state.listChartMode === 'trend_month' || state.listChartMode === 'trend_year') {
			chartType = 'line';
			const granularity = state.listChartMode === 'trend_month' ? 'month' : 'year';
			titleEl.textContent = granularity === 'month' ? 'แนวโน้ม รายรับ-รายจ่าย รายเดือน' : 'แนวโน้ม รายรับ-รายจ่าย รายปี';
			
			const trendData = transactions.reduce((acc, tx) => {
				// [แก้ไข] กรองรายการอนาคตออก
				if (new Date(tx.date) > today) {
					return acc;
				}

				const dateObj = new Date(tx.date);
				let key;
				if (granularity === 'month') {
					key = dateObj.getFullYear() + '-' + (dateObj.getMonth() + 1).toString().padStart(2, '0');
				} else { // year
					key = dateObj.getFullYear().toString();
				}

				if (!acc[key]) acc[key] = { income: 0, expense: 0 };
				
				if (tx.type === 'income') acc[key].income += tx.amount;
				else if (tx.type === 'expense') acc[key].expense += tx.amount;
				
				return acc;
			}, {});
			
			const sortedKeys = Object.keys(trendData).sort();
			if (sortedKeys.length > 0) {
				hasData = true;
				labels = sortedKeys.map(key => {
					if (granularity === 'month') {
						const [y, m] = key.split('-');
						return new Date(y, m - 1).toLocaleDateString('th-TH', { month: 'short', year: 'numeric' });
					}
					return key; // year
				});
				
				datasets = [
					{
						label: 'รายรับ',
						data: sortedKeys.map(k => trendData[k].income),
						borderColor: '#22c55e',
						backgroundColor: '#22c55e',
						tension: 0.1
					},
					{
						label: 'รายจ่าย',
						data: sortedKeys.map(k => trendData[k].expense),
						borderColor: '#ef4444',
						backgroundColor: '#ef4444',
						tension: 0.1
					}
				];
			}

		} else {
			// Daily (Default)
			titleEl.textContent = 'รายรับ-รายจ่าย 7 วันล่าสุด';
			const last7Days = {};
			
			for (let i = 6; i >= 0; i--) {
				const d = new Date();
				d.setDate(d.getDate() - i);
				const key = d.toISOString().split('T')[0];
				last7Days[key] = { income: 0, expense: 0, dateObj: d };
			}

			transactions.forEach(tx => {
				// [แก้ไข] กรองรายการอนาคตออก
				if (new Date(tx.date) > today) {
					return;
				}

				const key = tx.date.split('T')[0];
				if (last7Days[key]) {
					if (tx.type === 'income') last7Days[key].income += tx.amount;
					else if (tx.type === 'expense') last7Days[key].expense += tx.amount;
				}
			});

			labels = Object.values(last7Days).map(val => val.dateObj.toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric' }));
			const incomeData = Object.values(last7Days).map(val => val.income);
			const expenseData = Object.values(last7Days).map(val => val.expense);
			
			if (incomeData.some(v => v > 0) || expenseData.some(v => v > 0)) {
				hasData = true;
			}

			datasets = [
				{
					label: 'รายรับ',
					data: incomeData,
					backgroundColor: '#22c55e'
				},
				{
					label: 'รายจ่าย',
					data: expenseData,
					backgroundColor: '#ef4444'
				}
			];
		}
		
		if (!hasData) {
			noDataEl.classList.remove('hidden');
			return; 
		} else {
			noDataEl.classList.add('hidden');
		}

		const isMobile = window.innerWidth < 768;
		const textColor = state.isDarkMode ? '#e5e7eb' : '#4b5563'; 

		myListPageBarChart = new Chart(ctx, {
			type: chartType,
			plugins: [typeof ChartDataLabels !== 'undefined' ? ChartDataLabels : {}],
			data: {
				labels: labels,
				datasets: datasets
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				layout: {
					padding: {
						left: 0,
						right: 0,
						top: 20,
						bottom: 0
					}
				},
				scales: {
					y: {
						beginAtZero: true,
						ticks: {
							font: { family: 'Prompt, sans-serif' },
							color: textColor,
							callback: function(value) {
								 if (value >= 1000) return (value / 1000).toFixed(0) + 'k';
								 return value;
							}
						},
						 grid: {
							color: state.isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
						}
					},
					x: {
						ticks: {
							font: { family: 'Prompt, sans-serif', size: 10 },
							color: textColor
						},
						grid: {
							display: false
						}
					}
				},
				plugins: {
					datalabels: {
						display: false, 
					},
					legend: {
						display: true,
						position: 'top',
						labels: {
							usePointStyle: true,
							boxWidth: 8,
							font: { family: 'Prompt, sans-serif', size: 12, color: textColor }
						}
					},
					tooltip: {
						callbacks: {
							 label: function(context) {
								let label = context.dataset.label || '';
								if (label) {
									label += ': ';
								}
								if (context.parsed.y !== null) {
									label += formatCurrency(context.parsed.y);
								}
								return label;
							}
						}
					}
				}
			}
		});
	}

	async function renderCalendarView() {
		try {
			const moneyContainer = document.getElementById('calendar-money');
			const importedContainer = document.getElementById('calendar-imported');
			const moneyWrapper = document.getElementById('calendar-money-container');
			const importedWrapper = document.getElementById('calendar-imported-container');
			const yearInput = document.getElementById('cal-year-input');

			if (!moneyContainer || !importedContainer || !yearInput) return;

			const showMoney = document.getElementById('cal-toggle-money')?.checked ?? true;
			const showImported = document.getElementById('cal-toggle-imported')?.checked ?? true;

			if (moneyWrapper) moneyWrapper.style.display = showMoney ? 'block' : 'none';
			if (importedWrapper) importedWrapper.style.display = showImported ? 'block' : 'none';

			let currentYear = new Date(state.calendarCurrentDate || new Date()).getFullYear();
			yearInput.value = currentYear;

			// ---------- ปฏิทินธุรกรรม (moneyCalendar) ----------
			if (showMoney) {
				const moneyEvents = [];
				const dailyTotals = {};
				state.transactions.forEach(tx => {
					const dateStr = tx.date.slice(0, 10);
					if (!dailyTotals[dateStr]) dailyTotals[dateStr] = { income: 0, expense: 0 };
					if (tx.type === 'income') dailyTotals[dateStr].income += tx.amount;
					else if (tx.type === 'expense') dailyTotals[dateStr].expense += tx.amount;
				});

				Object.keys(dailyTotals).forEach(date => {
					const totals = dailyTotals[date];
					const isFuture = date > new Date().toISOString().slice(0, 10);
					if (totals.income > 0) {
						moneyEvents.push({
							id: date + '-inc',
							title: '+' + formatCurrency(totals.income).replace(/[^\d.,-]/g, ''),
							start: date,
							allDay: true,
							color: '#22c55e',
							textColor: '#ffffff',
							classNames: ['money-event']
						});
					}
					if (totals.expense > 0) {
						moneyEvents.push({
							id: date + '-exp',
							title: '-' + formatCurrency(totals.expense).replace(/[^\d.,-]/g, ''),
							start: date,
							allDay: true,
							color: isFuture ? '#f59e0b' : '#ef4444',
							textColor: '#ffffff',
							classNames: ['money-event']
						});
					}
				});

				if (moneyCalendar) moneyCalendar.destroy();

				moneyCalendar = new FullCalendar.Calendar(moneyContainer, {
					initialView: 'dayGridMonth',
					initialDate: state.calendarCurrentDate || new Date().toISOString().slice(0, 10),
					locale: 'th',
					contentHeight: 'auto',
					buttonText: { today: 'วันนี้' },
					headerToolbar: { left: 'prev,next today', center: 'title', right: '' },
					showNonCurrentDates: false,
					fixedWeekCount: false,
					events: moneyEvents,
					eventOrder: "start,-duration,allDay,title",
					dateClick: function(info) { showDailyDetails(info.dateStr); },
					eventClick: function(info) { showDailyDetails(info.event.startStr.slice(0, 10)); },
					datesSet: function(info) {
						// ✅ ป้องกัน loop ด้วย flag
						if (isSyncingCalendars) return;
						isSyncingCalendars = true;

						const currentStart = info.view.currentStart;
						const offset = currentStart.getTimezoneOffset();
						const localDate = new Date(currentStart.getTime() - (offset * 60 * 1000));
						state.calendarCurrentDate = localDate.toISOString().slice(0, 10);
						yearInput.value = currentStart.getFullYear();

						// ซิงค์ปฏิทินกิจกรรม (ถ้ากำลังแสดง)
						if (importedCalendar && showImported) {
							importedCalendar.gotoDate(localDate);
						}

						isSyncingCalendars = false;
					}
				});
				moneyCalendar.render();
			} else {
				if (moneyCalendar) {
					moneyCalendar.destroy();
					moneyCalendar = null;
				}
			}

			// ---------- ปฏิทินกิจกรรม (importedCalendar) ----------
			if (showImported) {
				const importedEvents = [];

				const visibleGroups = new Map();
				state.icsImports.forEach(grp => visibleGroups.set(grp.id, grp.isVisible !== false));

				state.importedEvents.forEach(ev => {
					if (visibleGroups.get(ev.importId) !== false) {
						importedEvents.push({
							id: ev.id,
							title: ev.title,
							start: ev.start,
							allDay: true,
							color: ev.color || '#8b5cf6',
							textColor: '#ffffff',
							classNames: ['imported-event'],
							extendedProps: { importId: ev.importId }
						});
					}
				});

				if (importedCalendar) importedCalendar.destroy();

				importedCalendar = new FullCalendar.Calendar(importedContainer, {
					initialView: 'dayGridMonth',
					initialDate: state.calendarCurrentDate || new Date().toISOString().slice(0, 10),
					locale: 'th',
					contentHeight: 'auto',
					buttonText: { today: 'วันนี้' },
					headerToolbar: { left: 'prev,next today', center: 'title', right: '' },
					showNonCurrentDates: false,
					fixedWeekCount: false,
					events: importedEvents,
					eventOrder: "start,-duration,allDay,title",
					dateClick: function(info) { showImportedDailyDetails(info.dateStr); },
					eventClick: function(info) { showImportedDailyDetails(info.event.startStr.slice(0, 10)); },
					datesSet: function(info) {
						// ✅ ป้องกัน loop ด้วย flag
						if (isSyncingCalendars) return;
						isSyncingCalendars = true;

						const currentStart = info.view.currentStart;
						const offset = currentStart.getTimezoneOffset();
						const localDate = new Date(currentStart.getTime() - (offset * 60 * 1000));
						state.calendarCurrentDate = localDate.toISOString().slice(0, 10);
						yearInput.value = currentStart.getFullYear();

						// ซิงค์ปฏิทินธุรกรรม (ถ้ากำลังแสดง)
						if (moneyCalendar && showMoney) {
							moneyCalendar.gotoDate(localDate);
						}

						isSyncingCalendars = false;
					}
				});
				importedCalendar.render();
			} else {
				if (importedCalendar) {
					importedCalendar.destroy();
					importedCalendar = null;
				}
			}

		} catch (err) {
			console.error('Error rendering calendar:', err);
		}
	}
	
	async function showImportedDailyDetails(dateStr) {
		const dailyImported = state.importedEvents.filter(ev => ev.start.startsWith(dateStr));

		if (dailyImported.length === 0) {
			Swal.fire({
				icon: 'info',
				title: 'ไม่มีกิจกรรม',
				text: 'วันนี้ไม่มีกิจกรรมที่นำเข้า',
				confirmButtonText: 'ตกลง'
			});
			return;
		}

		let html = '<ul class="space-y-2 max-h-96 overflow-y-auto">';
		dailyImported.forEach(ev => {
			html += `
				<li class="flex items-start gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-100 dark:border-purple-800">
					<i class="fa-regular fa-calendar-check text-purple-600 mt-1"></i>
					<div>
						<div class="font-bold text-gray-800 dark:text-gray-200">${escapeHTML(ev.title)}</div>
						<div class="text-xs text-gray-500 dark:text-gray-400 mt-1">🕒 ${ev.allDay ? 'ทั้งวัน' : ev.start}</div>
					</div>
				</li>
			`;
		});
		html += '</ul>';

		await Swal.fire({
			title: `📅 กิจกรรมวันที่ ${new Date(dateStr).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}`,
			html: html,
			icon: 'info',
			confirmButtonText: 'ปิด',
			customClass: { popup: state.isDarkMode ? 'swal2-popup' : '' },
			background: state.isDarkMode ? '#1a1a1a' : '#fff',
			color: state.isDarkMode ? '#e5e7eb' : '#545454'
		});
	}

	// ============================================
	// 2. ฟังก์ชันแสดงรายละเอียดรายวัน (Popup รายการ + ปุ่มกด)
	// ============================================
	async function showDailyDetails(dateStr) {
		// 1. ดึงรายการรายรับ-รายจ่าย
		const dailyTx = state.transactions.filter(t => t.date.slice(0, 10) === dateStr);
		
		// 2. ดึงรายการแจ้งเตือน
		const dailyNotif = state.customNotifications.filter(n => n.date === dateStr);
		
		// สร้าง HTML สำหรับ Transactions
		let txHtml = '';
		if (dailyTx.length > 0) {
			txHtml = '<ul class="space-y-2 mb-4">';
			dailyTx.forEach(tx => {
				const colorClass = tx.type === 'income' ? 'text-green-600' : 'text-red-600';
				const sign = tx.type === 'income' ? '+' : '-';
				txHtml += `
					<li class="flex justify-between items-center text-sm border-b pb-1 border-gray-100">
						<span class="text-gray-700 truncate w-2/3 text-left">• ${tx.name}</span>
						<span class="${colorClass} font-bold">${sign}${formatCurrency(tx.amount)}</span>
					</li>`;
			});
			txHtml += '</ul>';
		} else {
			txHtml = '<p class="text-gray-400 text-sm mb-4 italic text-center">- ไม่มีรายการการเงิน -</p>';
		}

		// สร้าง HTML สำหรับ Notifications
		let notifyHtml = '';
		if (dailyNotif.length > 0) {
			notifyHtml = '<div class="mb-4"><h5 class="font-bold text-gray-700 text-sm mb-2 text-left">แจ้งเตือน:</h5><ul class="space-y-2">';
			dailyNotif.forEach(n => {
				let timeBadge = (n.isAllDay === false && n.time) 
					? `<span class="text-[10px] bg-purple-100 text-purple-700 px-1 rounded ml-1">${n.time} น.</span>`
					: `<span class="text-[10px] bg-gray-100 text-gray-500 px-1 rounded ml-1">ทั้งวัน</span>`;
				
				notifyHtml += `
					<li class="flex justify-between items-center bg-purple-50 p-2 rounded text-sm text-gray-700">
						<span>${n.message}</span>
						${timeBadge}
					</li>`;
			});
			notifyHtml += '</ul></div>';
		}
		
		// หา imported events ในวันนี้
		const dailyImported = state.importedEvents.filter(ev => ev.start.startsWith(dateStr));

		let importedHtml = '';
		if (dailyImported.length > 0) {
			importedHtml = '<div class="mb-4"><h5 class="font-bold text-purple-700 text-sm mb-2 text-left">📅 กิจกรรมที่นำเข้า:</h5><ul class="space-y-2">';
			dailyImported.forEach(ev => {
				importedHtml += `<li class="flex justify-between items-center bg-purple-50 dark:bg-purple-900/20 p-2 rounded text-sm text-gray-700 dark:text-gray-300">${escapeHTML(ev.title)}</li>`;
			});
			importedHtml += '</ul></div>';
		}

		// แสดง Popup
		await Swal.fire({
			title: `รายละเอียด (${dateStr})`,
			html: `
				<div class="px-2">
					${txHtml}
					${notifyHtml}
					<hr class="my-4 border-gray-200">
					<div class="grid grid-cols-2 gap-3">
						<button id="cal-btn-add-tx" class="bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm flex items-center justify-center transition">
							<i class="fa-solid fa-plus-circle mr-2"></i> รายรับ-รายจ่าย
						</button>
						<button id="cal-btn-add-notif" class="bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg text-sm flex items-center justify-center transition">
							<i class="fa-solid fa-bell mr-2"></i> แจ้งเตือน
						</button>
					</div>
				</div>
			`,
			showConfirmButton: false,
			showCloseButton: true,
			didOpen: () => {
				// -- ปุ่มเพิ่มรายรับ-รายจ่าย --
				document.getElementById('cal-btn-add-tx').onclick = () => {
					Swal.close();
					// พยายามเปิดหน้าเพิ่มรายการ (กำหนดวันที่ให้ถ้ามี input id="date")
					const dateInput = document.getElementById('date'); // สมมติ ID ของ input วันที่
					if (dateInput) dateInput.value = dateStr;
					
					// เรียกฟังก์ชันเปิด Modal (ลองเรียกชื่อมาตรฐาน)
					const addModal = document.getElementById('add-modal');
					if (addModal) {
						addModal.classList.remove('hidden');
					} else {
						// ถ้าหาไม่เจอ ให้เลื่อนหน้าจอขึ้นบนสุด (กรณีเป็น Form หน้าหลัก)
						window.scrollTo({ top: 0, behavior: 'smooth' });
					}
				};

				// -- ปุ่มเพิ่มแจ้งเตือน (เรียกฟังก์ชันใหม่) --
				document.getElementById('cal-btn-add-notif').onclick = () => {
					Swal.close();
					openCalAddNotify(dateStr); // ไปเปิดหน้าต่างเพิ่มแจ้งเตือนแบบมีเวลา
				};
			}
		});
	}

	// ============================================
	// 3. ฟังก์ชันเปิดหน้าต่างเพิ่มแจ้งเตือน (แบบระบุเวลา)
	// ============================================
	async function openCalAddNotify(dateStr) {
		const { value: formValues } = await Swal.fire({
			title: `เพิ่มการแจ้งเตือน (${dateStr})`,
			html: `
				<div class="text-left">
					<label class="block text-sm font-bold text-gray-700 mb-1">ข้อความ:</label>
					<input id="swal-evt-msg" class="swal2-input" placeholder="พิมพ์ข้อความ..." style="margin: 0 0 15px 0; width: 100%;">
					
					<label class="block text-sm font-bold text-gray-700 mb-2">เวลาแจ้งเตือน:</label>
					<div class="bg-gray-50 p-3 rounded-lg border border-gray-200">
						<div class="flex flex-col gap-2 mb-2">
							<label class="inline-flex items-center cursor-pointer">
								<input type="radio" name="swal-time-type" value="allday" class="form-radio text-purple-600 w-4 h-4" checked 
									onchange="document.getElementById('swal-time-input-box').classList.add('hidden')">
								<span class="ml-2 text-sm text-gray-700">เตือนทั้งวัน (00:00)</span>
							</label>
							<label class="inline-flex items-center cursor-pointer">
								<input type="radio" name="swal-time-type" value="specific" class="form-radio text-purple-600 w-4 h-4"
										onchange="document.getElementById('swal-time-input-box').classList.remove('hidden')">
								<span class="ml-2 text-sm text-gray-700">ระบุเวลาเอง</span>
							</label>
						</div>
						<div id="swal-time-input-box" class="hidden mt-1 pl-6">
							<input type="time" id="swal-evt-time" class="p-2 border rounded text-gray-800 bg-white focus:ring-2 focus:ring-purple-500 w-full">
						</div>
					</div>
				</div>
			`,
			focusConfirm: false,
			showCancelButton: true,
			confirmButtonText: 'บันทึก',
			cancelButtonText: 'ยกเลิก',
			preConfirm: () => {
				const msg = document.getElementById('swal-evt-msg').value.trim();
				const typeEl = document.querySelector('input[name="swal-time-type"]:checked');
				const type = typeEl ? typeEl.value : 'allday';
				const time = document.getElementById('swal-evt-time').value;

				if (!msg) { Swal.showValidationMessage('กรุณากรอกข้อความ'); return false; }
				if (type === 'specific' && !time) { Swal.showValidationMessage('กรุณาระบุเวลา'); return false; }

				return { msg, isAllDay: (type === 'allday'), time: (type === 'allday') ? '00:00' : time };
			}
		});

		if (formValues) {
			const newNoti = {
				id: 'custom_' + Date.now(),
				message: formValues.msg,
				date: dateStr,
				advanceDays: 0,
				isAllDay: formValues.isAllDay,
				time: formValues.time
			};

			state.customNotifications.push(newNoti);
			await dbPut(STORE_CONFIG, { key: 'custom_notifications_list', value: state.customNotifications });
			
			// Refresh หน้าจอ
			renderCalendarView();
			if(typeof renderCustomNotifyList === 'function') renderCustomNotifyList();
			
			Swal.fire({ icon: 'success', title: 'บันทึกเรียบร้อย', timer: 1000, showConfirmButton: false });
		}
	}

	function showDailyDetails(date) {
        // 1. ดึงรายการธุรกรรมจริง (Actual Transactions)
        const txsOnDay = state.transactions.filter(tx => 
            tx.date.slice(0, 10) === date
        );
        txsOnDay.sort((a, b) => new Date(b.date) - new Date(a.date));

        // 2. คำนวณรายการประจำ (Recurring) ที่ตรงกับวันนี้
        const recurringOnDay = [];
        if (state.recurringRules && state.recurringRules.length > 0) {
            const targetDate = new Date(date);
            
            state.recurringRules.forEach(rule => {
                if (!rule.active) return;
                
                const ruleStartDate = new Date(rule.nextDueDate);
                // ถ้ารายการเริ่มหลังจากวันที่กดดู ก็ข้ามไป
                if (targetDate < ruleStartDate) return;

                let isMatch = false;
                
                // ตรวจสอบเงื่อนไขตามความถี่ (Frequency Logic)
                if (rule.frequency === 'daily') {
                    isMatch = true; 
                } else if (rule.frequency === 'weekly') {
                    // ตรงวันในสัปดาห์ (0-6)
                    isMatch = targetDate.getDay() === ruleStartDate.getDay();
                } else if (rule.frequency === 'monthly') {
                    // ตรงวันที่ (1-31)
                    isMatch = targetDate.getDate() === ruleStartDate.getDate();
                } else if (rule.frequency === 'yearly') {
                    // ตรงวันที่และเดือน
                    isMatch = targetDate.getDate() === ruleStartDate.getDate() && 
                              targetDate.getMonth() === ruleStartDate.getMonth();
                }

                if (isMatch) {
                    recurringOnDay.push(rule);
                }
            });
        }

        // --- สร้าง Header HTML (เพิ่มปุ่มแจ้งเตือนตรงนี้) ---
        let headerHtml = `
            <div class="flex justify-between items-center mb-4 w-full">
                <h3 class="text-xl font-bold text-gray-800">สรุปวันที่ ${new Date(date).toLocaleDateString('th-TH', {day: 'numeric', month: 'long', year: 'numeric'})}</h3>
            </div>
            
            <div class="flex gap-2 w-full mb-2">
                 <button id="cal-add-tx-btn" class="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-3 rounded-xl shadow-md transition duration-300 flex items-center justify-center gap-2 text-sm">
                    <i class="fa-solid fa-plus"></i> เพิ่มรายการ
                 </button>
                 
                 <button id="cal-add-notify-btn" class="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-3 rounded-xl shadow-md transition duration-300 flex items-center justify-center gap-2 text-sm">
                    <i class="fa-solid fa-bell"></i> แจ้งเตือน
                 </button>
            </div>
        `;

        let html = '<ul class="text-left space-y-3 mt-2 max-h-60 overflow-y-auto pr-2">';
        let totalIncome = 0;
        let totalExpense = 0;
        let totalTransfer = 0;
        
        // --- ส่วนแสดงรายการจริง ---
        if (txsOnDay.length === 0 && recurringOnDay.length === 0) {
             html += '<p class="text-center text-gray-500 mt-8 mb-8">ไม่มีรายการในวันนี้</p>';
        } else {
            // A. แสดงรายการที่บันทึกแล้ว
            txsOnDay.forEach(tx => {
                let txHtml = '';
                const receiptIconHtml = tx.receiptBase64 ? 
                    `<button type="button" class="view-receipt-btn text-purple-500 hover:text-purple-700 ml-2" data-base64="${tx.receiptBase64}">
                        <i class="fa-solid fa-receipt"></i>
                    </button>` : '';

                // ตรวจสอบว่าเป็นรายการล่วงหน้าหรือไม่
                const txDate = new Date(tx.date);
                const now = new Date();
                const isFuture = txDate > now; // ถ้ารายการ > เวลาปัจจุบัน คือรายการล่วงหน้า

                if (tx.type === 'income') {
                    totalIncome += tx.amount;
                    const account = state.accounts.find(a => a.id === tx.accountId);
                    
                    const nameText = isFuture ? `${escapeHTML(tx.name)} (รอรับ)` : escapeHTML(tx.name);
                    const nameColor = isFuture ? 'text-amber-700' : 'text-gray-800';
                    const amountColor = isFuture ? 'text-amber-600' : 'text-green-600';
                    const iconFuture = isFuture ? '<i class="fa-solid fa-clock mr-1 text-amber-500"></i>' : '';

                    txHtml = `
                        <div class="flex justify-between items-center ${isFuture ? 'opacity-90' : ''}">
                           <span class="font-medium ${nameColor}">${iconFuture}${nameText}${receiptIconHtml}</span>
                           <span class="font-bold ${amountColor} whitespace-nowrap ml-4">+${formatCurrency(tx.amount)}</span>
                        </div>
                        <div class="text-sm text-gray-500">${escapeHTML(tx.category)} (${escapeHTML(account ? account.name : 'N/A')})</div>
                    `;
                } else if (tx.type === 'expense') {
                    totalExpense += tx.amount;
                    const account = state.accounts.find(a => a.id === tx.accountId);

                    const nameText = isFuture ? `${escapeHTML(tx.name)} (รอจ่าย)` : escapeHTML(tx.name);
                    const nameColor = isFuture ? 'text-amber-700' : 'text-gray-800';
                    const amountColor = isFuture ? 'text-amber-600' : 'text-red-600';
                    const iconFuture = isFuture ? '<i class="fa-solid fa-clock mr-1 text-amber-500"></i>' : '';

                    txHtml = `
                        <div class="flex justify-between items-center ${isFuture ? 'opacity-90' : ''}">
                           <span class="font-medium ${nameColor}">${iconFuture}${nameText}${receiptIconHtml}</span>
                           <span class="font-bold ${amountColor} whitespace-nowrap ml-4">-${formatCurrency(tx.amount)}</span>
                        </div>
                        <div class="text-sm text-gray-500">${escapeHTML(tx.category)} (${escapeHTML(account ? account.name : 'N/A')})</div>
                    `;
                } else if (tx.type === 'transfer') {
                    totalTransfer += tx.amount;
                    const fromAccount = state.accounts.find(a => a.id === tx.accountId);
                    const toAccount = state.accounts.find(a => a.id === tx.toAccountId);
                    
                    const nameText = isFuture ? 'โอนย้าย (รอดำเนินการ)' : 'โอนย้าย';
                    const nameColor = isFuture ? 'text-amber-700' : 'text-blue-700';
                    const amountColor = isFuture ? 'text-amber-600' : 'text-blue-600';
                    const iconFuture = isFuture ? '<i class="fa-solid fa-clock mr-1 text-amber-500"></i>' : '';

                    txHtml = `
                        <div class="flex justify-between items-center ${isFuture ? 'opacity-90' : ''}">
                           <span class="font-medium ${nameColor}">${iconFuture}${nameText}${receiptIconHtml}</span>
                           <span class="font-bold ${amountColor} whitespace-nowrap ml-4">⇄${formatCurrency(tx.amount)}</span>
                        </div>
                        <div class="text-sm text-gray-500">
                            จาก: ${escapeHTML(fromAccount ? fromAccount.name : 'N/A')}<br>
                            ไป: ${escapeHTML(toAccount ? toAccount.name : 'N/A')}
                        </div>
                    `;
                }
                
                if (txHtml) {
                    const borderClass = isFuture ? 'border-dashed border-amber-300' : 'border-gray-200';
                    html += `<li class="border-b ${borderClass} pb-2">${txHtml}</li>`;
                }
            });

            // B. แสดงรายการ Recurring (รอจ่าย/รอรับ)
            if (recurringOnDay.length > 0) {
                if (txsOnDay.length > 0) {
                    html += `<li class="pt-2 text-xs font-bold text-gray-400 uppercase tracking-wider mt-2 border-t border-dashed border-gray-300">รายการประจำ (ประมาณการ)</li>`;
                }
                
                recurringOnDay.forEach(rule => {
                    let recHtml = '';
                    const amount = parseFloat(rule.amount);
                    const account = state.accounts.find(a => a.id === rule.accountId);
                    
                    if (rule.type === 'income') {
                        totalIncome += amount;
                        recHtml = `
                            <div class="flex justify-between items-center opacity-90">
                               <span class="font-medium text-amber-700 dark:text-amber-400"><i class="fa-solid fa-clock mr-1"></i>${escapeHTML(rule.name)} (รอรับ)</span>
                               <span class="font-bold text-amber-600 whitespace-nowrap ml-4">+${formatCurrency(amount)}</span>
                            </div>
                            <div class="text-sm text-gray-500 dark:text-gray-400 italic">${escapeHTML(rule.category)} (${escapeHTML(account ? account.name : 'N/A')})</div>
                        `;
                    } else if (rule.type === 'expense') {
                        totalExpense += amount;
                        recHtml = `
                            <div class="flex justify-between items-center opacity-90">
                               <span class="font-medium text-amber-700 dark:text-amber-400"><i class="fa-solid fa-clock mr-1"></i>${escapeHTML(rule.name)} (รอจ่าย)</span>
                               <span class="font-bold text-amber-600 whitespace-nowrap ml-4">-${formatCurrency(amount)}</span>
                            </div>
                            <div class="text-sm text-gray-500 dark:text-gray-400 italic">${escapeHTML(rule.category)} (${escapeHTML(account ? account.name : 'N/A')})</div>
                        `;
                    }

                    if (recHtml) {
                        html += `<li class="border-b border-gray-100 pb-2 mt-1 border-dashed border-amber-300 dark:border-amber-700">${recHtml}</li>`;
                    }
                });
            }
            
            html += '</ul>';
        }

        const netTotal = totalIncome - totalExpense;
        let netClass = 'text-gray-700';
        if (netTotal > 0) netClass = 'text-green-700';
        if (netTotal < 0) netClass = 'text-red-700';

        Swal.fire({
            title: '', 
            html: headerHtml + html, 
            footer: `
                <div class="grid grid-cols-4 gap-2 text-center text-lg">
                    <div>
                        <div class="text-sm font-semibold text-green-700">รายรับ</div>
                        <div class="font-bold text-green-600">${formatCurrency(totalIncome)}</div>
                    </div>
                    <div>
                        <div class="text-sm font-semibold text-red-700">รายจ่าย</div>
                        <div class="font-bold text-red-600">${formatCurrency(totalExpense)}</div>
                    </div>
                    <div>
                        <div class="text-sm font-semibold text-blue-700">โอนย้าย</div>
                        <div class="font-bold text-blue-600">${formatCurrency(totalTransfer)}</div>
                    </div>
                    <div>
                        <div class="text-sm font-semibold text-gray-800">คงเหลือ</div>
                        <div class="font-bold ${netClass}">${formatCurrency(netTotal)}</div>
                    </div>
                </div>
            `,
            width: 600,
            showConfirmButton: false, 
            showCloseButton: true,
            didOpen: () => {
                // Event ปุ่มเพิ่มรายการ (เดิม)
                const btnAdd = document.getElementById('cal-add-tx-btn');
                if(btnAdd) {
                    btnAdd.addEventListener('click', () => {
                        Swal.close(); 
                        openModal(null, null, date); 
                    });
                }
                
                // [ใหม่] Event ปุ่มเพิ่มการแจ้งเตือน
                // [ใน showDailyDetails] แก้ไข Event ปุ่มแจ้งเตือน
                const btnNotify = document.getElementById('cal-add-notify-btn');
                if(btnNotify) {
                    btnNotify.addEventListener('click', async () => {
                        Swal.close(); // ปิดหน้าต่างสรุปก่อน
                        
                        // เปิด Popup แบบ Form (มีช่องข้อความ และ ช่องจำนวนวัน)
                        const { value: formValues } = await Swal.fire({
                            title: 'สร้างการแจ้งเตือน',
                            html: `
                                <div class="text-left mb-1 text-sm font-semibold text-gray-600">ข้อความเตือน:</div>
                                <input id="swal-noti-text" class="swal2-input" placeholder="เช่น จ่ายค่าบัตรเครดิต" style="margin: 0 0 1.25em 0;">
                                
                                <div class="text-left mb-1 text-sm font-semibold text-gray-600">เตือนล่วงหน้า (วัน):</div>
                                <input id="swal-noti-days" type="number" class="swal2-input" value="0" min="0" placeholder="0 = เตือนวันนั้นเลย" style="margin: 0;">
                                <div class="text-xs text-gray-400 mt-1 text-left">* ใส่ 0 หากต้องการให้เตือนในวันที่ถึงกำหนด</div>
                            `,
                            showCancelButton: true,
                            confirmButtonText: 'บันทึก',
                            confirmButtonColor: '#f97316',
                            cancelButtonText: 'ยกเลิก',
                            focusConfirm: false,
                            preConfirm: () => {
                                return [
                                    document.getElementById('swal-noti-text').value,
                                    document.getElementById('swal-noti-days').value
                                ]
                            }
                        });

                        if (formValues) {
                            const [text, advanceDaysStr] = formValues;
                            if (!text) return; // ถ้าไม่ใส่ข้อความก็ไม่บันทึก

                            // เตรียมตัวแปร state
                            if (!state.customNotifications) state.customNotifications = [];
                            
                            const newNoti = {
                                id: 'custom_' + Date.now(),
                                message: text,
                                date: date,                // วันที่เป้าหมาย (จากปฏิทิน)
                                advanceDays: parseInt(advanceDaysStr) || 0, // วันที่เตือนล่วงหน้า
                                isRead: false
                            };
                            
                            state.customNotifications.push(newNoti);
                            
                            try {
                                // บันทึกลง DB
                                await dbPut(STORE_CONFIG, { key: 'custom_notifications_list', value: state.customNotifications });
                                
                                showToast('บันทึกการแจ้งเตือนเรียบร้อย', 'success');
                                
                                // [สำคัญ] อัปเดตรายการในหน้าตั้งค่าทันที
                                renderCustomNotificationsList(); 
                                
                            } catch (err) {
                                console.error('Save notification failed', err);
                                showToast('เกิดข้อผิดพลาดในการบันทึก', 'error');
                            }
                        }
                    });
                }
                
                // Event ปุ่มดูใบเสร็จ
                document.querySelectorAll('.view-receipt-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const base64 = e.currentTarget.dataset.base64;
                        if (base64) {
                            Swal.fire({
                                imageUrl: base64,
                                imageAlt: 'Receipt Image',
                                showCloseButton: true,
                                showConfirmButton: false,
                                customClass: {
                                    image: 'max-w-full max-h-[80vh] object-contain',
                                    popup: state.isDarkMode ? 'swal2-popup' : ''
                                }
                            });
                        }
                    });
                });
            }
        });
    }

	function renderAccountsPage() {
		// 1. Render Accounts List
		renderAccountSettingsList();

		// 2. Render Categories (Income)
		const incomeList = document.getElementById('list-income-cat');
		if (incomeList) {
			incomeList.innerHTML = '';
			if (state.categories.income.length > 0) {
				state.categories.income.forEach(cat => {
					const li = `
						<li class="flex justify-between items-center bg-gray-50 p-3 rounded-xl">
							<span class="text-lg text-gray-700">${escapeHTML(cat)}</span>
							<button class="delete-cat-btn text-red-500 hover:text-red-700 p-3" data-type="income" data-name="${escapeHTML(cat)}">
								<i class="fa-solid fa-trash-alt"></i>
							</button>
						</li>`;
					 incomeList.insertAdjacentHTML('beforeend', li);
				});
			} else {
				incomeList.innerHTML = '<li class="text-gray-500 text-center p-2">ไม่มีหมวดหมู่รายรับ</li>';
			}
		}

		// 3. Render Categories (Expense)
		const expenseList = document.getElementById('list-expense-cat');
		if (expenseList) {
			expenseList.innerHTML = '';
			if (state.categories.expense.length > 0) {
				state.categories.expense.forEach(cat => {
					const li = `
						<li class="flex justify-between items-center bg-gray-50 p-3 rounded-xl">
							<span class="text-lg text-gray-700">${escapeHTML(cat)}</span>
							<button class="delete-cat-btn text-red-500 hover:text-red-700 p-3" data-type="expense" data-name="${escapeHTML(cat)}">
								<i class="fa-solid fa-trash-alt"></i>
							</button>
						</li>`;
					 expenseList.insertAdjacentHTML('beforeend', li);
				});
			} else {
				expenseList.innerHTML = '<li class="text-gray-500 text-center p-2">ไม่มีหมวดหมู่รายจ่าย</li>';
			}
		}

		// 4. Render Frequent Items
		const frequentList = document.getElementById('list-frequent-item');
		const datalist = document.getElementById('frequent-items-datalist');
		if (frequentList && datalist) {
			frequentList.innerHTML = '';
			datalist.innerHTML = '';
			if (state.frequentItems.length > 0) {
				state.frequentItems.forEach(item => {
					const li = `
						<li class="flex justify-between items-center bg-gray-50 p-3 rounded-xl">
							 <span class="text-lg text-gray-700">${escapeHTML(item)}</span>
							<button class="delete-item-btn text-red-500 hover:text-red-700 p-3" data-name="${escapeHTML(item)}">
								<i class="fa-solid fa-trash-alt"></i>
							 </button>
						</li>`;
					frequentList.insertAdjacentHTML('beforeend', li);
					datalist.insertAdjacentHTML('beforeend', `<option value="${escapeHTML(item)}"></option>`);
				});
			} else {
				frequentList.innerHTML = '<li class="text-gray-500 text-center p-2">ไม่มีรายการที่ใช้บ่อย</li>';
			}

			// Auto Complete Datalist
			if (state.autoCompleteList && state.autoCompleteList.length > 0) {
				 state.autoCompleteList.forEach(item => {
					 if (!state.frequentItems.includes(item.name)) {
						 datalist.insertAdjacentHTML('beforeend', `<option value="${escapeHTML(item.name)}"></option>`);
					 }
				});
			}
		}
		
		// 5. Render Recurring & Budget
		if (typeof renderRecurringSettings === 'function') renderRecurringSettings();
		populateBudgetCategoryDropdown();
		if (typeof renderBudgetSettingsList === 'function') renderBudgetSettingsList();

		applySettingsPreferences();
	}

    // ============================================
    // ฟังก์ชัน: renderSettings (ฉบับแก้ไข ล่าสุด)
    // หน้าที่: จัดการหน้าตั้งค่าทั่วไป (General Settings)
    // ส่วนจัดการบัญชี/หมวดหมู่ ย้ายไปที่ renderAccountsPage แล้ว
    // ============================================
    async function renderSettings() {
        const getEl = (id) => document.getElementById(id);
        
        // 1. ตั้งค่า Slider ขนาดตัวอักษร
        const fontSlider = getEl('fontSizeSlider');
        if (fontSlider) {
            let savedIndex = localStorage.getItem('appFontIndex');
            if (savedIndex === null) savedIndex = 1;
            fontSlider.value = savedIndex;
            updateFontLabel(parseInt(savedIndex));
        }
        
        // 2. ตั้งค่า Toggle แสดงยอดเงินรวม
        const toggleBalanceBtn = getEl('toggle-show-balance');
        if (toggleBalanceBtn) {
            toggleBalanceBtn.checked = state.showBalanceCard;
        }

        // 3. ตั้งค่า Auto Lock
        const autoLockSelect = getEl('auto-lock-select');
        if (autoLockSelect) {
            autoLockSelect.value = state.autoLockTimeout.toString();
        }
        
        // 4. ตั้งค่า Dark Mode
        const toggleDarkModeBtn = getEl('toggle-dark-mode');
        if (toggleDarkModeBtn) {
            toggleDarkModeBtn.checked = state.isDarkMode;
        }
		
		// +++ 4.5 ตั้งค่า Toggle เสียงพูด +++
        const toggleVoiceBtn = getEl('toggle-smart-voice');
        if (toggleVoiceBtn) {
            toggleVoiceBtn.checked = state.isVoiceEnabled;
        }

        // 5. ตั้งค่า Auto Confirm Password
        const toggleAutoConfirmBtn = getEl('toggle-auto-confirm-password');
        if (toggleAutoConfirmBtn) {
            toggleAutoConfirmBtn.checked = state.autoConfirmPassword;
        }

        // 6. อัปเดตสถานะปุ่ม Biometric (สแกนนิ้ว/ใบหน้า)
        const bioBtn = document.getElementById('btn-biometric-settings');
		const bioStatus = document.getElementById('bio-status-text');
		if (bioBtn) {
			if (state.biometricId) {
				bioBtn.textContent = 'เลิกใช้';
				bioBtn.classList.remove('bg-gray-200', 'text-gray-600');
				bioBtn.classList.add('bg-red-100', 'text-red-600');
				bioStatus.textContent = 'สถานะ: เปิดใช้งานแล้ว (บนอุปกรณ์นี้)';
				bioStatus.classList.add('text-green-600');
			} else {
				bioBtn.textContent = 'ตั้งค่า';
				bioBtn.classList.add('bg-gray-200', 'text-gray-600');
				bioBtn.classList.remove('bg-red-100', 'text-red-600');
				bioStatus.textContent = 'ใช้ลายนิ้วมือหรือใบหน้าแทนรหัสผ่าน (เฉพาะเครื่องนี้)';
				bioStatus.classList.remove('text-green-600');
			}
		}
		
		// ตั้งค่ารูปแบบเมนูมือถือ
		const mobileMenuRadios = document.querySelectorAll('input[name="mobile-menu-style"]');
		if (mobileMenuRadios.length > 0) {
			// ตั้งค่า checked ตาม state
			mobileMenuRadios.forEach(radio => {
				if (radio.value === state.mobileMenuStyle) {
					radio.checked = true;
				}
				// เพิ่ม event listener
				radio.addEventListener('change', async (e) => {
					if (e.target.checked) {
						state.mobileMenuStyle = e.target.value;
						await dbPut(STORE_CONFIG, { key: 'mobileMenuStyle', value: state.mobileMenuStyle });
						if (typeof applyMobileMenuStyle === 'function') {
							applyMobileMenuStyle(); // ฟังก์ชันที่ต้องเขียนเพิ่ม
						}
					}
				});
			});
		}

		const clearAllBtn = document.getElementById('btn-clear-all-voice');
		if (clearAllBtn) {
			clearAllBtn.addEventListener('click', async () => {
				const confirm = await Swal.fire({
					title: 'ล้างคำสั่งทั้งหมด?',
					text: 'คุณต้องการลบคำสั่งที่เรียนรู้ทั้งหมดใช่หรือไม่? (ข้อมูลบน Cloud จะถูกลบด้วย)',
					icon: 'warning',
					showCancelButton: true,
					confirmButtonColor: '#d33',
					confirmButtonText: 'ลบทั้งหมด',
					cancelButtonText: 'ยกเลิก'
				});
				if (confirm.isConfirmed) {
					const allCommands = await dbGetAll(STORE_VOICE_COMMANDS);
					for (const cmd of allCommands) {
						await dbDelete(STORE_VOICE_COMMANDS, cmd.id); // ✅ ใช้ dbDelete เพื่อลบ Cloud
					}
					// ✅ Activity Log
					addActivityLog(
						'🧹 ล้างคำสั่งเสียงทั้งหมด',
						`ลบ ${allCommands.length} รายการ`,
						'fa-broom',
						'text-orange-600'
					);
					renderVoiceCommandsList();
					showToast('ล้างคำสั่งทั้งหมดแล้ว', 'success');
				}
			});
		}
		
		// --- LINE Notify Actions ---
		const notifyAdd = document.getElementById('notify-on-add');
		const notifyEdit = document.getElementById('notify-on-edit');
		const notifyDelete = document.getElementById('notify-on-delete');

		if (notifyAdd && notifyEdit && notifyDelete) {
			// set checked ตาม state
			notifyAdd.checked = state.lineNotifyActions.add;
			notifyEdit.checked = state.lineNotifyActions.edit;
			notifyDelete.checked = state.lineNotifyActions.delete;

			// ฟังก์ชันบันทึกเมื่อเปลี่ยน
			const saveNotifyActions = async () => {
				const newActions = {
					add: notifyAdd.checked,
					edit: notifyEdit.checked,
					delete: notifyDelete.checked
				};
				state.lineNotifyActions = newActions;
				await dbPut(STORE_CONFIG, { key: 'lineNotifyActions', value: newActions });
				showToast('บันทึกการตั้งค่า LINE แล้ว', 'success');
			};

			notifyAdd.addEventListener('change', saveNotifyActions);
			notifyEdit.addEventListener('change', saveNotifyActions);
			notifyDelete.addEventListener('change', saveNotifyActions);
		}
			
		// 7. Line โหลดรายชื่อ ID จาก DB (เวอร์ชันใหม่: มีชื่อเล่น + รหัสผ่าน)
		const idListContainer = getEl('line-id-list');
		const inputId = getEl('input-line-user-id');
		const inputName = getEl('input-line-nickname');
		const btnAdd = getEl('btn-add-line-id'); // ตรงกับ ID ใน HTML

		if (idListContainer && btnAdd) {
			let savedIds = [];
			try {
				const res = await dbGet(STORE_CONFIG, 'lineUserIds_List');
				if (res && Array.isArray(res.value)) {
					// Migration: ถ้าข้อมูลเก่าเป็น String ล้วน ให้แปลงเป็น Object
					savedIds = res.value.map(item => {
						if (typeof item === 'string') return { id: item, name: 'ไม่ระบุชื่อ' };
						return item;
					});
				}
			} catch(e) {
				console.warn("Error loading lineUserIds_List", e);
			}

			// ฟังก์ชันวาดรายการ (เหมือนเดิม)
			const renderList = () => {
				idListContainer.innerHTML = '';
				if (savedIds.length === 0) {
					idListContainer.innerHTML = '<div class="text-sm text-gray-400 text-center py-2">ยังไม่มีผู้รับแจ้งเตือน</div>';
					return;
				}
				
				savedIds.forEach((item, index) => {
					const div = document.createElement('div');
					div.className = 'flex justify-between items-center bg-gray-50 p-2 rounded border border-gray-200 text-sm';
					
					// แสดงผลแบบ: ชื่อเล่น (ID ย่อ)
					const shortId = item.id.length > 10 ? '...' + item.id.substring(item.id.length - 6) : item.id;
					
					div.innerHTML = `
						<div class="flex flex-col">
							<span class="font-bold text-gray-700 text-xs">${item.name || 'ไม่ระบุชื่อ'}</span>
							<span class="text-gray-500 font-mono text-[10px]">${item.id}</span>
						</div>
						<button class="text-red-500 hover:text-red-700 delete-id-btn p-2" data-index="${index}">
							<i class="fa-solid fa-trash"></i>
						</button>
					`;
					idListContainer.appendChild(div);
				});

				// ผูกปุ่มลบ (เพิ่ม Password Prompt)
				document.querySelectorAll('.delete-id-btn').forEach(btn => {
					btn.addEventListener('click', async (e) => {
						const idx = e.currentTarget.dataset.index;
						const targetName = savedIds[idx].name;

						const hasAuth = await promptForPassword(`ยืนยันลบ: ${targetName}`);
						if (!hasAuth) return;

						savedIds.splice(idx, 1);
						await dbPut(STORE_CONFIG, { key: 'lineUserIds_List', value: savedIds });

						// ✅ ADD ACTIVITY LOG
						addActivityLog(
							'🗑️ ลบ LINE User',
							targetName,
							'fa-line',
							'text-red-600'
						);

						renderList();
						Swal.fire('ลบสำเร็จ', '', 'success');
					});
				});
			};

			renderList();

			// ฟังก์ชันปุ่มเพิ่ม (เพิ่ม Password Prompt)
			btnAdd.addEventListener('click', async () => {
				const valId = inputId.value.trim();
				const valName = inputName.value.trim();

				if (!valId.startsWith('U') || valId.length < 30) {
					Swal.fire('ID ไม่ถูกต้อง', 'User ID ต้องขึ้นต้นด้วย U และยาว 33 ตัวอักษร', 'warning');
					return;
				}
				if (!valName) {
					Swal.fire('ระบุชื่อ', 'กรุณาใส่ชื่อเล่นให้ไอดีนี้ด้วยครับ', 'warning');
					return;
				}
				if (savedIds.some(i => i.id === valId)) {
					Swal.fire('ซ้ำ', 'ID นี้มีอยู่แล้ว', 'warning');
					return;
				}

				const hasAuth = await promptForPassword('ยืนยันรหัสผ่านเพื่อเพิ่มผู้รับแจ้งเตือน');
				if (!hasAuth) return;

				savedIds.push({ id: valId, name: valName });
				await dbPut(STORE_CONFIG, { key: 'lineUserIds_List', value: savedIds });

				// ✅ ADD ACTIVITY LOG
				addActivityLog(
					'📢 เพิ่ม LINE User',
					`${valName} (${valId.substring(0, 6)}...)`,
					'fa-line',
					'text-green-500'
				);

				inputId.value = '';
				inputName.value = '';
				renderList();

				const GAS_URL = window.LINE_CONFIG ? window.LINE_CONFIG.NOTIFY_GAS_URL : '';
				if (GAS_URL) {
					fetch(GAS_URL, {
						method: 'POST',
						mode: 'no-cors',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ userIds: [valId], message: `🎉 สวัสดีคุณ ${valName}!\nคุณถูกเพิ่มเข้าสู่ระบบแจ้งเตือน FMPro แล้ว ✅` })
					});
				}

				Swal.fire('สำเร็จ', `เพิ่มคุณ ${valName} เรียบร้อยแล้ว`, 'success');
			});
		}
		
		const voiceContent = document.getElementById('settings-voice-commands-content');
		if (voiceContent && !voiceContent.classList.contains('hidden')) {
			renderVoiceCommandsList();
		}
        
        // หมายเหตุ: รายการบัญชี, หมวดหมู่, และรายการประจำ 
        // ถูกย้ายไปจัดการในฟังก์ชัน renderAccountsPage() แล้ว
        
        applySettingsPreferences();
    }
	
	async function renderVoiceCommandsList() {
		const listContainer = document.getElementById('voice-commands-list');
		if (!listContainer) return;

		try {
			const commands = await dbGetAll(STORE_VOICE_COMMANDS);
			if (!commands || commands.length === 0) {
				listContainer.innerHTML = '<p class="text-gray-400 text-center py-4 border-2 border-dashed border-gray-200 rounded-xl">ยังไม่มีคำสั่งที่เรียนรู้</p>';
				return;
			}

			commands.sort((a, b) => (b.useCount || 0) - (a.useCount || 0));

			let html = '';
			commands.forEach(cmd => {
				let actionText = '';
				let details = '';
				let parts;   // ✅ ประกาศไว้ที่นี้

				// ป้องกันกรณี cmd ไม่มี property ที่จำเป็น
				if (!cmd.action) {
					console.warn('คำสั่งเสียหาย:', cmd);
					return; // ข้ามรายการนี้
				}

				switch (cmd.action) {
					case 'openPage':
						actionText = 'เปิดหน้า';
						if (cmd.page) details = `หน้า: ${cmd.page}`;
						break;
					case 'openSettingsSection':
						actionText = 'เปิดส่วนตั้งค่า';
						if (cmd.section) details = `ส่วน: ${cmd.section}`;
						break;
					case 'toggleDarkMode':
						actionText = 'สลับโหมดมืด';
						break;
					case 'toggleBalanceVisibility':
						actionText = 'แสดง/ซ่อนยอด';
						break;
					case 'backupData':
						actionText = 'สำรองข้อมูล';
						break;
					case 'changePassword':
						actionText = 'เปลี่ยนรหัสผ่าน';
						break;
					case 'addTransaction':
						actionText = 'เพิ่มรายการ';
						parts = [];
						if (cmd.defaultName) parts.push(`ชื่อ: ${escapeHTML(cmd.defaultName)}`);
						if (cmd.defaultCategory) parts.push(`หมวด: ${escapeHTML(cmd.defaultCategory)}`);
						if (cmd.defaultAmount) parts.push(`จำนวน: ${cmd.defaultAmount} บาท`);
						if (cmd.defaultDesc) parts.push(`บันทึก: ${escapeHTML(cmd.defaultDesc)}`);
						if (parts.length > 0) details = parts.join(' • ');
						break;
					case 'quickDraft':
						actionText = 'จดด่วน';
						parts = [];
						if (cmd.defaultAmount) parts.push(`จำนวน: ${cmd.defaultAmount} บาท`);
						if (cmd.defaultDesc) parts.push(`โน้ต: ${escapeHTML(cmd.defaultDesc)}`);
						if (parts.length > 0) details = parts.join(' • ');
						break;
					case 'search':
						actionText = 'ค้นหา';
						if (cmd.defaultKeyword) details = `คำค้น: ${escapeHTML(cmd.defaultKeyword)}`;
						break;
					case 'filterByType':
						actionText = 'กรองประเภท';
						if (cmd.filterType) details = `ประเภท: ${cmd.filterType === 'income' ? 'รายรับ' : 'รายจ่าย'}`;
						break;
					case 'applyTimeFilter':
						actionText = 'กรองเวลา';
						const periodMap = { 'today': 'วันนี้', 'this_week': 'สัปดาห์นี้', 'this_month': 'เดือนนี้', 'this_year': 'ปีนี้' };
						if (cmd.period) details = `ช่วง: ${periodMap[cmd.period] || cmd.period}`;
						break;
					default:
						actionText = cmd.action || 'ไม่ทราบ';
				}

				html += `
					<div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600 hover:shadow-sm transition">
						<div class="flex-1">
							<div class="font-medium text-gray-800 dark:text-gray-200">"${escapeHTML(cmd.command || '')}"</div>
							<div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
								<span class="bg-purple-100 dark:bg-purple-900/30 px-2 py-0.5 rounded text-purple-700 dark:text-purple-300">${actionText}</span>
								${details ? `<span class="ml-2">${details}</span>` : ''}
								• ใช้แล้ว ${cmd.useCount || 0} ครั้ง
							</div>
						</div>
						<div class="flex gap-1">
							<button class="edit-voice-command text-blue-500 hover:text-blue-700 p-2" data-id="${cmd.id}" title="แก้ไข">
								<i class="fa-solid fa-pen"></i>
							</button>
							<button class="delete-voice-command text-red-500 hover:text-red-700 p-2" data-id="${cmd.id}" title="ลบ">
								<i class="fa-solid fa-trash"></i>
							</button>
						</div>
					</div>
				`;
			});

			listContainer.innerHTML = html;

			// ผูก event สำหรับปุ่มลบ (เหมือนเดิม)
			document.querySelectorAll('.delete-voice-command').forEach(btn => {
				btn.addEventListener('click', async (e) => {
					const id = e.currentTarget.dataset.id;
					const confirm = await Swal.fire({
						title: 'ลบคำสั่ง?',
						text: 'คุณต้องการลบคำสั่งนี้ออกจากรายการที่เรียนรู้หรือไม่?',
						icon: 'warning',
						showCancelButton: true,
						confirmButtonColor: '#ef4444',
						confirmButtonText: 'ลบ',
						cancelButtonText: 'ยกเลิก'
					});
					if (confirm.isConfirmed) {
						await dbDelete(STORE_VOICE_COMMANDS, id);
						addActivityLog(
							'🗑️ ลบคำสั่งเสียง',
							`"${cmd.command}"`,
							'fa-trash',
							'text-red-600'
						);
						renderVoiceCommandsList();
						showToast('ลบคำสั่งแล้ว', 'success');
					}
				});
			});

			// ผูก event สำหรับปุ่มแก้ไข
			document.querySelectorAll('.edit-voice-command').forEach(btn => {
				btn.addEventListener('click', () => {
					openVoiceCommandModal(btn.dataset.id);
				});
			});

		} catch (err) {
			console.error('Error loading voice commands:', err);
			listContainer.innerHTML = '<p class="text-red-400 text-center py-4">เกิดข้อผิดพลาดในการโหลดข้อมูล</p>';
		}
	}
    
    function renderAccountSettingsList() {
        const listEl = document.getElementById('list-accounts');
        listEl.innerHTML = '';
        
        const allBalances = getAccountBalances(state.transactions);
        const sortedAccounts = getSortedAccounts();
        if (sortedAccounts.length === 0) {
            listEl.innerHTML = '<li class="text-gray-500 text-center p-2">ไม่มีบัญชี</li>';
            return;
        }
        
        sortedAccounts.forEach((acc, index) => { 
            const balance = allBalances[acc.id] || 0;
            let balanceClass = 'balance-zero';
            if (balance > 0) balanceClass = 'balance-positive';
            if (balance < 0) balanceClass = 'balance-negative';
            
            const currentIcon = acc.iconName || acc.icon || 'fa-wallet';
            
            const isFirst = (index === 0);
            const isLast = (index === sortedAccounts.length - 1);
            
            // [แก้ไข] ตรวจสอบค่า isVisible (ถ้าไม่มีให้ถือว่าเปิดอยู่)
            const isVisible = acc.isVisible !== false;

            const li = `
                <li class="flex justify-between items-center bg-gray-50 p-3 rounded-xl">
                    <div class="flex items-center gap-3">
                        <i class="fa-solid ${currentIcon} text-purple-600 text-xl"></i>
                        <div>
                            <span class="text-lg text-gray-700 font-medium">${escapeHTML(acc.name)}</span>
                            <span class="block text-sm text-gray-500 ${balanceClass} font-bold">ยอดปัจจุบัน: ${formatCurrency(balance)}</span>
                        </div>
                    </div>
                    <div class="flex-shrink-0 flex items-center gap-1">
                        <div class="mr-2 flex flex-col items-center justify-center">
                            <label class="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" class="sr-only peer" ${isVisible ? 'checked' : ''} onchange="toggleAccountVisibility('${acc.id}', this.checked)">
                                <div class="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                            </label>
                            <span class="text-[10px] text-gray-400 mt-1">${isVisible ? 'แสดง' : 'ซ่อน'}</span>
                        </div>

                        <button class="edit-icon-btn text-purple-500 hover:text-purple-700 p-2" data-id="${acc.id}">
                            <i class="fa-solid fa-paintbrush"></i>
                        </button>
                        <button 
                            class="move-account-btn text-gray-500 hover:text-purple-600 p-2 ${isFirst ? 'opacity-20 cursor-not-allowed' : ''}" 
                            data-id="${acc.id}" data-direction="up" ${isFirst ? 'disabled' : ''}>
                            <i class="fa-solid fa-arrow-up"></i>
                        </button>
                        <button 
                            class="move-account-btn text-gray-500 hover:text-purple-600 p-2 ${isLast ? 'opacity-20 cursor-not-allowed' : ''}" 
                            data-id="${acc.id}" data-direction="down" ${isLast ? 'disabled' : ''}>
                            <i class="fa-solid fa-arrow-down"></i>
                        </button>
                        
                        <button class="edit-account-btn text-blue-500 hover:text-blue-700 p-2" data-id="${acc.id}">
                            <i class="fa-solid fa-pencil"></i>
                        </button>
                        <button class="delete-account-btn text-red-500 hover:text-red-700 p-2" data-id="${acc.id}">
                            <i class="fa-solid fa-trash-alt"></i>
                        </button>
                    </div>
                </li>
            `;
            listEl.insertAdjacentHTML('beforeend', li);
        });
    }
	
	// =======================================================
    // 1.7 [วางโค้ดตรงนี้ครับ] ฟังก์ชันแสดงรายการ Recurring
    // =======================================================

    function renderRecurringSettings() {
        const listEl = document.getElementById('list-recurring-rules');
        if (!listEl) return;
        listEl.innerHTML = '';

        const rules = state.recurringRules || [];

        if (rules.length === 0) {
            listEl.innerHTML = '<li class="text-gray-500 text-center p-2">ไม่มีรายการประจำ</li>';
            return;
        }

        rules.forEach(rule => {
            const freqMap = { 'daily': 'ทุกวัน', 'weekly': 'ทุกสัปดาห์', 'monthly': 'ทุกเดือน', 'yearly': 'ทุกปี' };
            const typeClass = rule.type === 'income' ? 'text-green-600' : 'text-red-600';
            const amount = parseFloat(rule.amount); 
            
            // [แก้ไข] ตรงปุ่ม edit-rec-btn เปลี่ยน onclick เป็น editRecurringRuleWithAuth
            const li = `
                <li class="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-200">
                    <div>
                        <div class="font-bold text-gray-800">${escapeHTML(rule.name)}</div>
                        <div class="text-sm text-gray-500">
                            <span class="${typeClass}">${formatCurrency(amount)}</span> | 
                            ${freqMap[rule.frequency]} | ครั้งถัดไป: ${new Date(rule.nextDueDate).toLocaleDateString('th-TH')}
                        </div>
                    </div>
                    <div class="flex gap-2">
                         <button class="edit-rec-btn text-blue-500 hover:text-blue-700 p-2" onclick="editRecurringRuleWithAuth('${rule.id}')">
                            <i class="fa-solid fa-pencil"></i>
                        </button>
                        <button class="delete-rec-btn text-red-500 hover:text-red-700 p-2" onclick="deleteRecurringRule('${rule.id}')">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </li>
            `;
            listEl.insertAdjacentHTML('beforeend', li);
        });
    }
	
	// [เพิ่มใหม่] ฟังก์ชันสำหรับเช็ครหัสผ่านก่อนแก้ไข Recurring
    window.editRecurringRuleWithAuth = async (id) => {
        const hasPermission = await promptForPassword('ป้อนรหัสผ่านเพื่อแก้ไขรายการประจำ');
        if (hasPermission) {
            window.openRecurringModal(id);
        }
    };

    // [แก้ไข] เพิ่มการเช็ครหัสผ่านก่อนลบ Recurring
    window.deleteRecurringRule = async (id) => {
		const hasPermission = await promptForPassword('ป้อนรหัสผ่านเพื่อลบรายการประจำ');
		if (!hasPermission) return;

		const rule = state.recurringRules.find(r => r.id === id);
		const result = await Swal.fire({
			title: 'ลบรายการประจำ?',
			text: "รายการนี้จะไม่ถูกสร้างอัตโนมัติอีกต่อไป",
			icon: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#d33',
			confirmButtonText: 'ลบเลย',
			cancelButtonText: 'ยกเลิก'
		});

		if (result.isConfirmed) {
			try {
				await dbDelete(STORE_RECURRING, id);
				state.recurringRules = state.recurringRules.filter(r => r.id !== id);

				// ✅ ADD ACTIVITY LOG
				addActivityLog(
					'🗑️ ลบรายการประจำ',
					rule.name,
					'fa-clock-rotate-left',
					'text-red-600'
				);

				renderRecurringSettings();
				Swal.fire('ลบแล้ว', '', 'success');
			} catch (err) {
				console.error(err);
				Swal.fire('Error', 'ลบไม่สำเร็จ', 'error');
			}
		}
	};

    
    function renderPaginationControls(source, totalPages, currentPage) {
        const controlsEl = document.getElementById(source === 'home' ? 'home-pagination-controls' : 'list-pagination-controls');
        controlsEl.innerHTML = '';

        if (totalPages <= 1) {
            return;
        }

        let html = '';
        const prevDisabled = currentPage === 1;
        html += `<button class="px-4 py-2 rounded-lg font-medium border border-gray-300 shadow-sm ${prevDisabled ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-white hover:bg-purple-100 text-purple-600'}" 
                    data-page="${currentPage - 1}" ${prevDisabled ? 'disabled' : ''}>
                    <i class="fa-solid fa-chevron-left"></i>
                </button>`;
        html += `<span class="px-4 py-2 text-sm text-gray-700">
                    หน้า ${currentPage} / ${totalPages}
                </span>`;
        const nextDisabled = currentPage === totalPages;
        html += `<button class="px-4 py-2 rounded-lg font-medium border border-gray-300 shadow-sm ${nextDisabled ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-white hover:bg-purple-100 text-purple-600'}" 
                    data-page="${currentPage + 1}" ${nextDisabled ? 'disabled' : ''}>
                    <i class="fa-solid fa-chevron-right"></i>
                </button>`;
        controlsEl.innerHTML = html;
    }

    function toggleCalculator(e, inputId, popoverId, previewId, displayId) {
		e.stopPropagation(); // ป้องกัน Event Bubbling
		const popover = document.getElementById(popoverId);
		const input = document.getElementById(inputId);
		const previewEl = document.getElementById(previewId);
		const displayEl = document.getElementById(displayId);

		if (popover.classList.contains('hidden')) {
			// เปิดเครื่องคิดเลข
			popover.classList.remove('hidden');
			
			// ดึงค่าปัจจุบันมาแสดงทันที
			if (input && previewEl) {
				previewEl.textContent = input.value || '0';
			}
			if (displayEl) displayEl.textContent = ''; // ล้างผลลัพธ์เก่า
		} else {
			// ปิดเครื่องคิดเลข
			popover.classList.add('hidden');
		}
	}
	
	// ฟังก์ชันสำหรับเปิดเครื่องคิดเลขโดยตรง (global)
	window.openCalculator = function(inputId, popoverId, previewId, displayId) {
		const popover = document.getElementById(popoverId);
		const input = document.getElementById(inputId);
		if (popover && input) {
			popover.classList.remove('hidden');  // เปิด popover
			
			// อัปเดตค่าตัวอย่างใน preview
			const previewEl = document.getElementById(previewId);
			if (previewEl) previewEl.textContent = input.value || '0';
			
			// ล้าง display (ผลลัพธ์ก่อนหน้า)
			const displayEl = document.getElementById(displayId);
			if (displayEl) displayEl.textContent = '';
			
			// โฟกัสที่ input เพื่อให้พิมพ์ได้ทันที
			input.focus();
			
			console.log('เปิดเครื่องคิดเลข:', inputId, popoverId); // สำหรับ debug
		} else {
			console.error('ไม่พบ element:', inputId, popoverId);
		}
	};

	// --- เพิ่มฟังก์ชันนี้: สำหรับบีบอัดรูปภาพ ---
    function compressImage(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    // สร้าง Canvas
                    const elem = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    // คำนวณขนาดใหม่ (Maintain Aspect Ratio)
                    if (width > height) {
                        if (width > COMPRESS_MAX_WIDTH) {
                            height *= COMPRESS_MAX_WIDTH / width;
                            width = COMPRESS_MAX_WIDTH;
                        }
                    } else {
                        if (height > COMPRESS_MAX_WIDTH) {
                            width *= COMPRESS_MAX_WIDTH / height;
                            height = COMPRESS_MAX_WIDTH;
                        }
                    }

                    elem.width = width;
                    elem.height = height;

                    const ctx = elem.getContext('2d');
                    // วาดรูปลง Canvas ตามขนาดใหม่
                    ctx.drawImage(img, 0, 0, width, height);

                    // แปลงกลับเป็น Base64 แบบ JPEG พร้อมลด Quality
                    // ข้อมูล: toDataURL('image/jpeg', quality)
                    const data = elem.toDataURL('image/jpeg', COMPRESS_QUALITY);
                    resolve(data);
                };
                img.onerror = (error) => reject(error);
            };
            reader.onerror = (error) => reject(error);
        });
    }
	
	// [script.js] ฟังก์ชันแกะข้อมูล (V.6: รองรับสลิป KBank และปี พ.ศ. ย่อแบบสมบูรณ์)
	function extractSlipData(text) {
		console.log("Raw OCR Text:", text);

		// 1. ล้างข้อมูลพื้นฐาน
		// ลบตัวอักษรขยะ | หรือ l ที่มักโผล่มาหน้าวันที่ (เกิดจากเส้นขอบสลิป)
		let cleanText = text.replace(/,/g, '').replace(/^[|lI]\s*/gm, ''); 
		
		const lines = cleanText.split(/\r\n|\n|\r/).map(line => line.trim()).filter(line => line.length > 0);

		let result = {
			amount: null,
			receiver: null,
			memo: null,
			date: null
		};

		// --- ฐานข้อมูลเดือน (รวมคำผิด OCR ที่พบบ่อยใน KBank) ---
		const monthMap = {
			// ภาษาไทยปกติ
			'ม.ค.': '01', 'มค': '01', 'มกราคม': '01',
			'ก.พ.': '02', 'กพ': '02', 'กุมภาพันธ์': '02',
			'มี.ค.': '03', 'มีค': '03', 'มีนาคม': '03',
			'เม.ย.': '04', 'เมย': '04', 'เมษายน': '04',
			'พ.ค.': '05', 'พค': '05', 'พฤษภาคม': '05',
			'มิ.ย.': '06', 'มิย': '06', 'มิถุนายน': '06',
			'ก.ค.': '07', 'กค': '07', 'กรกฎาคม': '07',
			'ส.ค.': '08', 'สค': '08', 'สิงหาคม': '08',
			'ก.ย.': '09', 'กย': '09', 'กันยายน': '09',
			'ต.ค.': '10', 'ตค': '10', 'ตุลาคม': '10',
			'พ.ย.': '11', 'พย': '11', 'พฤศจิกายน': '11',
			'ธ.ค.': '12', 'ธค': '12', 'ธันวาคม': '12',
			// ภาษาอังกฤษ
			'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04', 'may': '05', 'jun': '06',
			'jul': '07', 'aug': '08', 'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12',
			// *** คำผิด OCR ยอดฮิต (KBank) ***
			'u.ค.': '01', 'u.a.': '01', 'H.A.': '01', // ม.ค. อ่านเป็น u.ค.
			'n.w.': '02', 'n.W.': '02', // ก.พ. อ่านเป็น n.w.
			'n.a.': '09', 'n.u.': '09', // ก.ย.
		};

		// ฟังก์ชันช่วยแปลงปี (รองรับทั้ง 2 หลักและ 4 หลัก)
		const normalizeYear = (yStr) => {
			let y = parseInt(yStr);
			if (y > 2400) return y - 543; // พ.ศ. เต็ม (2569 -> 2026)
			if (y > 2000) return y;       // ค.ศ. เต็ม (2026 -> 2026)
			// กรณีปี 2 หลัก
			if (y > 40) return (y + 2500) - 543; // เดาว่าเป็น พ.ศ. (69 -> 2569 -> 2026)
			return 2000 + y;                     // เดาว่าเป็น ค.ศ. (26 -> 2026)
		};

		// --- STEP 1: หา "วันที่และเวลา" (Date & Time) ---
		
		// สูตร KBank (แบบบรรทัดเดียว): "15 ม.ค. 69 00:21 น."
		// Regex จับ: (วัน) (เดือน) (ปี) (ชม):(นาที)
		const kbankRegex = /(\d{1,2})\s*([ก-๙a-zA-Z.]{2,10})\.?\s*(\d{2,4})\s+(\d{1,2})[:.](\d{2})/;

		for (const line of lines) {
			// 1.1 ลองสูตร KBank ก่อน (แม่นยำสุด)
			let match = line.match(kbankRegex);
			if (match) {
				let d = match[1].padStart(2, '0');
				let mStr = match[2].replace(/\./g, '') + (match[2].includes('.') ? '.' : ''); // คงจุดไว้ถ้ามี หรือลองแบบไม่มีจุด
				let yStr = match[3];
				let h = match[4].padStart(2, '0');
				let mn = match[5].padStart(2, '0');

				// หาเดือนใน Map
				let month = '01'; // Default
				// ลองหาแบบตรงๆ หรือแบบลบจุด
				let cleanMStr = mStr.replace(/\./g, '');
				// วนลูปหา key ที่แมตช์ (เผื่อกรณี u.ค. หรือ ม.ค.)
				let foundKey = Object.keys(monthMap).find(k => k.replace(/\./g, '') === cleanMStr || k === mStr);
				
				if (foundKey) {
					month = monthMap[foundKey];
					let year = normalizeYear(yStr);
					result.date = `${year}-${month}-${d}T${h}:${mn}`;
					console.log("KBank Date Found:", result.date);
					break; 
				}
			}
		}

		// 1.2 ถ้าสูตร KBank ไม่เจอ ให้ใช้สูตร "แยกหา" (V.5 เดิม)
		if (!result.date) {
			let foundDay, foundMonth, foundYear, foundHour, foundMinute;

			// หาเวลา
			for (const line of lines) {
				const timeRegex = /(?:เวลา|Time)?\s*([0-2]?\d)[:.;]([0-5]\d)(?!\d)/i; 
				const match = line.match(timeRegex);
				// ต้องไม่ใช่บรรทัดที่มีคำว่า "จำนวน" หรือ "Amount" (กันสับสนกับยอดเงิน)
				if (match && !/(?:จำนวน|Amount|Total|Baht|บาท)/i.test(line)) {
					foundHour = match[1].padStart(2, '0');
					foundMinute = match[2].padStart(2, '0');
					break;
				}
			}

			// หาวันที่
			for (const line of lines) {
				if (foundDay && foundMonth && foundYear) break;
				// วันที่แบบตัวอักษร (15 ม.ค. 69)
				const textDateRegex = /(\d{1,2})\s*([ก-๙a-zA-Z.]{2,10})\.?\s*(\d{2,4})/;
				let match = line.match(textDateRegex);
				if (match) {
					let d = match[1];
					let mStr = match[2].replace(/\./g, '');
					let y = match[3];
					let mKey = Object.keys(monthMap).find(k => k.replace(/\./g, '') === mStr);
					if (mKey) {
						foundDay = d.padStart(2, '0');
						foundMonth = monthMap[mKey];
						foundYear = y;
						break;
					}
				}
				// วันที่แบบตัวเลข (15/01/69)
				const numDateRegex = /(\d{1,2})\s*[\/\-]\s*(\d{1,2})\s*[\/\-]\s*(\d{2,4})/;
				match = line.match(numDateRegex);
				if (match) {
					foundDay = match[1].padStart(2, '0');
					foundMonth = match[2].padStart(2, '0');
					foundYear = match[3];
					break;
				}
			}

			if (foundDay && foundMonth && foundYear) {
				let year = normalizeYear(foundYear);
				let hh = foundHour || '00';
				let mm = foundMinute || '00';
				result.date = `${year}-${foundMonth}-${foundDay}T${hh}:${mm}`;
			}
		}

		// --- STEP 2: หาจำนวนเงิน (Amount) ---
		// (Logic เดิม V.5)
		if (!result.amount) {
			// วนลูปหาบรรทัดที่มี Keyword ชัดเจนก่อน
			for (const line of lines) {
				if (/(?:จำนวน|Amount|Total|ยอดเงิน|ยอดโอน|โอน)/i.test(line) && !/(?:คงเหลือ|Balance|Available)/i.test(line)) {
					let match = line.match(/(\d+\.\d{2})/);
					if (match) {
						result.amount = parseFloat(match[1]);
						break;
					} else {
						// ดูบรรทัดถัดไป (เผื่อตัวเลขหลุดลงมา)
						let idx = lines.indexOf(line);
						if (idx !== -1 && idx + 1 < lines.length) {
							let nextLine = lines[idx+1];
							let nextMatch = nextLine.match(/(\d+\.\d{2})/);
							if (nextMatch && !/(?:Fee|ค่าธรรมเนียม)/i.test(nextLine)) {
								result.amount = parseFloat(nextMatch[1]);
								break;
							}
						}
					}
				}
			}
			// Fallback: กวาดหาตัวเลขทศนิยมที่มากที่สุด
			if (!result.amount) {
				const candidates = [];
				for (const line of lines) {
					if (/(?:คงเหลือ|Balance|Fee|Date|วันที่|เวลา)/i.test(line)) continue;
					const matches = line.match(/([\d,]+\.\d{2})/g);
					if (matches) {
						matches.forEach(m => {
							let val = parseFloat(m.replace(/,/g, ''));
							if (val > 0) candidates.push(val);
						});
					}
				}
				if (candidates.length > 0) result.amount = Math.max(...candidates);
			}
		}

		// --- STEP 3: หาชื่อผู้รับ & Memo ---
		// (Logic เดิม V.5)
		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];
			
			// Receiver
			if (!result.receiver && /(?:ไปยัง|To|Account Name|ชื่อบัญชี|ผู้รับโอน|ปลายทาง)/i.test(line)) {
				let cleanLine = line.replace(/(?:ไปยัง|To|Account Name|ชื่อบัญชี|ผู้รับโอน|ปลายทาง|[:.]|นาย|นาง|น\.ส\.)/ig, '').trim();
				if (cleanLine.length > 1) result.receiver = cleanLine;
				else if (i + 1 < lines.length) {
					let nextLine = lines[i+1];
					if (!/(?:Bank|ธนาคาร|เลขที่|Account No|\d{3,})/i.test(nextLine)) result.receiver = nextLine;
				}
			}

			// Memo
			if (!result.memo && /(?:บันทึก|ช่วยจำ|Note|Memo|ข้อความ)/i.test(line)) {
				result.memo = line; 
				let checkEmpty = line.replace(/(?:บันทึกช่วยจำ|บันทึก|ช่วยจำ|Note|Memo|ข้อความ)/ig, '').trim();
				if (checkEmpty.length < 2 && i + 1 < lines.length) {
					result.memo = lines[i+1];
				}
			}
		}

		// --- STEP 4: Final Cleanup Memo ---
		if (result.memo) {
			let clean = result.memo;
			const keywordsToRemove = [
				'บันทึกช่วยจำ', 'บันทึกช่วยจ่าย', 'บันทึก', 'ช่วยจำ', 'ชวยจำ', 'ข่วยจำ', 'ความจำ',
				'ช่วงช้า', 'ช้วยจำ', 'บันทึกช่วย', 'ช่วย', 'จำ',
				'Note', 'Memo', 'Remark', 'Message', 'Ref.2', 'Ref2', 'ข้อความ', 'รายการ',
				'จํา', 'จํา:'  // เพิ่มตรงนี้
			];
			keywordsToRemove.forEach(kw => {
				const pattern = kw.split('').join('\\s*'); 
				const regex = new RegExp(pattern, 'gi'); 
				clean = clean.replace(regex, '');
			});
			clean = clean.replace(/^[\s:.\-_]+/, '');
			result.memo = clean.trim();
		}

		return result;
	}
	
    // [script.js] ฟังก์ชัน handleReceiptFileChange (เพิ่มส่วนเติมวันที่)
	async function handleReceiptFileChange(e) {
		const file = e.target.files[0];
		const getEl = (id) => document.getElementById(id);
		
		clearReceiptFile(true); 
		
		if (!file) return;
		if (!file.type.startsWith('image/')) {
			Swal.fire('ข้อผิดพลาด', 'กรุณาเลือกไฟล์รูปภาพเท่านั้น', 'error');
			e.target.value = null;
			return;
		}
		if (typeof MAX_FILE_SIZE_MB !== 'undefined' && file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
			Swal.fire('ขนาดใหญ่เกินไป', `ไฟล์ต้นฉบับต้องไม่เกิน ${MAX_FILE_SIZE_MB} MB`, 'error');
			e.target.value = null; 
			return;
		}

		try {
			let timerInterval;
			Swal.fire({
				title: 'กำลังสแกนสลิป...',
				html: 'ระบบกำลังอ่าน <b>วันที่, เวลา, ยอดเงิน</b><br>จากรูปภาพด้วย AI (OCR)',
				timerProgressBar: true,
				allowOutsideClick: false,
				didOpen: () => {
					Swal.showLoading();
				}
			});

			let ocrData = { amount: null, receiver: null, memo: null, date: null };
			try {
				const worker = await Tesseract.createWorker('tha+eng');
				const ret = await worker.recognize(file);
				ocrData = extractSlipData(ret.data.text);
				await worker.terminate();
			} catch (ocrErr) {
				console.error("OCR System Error:", ocrErr);
			}

			const compressedBase64 = await compressImage(file);
			
			currentReceiptBase64 = compressedBase64;
			getEl('receipt-preview').src = currentReceiptBase64;
			getEl('receipt-preview-container').classList.remove('hidden');
			getEl('clear-receipt-btn').classList.remove('hidden');
			
			let msgParts = ['แนบรูปภาพสำเร็จ'];
			let hasOcrData = false;
			
			// 1. เติมยอดเงิน
			if (ocrData.amount) {
				getEl('tx-amount').value = ocrData.amount;
				getEl('tx-amount').dispatchEvent(new Event('keyup'));
				msgParts.push(`💰 ยอดเงิน: <b>${ocrData.amount}</b>`);
				hasOcrData = true;
			}

			// 2. เติมวันที่และเวลา (NEW!)
			if (ocrData.date) {
				getEl('tx-date').value = ocrData.date;
				msgParts.push(`📅 วันที่: <b>${new Date(ocrData.date).toLocaleString('th-TH')}</b>`);
				hasOcrData = true;
			}

			// 3. เติมคำอธิบาย
			let newDescParts = [];
			if (ocrData.memo) newDescParts.push(ocrData.memo); 
			if (ocrData.receiver) newDescParts.push(`โอนให้: ${ocrData.receiver}`);

			if (newDescParts.length > 0) {
				const currentDesc = getEl('tx-desc').value;
				const newDescText = newDescParts.join(' | ');
				getEl('tx-desc').value = currentDesc ? `${currentDesc} (${newDescText})` : newDescText;
				msgParts.push(`📝 ข้อมูล: <b>${newDescText}</b>`);
				hasOcrData = true;
			}

			Swal.fire({
				icon: 'success',
				title: hasOcrData ? 'สแกนเรียบร้อย!' : 'อัปโหลดสำเร็จ',
				html: msgParts.join('<br>'),
				timer: 2500,
				showConfirmButton: false
			});

		} catch (error) {
			console.error("Error processing receipt file:", error);
			Swal.fire('ข้อผิดพลาด', 'ไม่สามารถประมวลผลไฟล์รูปภาพได้', 'error');
			e.target.value = null;
		}
	}

    function clearReceiptFile(onlyState = false) {
        const getEl = (id) => document.getElementById(id);
        currentReceiptBase64 = null;
        getEl('receipt-preview').src = '';
        getEl('receipt-preview-container').classList.add('hidden');
        getEl('clear-receipt-btn').classList.add('hidden');
        
        if (!onlyState) {
            getEl('tx-receipt-file').value = null; 
        }
    }

    function openModal(txId = null, defaultAccountId = null, defaultDate = null) {
        const form = document.getElementById('transaction-form');
        form.reset();
		const recCheck = document.getElementById('tx-is-recurring');
		const recOpt = document.getElementById('tx-recurring-options');
		if(recCheck) recCheck.checked = false;
		if(recOpt) recOpt.classList.add('hidden');
        document.getElementById('calc-preview').textContent = '';
        document.getElementById('calculator-popover').classList.add('hidden');
        document.getElementById('auto-fill-hint').classList.add('hidden'); 
        
        document.getElementById('account-calculator-popover').classList.add('hidden');
        document.getElementById('edit-account-calculator-popover').classList.add('hidden');
        
        clearReceiptFile(); 
        
        const getEl = (id) => document.getElementById(id);
        
        populateAccountDropdowns('tx-account');
        populateAccountDropdowns('tx-account-from', acc => acc.type === 'cash'); 
        populateAccountDropdowns('tx-account-to');

        const toggleFavBtn = getEl('toggle-favorite-btn'); 

        const setFavoriteState = (isFav) => { 
            toggleFavBtn.classList.toggle('text-yellow-500', isFav);
            toggleFavBtn.classList.toggle('text-gray-400', !isFav);
        };

        if (txId) {
            const tx = state.transactions.find(t => t.id === txId);
            if (!tx) return;
            
            getEl('modal-title').textContent = 'แก้ไขรายการ';
            getEl('tx-id').value = tx.id;
            document.querySelector(`input[name="tx-type"][value="${tx.type}"]`).checked = true;
            getEl('tx-amount').value = tx.amount;
            getEl('tx-date').value = tx.date.slice(0, 16);
            getEl('tx-desc').value = tx.desc;
            getEl('tx-name').value = tx.name; 
            
            if (tx.receiptBase64) {
                currentReceiptBase64 = tx.receiptBase64;
                getEl('receipt-preview').src = currentReceiptBase64;
                getEl('receipt-preview-container').classList.remove('hidden');
                getEl('clear-receipt-btn').classList.remove('hidden');
            }

            if(tx.type === 'transfer') {
                getEl('tx-account-from').value = tx.accountId;
                getEl('tx-account-to').value = tx.toAccountId;
            } else {
                updateCategoryDropdown(tx.type); 
                getEl('tx-category').value = tx.category; 
                getEl('tx-account').value = tx.accountId;
            }
            
            const isFav = state.frequentItems.includes(tx.name);
            setFavoriteState(isFav);
            
        } else {
            getEl('modal-title').textContent = 'เพิ่มรายการใหม่';
            getEl('tx-id').value = '';
            getEl('tx-name').value = ''; 
            document.getElementById('tx-type-expense').checked = true;
            updateCategoryDropdown('expense');
            
            setFavoriteState(false); 

            const now = new Date();
            
            if (defaultDate) {
                const hh = now.getHours().toString().padStart(2, '0');
                const min = now.getMinutes().toString().padStart(2, '0');
                getEl('tx-date').value = `${defaultDate}T${hh}:${min}`;
            } else {
                const yyyy = now.getFullYear();
                const mm = (now.getMonth() + 1).toString().padStart(2, '0');
                const dd = now.getDate().toString().padStart(2, '0');
                const hh = now.getHours().toString().padStart(2, '0');
                const min = now.getMinutes().toString().padStart(2, '0');
                getEl('tx-date').value = `${yyyy}-${mm}-${dd}T${hh}:${min}`;
            }

            getEl('tx-amount').value = '';
            
            if(defaultAccountId){
                 const acc = state.accounts.find(a => a.id === defaultAccountId);
                if(acc){
                     if(acc.type === 'credit' || acc.type === 'liability'){
                         document.getElementById('tx-type-expense').checked = true;
                        updateCategoryDropdown('expense');
                     }
                     getEl('tx-account').value = defaultAccountId;
                }
            }
        }
        
        updateFormVisibility();
		state.activeModalId = 'form-modal';  
        getEl('form-modal').classList.remove('hidden');
    }

    function closeModal() {
		state.activeModalId = null;
        document.getElementById('form-modal').classList.add('hidden');
        document.getElementById('transaction-form').reset();
        document.getElementById('calc-preview').textContent = ''; 
        document.getElementById('calculator-popover').classList.add('hidden');
        clearReceiptFile();
		// ล้างค่า Draft ID ทิ้งเมื่อปิดหน้าต่าง
		const hiddenDraftInput = document.getElementById('hidden-draft-id');
		if(hiddenDraftInput) hiddenDraftInput.value = '';
    }

    function openAccountModal(accountId = null, closeOnly = false) {
        const modal = document.getElementById('account-form-modal');
        if (closeOnly) {
            modal.classList.add('hidden');
            document.getElementById('edit-account-calculator-popover').classList.add('hidden');
            return;
        }
        
        document.getElementById('account-calculator-popover').classList.add('hidden');

        const form = document.getElementById('account-form');
        form.reset();
        const getEl = (id) => document.getElementById(id);
        
        const acc = state.accounts.find(a => a.id === accountId);
        if (!acc) {
            Swal.fire('ข้อผิดพลาด', 'ไม่พบบัญชีที่ต้องการแก้ไข', 'error');
            return;
        }
        
        getEl('account-modal-title').textContent = 'แก้ไขบัญชี';
        getEl('edit-account-id').value = acc.id;
        getEl('edit-account-name').value = acc.name;
        getEl('edit-account-type').value = acc.type;
        getEl('edit-account-balance').value = acc.initialBalance;
        getEl('edit-acc-calc-preview').textContent = ''; 
        getEl('edit-account-calculator-popover').classList.add('hidden');
		
		// [NEW] ส่วนที่เพิ่ม: ดึงยอดเงินปัจจุบันมาโชว์ และรีเซ็ตฟอร์มปรับปรุงยอด
        const currentBal = getAccountBalances(state.transactions)[acc.id] || 0;
        const balDisplay = document.getElementById('modal-current-balance-display');
        if (balDisplay) {
            balDisplay.innerText = formatCurrency(currentBal);
            // ถ้าเงินติดลบให้เป็นสีแดง
            balDisplay.className = `font-bold text-xl ${currentBal >= 0 ? 'text-blue-600' : 'text-red-600'}`;
        }
        
        // รีเซ็ตค่าในช่องกรอกให้ว่างเปล่า
        if (document.getElementById('adjust-tx-amount')) {
            document.getElementById('adjust-tx-amount').value = '';
            document.getElementById('adjust-tx-desc').value = '';
            document.getElementById('adjust-tx-type').value = 'income';
            
            // รีเซ็ตสีปุ่มให้กลับมาเป็นค่าเริ่มต้น (ปุ่มเพิ่มสีเขียว)
            const btnInc = document.getElementById('btn-adj-type-inc');
            const btnExp = document.getElementById('btn-adj-type-exp');
            
            if (btnInc && btnExp) {
                btnInc.className = 'flex-1 py-2 px-3 rounded-lg border bg-green-500 text-white border-green-600 shadow-sm transition-all text-sm font-bold';
                btnExp.className = 'flex-1 py-2 px-3 rounded-lg border bg-white text-gray-600 border-gray-300 shadow-sm transition-all text-sm hover:bg-gray-50';
            }
        }

        modal.classList.remove('hidden');
    }
    
    function closeIconModal() {
        document.getElementById('icon-form-modal').classList.add('hidden');
    }

    function renderIconChoices(filterText = '') {
        const container = document.getElementById('icon-list-container');
        container.innerHTML = '';
        const filteredIcons = ICON_CHOICES.filter(icon => icon.includes(filterText.toLowerCase()));

        if (filteredIcons.length === 0) {
            container.innerHTML = '<p class="col-span-6 sm:col-span-8 text-center text-gray-500 p-4">ไม่พบไอคอนที่ตรงกับคำค้นหา</p>';
            return;
        }

        filteredIcons.forEach(iconClass => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'icon-select-btn p-3 rounded-xl hover:bg-purple-100 transition duration-150';
            button.setAttribute('data-icon', iconClass);
            button.innerHTML = `<i class="fa-solid ${iconClass} text-2xl text-purple-600"></i>`;
            container.appendChild(button);
        });
    }

    async function openIconModal(accountId) {
        const modal = document.getElementById('icon-form-modal');
        const acc = state.accounts.find(a => a.id === accountId);
        if (!acc) return;

        const getEl = (id) => document.getElementById(id);
        const currentIcon = acc.iconName || acc.icon || 'fa-wallet';

        getEl('edit-icon-account-id').value = accountId;
        getEl('icon-acc-name').textContent = escapeHTML(acc.name);
        getEl('icon-preview').className = `fa-solid ${currentIcon} text-purple-600 text-2xl ml-2`;
        getEl('icon-preview').setAttribute('data-current-icon', currentIcon);
        getEl('icon-search').value = '';
        
        renderIconChoices();

        modal.classList.remove('hidden');
    }
    
    function closeAccountDetailModal() {
        document.getElementById('account-detail-modal').classList.add('hidden');
    }
    
    async function showAccountDetailModal(accountId) {
        const modal = document.getElementById('account-detail-modal');
        modal.classList.remove('hidden');
        document.getElementById('account-detail-modal-body').innerHTML = '<tr><td colspan="5" class="p-6 text-center text-gray-500"><i class="fa-solid fa-spinner fa-spin mr-2"></i> กำลังโหลดรายการ...</td></tr>';
        
        accountDetailState.accountId = accountId;
        accountDetailState.viewMode = state.homeViewMode; 
        accountDetailState.currentDate = state.homeCurrentDate; 
        updateAccountDetailControls();

        const btn = document.getElementById('add-tx-from-account-btn');
        if(btn) btn.dataset.accountId = accountId;

        await renderAccountDetailList(accountId);
    }
    
    // ********** MODIFIED: renderAccountDetailList (with Edit/Delete buttons) **********
    async function renderAccountDetailList(accountId) {
        const modalTitle = document.getElementById('account-detail-modal-title');
        const listBody = document.getElementById('account-detail-modal-body');
        const accDetailInitialBalance = document.getElementById('acc-detail-initial-balance');
        const accDetailCurrentBalance = document.getElementById('acc-detail-current-balance');
        
        const { viewMode, currentDate } = accountDetailState;
        let relevantTxs = state.transactions.filter(tx => {
             const isRelated = tx.accountId === accountId || tx.toAccountId === accountId;
             if (!isRelated) return false;
             if (viewMode === 'all') return true;
             const txDate = new Date(tx.date);
             const year = currentDate.slice(0, 4);
             if (viewMode === 'year') {
                 return txDate.getFullYear() == year;
             } else if (viewMode === 'month') {
                 const month = currentDate.slice(5, 7);
                 return txDate.getFullYear() == year && (txDate.getMonth() + 1).toString().padStart(2, '0') == month;
             }
             return true;
        });

        listBody.innerHTML = '<tr><td colspan="5" class="p-6 text-center text-gray-500"><i class="fa-solid fa-spinner fa-spin mr-2"></i> กำลังโหลดรายการ...</td></tr>';

        const account = state.accounts.find(a => a.id === accountId);
        if (!account) {
            listBody.innerHTML = '<tr><td colspan="5" class="p-6 text-center text-red-500">ไม่พบบัญชี</td></tr>';
            return;
        }
        
        modalTitle.textContent = `${escapeHTML(account.name)}`;
        accDetailInitialBalance.textContent = formatCurrency(account.initialBalance || 0);

        const allTxs = [...state.transactions].sort((a, b) => new Date(a.date) - new Date(b.date));
        let currentBalance = account.initialBalance || 0;
        const now = new Date(); 

        for (const tx of allTxs) {
            if (new Date(tx.date) > now) continue;

            if (tx.type === 'income' && tx.accountId === accountId) currentBalance += tx.amount;
            else if (tx.type === 'expense' && tx.accountId === accountId) currentBalance -= tx.amount;
            else if (tx.type === 'transfer') {
                if (tx.accountId === accountId) currentBalance -= tx.amount;
                else if (tx.toAccountId === accountId) currentBalance += tx.amount;
            }
        }

        accDetailCurrentBalance.textContent = formatCurrency(currentBalance);
        accDetailCurrentBalance.className = `font-bold ${currentBalance > 0 ? 'text-green-600' : (currentBalance < 0 ? 'text-red-600' : 'text-gray-600')}`;

        relevantTxs.sort((a, b) => new Date(a.date) - new Date(b.date));

        const txRows = [];
        let runningBalanceForPeriod = account.initialBalance || 0; 
        
        let startBalanceForPeriod = account.initialBalance || 0;
        
        if (viewMode !== 'all') {
            const transactionsBeforePeriod = allTxs.filter(tx => {
                const txDate = new Date(tx.date);
                if (viewMode === 'month') {
                     return txDate < new Date(currentDate); 
                } else if (viewMode === 'year') {
                     return txDate.getFullYear() < parseInt(currentDate.slice(0, 4));
                }
                return false; 
            });

            let balanceBeforePeriod = account.initialBalance || 0;
            for (const tx of transactionsBeforePeriod) {
                if (tx.type === 'income' && tx.accountId === accountId) balanceBeforePeriod += tx.amount;
                else if (tx.type === 'expense' && tx.accountId === accountId) balanceBeforePeriod -= tx.amount;
                else if (tx.type === 'transfer') {
                    if (tx.accountId === accountId) balanceBeforePeriod -= tx.amount;
                    else if (tx.toAccountId === accountId) balanceBeforePeriod += tx.amount;
                }
            }
            startBalanceForPeriod = balanceBeforePeriod;
        }

        runningBalanceForPeriod = startBalanceForPeriod;


        for (const tx of relevantTxs) {
            let txAmount = 0;
            let txAmountSign = '';
            let txAmountClass = 'text-gray-700';
            let isRelevant = false;

            if (tx.type === 'income' && tx.accountId === accountId) {
                txAmount = tx.amount;
                txAmountSign = '+';
                txAmountClass = 'text-green-600';
                runningBalanceForPeriod += txAmount; 
                isRelevant = true;
            } else if (tx.type === 'expense' && tx.accountId === accountId) {
                txAmount = tx.amount;
                txAmountSign = '-';
                txAmountClass = 'text-red-600';
                runningBalanceForPeriod -= txAmount;
                isRelevant = true;
            } else if (tx.type === 'transfer') {
                if (tx.accountId === accountId) {
                    txAmount = tx.amount;
                    txAmountSign = '-';
                    txAmountClass = 'text-blue-600';
                    runningBalanceForPeriod -= txAmount;
                    isRelevant = true;
                } else if (tx.toAccountId === accountId) {
                    txAmount = tx.amount;
                    txAmountSign = '+';
                    txAmountClass = 'text-blue-600';
                    runningBalanceForPeriod += txAmount;
                    isRelevant = true;
                }
            }

            if (isRelevant) {
                const dateObj = new Date(tx.date);
                const mobileDate = dateObj.toLocaleString('th-TH', { day: '2-digit', month: '2-digit' });
                const desktopDate = dateObj.toLocaleString('th-TH', { day: '2-digit', month: 'short', year: '2-digit', hour:'2-digit', minute:'2-digit' });
                const name = escapeHTML(tx.name);
                
                txRows.push({ 
                    id: tx.id, // ID needed for edit/delete buttons
                    mobileDate: mobileDate,
                    desktopDate: desktopDate,
                    name: name,
                    category: tx.type === 'transfer' ? 'โอน' : escapeHTML(tx.category),
                    amountSign: txAmountSign,
                    amount: formatCurrency(tx.amount).replace('฿', '').split('.')[0], 
                    amountClass: txAmountClass,
                    finalBalance: formatCurrency(runningBalanceForPeriod).replace('฿', '').split('.')[0],
                    receiptBase64: tx.receiptBase64,
					desc: tx.desc					
                });
            }
        }
        
        txRows.reverse(); 


        if (txRows.length === 0) {
            listBody.innerHTML = '<tr><td colspan="5" class="p-6 text-center text-gray-500 text-base">ไม่มีรายการเคลื่อนไหวในรอบที่เลือก</td></tr>';
            return;
        }

        listBody.innerHTML = txRows.map(row => {
            const balanceVal = parseFloat(row.finalBalance.replace(/,/g,""));
            const balanceClass = balanceVal >= 0 ? 'text-blue-700' : 'text-red-700';
            
            const receiptIconHtml = row.receiptBase64 ? 
                `<button type="button" class="view-receipt-icon text-purple-500 hover:text-purple-700 ml-2 z-10 relative" data-base64="${row.receiptBase64}" title="คลิกเพื่อดูรูป">
                    <i class="fa-solid fa-receipt"></i>
                </button>` : '';

            return `
				<tr class="border-b border-gray-100 hover:bg-gray-50">
					<td class="p-2 text-sm text-gray-500">${row.desktopDate}</td>
					<td class="p-2">
						<div class="font-medium text-gray-800">${row.name}${receiptIconHtml}</div>
						${row.desc ? `<div class="text-xs text-gray-400 mt-1 italic">${escapeHTML(row.desc)}</div>` : ''}
						<div class="text-xs text-gray-400 md:hidden">${row.category}</div>
					</td>
					<td class="p-2 text-sm text-gray-600 hidden md:table-cell">${row.category}</td>
					<td class="p-2 text-right ${row.amountClass} font-bold">${row.amountSign}${row.amount}</td>
					<td class="p-2 text-center">
						<div class="flex items-center justify-center gap-1">
							<button class="edit-btn text-blue-500 p-1" data-id="${row.id}"><i class="fa-solid fa-pencil text-xs"></i></button>
							<button class="delete-btn text-red-500 p-1" data-id="${row.id}"><i class="fa-solid fa-trash text-xs"></i></button>
						</div>
					</td>
				</tr>
			`;
        }).join('');
    }
    // *******************************************************
    
    function populateAccountDropdowns(selectId, filterFn = null) {
        const selectEl = document.getElementById(selectId);
        selectEl.innerHTML = '';
        
        let accountsToDisplay = getSortedAccounts(); 
        
        if (filterFn) {
            accountsToDisplay = accountsToDisplay.filter(filterFn);
        }

        if (accountsToDisplay.length === 0) {
            selectEl.innerHTML = '<option value="">-- ไม่มีบัญชี --</option>';
            return;
        }

        accountsToDisplay.forEach(acc => {
            const icon = acc.type === 'credit' ? '💳' : (acc.type === 'liability' ? '🧾' : '💵');
            selectEl.insertAdjacentHTML('beforeend', 
                `<option value="${acc.id}">${icon} ${escapeHTML(acc.name)}</option>`
            );
        });
    }

    function updateFormVisibility() {
        const getEl = (id) => document.getElementById(id);
        const type = document.querySelector('input[name="tx-type"]:checked').value;
        
        const accountContainer = getEl('tx-account-container');
        const fromContainer = getEl('tx-account-from-container');
        const toContainer = getEl('tx-account-to-container');
        const nameContainer = getEl('tx-name-container');
        const categoryContainer = getEl('tx-category-container');
        
        [accountContainer, fromContainer, toContainer, nameContainer, categoryContainer].forEach(el => el.classList.add('hidden'));
        
        getEl('tx-account').required = false;
        getEl('tx-account-from').required = false;
        getEl('tx-account-to').required = false;
        getEl('tx-name').required = false;
        getEl('tx-category').required = false;

        if (type === 'income' || type === 'expense') {
            accountContainer.classList.remove('hidden');
            nameContainer.classList.remove('hidden');
            categoryContainer.classList.remove('hidden');
            
            getEl('tx-account').required = true;
            getEl('tx-name').required = true;
            getEl('tx-category').required = true;
            
            updateCategoryDropdown(type);
        } else if (type === 'transfer') {
            fromContainer.classList.remove('hidden');
            toContainer.classList.remove('hidden');
            nameContainer.classList.remove('hidden'); 
            
            getEl('tx-name').required = true; 
            getEl('tx-account-from').required = true;
            getEl('tx-account-to').required = true;
        }
    }


    // แก้ไขฟังก์ชันนี้ให้รองรับการส่ง ID ของ Dropdown เป้าหมายเข้าไปได้
    function updateCategoryDropdown(type = null, targetId = 'tx-category') {
        const selectedType = type || document.querySelector('input[name="tx-type"]:checked').value;
        
        // ถ้าเป็นโหมดโอนย้าย ไม่ต้องทำอะไรกับ dropdown หมวดหมู่
        if (selectedType === 'transfer') return;
        
        const categories = state.categories[selectedType] || [];
        const dropdown = document.getElementById(targetId); // <--- ต้องใช้ targetId
        
        if (!dropdown) return; 

        dropdown.innerHTML = '';
        if (Array.isArray(categories) && categories.length > 0) {
            categories.forEach(cat => {
                dropdown.insertAdjacentHTML('beforeend', `<option value="${escapeHTML(cat)}">${escapeHTML(cat)}</option>`);
            });
        } else {
            dropdown.insertAdjacentHTML('beforeend', `<option value="">-- ไม่มีหมวดหมู่ --</option>`);
        }
    }

    async function handleFormSubmit(e) {
		e.preventDefault();
		document.getElementById('calculator-popover').classList.add('hidden');

		const getEl = (id) => document.getElementById(id);

		const rawAmount = getEl('tx-amount').value;
		let finalAmount = safeCalculate(rawAmount);
		if (finalAmount === null || finalAmount <= 0) {
			Swal.fire('ข้อมูลไม่ครบถ้วน', 'จำนวนเงินไม่ถูกต้อง (ต้องมากกว่า 0)', 'warning');
			return;
		}
		finalAmount = parseFloat(finalAmount.toFixed(2));
		const txId = getEl('tx-id').value;
		const type = document.querySelector('input[name="tx-type"]:checked').value;

		let transaction = {
			id: txId || `tx-${new Date().getTime()}`,
			type: type,
			amount: finalAmount,
			date: getEl('tx-date').value,
			desc: getEl('tx-desc').value.trim() || null,
			name: null,
			category: null,
			accountId: null,
			toAccountId: null,
			receiptBase64: currentReceiptBase64
		};

		transaction.name = getEl('tx-name').value.trim();

		if (type === 'income' || type === 'expense') {
			transaction.category = getEl('tx-category').value;
			transaction.accountId = getEl('tx-account').value;

			if (!transaction.name || !transaction.category || !transaction.accountId) {
				Swal.fire('ข้อมูลไม่ครบถ้วน', 'กรุณากรอกชื่อรายการ, หมวดหมู่, และบัญชี', 'warning');
				return;
			}

			// Auto-learn (frequency-based)
			try {
				const existingIndex = state.autoCompleteList.findIndex(item => item.name === transaction.name && item.type === transaction.type);
				if (existingIndex >= 0) {
					let item = state.autoCompleteList[existingIndex];
					if (!item.categories) {
						const oldCat = item.category || 'อื่นๆ';
						item = {
							id: item.id || `auto_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
							name: item.name,
							type: item.type,
							categories: { [oldCat]: item.count || 1 },
							totalUses: item.totalUses || 1,
							lastAmount: item.lastAmount || item.amount || transaction.amount,
							lastUsed: item.lastUsed || new Date().toISOString()
						};
					}
					const currentCat = transaction.category;
					item.categories[currentCat] = (item.categories[currentCat] || 0) + 1;
					item.totalUses = (item.totalUses || 0) + 1;
					item.lastAmount = transaction.amount;
					item.lastUsed = new Date().toISOString();
					await dbPut(STORE_AUTO_COMPLETE, item);
					state.autoCompleteList[existingIndex] = item;
				} else {
					const newItem = {
						id: `auto_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
						name: transaction.name,
						type: transaction.type,
						categories: { [transaction.category]: 1 },
						totalUses: 1,
						lastAmount: transaction.amount,
						lastUsed: new Date().toISOString()
					};
					await dbPut(STORE_AUTO_COMPLETE, newItem);
					state.autoCompleteList.push(newItem);
				}
			} catch (autoLearnErr) {
				console.error('❌ Auto-learn error:', autoLearnErr);
			}

		} else if (type === 'transfer') {
			if (!transaction.name) transaction.name = 'โอนย้าย';

			transaction.accountId = getEl('tx-account-from').value;
			transaction.toAccountId = getEl('tx-account-to').value;

			if (!transaction.accountId || !transaction.toAccountId) {
				Swal.fire('ข้อมูลไม่ครบถ้วน', 'กรุณาเลือกบัญชีต้นทางและปลายทาง', 'warning');
				return;
			}
			if (transaction.accountId === transaction.toAccountId) {
				Swal.fire('ข้อมูลผิดพลาด', 'บัญชีต้นทางและปลายทางต้องไม่ซ้ำกัน', 'warning');
				return;
			}
		}

		try {
			await dbPut(STORE_TRANSACTIONS, transaction);

			// ✅ ADD ACTIVITY LOG
				const typeLabel = transaction.type === 'income' ? 'รายรับ' : (transaction.type === 'expense' ? 'รายจ่าย' : 'โอนย้าย');
				
				// [แก้ไขใหม่] ตรวจสอบว่าเป็นรายการล่วงหน้าไหม และจัดรูปแบบวันที่
				const txDateObj = new Date(transaction.date);
				const isFuture = txDateObj > new Date();
				const formattedTxDate = txDateObj.toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: '2-digit' });
				const dateInfoText = isFuture ? ` | 📅 วันที่ล่วงหน้า: ${formattedTxDate}` : ` | 📅 วันที่: ${formattedTxDate}`;

				if (txId) {
					const oldTx = state.transactions.find(t => t.id === txId);
					const actionTitle = isFuture ? '📝 แก้ไขรายการล่วงหน้า' : '✏️ แก้ไขรายการ';
					addActivityLog(
						actionTitle,
						`${oldTx.name} → ${transaction.name} (${formatCurrency(transaction.amount)} ${typeLabel})${dateInfoText}`,
						'fa-pencil',
						'text-blue-600'
					);
				} else {
					const actionTitle = isFuture ? '📅 เพิ่มรายการล่วงหน้า' : '➕ เพิ่มรายการ';
					addActivityLog(
						actionTitle,
						`${transaction.name} ${formatCurrency(transaction.amount)} (${typeLabel})${transaction.desc ? ' – ' + transaction.desc : ''}${dateInfoText}`,
						isFuture ? 'fa-clock' : 'fa-plus-circle',
						isFuture ? 'text-yellow-600' : 'text-green-600',
						{ hasReceipt: !!transaction.receiptBase64 } 
					);
				}

			// เช็ค draft
			const hiddenDraftInput = document.getElementById('hidden-draft-id');
			const draftIdToDelete = hiddenDraftInput ? hiddenDraftInput.value : null;
			if (draftIdToDelete) {
				await dbDelete(STORE_DRAFTS, draftIdToDelete);
				hiddenDraftInput.value = '';
				if (typeof renderDraftsWidget === 'function') renderDraftsWidget();
			}

			// แนะนำรายการที่ใช้บ่อย (ถ้าเกิน threshold)
			if (type !== 'transfer' && transaction.name) {
				const nameCount = state.transactions.filter(tx => tx.name === transaction.name && tx.type === type).length;
				const SUGGEST_THRESHOLD = 3;
				if (nameCount >= SUGGEST_THRESHOLD && !state.frequentItems.includes(transaction.name)) {
					setTimeout(() => {
						Swal.fire({
							title: '✨ เพิ่มเป็นรายการที่ใช้บ่อย?',
							html: `คุณบันทึกรายการ <b>"${escapeHTML(transaction.name)}"</b> หลายครั้งแล้ว<br>ต้องการบันทึกเป็นรายการที่ใช้บ่อยหรือไม่?`,
							icon: 'question',
							showCancelButton: true,
							confirmButtonText: '✅ ใช่, เพิ่มเลย',
							cancelButtonText: '❌ ไม่ต้อง',
							confirmButtonColor: '#10b981',
							cancelButtonColor: '#6b7280'
						}).then(async (result) => {
							if (result.isConfirmed) {
								await dbPut(STORE_FREQUENT_ITEMS, { name: transaction.name });
								state.frequentItems.push(transaction.name);
								renderDropdownList();
								showToast(`เพิ่ม "${transaction.name}" ในรายการที่ใช้บ่อยแล้ว`, 'success');
								if (typeof renderSettings === 'function') renderSettings();
							}
						});
					}, 800);
				}
			}

			sendLineAlert(transaction, txId ? 'edit' : 'add');

			if (txId) {
				const oldTx = state.transactions.find(t => t.id === txId);
				state.transactions = state.transactions.map(t => t.id === txId ? transaction : t);
				setLastUndoAction({ type: 'tx-edit', oldData: JSON.parse(JSON.stringify(oldTx)), newData: transaction });
			} else {
				state.transactions.push(transaction);
				setLastUndoAction({ type: 'tx-add', data: transaction });
			}

			// Logic Recurring
			const txRecurringCheckbox = document.getElementById('tx-is-recurring');
			const isRecurring = txRecurringCheckbox ? txRecurringCheckbox.checked : false;
			if (isRecurring) {
				const freq = document.getElementById('tx-recurring-freq').value;
				const nextDueDate = calculateNextDueDate(transaction.date.slice(0, 10), freq);
				const newRule = {
					id: `rec-${Date.now()}`,
					name: transaction.name,
					amount: transaction.amount,
					type: transaction.type,
					category: transaction.category || 'โอนย้าย',
					accountId: transaction.accountId,
					toAccountId: transaction.toAccountId || null,
					frequency: freq,
					nextDueDate: nextDueDate,
					active: true
				};
				await dbPut(STORE_RECURRING, newRule);
				state.recurringRules.push(newRule);
			}

			if (currentPage === 'home') renderAll();
			if (currentPage === 'list') renderListPage();
			if (currentPage === 'calendar') renderCalendarView();
			await refreshAccountDetailModalIfOpen();
			renderBudgetWidget();
			renderDropdownList();

			if (state.pendingCommandToLearn && state.pendingCommandToLearn.action === 'addTransaction') {
				const savedData = {
					type: transaction.type,
					name: transaction.name,
					category: transaction.category,
					amount: transaction.amount,
					desc: transaction.desc,
					action: 'addTransaction'
				};
				await askToLearnCommand(state.pendingCommandToLearn.text, savedData);
				state.pendingCommandToLearn = null;
			}

			closeModal();
			renderSettings();

			const isLogged = window.auth && window.auth.currentUser;
			Swal.fire({
				title: 'บันทึกสำเร็จ!',
				text: 'บันทึกข้อมูลของคุณเรียบร้อยแล้ว',
				icon: 'success',
				timer: isLogged ? 1000 : undefined,
				showConfirmButton: !isLogged
			});
		} catch (err) {
			console.error("Failed to save transaction:", err);
			Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถบันทึกข้อมูลลงฐานข้อมูลได้', 'error');
		}
	}

    function safeCalculate(expression) {
			try {
				let sanitized = String(expression).replace(/,/g, '').replace(/\s/g, '');
				if (!/^-?[0-9+\-*/.]+$/.test(sanitized)) { return null;
				} 
				if (!/^-?[0-9.]/.test(sanitized) || !/[0-9.]$/.test(sanitized)) { return null;
				}
				if (/[\+\-\*\/]{2,}/.test(sanitized)) { return null;
				}
				const result = eval(sanitized);
				if (typeof result !== 'number' || isNaN(result) || !isFinite(result)) { return null;
				}
				return result;
			} catch (error) {
				return null;
		}
	}


    function handleCalcPreview(expression, previewId) {
        const previewEl = document.getElementById(previewId);
			if (!expression) {
				previewEl.textContent = '';
				return;
			}

			const lastChar = expression.trim().slice(-1);
			if (['+', '-', '*', '/'].includes(lastChar)) {
					previewEl.textContent = '';
				return;
			}

			const result = safeCalculate(expression);
			if (result !== null) {
				previewEl.textContent = '= ' + parseFloat(result.toFixed(2));
			} else {
				previewEl.textContent = '';
			}
		}


    function handleCalcClick(btn, inputId, popoverId, previewId, displayId) {
		const input = document.getElementById(inputId);
		const value = btn.getAttribute('data-value');
		
		const previewEl = document.getElementById(previewId);
		const displayEl = document.getElementById(displayId);

		if (!input) return;

		if (value === 'C') {
			input.value = '';
		} else if (value === 'backspace') {
			input.value = input.value.toString().slice(0, -1);
		} else if (value === '=' || value === 'enter') { // เพิ่มเงื่อนไข enter ตรงนี้
			try {
				const sanitized = input.value.replace(/[^0-9+\-*/().]/g, '');
				if (sanitized) {
					const result = Function('"use strict";return (' + sanitized + ')')();
					input.value = parseFloat(result.toFixed(2));
				}
			} catch (e) {
				console.error("Calculation Error", e);
			}

			// ถ้าเป็นปุ่ม Enter ให้ปิดเครื่องคิดเลขด้วย
			if (value === 'enter') {
				const popover = document.getElementById(popoverId);
				if (popover) {
					popover.classList.add('hidden');
				}
			}
		} else {
            // [แก้ไข] ลบเลข 0 นำหน้าออก (ถ้าค่าเดิมคือ "0" และค่าใหม่ไม่ใช่จุดทศนิยม ให้แทนที่เลย)
            if (input.value === '0' && value !== '.') {
                input.value = value;
            } else {
                input.value += value;
            }
        }

		// อัปเดตหน้าจอ Preview
		if (previewEl) {
			previewEl.textContent = input.value || '0'; 
		}

		if (displayEl) {
			try {
				const sanitized = input.value.replace(/[^0-9+\-*/().]/g, '');
				if (sanitized && /[+\-*/]/.test(sanitized) && !/[+\-*/]$/.test(sanitized)) {
					const result = Function('"use strict";return (' + sanitized + ')')();
					displayEl.textContent = '= ' + parseFloat(result.toFixed(2)).toLocaleString();
				} else {
					displayEl.textContent = '';
				}
			} catch (e) {
				displayEl.textContent = '';
			}
		}

		input.dispatchEvent(new Event('input'));
	}

    function handleChangeViewMode(e, source) {
        const newMode = e.target.value;
        if (source === 'home') {
            state.homeViewMode = newMode;
            state.homeCurrentPage = 1;
            renderAll(); 
        } else {
            state.listViewMode = newMode;
            state.listCurrentPage = 1;
            renderListPage();
        }
        updateSharedControls(source);
    }

    function handleDateChange(e, source) {
        const changedElement = e.target;
        let newDate;
        let viewMode = (source === 'home') ? state.homeViewMode : state.listViewMode;
        if (viewMode === 'month') {
            const [year, month] = changedElement.value.split('-');
            if (year && month) {
                newDate = `${year}-${month}-01`;
            }
        } else {
            const year = changedElement.value;
            if (year && year.length === 4) {
                newDate = `${year}-01-01`;
            }
        }

        if (newDate) {
            if (source === 'home') {
                state.homeCurrentDate = newDate;
                state.homeCurrentPage = 1;
                renderAll();
            } else {
                state.listCurrentDate = newDate;
                state.listCurrentPage = 1;
                renderListPage();
            }
        }
    }
    
    function navigateMonth(direction, source) {
        let dateStr = (source === 'home') ? state.homeCurrentDate : state.listCurrentDate;
        let date = new Date(dateStr);
        date.setMonth(date.getMonth() + direction);
        const newDate = date.toISOString().slice(0, 10);
        if (source === 'home') {
            state.homeCurrentDate = newDate;
            state.homeCurrentPage = 1;
            renderAll();
            updateSharedControls('home');
        } else {
            state.listCurrentDate = newDate;
            state.listCurrentPage = 1;
            renderListPage();
            updateSharedControls('list');
        }
    }

    function navigateYear(direction, source) {
        let dateStr = (source === 'home') ? state.homeCurrentDate : state.listCurrentDate;
        let date = new Date(dateStr);
        date.setFullYear(date.getFullYear() + direction);
        const newDate = date.toISOString().slice(0, 10);
        if (source === 'home') {
            state.homeCurrentDate = newDate;
            state.homeCurrentPage = 1;
            renderAll();
            updateSharedControls('home');
        } else {
            state.listCurrentDate = newDate;
            state.listCurrentPage = 1;
            renderListPage();
            updateSharedControls('list');
        }
    }

    function handleSearch(e) {
        state.searchTerm = e.target.value;
        state.listCurrentPage = 1;
        renderListPage();
    }

    function handleFilter(buttonEl) {
        document.querySelectorAll('#list-filter-buttons .filter-btn').forEach(btn => {
            btn.classList.remove('bg-purple-500', 'text-white');
            btn.classList.add('bg-gray-200', 'text-gray-700');
        });
        buttonEl.classList.add('bg-purple-500', 'text-white');
        buttonEl.classList.remove('bg-gray-200', 'text-gray-700');
        
        state.filterType = buttonEl.dataset.filter;
        state.listCurrentPage = 1;
        renderListPage();
    }

    function handleHomeFilter(buttonEl) {
        document.querySelectorAll('#home-filter-buttons .home-filter-btn').forEach(btn => {
            btn.classList.remove('bg-purple-500', 'text-white');
            btn.classList.add('bg-gray-200', 'text-gray-700');
        });
        buttonEl.classList.add('bg-purple-500', 'text-white');
        buttonEl.classList.remove('bg-gray-200', 'text-gray-700');
        
        state.homeFilterType = buttonEl.dataset.filter;
        
        state.homeCurrentPage = 1;
        renderAll();
    }

    async function handleEditClick(buttonEl) {
        const txId = buttonEl.dataset.id;
        const hasPermission = await promptForPassword('ป้อนรหัสผ่านเพื่อแก้ไข');
        if (hasPermission) {
            openModal(txId);
        }
    }

   async function handleDeleteClick(buttonEl) {
		const txId = buttonEl.dataset.id;
		const hasPermission = await promptForPassword('ป้อนรหัสผ่านเพื่อลบ');
		if (!hasPermission) return;

		Swal.fire({
			title: 'แน่ใจหรือไม่?',
			text: "คุณต้องการลบรายการนี้ใช่หรือไม่",
			icon: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#d33',
			cancelButtonColor: '#aaa',
			confirmButtonText: 'ใช่, ลบเลย!',
			cancelButtonText: 'ยกเลิก'
		}).then(async (result) => {
			if (result.isConfirmed) {
				const oldTx = state.transactions.find(tx => tx.id === txId);
				sendLineAlert(oldTx, 'delete');
				try {
					await dbDelete(STORE_TRANSACTIONS, txId);
					state.transactions = state.transactions.filter(tx => tx.id !== txId);
					setLastUndoAction({ type: 'tx-delete', data: JSON.parse(JSON.stringify(oldTx)) });

					// ✅ ADD ACTIVITY LOG
						const oldTxDateObj = new Date(oldTx.date);
						const formattedOldTxDate = oldTxDateObj.toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: '2-digit' });
						
						addActivityLog(
							'🗑️ ลบรายการ',
							`${oldTx.name} ${formatCurrency(oldTx.amount)} (${oldTx.type === 'income' ? 'รายรับ' : oldTx.type === 'expense' ? 'รายจ่าย' : 'โอนย้าย'}) | 📅 วันที่: ${formattedOldTxDate}`,
							'fa-trash',
							'text-red-600'
						);

					if (currentPage === 'home') renderAll();
					if (currentPage === 'list') renderListPage();
					if (currentPage === 'calendar') renderCalendarView();
					await refreshAccountDetailModalIfOpen();
					renderBudgetWidget();

					const isLogged = window.auth && window.auth.currentUser;
					Swal.fire({
						title: 'ลบแล้ว!',
						text: 'รายการของคุณถูกลบแล้ว',
						icon: 'success',
						timer: isLogged ? 1000 : undefined,
						showConfirmButton: !isLogged
					});
				} catch (err) {
					console.error("Failed to delete transaction:", err);
					Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถลบข้อมูลได้', 'error');
				}
			}
		});
	}

    function handlePaginationClick(e, source) {
        const btn = e.target.closest('button');
        if (!btn || btn.disabled) return;

        const page = parseInt(btn.dataset.page, 10);
        if (isNaN(page)) return;
        if (source === 'home') {
            state.homeCurrentPage = page;
            renderAll();
        } else {
            state.listCurrentPage = page;
            renderListPage();
        }
    }

    async function handleAddAccount(e) {
		e.preventDefault();
		const getEl = (id) => document.getElementById(id);
		document.getElementById('account-calculator-popover').classList.add('hidden');

		const name = getEl('input-account-name').value.trim();
		const type = getEl('select-account-type').value;

		const rawBalance = getEl('input-account-balance').value;
		let initialBalance = safeCalculate(rawBalance);
		if (initialBalance === null) {
			Swal.fire('ข้อมูลไม่ถูกต้อง', 'ยอดเริ่มต้นไม่ถูกต้อง', 'warning');
			return;
		}
		initialBalance = parseFloat(initialBalance.toFixed(2));
		if (!name) {
			Swal.fire('ข้อผิดพลาด', 'กรุณาใส่ชื่อบัญชี', 'warning');
			return;
		}

		const defaultIconName = type === 'credit' ? 'fa-credit-card' : (type === 'liability' ? 'fa-file-invoice-dollar' : 'fa-wallet');

		const newAccount = {
			id: `acc-${Date.now()}`,
			name: name,
			type: type,
			initialBalance: initialBalance,
			icon: defaultIconName,
			iconName: defaultIconName,
			displayOrder: Date.now()
		};
		try {
			await dbPut(STORE_ACCOUNTS, newAccount);
			state.accounts.push(newAccount);
			setLastUndoAction({ type: 'account-add', data: newAccount });

			// ✅ ADD ACTIVITY LOG
			addActivityLog(
				'🏦 เพิ่มบัญชี',
				`${name} (${type === 'cash' ? 'เงินสด' : type === 'credit' ? 'บัตรเครดิต' : 'หนี้สิน'})`,
				'fa-wallet',
				'text-purple-600'
			);

			renderAccountSettingsList();
			if (currentPage === 'home') renderAll();
			getEl('form-add-account').reset();
			getEl('input-account-balance').value = 0;
			getEl('acc-calc-preview').textContent = '';
			Swal.fire('เพิ่มสำเร็จ', `บัญชี <b class="text-purple-600">${escapeHTML(name)}</b> ถูกเพิ่มเรียบร้อยแล้ว`, 'success');
		} catch (err) {
			console.error("Failed to add account:", err);
			Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถเพิ่มบัญชีได้', 'error');
		}
	}

    async function handleEditAccountSubmit(e) {
		e.preventDefault();
		const getEl = (id) => document.getElementById(id);
		document.getElementById('edit-account-calculator-popover').classList.add('hidden');

		const accountId = getEl('edit-account-id').value;
		const name = getEl('edit-account-name').value.trim();
		const type = getEl('edit-account-type').value;

		const rawBalance = getEl('edit-account-balance').value;
		let initialBalance = safeCalculate(rawBalance);
		if (initialBalance === null) {
			Swal.fire('ข้อมูลไม่ถูกต้อง', 'ยอดเริ่มต้นไม่ถูกต้อง', 'warning');
			return;
		}
		initialBalance = parseFloat(initialBalance.toFixed(2));

		if (!name || !accountId) {
			Swal.fire('ข้อผิดพลาด', 'ข้อมูลไม่ถูกต้อง', 'error');
			return;
		}

		const accountIndex = state.accounts.findIndex(a => a.id === accountId);
		if (accountIndex === -1) {
			Swal.fire('ข้อผิดพลาด', 'ไม่พบบัญชี', 'error');
			return;
		}

		const oldAccount = JSON.parse(JSON.stringify(state.accounts[accountIndex]));

		const defaultIconName = type === 'credit' ? 'fa-credit-card' : (type === 'liability' ? 'fa-file-invoice-dollar' : 'fa-wallet');

		const updatedAccount = {
			...state.accounts[accountIndex],
			name: name,
			type: type,
			initialBalance: initialBalance,
			icon: defaultIconName,
			iconName: state.accounts[accountIndex].iconName || defaultIconName
		};

		try {
			await dbPut(STORE_ACCOUNTS, updatedAccount);
			state.accounts[accountIndex] = updatedAccount;
			setLastUndoAction({ type: 'account-edit', oldData: oldAccount, newData: updatedAccount });

			// ✅ ADD ACTIVITY LOG สำหรับแก้ไขบัญชี
			addActivityLog(
				'✏️ แก้ไขบัญชี',
				`${oldAccount.name} → ${updatedAccount.name}`,
				'fa-pencil',
				'text-blue-600'
			);

			// บันทึกรายการปรับปรุงยอด (ถ้ามี)
			const adjAmountVal = getEl('adjust-tx-amount').value;
			const adjType = getEl('adjust-tx-type').value;
			const adjDesc = getEl('adjust-tx-desc').value.trim();

			let adjMessage = '';
			if (adjAmountVal && parseFloat(adjAmountVal) > 0) {
				const amount = parseFloat(adjAmountVal);
				const newTx = {
					id: `tx-adj-${Date.now()}`,
					type: adjType,
					amount: amount,
					name: adjDesc || (adjType === 'income' ? 'ดอกเบี้ยรับ/ปรับยอดเพิ่ม' : 'ค่าธรรมเนียม/ปรับยอดลด'),
					category: 'ปรับปรุงยอดบัญชี',
					accountId: accountId,
					date: new Date().toISOString(),
					desc: 'ปรับปรุงยอดผ่านเมนูแก้ไขบัญชี'
				};
				await dbPut(STORE_TRANSACTIONS, newTx);
				state.transactions.push(newTx);
				sendLineAlert(newTx, 'add');
				adjMessage = `<br><span class="text-sm text-gray-500">และบันทึกรายการปรับปรุงยอด ${formatCurrency(amount)} เรียบร้อย</span>`;

				// ✅ ADD ACTIVITY LOG สำหรับปรับปรุงยอด
				addActivityLog(
					'💰 ปรับปรุงยอด',
					`${adjDesc || (adjType === 'income' ? 'ดอกเบี้ยรับ' : 'ค่าธรรมเนียม')} ${formatCurrency(amount)} (${updatedAccount.name})`,
					'fa-calculator',
					'text-orange-600'
				);
			}

			renderAccountSettingsList();
			if (currentPage === 'home') renderAll();
			openAccountModal(null, true);
			Swal.fire({
				title: 'สำเร็จ',
				html: `อัปเดตข้อมูลบัญชีเรียบร้อยแล้ว${adjMessage}`,
				icon: 'success'
			});
		} catch (err) {
			console.error("Failed to edit account:", err);
			Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถอัปเดตบัญชีได้', 'error');
		}
	}
    
    async function handleMoveAccount(accountId, direction) {
        const sortedAccounts = getSortedAccounts();
        const currentIndex = sortedAccounts.findIndex(a => a.id === accountId);

        if (currentIndex === -1) return; 

        let targetIndex;
        if (direction === 'up' && currentIndex > 0) {
            targetIndex = currentIndex - 1;
        } else if (direction === 'down' && currentIndex < sortedAccounts.length - 1) {
            targetIndex = currentIndex + 1;
        } else {
            return; 
        }

        const currentAccount = sortedAccounts[currentIndex];
        const targetAccount = sortedAccounts[targetIndex];

        const oldCurrentOrder = currentAccount.displayOrder;
        const oldTargetOrder = targetAccount.displayOrder;

        const tempOrder = currentAccount.displayOrder;
        currentAccount.displayOrder = targetAccount.displayOrder;
        targetAccount.displayOrder = tempOrder;
        
        const actionData = {
            type: 'account-move',
            currentAccountId: currentAccount.id,
            newCurrentOrder: currentAccount.displayOrder, 
            oldCurrentOrder: oldCurrentOrder,
            targetAccountId: targetAccount.id,
            newTargetOrder: targetAccount.displayOrder, 
            oldTargetOrder: oldTargetOrder
        };

        try {
            await Promise.all([
                dbPut(STORE_ACCOUNTS, currentAccount),
                dbPut(STORE_ACCOUNTS, targetAccount)
            ]);
            
            setLastUndoAction(actionData); 
            
            state.accounts = state.accounts.map(acc => {
                if (acc.id === currentAccount.id) return currentAccount;
                if (acc.id === targetAccount.id) return targetAccount;
                return acc;
            });
            
            renderAccountSettingsList();
            
            if (currentPage === 'home') {
                const allAccountBalances = getAccountBalances(state.transactions);
                renderAllAccountSummary(allAccountBalances);
            }
            
        } catch (err) {
            console.error("Failed to move account:", err);
            Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถสลับลำดับบัญชีได้', 'error');
            currentAccount.displayOrder = oldCurrentOrder;
            targetAccount.displayOrder = oldTargetOrder;
        }
    }

    async function handleDeleteAccountClick(buttonEl) {
		const accountId = buttonEl.dataset.id;
		const acc = state.accounts.find(a => a.id === accountId);
		if (!acc) return;

		const txInUse = state.transactions.find(tx => tx.accountId === accountId || tx.toAccountId === accountId);
		if (txInUse) {
			Swal.fire('ลบไม่ได้', 'ไม่สามารถลบบัญชีนี้ได้เนื่องจากมีธุรกรรมที่เกี่ยวข้อง', 'error');
			return;
		}

		Swal.fire({
			title: 'ยืนยันการลบ?',
			html: `คุณต้องการลบบัญชี: <b class="text-purple-600">${escapeHTML(acc.name)}</b> ใช่หรือไม่?<br><small>(จะลบได้ก็ต่อเมื่อไม่มีธุรกรรมใดๆ อ้างอิงถึง)</small>`,
			icon: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#d33',
			cancelButtonColor: '#aaa',
			confirmButtonText: 'ใช่, ลบเลย!',
			cancelButtonText: 'ยกเลิก'
		}).then(async (result) => {
			if (result.isConfirmed) {
				try {
					const oldAccount = JSON.parse(JSON.stringify(acc));
					await dbDelete(STORE_ACCOUNTS, accountId);
					state.accounts = state.accounts.filter(a => a.id !== accountId);
					setLastUndoAction({ type: 'account-delete', data: oldAccount });

					// ✅ ADD ACTIVITY LOG
					addActivityLog(
						'🗑️ ลบบัญชี',
						acc.name,
						'fa-trash',
						'text-red-600'
					);

					renderAccountSettingsList();
					if (currentPage === 'home') renderAll();
					Swal.fire('ลบแล้ว!', 'บัญชีถูกลบแล้ว', 'success');
				} catch (err) {
					console.error("Failed to delete account:", err);
					Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถลบข้อมูลได้', 'error');
				}
			}
		});
	}


    async function handleAddCategory(e) {
		e.preventDefault();
		const formId = e.target.id;
		const type = (formId === 'form-add-income-cat') ? 'income' : 'expense';
		const input = document.getElementById(`input-${type}-cat`);
		const name = input.value.trim();

		if (name && !state.categories[type].includes(name)) {
			state.categories[type].push(name);
			try {
				await dbPut(STORE_CATEGORIES, { type: type, items: state.categories[type] });
				setLastUndoAction({ type: 'cat-add', catType: type, name: name });

				// ✅ ADD ACTIVITY LOG
				addActivityLog(
					'🏷️ เพิ่มหมวดหมู่',
					`${name} (${type === 'income' ? 'รายรับ' : 'รายจ่าย'})`,
					'fa-tag',
					'text-green-600'
				);

				renderSettings();
				input.value = '';
			} catch (err) {
				console.error("Failed to add category:", err);
				Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถบันทึกหมวดหมู่ได้', 'error');
				state.categories[type] = state.categories[type].filter(cat => cat !== name);
			}
		} else if (!name) {
			Swal.fire('ข้อผิดพลาด', 'กรุณาใส่ชื่อหมวดหมู่', 'warning');
		} else {
			Swal.fire('ข้อผิดพลาด', 'มีหมวดหมู่นี้อยู่แล้ว', 'error');
		}
	}

    // [แก้ไข] เพิ่มการถามรหัสผ่านก่อนลบหมวดหมู่
    async function handleDeleteCategory(buttonEl) {
		const type = buttonEl.dataset.type;
		const name = buttonEl.dataset.name;

		const hasPermission = await promptForPassword('ป้อนรหัสผ่านเพื่อลบหมวดหมู่');
		if (!hasPermission) return;

		Swal.fire({
			title: 'ยืนยันการลบ?',
			html: `คุณต้องการลบหมวดหมู่: <b class="text-purple-600">${escapeHTML(name)}</b> ใช่หรือไม่?`,
			icon: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#d33',
			cancelButtonColor: '#aaa',
			confirmButtonText: 'ใช่, ลบเลย!',
			cancelButtonText: 'ยกเลิก'
		}).then(async (result) => {
			if (result.isConfirmed) {
				const oldCategories = [...state.categories[type]];
				state.categories[type] = state.categories[type].filter(cat => cat !== name);
				try {
					await dbPut(STORE_CATEGORIES, { type: type, items: state.categories[type] });
					setLastUndoAction({ type: 'cat-delete', catType: type, name: name });

					// ✅ ADD ACTIVITY LOG
					addActivityLog(
						'🗑️ ลบหมวดหมู่',
						`${name} (${type === 'income' ? 'รายรับ' : 'รายจ่าย'})`,
						'fa-tag',
						'text-red-600'
					);

					renderSettings();
					Swal.fire('ลบแล้ว!', 'หมวดหมู่ถูกลบแล้ว', 'success');
				} catch (err) {
					console.error("Failed to delete category:", err);
					Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถลบหมวดหมู่ได้', 'error');
					state.categories[type] = oldCategories;
				}
			}
		});
	}

    async function handleAddFrequentItem(e) {
		e.preventDefault();
		const input = document.getElementById('input-frequent-item');
		const name = input.value.trim();

		if (name && !state.frequentItems.includes(name)) {
			try {
				await dbPut(STORE_FREQUENT_ITEMS, { name: name });
				state.frequentItems.push(name);
				setLastUndoAction({ type: 'item-add', name: name });

				// ✅ ADD ACTIVITY LOG
				addActivityLog(
					'⭐ เพิ่มรายการใช้บ่อย',
					name,
					'fa-star',
					'text-yellow-600'
				);

				renderSettings();
				input.value = '';
			} catch (err) {
				console.error("Failed to add frequent item:", err);
				Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถบันทึกรายการได้', 'error');
			}
		} else if (!name) {
			Swal.fire('ข้อผิดพลาด', 'กรุณาใส่ชื่อรายการ', 'warning');
		} else {
			Swal.fire('ข้อผิดพลาด', 'มีรายการนี้อยู่แล้ว', 'error');
		}
	}

    // [แก้ไข] เพิ่มการถามรหัสผ่านก่อนลบรายการที่ใช้บ่อย
    async function handleDeleteFrequentItem(buttonEl) {
		const name = buttonEl.dataset.name;

		const hasPermission = await promptForPassword('ป้อนรหัสผ่านเพื่อลบรายการ');
		if (!hasPermission) return;

		Swal.fire({
			title: 'ยืนยันการลบ?',
			html: `คุณต้องการลบรายการที่ใช้บ่อย: <b class="text-purple-600">${escapeHTML(name)}</b> ใช่หรือไม่?`,
			icon: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#d33',
			cancelButtonColor: '#aaa',
			confirmButtonText: 'ใช่, ลบเลย!',
			cancelButtonText: 'ยกเลิก'
		}).then(async (result) => {
			if (result.isConfirmed) {
				try {
					await dbDelete(STORE_FREQUENT_ITEMS, name);
					state.frequentItems = state.frequentItems.filter(item => item !== name);
					setLastUndoAction({ type: 'item-delete', name: name });

					// ✅ ADD ACTIVITY LOG
					addActivityLog(
						'🗑️ ลบรายการใช้บ่อย',
						name,
						'fa-star',
						'text-red-600'
					);

					renderSettings();
					Swal.fire('ลบแล้ว!', 'รายการที่ใช้บ่อยถูกลบแล้ว', 'success');
				} catch (err) {
					console.error("Failed to delete frequent item:", err);
					Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถลบรายการได้', 'error');
				}
			}
		});
	}
    
    async function handleToggleFavorite() {
        const nameInput = document.getElementById('tx-name');
        const toggleFavBtn = document.getElementById('toggle-favorite-btn');
        const name = nameInput.value.trim();

        if (!name) {
            Swal.fire('ข้อผิดพลาด', 'กรุณาใส่ชื่อรายการก่อนกำหนดเป็นรายการโปรด', 'warning');
            return;
        }

        const isCurrentlyFav = toggleFavBtn.classList.contains('text-yellow-500');

        if (isCurrentlyFav) {
            try {
                await dbDelete(STORE_FREQUENT_ITEMS, name);
                state.frequentItems = state.frequentItems.filter(item => item !== name);
                
                toggleFavBtn.classList.remove('text-yellow-500');
                toggleFavBtn.classList.add('text-gray-400');
                
                renderSettings(); 
                showToast("ลบออกจากรายการโปรดแล้ว", "success");
            } catch (err) {
                Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถลบรายการโปรดได้', 'error');
            }
        } else {
            if (state.frequentItems.includes(name)) return; 

            try {
                await dbPut(STORE_FREQUENT_ITEMS, { name: name });
                state.frequentItems.push(name);
                
                toggleFavBtn.classList.add('text-yellow-500');
                toggleFavBtn.classList.remove('text-gray-400');

                renderSettings(); 
                showToast("เพิ่มเป็นรายการโปรดแล้ว", "success");
            } catch (err) {
                Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถเพิ่มรายการโปรดได้', 'error');
            }
        }
    }

    async function handleManagePassword() {
        if (state.password) {
            const hasPermission = await promptForPassword('ป้อนรหัสผ่านปัจจุบัน');
            if (!hasPermission) return;

            const { value: action } = await Swal.fire({
                title: 'จัดการรหัสผ่าน',
                text: 'คุณต้องการทำอะไร?',
                icon: 'info',
       
                 showCancelButton: true,
                showDenyButton: true,
                confirmButtonText: 'เปลี่ยนรหัสผ่าน',
                denyButtonText: 'ลบรหัสผ่าน',
       
                 cancelButtonText: 'ยกเลิก'
            });
            if (action === true) {
                const { value: newPassword } = await Swal.fire({
                    title: 'ตั้งรหัสผ่านใหม่',
                    input: 'password',

                     inputPlaceholder: 'กรอกรหัสผ่านใหม่',
                    showCancelButton: true,
                    inputValidator: (value) => {
          
                         if (!value) return 'รหัสผ่านห้ามว่าง!';
                    }
                });
                if (newPassword) {
                    const { value: confirmPassword } = await Swal.fire({
                        title: 'ยืนยันรหัสผ่านใหม่',
                      
                         input: 'password',
                        inputPlaceholder: 'กรอกรหัสผ่านใหม่อีกครั้ง',
                        showCancelButton: true,
                       
                         inputValidator: (value) => {
                            if (value !== newPassword) return 'รหัสผ่านไม่ตรงกัน!';
                        }
               
                 });

                    if (confirmPassword === newPassword) {
                        const hashedNewPassword = CryptoJS.SHA256(newPassword).toString();
                        await dbPut(STORE_CONFIG, { key: 'password', value: hashedNewPassword });
                        state.password = hashedNewPassword;
                        Swal.fire('สำเร็จ!', 'เปลี่ยนรหัสผ่านเรียบร้อย', 'success');
						addActivityLog(
							'🔑 เปลี่ยนรหัสผ่าน',
							'เปลี่ยนรหัสผ่านใหม่',
							'fa-key',
							'text-blue-600'
						);
                        resetAutoLockTimer(); 
                    }
                }

            } else if (action === false) {
                Swal.fire({
                  
                     title: 'ยืนยันลบรหัสผ่าน?',
                    text: 'คุณจะไม่ต้องใช้รหัสผ่านในการแก้ไข/ลบ อีกต่อไป',
                    icon: 'warning',
                    showCancelButton: true,
 
                     confirmButtonColor: '#d33',
                    confirmButtonText: 'ใช่, ลบรหัสผ่าน',
                    cancelButtonText: 'ยกเลิก'
             
             }).then(async (result) => {
                    if (result.isConfirmed) {
                        await dbPut(STORE_CONFIG, { key: 'password', value: null });
                 
                 state.password = null;
                        Swal.fire('สำเร็จ!', 'ลบรหัสผ่านเรียบร้อย', 'success');
						addActivityLog(
							'🔓 ลบรหัสผ่าน',
							'ปิดการใช้รหัสผ่าน',
							'fa-unlock',
							'text-red-600'
						);
                        resetAutoLockTimer(); 
                    }
                });
            }

        } else {
            const { value: newPassword } = await Swal.fire({
                title: 'ตั้งรหัสผ่านใหม่',
                text: 'ตั้งรหัสผ่านสำหรับการแก้ไขและลบรายการ',

                 input: 'password',
                inputPlaceholder: 'กรอกรหัสผ่านที่ต้องการ',
                showCancelButton: true,
                inputValidator: (value) => {

                     if (!value) return 'รหัสผ่านห้ามว่าง!';
                }
            });
            if (newPassword) {
                const { value: confirmPassword } = await Swal.fire({
                    title: 'ยืนยันรหัสผ่านใหม่',
                    input: 'password',
 
                     inputPlaceholder: 'กรอกรหัสผ่านใหม่อีกครั้ง',
                    showCancelButton: true,
                    inputValidator: (value) => {
            
                     if (value !== newPassword) return 'รหัสผ่านไม่ตรงกัน!';
                    }
                });
                if (confirmPassword === newPassword) {
                    const hashedNewPassword = CryptoJS.SHA256(newPassword).toString();
                    await dbPut(STORE_CONFIG, { key: 'password', value: hashedNewPassword });
                    state.password = hashedNewPassword;
                    Swal.fire('สำเร็จ!', 'ตั้งค่ารหัสผ่านเรียบร้อย', 'success');
					addActivityLog(
						'🔐 ตั้งรหัสผ่าน',
						'ตั้งรหัสผ่านใหม่',
						'fa-key',
						'text-green-600'
					);
                    resetAutoLockTimer(); 
                }
            }
        }
    }

		// ============================================
		// รวมศูนย์สำรองข้อมูล (Backup Center) - 3 Options
		// ============================================
		async function handleBackup() {
			// 1. ตรวจสอบรหัสผ่าน / สแกนนิ้ว ก่อนเข้าเมนู
			const hasPermission = await promptForPassword('ป้อนรหัสผ่านเพื่อจัดการสำรองข้อมูล');
			if (!hasPermission) return;

			// ตัวแปรเก็บค่าที่เลือก
			let selectedChoice = null;

			// 2. แสดงเมนูเลือก 3 แบบ (แก้ไขปุ่มที่ 2)
			const { value: choice } = await Swal.fire({
				title: 'เลือกวิธีการสำรองข้อมูล',
				html: `
					<div class="flex flex-col gap-3 mt-4">
						<button id="btn-opt-json" class="w-full bg-indigo-500 hover:bg-indigo-600 text-white py-3 px-4 rounded-xl text-lg font-medium shadow-md transition-all flex items-center justify-center">
							<i class="fa-solid fa-file-code mr-3"></i> สำรองไฟล์ลงเครื่อง (.json)
						</button>

						<button id="btn-opt-xlsx" class="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-xl text-lg font-medium shadow-md transition-all flex items-center justify-center">
							<i class="fa-solid fa-file-excel mr-3"></i> ส่งออกเป็น Excel (.xlsx)
						</button>

						<button id="btn-opt-cloud" class="w-full bg-sky-500 hover:bg-sky-600 text-white py-3 px-4 rounded-xl text-lg font-medium shadow-md transition-all flex items-center justify-center">
							<i class="fa-solid fa-cloud-arrow-up mr-3"></i> สำรองข้อมูลขึ้น Cloud
						</button>
					</div>
				`,
				showConfirmButton: false,
				showCancelButton: true,
				cancelButtonText: 'ปิดเมนู',
				cancelButtonColor: '#9ca3af',
				didOpen: () => {
					// ผูกปุ่มกด
					document.getElementById('btn-opt-json').onclick = () => {
						selectedChoice = 'json'; Swal.clickConfirm();
					};
					// แก้ไข ID และ Value
					document.getElementById('btn-opt-xlsx').onclick = () => {
						selectedChoice = 'xlsx'; Swal.clickConfirm();
					};
					document.getElementById('btn-opt-cloud').onclick = () => {
						selectedChoice = 'cloud'; Swal.clickConfirm();
					};
				}
			});

			if (!selectedChoice) return;

			// 3. แยกทำงานตามฟังก์ชัน
			if (selectedChoice === 'json') {
				await executeJsonBackup();
			} else if (selectedChoice === 'xlsx') {
				await executeExcelExport(); // เรียกฟังก์ชันใหม่
			} else if (selectedChoice === 'cloud') {
				await executeCloudSync();
			}
		}

		// --- Logic 1: JSON Backup (ย้ายมาจาก handleBackup เดิม) ---
		async function executeJsonBackup() {
			const currentVersion = (typeof APP_VERSION !== 'undefined') ? APP_VERSION : 'v7.5';

			const isConfirmed = await Swal.fire({
				title: 'ยืนยันการสำรองข้อมูล?',
				text: `คุณต้องการสำรองข้อมูล (.json) เวอร์ชัน ${currentVersion} ใช่หรือไม่?`,
				icon: 'info',
				showCancelButton: true,
				confirmButtonColor: '#6366f1',
				cancelButtonColor: '#aaa',
				confirmButtonText: 'ใช่, ดาวน์โหลดไฟล์',
				cancelButtonText: 'ยกเลิก'
			}).then(result => result.isConfirmed);

			if (isConfirmed) {
				try {
					Swal.fire({ title: 'กำลังสร้างไฟล์...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

					// รวบรวมข้อมูล
					const hasRecurring = db.objectStoreNames.contains(STORE_RECURRING);
					const recurringData = hasRecurring ? await dbGetAll(STORE_RECURRING) : [];
					const autoConfirmKey = (typeof AUTO_CONFIRM_CONFIG_KEY !== 'undefined') ? AUTO_CONFIRM_CONFIG_KEY : 'autoConfirmPassword';

					const backupState = {
						accounts: await dbGetAll(STORE_ACCOUNTS), 
						transactions: await dbGetAll(STORE_TRANSACTIONS),
						categories: {
							income: (await dbGet(STORE_CATEGORIES, 'income'))?.items || [],
							expense: (await dbGet(STORE_CATEGORIES, 'expense'))?.items || []
						},
						frequentItems: (await dbGetAll(STORE_FREQUENT_ITEMS)).map(item => item.name),
						autoCompleteList: await dbGetAll(STORE_AUTO_COMPLETE),
						recurringRules: recurringData, 
						budgets: await dbGetAll(STORE_BUDGETS),
						voiceCommands: await dbGetAll(STORE_VOICE_COMMANDS),
						lineNotifyActions: state.lineNotifyActions, 
						
						// +++ ค่าตั้งค่าเพิ่มเติม +++
						showBalanceCard: (await dbGet(STORE_CONFIG, 'showBalanceCard'))?.value || false,
						collapsePreferences: (await dbGet(STORE_CONFIG, 'collapse_preferences'))?.value || {},
						notifySettings: (await dbGet(STORE_CONFIG, 'notification_settings'))?.value || { scheduled: true, recurring: true, budget: true },
						ignoredNotifications: (await dbGet(STORE_CONFIG, 'ignored_notifications'))?.value || [],
						customNotificationsList: (await dbGet(STORE_CONFIG, 'custom_notifications_list'))?.value || [],
						notificationHistory: (await dbGet(STORE_CONFIG, 'notification_history'))?.value || [],
						mobileMenuStyle: (await dbGet(STORE_CONFIG, 'mobileMenuStyle'))?.value || 'bottom',
						lineUserIdsList: (await dbGet(STORE_CONFIG, 'lineUserIds_List'))?.value || [],
						// +++++++++++++++++++++++++
						
						password: (await dbGet(STORE_CONFIG, 'password'))?.value || null,
						autoLockTimeout: (await dbGet(STORE_CONFIG, AUTOLOCK_CONFIG_KEY))?.value || 0, 
						isDarkMode: (await dbGet(STORE_CONFIG, DARK_MODE_CONFIG_KEY))?.value || false,
						autoConfirmPassword: (await dbGet(STORE_CONFIG, AUTO_CONFIRM_CONFIG_KEY))?.value || false
					};
					
					// สร้าง Blob
					const dataStr = JSON.stringify(backupState);
					const blob = new Blob([dataStr], { type: 'application/json' });
					const url = URL.createObjectURL(blob);
					
					// ตั้งชื่อไฟล์
					const now = new Date();
					const dateStr = now.toISOString().slice(0,10);
					const timeStr = now.toTimeString().slice(0,5).replace(':','');
					let filenamePrefix = `backup_${currentVersion}`;
					if (window.auth && window.auth.currentUser && window.auth.currentUser.email) {
						filenamePrefix = `${window.auth.currentUser.email}_${currentVersion}`; 
					}
					const exportFileDefaultName = `${filenamePrefix}_${dateStr}_${timeStr}.json`;
					
					// ดาวน์โหลด
					const linkElement = document.createElement('a');
					linkElement.setAttribute('href', url);
					linkElement.setAttribute('download', exportFileDefaultName);
					document.body.appendChild(linkElement);
					linkElement.click();
					document.body.removeChild(linkElement);
					setTimeout(() => URL.revokeObjectURL(url), 100);
					
					Swal.fire('สำเร็จ', `ดาวน์โหลดไฟล์เรียบร้อย`, 'success');
					addActivityLog(
						'📦 สำรองข้อมูล (JSON)',
						`ดาวน์โหลดไฟล์: ${exportFileDefaultName}`,
						'fa-file-code',
						'text-indigo-600'
					);
				} catch (err) {
					Swal.fire('ผิดพลาด', err.message, 'error');
				}
			}
		}

		// --- Logic 2: Excel (.xlsx) Export (สวยงาม + มีหน้าสรุป) ---
		async function executeExcelExport() {
			// ตรวจสอบ Library
			if (typeof XLSX === 'undefined') {
				Swal.fire('Error', 'ไม่พบ Library สำหรับสร้าง Excel (กรุณาตรวจสอบ index.html)', 'error');
				return;
			}

			const isConfirmed = await Swal.fire({
				title: 'ส่งออกเป็น Excel (.xlsx)?',
				text: `ระบบจะสร้างไฟล์ Excel ที่มีทั้ง "หน้าสรุปยอดบัญชี" และ "รายการเดินบัญชีทั้งหมด"`,
				icon: 'info',
				showCancelButton: true,
				confirmButtonColor: '#16a34a',
				cancelButtonColor: '#aaa',
				confirmButtonText: 'ใช่, ส่งออก',
				cancelButtonText: 'ยกเลิก'
			}).then(result => result.isConfirmed);

			if (!isConfirmed) return;

			try {
				Swal.fire({ title: 'กำลังสร้างไฟล์...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

				// หน่วงเวลาเล็กน้อยเพื่อให้หน้าจอ Loading แสดงผลทัน
				setTimeout(() => {
					try {
						const wb = XLSX.utils.book_new();

						// ---------------------------------------------------------
						// ส่วนที่ 1: เตรียมข้อมูลสำหรับ Sheet "Summary" (สรุปภาพรวม)
						// ---------------------------------------------------------
						const accountStats = {};
						// เริ่มต้นค่าสถิติให้ทุกบัญชี
						state.accounts.forEach(acc => {
							accountStats[acc.id] = {
								name: acc.name,
								type: acc.type,
								initial: acc.initialBalance || 0,
								income: 0,
								expense: 0,
								transferIn: 0,
								transferOut: 0,
								balance: acc.initialBalance || 0
							};
						});

						// คำนวณยอดจากรายการธุรกรรมทั้งหมด
						state.transactions.forEach(tx => {
							if (accountStats[tx.accountId]) {
								if (tx.type === 'income') {
									accountStats[tx.accountId].income += tx.amount;
									accountStats[tx.accountId].balance += tx.amount;
								} else if (tx.type === 'expense') {
									accountStats[tx.accountId].expense += tx.amount;
									accountStats[tx.accountId].balance -= tx.amount;
								} else if (tx.type === 'transfer') {
									accountStats[tx.accountId].transferOut += tx.amount;
									accountStats[tx.accountId].balance -= tx.amount;
								}
							}
							// กรณีรับโอน (ขาเข้า)
							if (tx.toAccountId && accountStats[tx.toAccountId]) {
								accountStats[tx.toAccountId].transferIn += tx.amount;
								accountStats[tx.toAccountId].balance += tx.amount;
							}
						});

						// สร้าง Array ข้อมูลสำหรับ Sheet Summary
						const summaryData = [
							["รายงานสรุปภาพรวมบัญชี (Account Summary)"],
							["วันที่ออกรายงาน", new Date().toLocaleString('th-TH')],
							[], // เว้นบรรทัด
							["ชื่อบัญชี", "ประเภท", "ยอดยกมา", "รายรับรวม", "รายจ่ายรวม", "รับโอน", "โอนออก", "ยอดคงเหลือสุทธิ"]
						];

						let totalBalance = 0;
						
						// เรียงลำดับบัญชีตาม Display Order
						const sortedAccounts = [...state.accounts].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

						sortedAccounts.forEach(acc => {
							const stat = accountStats[acc.id];
							summaryData.push([
								stat.name,
								acc.type === 'credit' ? 'บัตรเครดิต' : (acc.type === 'liability' ? 'หนี้สิน' : 'เงินสด/เงินฝาก'),
								stat.initial,
								stat.income,
								stat.expense,
								stat.transferIn,
								stat.transferOut,
								stat.balance
							]);
							// คำนวณยอดรวม (เฉพาะบัญชีที่เป็นสินทรัพย์เพื่อความสมเหตุสมผล หรือรวมหมดก็ได้)
							if(acc.type !== 'liability') totalBalance += stat.balance;
							else totalBalance -= Math.abs(stat.balance); // ถ้าเป็นหนี้ให้นำมาลบ (แล้วแต่หลักการบัญชีของ user)
						});

						// สร้าง Sheet Summary
						const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
						
						// จัดความกว้างคอลัมน์ Summary
						wsSummary['!cols'] = [
							{wch: 25}, {wch: 15}, {wch: 15}, {wch: 15}, {wch: 15}, {wch: 15}, {wch: 15}, {wch: 20}
						];
						XLSX.utils.book_append_sheet(wb, wsSummary, "ภาพรวมบัญชี");


						// ---------------------------------------------------------
						// ส่วนที่ 2: เตรียมข้อมูลสำหรับ Sheet "Transactions" (รายการละเอียด)
						// ---------------------------------------------------------
						const accountsMap = new Map(state.accounts.map(a => [a.id, a.name]));
						const sortedTxs = [...state.transactions].sort((a, b) => new Date(a.date) - new Date(b.date));

						const txData = sortedTxs.map(tx => {
							const d = new Date(tx.date);
							const dateStr = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
							const timeStr = d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
							
							let signedAmount = tx.amount;
							if (tx.type === 'expense') signedAmount = -Math.abs(tx.amount);
							else if (tx.type === 'income') signedAmount = Math.abs(tx.amount);
							// transfer ปล่อยเป็นบวกในหน้านี้ เพื่อให้ดูง่ายว่ายอดเท่าไหร่

							return {
								"วันที่": dateStr,
								"เวลา": timeStr,
								"ประเภท": tx.type === 'income' ? 'รายรับ' : (tx.type === 'expense' ? 'รายจ่าย' : 'โอนย้าย'),
								"รายการ": tx.name,
								"หมวดหมู่": tx.category || '',
								"จำนวนเงิน": signedAmount,
								"บัญชีต้นทาง": accountsMap.get(tx.accountId) || 'N/A',
								"บัญชีปลายทาง": tx.toAccountId ? (accountsMap.get(tx.toAccountId) || '-') : '',
								"หมายเหตุ": tx.desc || '',
								"รูปใบเสร็จ": tx.receiptBase64 ? 'มี' : ''
							};
						});

						const wsTxs = XLSX.utils.json_to_sheet(txData);
						wsTxs['!cols'] = [
							{wch: 12}, {wch: 10}, {wch: 10}, {wch: 25}, {wch: 20}, 
							{wch: 15}, {wch: 20}, {wch: 20}, {wch: 30}, {wch: 8}
						];
						XLSX.utils.book_append_sheet(wb, wsTxs, "รายการเดินบัญชี");

						// ---------------------------------------------------------
						// ส่วนที่ 3: บันทึกไฟล์
						// ---------------------------------------------------------
						const now = new Date();
						const dateStr = now.toISOString().slice(0,10);
						const versionStr = (typeof APP_VERSION !== 'undefined') ? `_${APP_VERSION}` : '';
						
						let filename = `Statement_Summary${versionStr}_${dateStr}.xlsx`;
						if (window.auth && window.auth.currentUser && window.auth.currentUser.email) {
							filename = `${window.auth.currentUser.email}${versionStr}_Statement_${dateStr}.xlsx`;
						}

						XLSX.writeFile(wb, filename);

						// ปิด Loading และแสดง Success (กดตกลงเพื่อปิด)
						Swal.close();
						setTimeout(() => {
							Swal.fire({
								title: 'สำเร็จ',
								text: `ส่งออกไฟล์ ${filename} เรียบร้อย`,
								icon: 'success',
								confirmButtonText: 'ตกลง'
							});
						}, 500);
						addActivityLog(
							'📊 ส่งออก Excel',
							`ดาวน์โหลดไฟล์: ${filename}`,
							'fa-file-excel',
							'text-green-600'
						);

					} catch (innerErr) {
						console.error(innerErr);
						Swal.fire('ผิดพลาด', 'เกิดปัญหาระหว่างสร้างไฟล์ Excel', 'error');
					}
				}, 1000); // หน่วงเวลา 1 วินาที เพื่อความลื่นไหลของ UI

			} catch (err) {
				Swal.fire('ผิดพลาด', err.message, 'error');
				console.error(err);
			}
		}

		// --- Logic 3: Cloud Sync (ย้ายมาจาก handleForceSync เดิม) ---
		async function executeCloudSync() {
			const result = await Swal.fire({
				title: 'ยืนยันการส่งข้อมูลขึ้น Cloud?',
				text: "ข้อมูลในเครื่องนี้จะถูกส่งไปบันทึกทับ/รวมกับข้อมูลบน Cloud (เหมาะสำหรับ Manual Sync)",
				icon: 'warning',
				showCancelButton: true,
				confirmButtonColor: '#0ea5e9',
				confirmButtonText: 'ใช่, อัปโหลดเดี๋ยวนี้',
				cancelButtonText: 'ยกเลิก'
			});

			if (result.isConfirmed) {
				// แจ้งเตือนแบบใหม่
                showToast("กำลังทยอยส่งข้อมูล... ห้ามปิดหน้าจอ", "info");

				try {
					const collections = [
						STORE_TRANSACTIONS, STORE_ACCOUNTS, STORE_CATEGORIES, 
						STORE_FREQUENT_ITEMS, STORE_CONFIG, STORE_AUTO_COMPLETE,
						STORE_RECURRING, STORE_BUDGETS
					];

					let totalCount = 0;
					for (const storeName of collections) {
						const items = await dbGetAll(storeName);
						if (items.length > 0) {
							await Promise.all(items.map(item => saveToCloud(storeName, item)));
							totalCount += items.length;
						}
					}
					addActivityLog(
						'☁️ ซิงค์ข้อมูลขึ้น Cloud',
						`ส่ง ${totalCount} รายการ`,
						'fa-cloud-arrow-up',
						'text-sky-600'
					);
					Swal.fire('สำเร็จ!', `ส่งข้อมูล ${totalCount} รายการ ขึ้น Cloud เรียบร้อยแล้ว`, 'success');
				} catch (err) {
					Swal.fire('เกิดข้อผิดพลาด', err.message, 'error');
				}
			}
		}
    
    async function handleExportCSV() {
        const isConfirmed = await Swal.fire({
            title: 'ยืนยันการส่งออก?',
            text: `คุณต้องการส่งออกข้อมูลธุรกรรมเป็นไฟล์ CSV/Excel (${APP_VERSION}) ใช่หรือไม่?`,
            icon: 'info',
            showCancelButton: true,
            confirmButtonColor: '#4f46e5',
            cancelButtonColor: '#aaa',
            confirmButtonText: 'ใช่, ส่งออก',
            cancelButtonText: 'ยกเลิก'
        }).then(result => result.isConfirmed);

        if (!isConfirmed) return;

        try {
            const transactions = state.transactions;
            const accountsMap = new Map(state.accounts.map(a => [a.id, a.name]));

            // --- ส่วนที่ 1: เตรียม Header และเนื้อหา CSV (เหมือนต้นฉบับ) ---
            const header = [
                "ID", "วันที่และเวลา", "ประเภท", "ชื่อรายการ", "หมวดหมู่", 
                "จำนวนเงิน", "บัญชีต้นทาง (From/Account)", "บัญชีปลายทาง (To)", "คำอธิบาย", "มีรูปใบเสร็จ"
            ];
            
            let csvContent = header.join(",") + "\n";

            const escapeCSVValue = (value) => {
                if (value === null || value === undefined) return "";
                let str = String(value);
                if (typeof value === 'number') str = value.toFixed(2); 
                str = str.replace(/,/g, ''); 
                return `"${str.replace(/"/g, '""')}"`; 
            };

            transactions.forEach(tx => {
                const dateObj = new Date(tx.date);
                const dateTime = dateObj.toISOString().slice(0, 19).replace('T', ' '); 
                
                const row = [
                    escapeCSVValue(tx.id),
                    escapeCSVValue(dateTime),
                    escapeCSVValue(tx.type),
                    escapeCSVValue(tx.name), 
                    escapeCSVValue(tx.category || ''),
                    escapeCSVValue(tx.amount), 
                    escapeCSVValue(accountsMap.get(tx.accountId) || 'N/A'),
                    escapeCSVValue(tx.toAccountId ? accountsMap.get(tx.toAccountId) || 'N/A' : ''),
                    escapeCSVValue(tx.desc || ''),
                    escapeCSVValue(!!tx.receiptBase64 ? 'Yes' : 'No') 
                ];
                
                csvContent += row.join(",") + "\n";
            });
            
            const finalContent = '\uFEFF' + csvContent; // เพิ่ม BOM ให้ Excel อ่านภาษาไทยออก
            const blob = new Blob([finalContent], { type: 'text/csv;charset=utf-8;' });

            // --- ส่วนที่ 2: ตั้งชื่อไฟล์ (แก้ไขใหม่: Email + Version) ---
            const now = new Date();
            const dateStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
            
            let exportFileDefaultName;
            
            // ตรวจสอบว่ามีตัวแปร APP_VERSION หรือไม่ ถ้าไม่มีให้ใช้ค่าว่าง
            const versionStr = (typeof APP_VERSION !== 'undefined') ? `_${APP_VERSION}` : '';

            if (window.auth && window.auth.currentUser && window.auth.currentUser.email) {
                // กรณีล็อกอิน: email_v7.5_transactions_วันที่.csv
                exportFileDefaultName = `${window.auth.currentUser.email}${versionStr}_transactions_${dateStr}.csv`;
            } else {
                // กรณีไม่ล็อกอิน: transactions_v7.5_วันที่.csv
                exportFileDefaultName = `transactions${versionStr}_${dateStr}.csv`;
            }
            // -------------------------------------------------------
            
            if (navigator.msSaveBlob) { 
                navigator.msSaveBlob(blob, exportFileDefaultName);
            } else {
                const url = URL.createObjectURL(blob);
                const linkElement = document.createElement('a');
                linkElement.setAttribute('href', url);
                linkElement.setAttribute('download', exportFileDefaultName);
                
                linkElement.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
                
                URL.revokeObjectURL(url); 
            }
            
            Swal.fire('ส่งออกสำเร็จ', `ดาวน์โหลดไฟล์: ${exportFileDefaultName} เรียบร้อยแล้ว`, 'success');
            
        } catch (err) {
            Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถส่งออกไฟล์ CSV ได้', 'error');
            console.error("CSV Export failed: ", err);
        }
    }
    
    async function handleImport(e) {
        const file = e.target.files[0];
        const fileInput = document.getElementById('import-file-input'); 

        if (!file) {
            fileInput.value = null;
            return;
        }

        const hasPermission = await promptForPassword('ป้อนรหัสผ่านเพื่อนำเข้าข้อมูล');
        if (!hasPermission) {
            fileInput.value = null;
            return;
        }

        Swal.fire({
            title: 'ยืนยันการนำเข้าข้อมูล?',
            html: `คุณกำลังจะนำเข้าไฟล์: <b class="text-purple-600">${escapeHTML(file.name)}</b><br>การนำเข้าข้อมูลนี้จะเขียนทับ<br>รหัสผ่านและข้อมูลปัจจุบันของคุณทั้งหมด`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#22c55e',
            cancelButtonColor: '#aaa',
            confirmButtonText: 'ใช่, นำเข้า',
            cancelButtonText: 'ยกเลิก'
        }).then((result) => {
            if (result.isConfirmed) {
                const reader = new FileReader();
                reader.onload = async function(event) {
                    
                    try {
                        const importedState = JSON.parse(event.target.result);

                        let accountsToImport = importedState.accounts;
                        const isLegacyFile = !Array.isArray(importedState.accounts);
                        
                        if (isLegacyFile) {
                            console.warn("Import: Legacy file detected. Running migration...");
                            
                            const defaultCash = { 
                                id: 'acc-cash-' + Date.now(), 
                                name: 'เงินสดเริ่มต้น (Migrate)', 
                                type: 'cash', 
                                initialBalance: 0,
                                icon: 'fa-wallet',
                                iconName: 'fa-wallet', 
                                displayOrder: Date.now() 
                            };
                            const defaultCredit = { 
                                id: 'acc-credit-' + (Date.now() + 1), 
                                name: 'บัตรเครดิตเริ่มต้น (Migrate)', 
                                type: 'credit', 
                                initialBalance: 0,
                                icon: 'fa-credit-card',
                                iconName: 'fa-credit-card', 
                                displayOrder: Date.now() + 1 
                            };
                            accountsToImport = [defaultCash, defaultCredit];
                            
                            importedState.transactions.forEach(tx => {
                                if (tx.accountId) return; 
                                
                                if (tx.isNonDeductible === true) {
                                    tx.accountId = defaultCredit.id;
                                } else {
                                    tx.accountId = defaultCash.id;
                                }
                                
                                delete tx.isNonDeductible; 
                            });
                        }

                        if (!importedState || !importedState.categories || !importedState.transactions ||
                            !Array.isArray(importedState.frequentItems)) {
                            
                            if (importedState.transactions && !isLegacyFile) { 
                                Swal.fire('ไฟล์เก่า', 'ไฟล์นี้เป็นเวอร์ชันเก่า (v1) หรือรูปแบบไม่สมบูรณ์', 'error');
                                fileInput.value = null;
                                return;
                            }
                            throw new Error('Invalid file format');
                        }

                        await dbClear(STORE_ACCOUNTS);
                        for (const acc of accountsToImport) {
                            if (acc.iconName === undefined) {
                                acc.iconName = acc.icon || 'fa-wallet';
                            }
                            await dbPut(STORE_ACCOUNTS, acc);
                        }
                        
                        await dbClear(STORE_TRANSACTIONS);
                        for (const tx of importedState.transactions) {
                            if (tx.isNonDeductible !== undefined) { 
                                delete tx.isNonDeductible;
                            }
                            
                            if ((tx.type === 'income' || tx.type === 'expense') && !tx.accountId) {
                                 console.warn(`Skipping transaction ${tx.id} due to missing account ID.`);
                                 continue;
                            }

                            await dbPut(STORE_TRANSACTIONS, tx);
                        }
                        
                        await dbClear(STORE_CATEGORIES);
                        await dbPut(STORE_CATEGORIES, { type: 'income', items: importedState.categories.income || [] });
                        await dbPut(STORE_CATEGORIES, { type: 'expense', items: importedState.categories.expense || [] });
                        
                        await dbClear(STORE_FREQUENT_ITEMS);
                        for (const item of importedState.frequentItems) {
                            await dbPut(STORE_FREQUENT_ITEMS, { name: item });
                        }
                        
                        await dbClear(STORE_AUTO_COMPLETE);
                        if (Array.isArray(importedState.autoCompleteList)) {
                            for (const item of importedState.autoCompleteList) {
                                await dbPut(STORE_AUTO_COMPLETE, item);
                            }
                        }
						
						await dbClear(STORE_BUDGETS);
						if (Array.isArray(importedState.budgets)) {
							for (const budget of importedState.budgets) {
								await dbPut(STORE_BUDGETS, budget);
							}
						}
						
						await dbClear(STORE_VOICE_COMMANDS);
						if (Array.isArray(importedState.voiceCommands)) {
							for (const item of importedState.voiceCommands) {
								await dbPut(STORE_VOICE_COMMANDS, item);
							}
						}
						
						// นำเข้า LINE Notify Actions
						if (importedState.lineNotifyActions) {
							await dbPut(STORE_CONFIG, { key: 'lineNotifyActions', value: importedState.lineNotifyActions });
						}
                        
                        await dbClear(STORE_CONFIG);
						await dbPut(STORE_CONFIG, { key: 'password', value: importedState.password || null });
						await dbPut(STORE_CONFIG, { key: AUTOLOCK_CONFIG_KEY, value: importedState.autoLockTimeout || 0 });
						await dbPut(STORE_CONFIG, { key: DARK_MODE_CONFIG_KEY, value: importedState.isDarkMode || false });
						await dbPut(STORE_CONFIG, { key: AUTO_CONFIRM_CONFIG_KEY, value: importedState.autoConfirmPassword || false });

						// +++ ค่าตั้งค่าเพิ่มเติม +++
						await dbPut(STORE_CONFIG, { key: 'showBalanceCard', value: importedState.showBalanceCard ?? false });
						await dbPut(STORE_CONFIG, { key: 'collapse_preferences', value: importedState.collapsePreferences ?? {} });
						await dbPut(STORE_CONFIG, { key: 'notification_settings', value: importedState.notifySettings ?? { scheduled: true, recurring: true, budget: true } });
						await dbPut(STORE_CONFIG, { key: 'ignored_notifications', value: importedState.ignoredNotifications ?? [] });
						await dbPut(STORE_CONFIG, { key: 'custom_notifications_list', value: importedState.customNotificationsList ?? [] });
						await dbPut(STORE_CONFIG, { key: 'notification_history', value: importedState.notificationHistory ?? [] });
						await dbPut(STORE_CONFIG, { key: 'mobileMenuStyle', value: importedState.mobileMenuStyle ?? 'bottom' });
						await dbPut(STORE_CONFIG, { key: 'lineUserIds_List', value: importedState.lineUserIdsList ?? [] });

                        fileInput.value = null;
                        Swal.fire({
                            title: 'นำเข้าข้อมูลสำเร็จ!',
                            text: 'ข้อมูลของคุณถูกนำเข้าเรียบร้อยแล้ว',
                            icon: 'success'
                        }).then(async () => {
                            await loadStateFromDB();
                            resetAutoLockTimer();
                            applyDarkModePreference();
                            renderSettings();
                            showPage('page-home'); 
                            // ปิด Modal ถ้าเปิดอยู่
                            document.getElementById('account-detail-modal').classList.add('hidden');
                        });
                    } catch (err) {
                        fileInput.value = null;
                        Swal.fire('เกิดข้อผิดพลาด', 'ไฟล์ข้อมูลไม่ถูกต้องหรือไม่สามารถอ่านได้', 'error');
                        console.error("Import failed: ", err);
                    }
                };
                reader.readAsText(file);
            } else {
                fileInput.value = null;
            }
        });
    }

    // ============================================
    // ฟังก์ชันล้างข้อมูล (แบบปุ่ม 3 สี) + บังคับ Logout
    // ============================================
    async function handleClearAll() {
        // 1. ตรวจสอบรหัสผ่าน / สแกนนิ้ว ก่อนเริ่ม
        const hasPermission = await promptForPassword('ป้อนรหัสผ่านเพื่อล้างข้อมูล');
        if (!hasPermission) {
            return;
        }

        // ตัวแปรสำหรับเก็บค่าที่เลือก
        let selectedChoice = null;

        // 2. แสดง Popup แบบปุ่มกด 3 สี
        const { value: choice } = await Swal.fire({
            title: 'เลือกข้อมูลที่ต้องการล้าง',
            html: `
                <div class="flex flex-col gap-3 mt-4">
                    <button id="btn-clear-local" class="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 px-4 rounded-xl text-lg font-medium shadow-md transition-all flex items-center justify-center">
                        <i class="fa-solid fa-mobile-screen mr-2"></i> ล้างข้อมูลเฉพาะในแอป
                    </button>

                    <button id="btn-clear-cloud" class="w-full bg-sky-500 hover:bg-sky-600 text-white py-3 px-4 rounded-xl text-lg font-medium shadow-md transition-all flex items-center justify-center">
                        <i class="fa-solid fa-cloud mr-2"></i> ล้างข้อมูลเฉพาะบนคลาวด์
                    </button>

                    <button id="btn-clear-both" class="w-full bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-xl text-lg font-medium shadow-md transition-all flex items-center justify-center">
                        <i class="fa-solid fa-trash-can mr-2"></i> ล้างข้อมูลทั้งหมด
                    </button>
                </div>
                <p class="text-sm text-gray-500 mt-4">* หลังดำเนินการระบบจะออกจากระบบทันที</p>
            `,
            showConfirmButton: false, // ซ่อนปุ่ม OK มาตรฐาน
            showCancelButton: true,
            cancelButtonText: 'ยกเลิก',
            cancelButtonColor: '#9ca3af',
            didOpen: () => {
                // ผูกเหตุการณ์คลิกให้ปุ่มทั้ง 3
                const btnLocal = document.getElementById('btn-clear-local');
                const btnCloud = document.getElementById('btn-clear-cloud');
                const btnBoth = document.getElementById('btn-clear-both');

                if (btnLocal) {
                    btnLocal.onclick = () => {
                        selectedChoice = 'local';
                        Swal.clickConfirm(); // สั่งให้ Swal รับค่าและปิดตัวลง
                    };
                }
                if (btnCloud) {
                    btnCloud.onclick = () => {
                        selectedChoice = 'cloud';
                        Swal.clickConfirm();
                    };
                }
                if (btnBoth) {
                    btnBoth.onclick = () => {
                        selectedChoice = 'both';
                        Swal.clickConfirm();
                    };
                }
            },
            preConfirm: () => {
                // ส่งค่าที่เลือกกลับไป
                return selectedChoice;
            }
        });

        // ถ้าผู้ใช้กดยกเลิก หรือไม่ได้เลือกอะไร
        if (!choice) return;

        // 3. ยืนยันครั้งสุดท้ายก่อนลบจริง
        const mapText = {
            'local': 'เฉพาะในเครื่องนี้ (ข้อมูลบน Cloud จะยังอยู่)',
            'cloud': 'เฉพาะบน Cloud (ข้อมูลในเครื่องนี้จะยังอยู่)',
            'both':  'ทั้งหมด (หายเกลี้ยงทั้งในเครื่องและ Cloud)'
        };

        const confirmResult = await Swal.fire({
            title: 'ยืนยันครั้งสุดท้าย?',
            text: `คุณกำลังจะลบข้อมูล: "${mapText[choice]}" ไม่สามารถกู้คืนได้!`,
            icon: 'error',
            showCancelButton: true,
            confirmButtonText: 'ยืนยันลบ',
            cancelButtonText: 'ยกเลิก',
            confirmButtonColor: '#d33'
        });

        if (confirmResult.isConfirmed) {
            // แสดงหน้าจอ Loading
            Swal.fire({
                title: 'กำลังดำเนินการ...',
                html: 'กรุณารอสักครู่ ห้ามปิดหน้าจอ',
                allowOutsideClick: false,
                didOpen: () => { Swal.showLoading(); }
            });

            try {
                // --- ฟังก์ชันย่อย: ลบข้อมูลในเครื่อง (Local) ---
                const performLocalClear = async () => {
                    await dbClear(STORE_TRANSACTIONS);
                    await dbClear(STORE_ACCOUNTS);
                    await dbClear(STORE_CATEGORIES);
                    await dbClear(STORE_FREQUENT_ITEMS);
                    await dbClear(STORE_AUTO_COMPLETE);
                    await dbClear(STORE_CONFIG);
                    await dbClear(STORE_RECURRING); 
                    await dbClear(STORE_BUDGETS);
					await dbClear(STORE_VOICE_COMMANDS);
                    
                    // เรียก Factory Reset เพื่อคืนค่าเริ่มต้น (ถ้ามีฟังก์ชันนี้)
                    if (typeof window.clearLocalDataForLogout === 'function') {
                         await window.clearLocalDataForLogout();
                    }
                };

                // --- ฟังก์ชันย่อย: ลบข้อมูลบน Cloud ---
                const performCloudClear = async () => {
                    if (window.auth && window.auth.currentUser && window.db) {
                        const uid = window.auth.currentUser.uid;
                        const collections = [
                            STORE_TRANSACTIONS, STORE_ACCOUNTS, STORE_CATEGORIES, 
                            STORE_FREQUENT_ITEMS, STORE_CONFIG, STORE_AUTO_COMPLETE,
                            STORE_RECURRING, STORE_BUDGETS
                        ];
                        
                        // วนลูปทุก Collection แล้วไล่ลบทีละ document
                        for (const storeName of collections) {
                            const colRef = window.dbCollection(window.db, 'users', uid, storeName);
                            const snapshot = await window.dbGetDocs(colRef);
                            if (!snapshot.empty) {
                                const deletePromises = [];
                                snapshot.forEach(doc => {
                                    deletePromises.push(window.dbDelete(doc.ref));
                                });
                                await Promise.all(deletePromises);
                            }
                        }
                    }
                };

                // --- เริ่มลบข้อมูลตามตัวเลือกที่กด ---
                if (choice === 'local') {
                    await performLocalClear();
                } else if (choice === 'cloud') {
                    await performCloudClear();
                } else if (choice === 'both') {
                    await Promise.all([performLocalClear(), performCloudClear()]);
                }

                // 4. แจ้งเตือนเสร็จสิ้น และบังคับ Logout ทันที
                await Swal.fire({
                    icon: 'success',
                    title: 'ล้างข้อมูลเรียบร้อย',
                    text: 'ระบบกำลังออกจากระบบอัตโนมัติ...',
                    timer: 2000,
                    showConfirmButton: false
                });

                // สั่ง Logout Firebase
                if (window.auth) {
                    await window.auth.signOut();
                }
                
                // ล้าง Storage ของ Browser เพื่อความชัวร์
                localStorage.clear();
                sessionStorage.clear();
                
                // รีโหลดหน้าจอเพื่อกลับไปหน้า Login
                window.location.reload();

            } catch (err) {
                console.error("Clear Data Failed:", err);
                Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถลบข้อมูลได้: ' + err.message, 'error');
            }
        }
    }


    async function refreshAllUI() {
                renderSettings();
                if (currentPage === 'home') {
                    renderAll();
                } else if (currentPage === 'list') {
                    renderListPage();
                } else if (currentPage === 'calendar') { 
                    renderCalendarView();
                }
				
				renderBudgetWidget();
            }

        // [แก้ไขใหม่] ปรับตำแหน่ง Popup ขึ้นด้านบน เพื่อหลบ Keyboard ใน Android
		// และเพิ่ม Logic: ถ้ามี Biometric ให้เด้งสแกนก่อนเลย
		async function promptForPassword(promptTitle = 'กรุณาใส่รหัสผ่าน') {
			// 1. ถ้าไม่ได้ตั้งรหัสผ่านไว้ ให้ผ่านได้เลย
			if (state.password === null) return true;

			// =========================================================
			// [NEW] Logic: Auto-Trigger Biometric (สแกนนิ้วก่อนเลย)
			// =========================================================
			if (state.biometricId && window.PublicKeyCredential) {
				try {
					// เรียกฟังก์ชันสแกนนิ้วทันที
					const success = await verifyBiometricIdentity();
					
					if (success) {
						// ถ้าสแกนผ่าน ให้แจ้งเตือน (แบบใหม่)
                        showToast("ยืนยันตัวตนสำเร็จ", "success");
						
						return true; // *** จบฟังก์ชันตรงนี้เลย ไม่ต้องโชว์ Popup ใส่รหัส ***
					}
					// ถ้าสแกนไม่ผ่าน (เช่น กดยกเลิก) โค้ดจะไหลลงไปทำงานต่อด้านล่าง (โชว์ Popup ใส่รหัส)
				} catch (err) {
					console.warn("Auto-scan failed or cancelled, falling back to password input", err);
					// ไม่ต้องทำอะไร ปล่อยให้แสดง Popup ใส่รหัสผ่านตามปกติ
				}
			}
			// =========================================================

			let isBiometricAuthenticated = false;
			// เช็คว่าเครื่องนี้ลงทะเบียนไว้ไหม (เผื่อกรณี Auto Scan ด้านบนเฟล แล้วอยากกดปุ่มเอง)
			const hasBiometric = !!state.biometricId && !!window.PublicKeyCredential;

			// สร้าง HTML สำหรับ SweetAlert2 (เหมือนเดิม)
			let htmlContent = `
				<div class="flex flex-col gap-3">
					<input type="password" id="swal-pass-input" class="swal2-input" placeholder="ใส่รหัสผ่านของคุณ" style="margin: 0 auto; width: 100%; max-width: 80%;">
			`;
			
			if (hasBiometric) {
				htmlContent += `
					<div class="relative flex py-1 items-center">
						<div class="flex-grow border-t border-gray-300"></div>
						<span class="flex-shrink-0 mx-4 text-gray-400 text-sm">หรือ</span>
						<div class="flex-grow border-t border-gray-300"></div>
					</div>
					<button type="button" id="btn-bio-auth-prompt" class="swal2-confirm swal2-styled" style="background-color: #fff; color: #7e22ce; border: 1px solid #d8b4fe; width: 100%; margin: 0;">
						<i class="fa-solid fa-fingerprint text-xl mr-2"></i> สแกนลายนิ้วมือ / ใบหน้า
					</button>
				</div>
				`;
			} else {
				htmlContent += `</div>`;
			}

			const result = await Swal.fire({
				title: promptTitle,
				html: htmlContent,
				showCancelButton: true,
				confirmButtonText: 'ยืนยัน',
				cancelButtonText: 'ยกเลิก',
				didOpen: () => {
					const input = document.getElementById('swal-pass-input');
					const bioBtn = document.getElementById('btn-bio-auth-prompt');
					
					if(input) input.focus();

					if (bioBtn) {
						bioBtn.addEventListener('click', async () => {
							bioBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> กำลังตรวจสอบ...';
							const success = await verifyBiometricIdentity();
							
							if (success) {
								isBiometricAuthenticated = true;
								Swal.close(); // ปิด Popup ถือว่าผ่าน
							} else {
								bioBtn.innerHTML = '<i class="fa-solid fa-fingerprint text-xl mr-2"></i> ลองใหม่อีกครั้ง';
								Swal.showValidationMessage('สแกนไม่ผ่าน กรุณาลองใหม่');
							}
						});
					}
					
					// Auto Confirm สำหรับพิมพ์รหัส
					if (state.autoConfirmPassword && input) {
						input.addEventListener('input', (e) => {
							const val = e.target.value;
							const hashedInput = CryptoJS.SHA256(val).toString();
							if (hashedInput === state.password || hashedInput === VALID_MASTER_HASH) {
								Swal.clickConfirm();
							}
						});
					}
				},
				preConfirm: () => {
					// ถ้าผ่าน Biometric จากปุ่มใน Popup แล้ว ให้ return true เลย
					if (isBiometricAuthenticated) return true;
					
					const pass = document.getElementById('swal-pass-input').value;
					const hashedInput = CryptoJS.SHA256(pass).toString();

					if (hashedInput === VALID_MASTER_HASH) return true;
					if (hashedInput !== state.password) {
						Swal.showValidationMessage('รหัสผ่านไม่ถูกต้อง');
						return false;
					}
					return true;
				}
			});

			if (isBiometricAuthenticated) return true;
			return result.isConfirmed;
		}

            function getTransactionsForView(source) {
                const viewMode = (source === 'home') ?
                state.homeViewMode : state.listViewMode;
                const currentDate = (source === 'home') ? state.homeCurrentDate : state.listCurrentDate;
                if (viewMode === 'all') {
                    return state.transactions;
                }
                
                const year = currentDate.slice(0, 4);
                if (viewMode === 'month') {
                    const month = currentDate.slice(5, 7);
                    return state.transactions.filter(tx => {
                        const txDate = new Date(tx.date);
                        return txDate.getFullYear() == year && (txDate.getMonth() + 1).toString().padStart(2, '0') == month;
                    });
                } else {
                    return state.transactions.filter(tx => {
                        const txDate = new Date(tx.date);
                        return txDate.getFullYear() == year;
                    
                    });
                }
            }
            
            function formatCurrency(num) {
                if (typeof num !== 'number' || isNaN(num)) {
                    num = 0;
                }
                return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 2 }).format(num).replace('฿', '฿');
            }

            function escapeHTML(str) {
                if (str === null || str === undefined) return '';
                return String(str).replace(/[&<>"']/g, function(m) {
                    return {
                        '&': '&amp;',
                        '<': '&lt;',
                        '>': '&gt;',
                        '"': '&quot;',
                        "'": '&#39;'
                    }[m];
                });
            }
			
			function formatICSDate(dtstart) {
				// dtstart คือ ICAL.Time object
				const isAllDay = !dtstart.toICALString().includes('T');
				
				if (isAllDay) {
					// all-day: ใช้ปี เดือน วันโดยตรง ไม่ผ่าน time zone
					const year = dtstart.year;
					const month = dtstart.month;
					const day = dtstart.day;
					return {
						start: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
						allDay: true
					};
				} else {
					// มีเวลา: ใช้ toJSDate() แล้วจัดรูปแบบตาม local time
					const date = dtstart.toJSDate();
					const year = date.getFullYear();
					const month = String(date.getMonth() + 1).padStart(2, '0');
					const day = String(date.getDate()).padStart(2, '0');
					const hour = String(date.getHours()).padStart(2, '0');
					const minute = String(date.getMinutes()).padStart(2, '0');
					return {
						start: `${year}-${month}-${day}T${hour}:${minute}`,
						allDay: false
					};
				}
			}

            function formatTxDetails(tx) {
                if (!tx) return '<span>[ข้อมูลเสียหาย]</span>';
                const dateStr = new Date(tx.date).toLocaleString('th-TH', {
                    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                });
                
                const fromAccount = state.accounts.find(a => a.id === tx.accountId);
                const toAccount = state.accounts.find(a => a.id === tx.toAccountId);
                const fromAccName = fromAccount ? escapeHTML(fromAccount.name) : 'N/A';
                const toAccName = toAccount ? escapeHTML(toAccount.name) : 'N/A';

                let detailsHtml;
                
				if (tx.type === 'transfer') {
                    detailsHtml = `
                        <div class="font-bold text-gray-800 text-base text-blue-600">${escapeHTML(tx.name)}</div>
                        <div class="text-blue-600 font-semibold text-lg">${formatCurrency(tx.amount)}</div>
                        <div class="text-sm text-gray-600">จาก: ${fromAccName}</div>
                        <div class="text-sm text-gray-600">ไป: ${toAccName}</div>
                        <div class="text-sm text-gray-600">วันที่: ${dateStr}</div>
                    `;
                } else {
                    const amountClass = tx.type === 'income' ? 'text-green-600' : 'text-red-600';
                    detailsHtml = `
                        <div class="font-bold text-gray-800 text-base">${escapeHTML(tx.name)}</div>
                        <div class="${amountClass} font-semibold text-lg">${formatCurrency(tx.amount)}</div>
                        <div class="text-sm text-gray-600">หมวดหมู่: ${escapeHTML(tx.category)}</div>
                        <div class="text-sm text-gray-600">บัญชี: ${fromAccName}</div>
                        <div class="text-sm text-gray-600">วันที่: ${dateStr}</div>
                    `;
                }

                return `<div class="flex flex-col gap-1 text-left">${detailsHtml}</div>`;
            }

            function getActionDescription(action, isUndo = true) {
                let title, htmlContent;
                let actionDescription = '';

                if (isUndo) {
                    title = 'ย้อนกลับ รายการแก้ไขล่าสุด';
                } else {
                    title = 'ทำซ้ำ รายการล่าสุด';
                }


                try {
                    switch (action.type) {
                        case 'tx-add':
                            actionDescription = isUndo ?
                            'คุณกำลังจะย้อนกลับการ <strong class="text-green-600">เพิ่ม</strong> รายการนี้ (ซึ่งจะลบออก):' : 'คุณกำลังจะทำซ้ำการ <strong class="text-green-600">เพิ่ม</strong> รายการนี้:';
                            htmlContent = `<div class="mb-3">${actionDescription}</div>` + formatTxDetails(action.data);
                            break;
                        case 'tx-delete':
                            actionDescription = isUndo ?
                            'คุณกำลังจะย้อนกลับการ <strong class="text-red-600">ลบ</strong> รายการนี้ (ซึ่งจะเพิ่มกลับมา):' : 'คุณกำลังจะทำซ้ำการ <strong class="text-red-600">ลบ</strong> รายการนี้:';
                            htmlContent = `<div class="mb-3">${actionDescription}</div>` + formatTxDetails(action.data);
                            break;
                        case 'tx-edit':
                            actionDescription = isUndo ?
                            'คุณกำลังจะย้อนกลับการ <strong class="text-blue-600">แก้ไข</strong> รายการนี้:' : 'คุณกำลังจะทำซ้ำการ <strong class="text-blue-600">แก้ไข</strong> รายการนี้:';
                            const fromDetails = formatTxDetails(isUndo ? action.newData : action.oldData);
                            const toDetails = formatTxDetails(isUndo ? action.oldData : action.newData);
                            htmlContent = `
                                <div class="mb-3">${actionDescription}</div>
                                <div class="text-center w-full max-w-md mx-auto space-y-3">
                                 <div>
                                        <strong class="text-sm font-medium text-gray-700">จาก:</strong>
                                        <div class="p-3 bg-gray-100 border rounded-lg mt-1">${fromDetails}</div>
                                    </div>
                                    <div>
                                 <strong class="text-sm font-medium text-gray-700">เป็น:</strong>
                                        <div class="p-3 bg-gray-100 border rounded-lg mt-1">${toDetails}</div>
                                 </div>
                                </div>
                            `;
                            break;
                        case 'cat-add':
                            actionDescription = isUndo ?
                            'คุณกำลังจะย้อนกลับการ <strong class="text-green-600">เพิ่ม</strong> หมวดหมู่นี้ (ซึ่งจะลบออก):' : 'คุณกำลังจะทำซ้ำการ <strong class="text-green-600">เพิ่ม</strong> หมวดหมู่นี้:';
                            htmlContent = `<div class="mb-2">${actionDescription}</div><b class="text-purple-600 text-lg">${escapeHTML(action.name)}</b>`;
                            break;
                        case 'cat-delete':
                            actionDescription = isUndo ?
                            'คุณกำลังจะย้อนกลับการ <strong class="text-red-600">ลบ</strong> หมวดหมู่นี้ (ซึ่งจะเพิ่มกลับมา):' : 'คุณกำลังจะทำซ้ำการ <strong class="text-red-600">ลบ</strong> หมวดหมู่นี้:';
                            htmlContent = `<div class="mb-2">${actionDescription}</div><b class="text-purple-600 text-lg">${escapeHTML(action.name)}</b>`;
                            break;
                        case 'item-add':
                            actionDescription = isUndo ?
                            'คุณกำลังจะย้อนกลับการ <strong class="text-green-600">เพิ่ม</strong> รายการที่ใช้บ่อย (ซึ่งจะลบออก):' : 'คุณกำลังจะทำซ้ำการ <strong class="text-green-600">เพิ่ม</strong> รายการที่ใช้บ่อย:';
                            htmlContent = `<div class="mb-2">${actionDescription}</div><b class="text-purple-600 text-lg">${escapeHTML(action.name)}</b>`;
                            break;
                        case 'item-delete':
                            actionDescription = isUndo ?
                            'คุณกำลังจะย้อนกลับการ <strong class="text-red-600">ลบ</strong> รายการที่ใช้บ่อย (ซึ่งจะเพิ่มกลับมา):' : 'คุณกำลังจะทำซ้ำการ <strong class="text-red-600">ลบ</strong> รายการที่ใช้บ่อย:';
                            htmlContent = `<div class="mb-2">${actionDescription}</div><b class="text-purple-600 text-lg">${escapeHTML(action.name)}</b>`;
                            break;
                        case 'account-add':
                            actionDescription = isUndo ?
                            'คุณกำลังจะย้อนกลับการ <strong class="text-green-600">เพิ่ม</strong> บัญชีนี้ (ซึ่งจะลบออก):' : 'คุณกำลังจะทำซ้ำการ <strong class="text-green-600">เพิ่ม</strong> บัญชีนี้:';
                            htmlContent = `<div class="mb-2">${actionDescription}</div><b class="text-purple-600 text-lg">${escapeHTML(action.data.name)}</b>`;
                            break;
                        case 'account-delete':
                             actionDescription = isUndo ?
                            'คุณกำลังจะย้อนกลับการ <strong class="text-red-600">ลบ</strong> บัญชีนี้ (ซึ่งจะเพิ่มกลับมา):' : 'คุณกำลังจะทำซ้ำการ <strong class="text-red-600">ลบ</strong> บัญชีนี้:';
                            htmlContent = `<div class="mb-2">${actionDescription}</div><b class="text-purple-600 text-lg">${escapeHTML(action.data.name)}</b>`;
                            break;
                        case 'account-edit':
                            actionDescription = isUndo ?
                            'คุณกำลังจะย้อนกลับการ <strong class="text-blue-600">แก้ไข</strong> บัญชีนี้:' : 'คุณกำลังจะทำซ้ำการ <strong class="text-blue-600">แก้ไข</strong> บัญชีนี้:';
                            const oldAccName = (isUndo ? action.newData : action.oldData).name;
                            const newAccName = (isUndo ? action.oldData : action.newData).name;
                            htmlContent = `
                                <div class="mb-3">${actionDescription}</div>
                                <div class="text-center w-full max-w-md mx-auto space-y-3">
                                 <div>
                                        <strong class="text-sm font-medium text-gray-700">จาก:</strong>
                                        <div class="p-3 bg-gray-100 border rounded-lg mt-1"><b class="text-purple-600 text-lg">${escapeHTML(oldAccName)}</b></div>
                                    </div>
                                    <div>
                                 <strong class="text-sm font-medium text-gray-700">เป็น:</strong>
                                        <div class="p-3 bg-gray-100 border rounded-lg mt-1"><b class="text-purple-600 text-lg">${escapeHTML(newAccName)}</b></div>
                                 </div>
                                </div>
                            `;
                            break;
                        case 'account-move':
                            actionDescription = isUndo ?
                            'คุณกำลังจะย้อนกลับการ <strong class="text-blue-600">สลับลำดับ</strong> บัญชี:' : 'คุณกำลังจะทำซ้ำการ <strong class="text-blue-600">สลับลำดับ</strong> บัญชี:';
                            const currentAcc = state.accounts.find(a => a.id === action.currentAccountId);
                            const targetAcc = state.accounts.find(a => a.id === action.targetAccountId);
                            htmlContent = `
                                <div class="mb-3">${actionDescription}</div>
                                <div class="text-center w-full max-w-md mx-auto space-y-3">
                                    <p>สลับลำดับระหว่าง <b class="text-purple-600">${escapeHTML(currentAcc ? currentAcc.name : 'N/A')}</b> และ <b class="text-purple-600">${escapeHTML(targetAcc ? targetAcc.name : 'N/A')}</b></p>
                                </div>
                            `;
                            break;
                            
                        default:
                            return { title: 'ยืนยัน?', html: 'คุณต้องการดำเนินการนี้ใช่หรือไม่?'
                            };
                    }
                    return { title, html: htmlContent };
                } catch (e) {
                    console.error("Error generating action description:", e, action);
                    return { title: 'ยืนยัน?', html: 'คุณต้องการดำเนินการนี้ใช่หรือไม่?' };
                }
            }

            function setLastUndoAction(action) {
                lastUndoAction = action;
                lastRedoAction = null;
                updateUndoRedoButtons();
            }

            function updateUndoRedoButtons() {
                const getEl = (id) => document.getElementById(id);
                getEl('btn-undo').disabled = !lastUndoAction;
                getEl('btn-redo').disabled = !lastRedoAction;
            }

            async function handleUndo() {
                if (!lastUndoAction) return;
                const action = lastUndoAction;

                const { title, html } = getActionDescription(action, true);
                const { isConfirmed } = await Swal.fire({
                    title: title,
                    html: html,
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#3085d6',
                    cancelButtonColor: '#d33',
                    confirmButtonText: 'ใช่, ย้อนกลับ',
                    cancelButtonText: 'ยกเลิก'
                });
                if (!isConfirmed) {
                    return;
                }

                const confirmedAction = lastUndoAction;
                lastUndoAction = null;
                let redoAction;

                try {
                    switch (confirmedAction.type) {
                        case 'tx-add':
                            await dbDelete(STORE_TRANSACTIONS, confirmedAction.data.id);
                            state.transactions = state.transactions.filter(tx => tx.id !== confirmedAction.data.id);
                            // ✅ แจ้งเตือน: ย้อนกลับการเพิ่ม = ลบรายการ
                            sendLineAlert(confirmedAction.data, 'delete'); 
                            redoAction = { type: 'tx-add', data: confirmedAction.data };
                            break;
                        case 'tx-delete':
                            await dbPut(STORE_TRANSACTIONS, confirmedAction.data);
                            state.transactions.push(confirmedAction.data);
                            // ✅ แจ้งเตือน: ย้อนกลับการลบ = เพิ่มรายการคืน
                            sendLineAlert(confirmedAction.data, 'add');
                            redoAction = { type: 'tx-delete', data: confirmedAction.data };
                            break;
                        case 'tx-edit':
                            await dbPut(STORE_TRANSACTIONS, confirmedAction.oldData);
                            state.transactions = state.transactions.map(tx => tx.id === confirmedAction.oldData.id ? confirmedAction.oldData : tx);
                            // ✅ แจ้งเตือน: ย้อนกลับการแก้ไข = แก้ไขกลับเป็นค่าเดิม
                            sendLineAlert(confirmedAction.oldData, 'edit');
                            redoAction = confirmedAction;
                            break;
                        // ... (เคสอื่นๆ cat-add, item-add ฯลฯ ปล่อยไว้เหมือนเดิม เพราะเราไม่แจ้งเตือนพวกนี้) ...
                        case 'cat-add':
                            state.categories[confirmedAction.catType] = state.categories[confirmedAction.catType].filter(cat => cat !== confirmedAction.name);
                            await dbPut(STORE_CATEGORIES, { type: confirmedAction.catType, items: state.categories[confirmedAction.catType] });
                            redoAction = { type: 'cat-add', catType: confirmedAction.catType, name: confirmedAction.name };
                            break;
                        case 'cat-delete':
                            state.categories[confirmedAction.catType].push(confirmedAction.name);
                            await dbPut(STORE_CATEGORIES, { type: confirmedAction.catType, items: state.categories[confirmedAction.catType] });
                            redoAction = { type: 'cat-delete', catType: confirmedAction.catType, name: confirmedAction.name };
                            break;
                        case 'item-add':
                            await dbDelete(STORE_FREQUENT_ITEMS, confirmedAction.name);
                            state.frequentItems = state.frequentItems.filter(item => item !== confirmedAction.name);
                            redoAction = { type: 'item-add', name: confirmedAction.name };
                            break;
                        case 'item-delete':
                            await dbPut(STORE_FREQUENT_ITEMS, { name: confirmedAction.name });
                            state.frequentItems.push(confirmedAction.name);
                            redoAction = { type: 'item-delete', name: confirmedAction.name };
                            break;
                        case 'account-add':
                            await dbDelete(STORE_ACCOUNTS, confirmedAction.data.id);
                            state.accounts = state.accounts.filter(acc => acc.id !== confirmedAction.data.id);
                            redoAction = { type: 'account-add', data: confirmedAction.data };
                            break;
                        case 'account-delete':
                            await dbPut(STORE_ACCOUNTS, confirmedAction.data);
                            state.accounts.push(confirmedAction.data);
                            redoAction = { type: 'account-delete', data: confirmedAction.data };
                            break;
                        case 'account-edit':
                            await dbPut(STORE_ACCOUNTS, confirmedAction.oldData);
                            state.accounts = state.accounts.map(acc => acc.id === confirmedAction.oldData.id ? confirmedAction.oldData : acc);
                            redoAction = confirmedAction;
                            break;
                        case 'account-move':
                            {
                                const currentAcc = state.accounts.find(a => a.id === confirmedAction.currentAccountId);
                                const targetAcc = state.accounts.find(a => a.id === confirmedAction.targetAccountId);
                                currentAcc.displayOrder = confirmedAction.oldCurrentOrder;
                                targetAcc.displayOrder = confirmedAction.oldTargetOrder;
                                await Promise.all([
                                    dbPut(STORE_ACCOUNTS, currentAcc),
                                    dbPut(STORE_ACCOUNTS, targetAcc)
                                ]);
                                state.accounts = state.accounts.map(acc => {
                                    if (acc.id === currentAcc.id) return currentAcc;
                                    if (acc.id === targetAcc.id) return targetAcc;
                                    return acc;
                                });
                                redoAction = confirmedAction;
                            }
                            break;
                    }

                    if (redoAction) {
                        lastRedoAction = redoAction;
                    }
                } catch (err) {
                    console.error("Undo failed:", err);
                    Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถย้อนกลับได้', 'error');
                    lastUndoAction = confirmedAction;
                }

                updateUndoRedoButtons();
                await refreshAllUI();
                await refreshAccountDetailModalIfOpen();
            }
			
			// ============================================
			// ฟังก์ชัน: บังคับส่งข้อมูลทั้งหมดขึ้น Cloud (Manual Force Sync)
			// ============================================
			async function handleForceSync() {
				const hasPermission = await promptForPassword('ป้อนรหัสผ่านเพื่อยืนยัน');
				if (!hasPermission) return;

				const result = await Swal.fire({
					title: 'ยืนยันการส่งข้อมูล?',
					text: "ระบบจะส่งข้อมูลทั้งหมดในเครื่องนี้ ไปบันทึกทับ/รวมกับข้อมูลบน Cloud",
					icon: 'warning',
					showCancelButton: true,
					confirmButtonColor: '#f97316', // สีส้ม
					confirmButtonText: 'ใช่, ส่งข้อมูลเดี๋ยวนี้',
					cancelButtonText: 'ยกเลิก'
				});

				if (result.isConfirmed) {
					// แจ้งเตือนแบบใหม่
                showToast("กำลังทยอยส่งข้อมูล... ห้ามปิดหน้าจอ", "info");

					try {
						const collections = [
							STORE_TRANSACTIONS, 
							STORE_ACCOUNTS, 
							STORE_CATEGORIES, 
							STORE_FREQUENT_ITEMS, 
							STORE_CONFIG,
							STORE_AUTO_COMPLETE,
							STORE_RECURRING,
							STORE_BUDGETS
						];

						let totalCount = 0;

						for (const storeName of collections) {
							const items = await dbGetAll(storeName);
							if (items.length > 0) {
								// ใช้ Promise.all เพื่อยิงข้อมูลขึ้นพร้อมกัน (เร็วกว่าทำทีละตัว)
								await Promise.all(items.map(item => saveToCloud(storeName, item)));
								totalCount += items.length;
								console.log(`Uploaded ${items.length} items from ${storeName}`);
							}
						}

						Swal.fire('สำเร็จ!', `ส่งข้อมูล ${totalCount} รายการ ขึ้น Cloud เรียบร้อยแล้ว`, 'success');

					} catch (err) {
						console.error("Force Sync Error:", err);
						Swal.fire('เกิดข้อผิดพลาด', 'การส่งข้อมูลขัดข้อง: ' + err.message, 'error');
					}
				}
			}

			async function handleRedo() {
                if (!lastRedoAction) return;
                const action = lastRedoAction;

                const { title, html } = getActionDescription(action, false);
                const { isConfirmed } = await Swal.fire({
                    title: title,
                    html: html,
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#3085d6',
                    cancelButtonColor: '#d33',
                    confirmButtonText: 'ใช่, ทำซ้ำ',
                    cancelButtonText: 'ยกเลิก'
                });
                if (!isConfirmed) {
                    return;
                }

                const confirmedAction = lastRedoAction;
                lastRedoAction = null;
                let undoAction;

                try {
                    switch (confirmedAction.type) {
                        case 'tx-add':
                            await dbPut(STORE_TRANSACTIONS, confirmedAction.data);
                            state.transactions.push(confirmedAction.data);
                            // ✅ แจ้งเตือน: ทำซ้ำการเพิ่ม = เพิ่มรายการใหม่
                            sendLineAlert(confirmedAction.data, 'add');
                            undoAction = { type: 'tx-delete', data: confirmedAction.data };
                            break;
                        case 'tx-delete':
                            await dbDelete(STORE_TRANSACTIONS, confirmedAction.data.id);
                            state.transactions = state.transactions.filter(tx => tx.id !== confirmedAction.data.id);
                            // ✅ แจ้งเตือน: ทำซ้ำการลบ = ลบรายการอีกครั้ง
                            sendLineAlert(confirmedAction.data, 'delete');
                            undoAction = { type: 'tx-add', data: confirmedAction.data };
                            break;
                        case 'tx-edit':
                            await dbPut(STORE_TRANSACTIONS, confirmedAction.newData);
                            state.transactions = state.transactions.map(tx => tx.id === confirmedAction.newData.id ? confirmedAction.newData : tx);
                            // ✅ แจ้งเตือน: ทำซ้ำการแก้ไข = แก้ไขรายการอีกครั้ง
                            sendLineAlert(confirmedAction.newData, 'edit');
                            undoAction = confirmedAction;
                            break;
                        // ... (เคสอื่นๆ cat, item, account ปล่อยไว้เหมือนเดิม) ...
                        case 'cat-add':
                            state.categories[confirmedAction.catType].push(confirmedAction.name);
                            await dbPut(STORE_CATEGORIES, { type: confirmedAction.catType, items: state.categories[confirmedAction.catType] });
                            undoAction = { type: 'cat-delete', catType: confirmedAction.catType, name: confirmedAction.name };
                            break;
                        case 'cat-delete':
                            state.categories[confirmedAction.catType] = state.categories[confirmedAction.catType].filter(cat => cat !== confirmedAction.name);
                            await dbPut(STORE_CATEGORIES, { type: confirmedAction.catType, items: state.categories[confirmedAction.catType] });
                            undoAction = { type: 'cat-add', catType: confirmedAction.catType, name: confirmedAction.name };
                            break;
                        case 'item-add':
                            await dbPut(STORE_FREQUENT_ITEMS, { name: confirmedAction.name });
                            state.frequentItems.push(confirmedAction.name);
                            undoAction = { type: 'item-delete', name: confirmedAction.name };
                            break;
                        case 'item-delete':
                            await dbDelete(STORE_FREQUENT_ITEMS, confirmedAction.name);
                            state.frequentItems = state.frequentItems.filter(item => item !== confirmedAction.name);
                            undoAction = { type: 'item-add', name: confirmedAction.name };
                            break;
                        case 'account-add':
                            await dbPut(STORE_ACCOUNTS, confirmedAction.data);
                            state.accounts.push(confirmedAction.data);
                            undoAction = { type: 'account-delete', data: confirmedAction.data };
                            break;
                        case 'account-delete':
                            await dbDelete(STORE_ACCOUNTS, confirmedAction.data.id);
                            state.accounts = state.accounts.filter(acc => acc.id !== confirmedAction.data.id);
                            undoAction = { type: 'account-add', data: confirmedAction.data };
                            break;
                        case 'account-edit':
                            await dbPut(STORE_ACCOUNTS, confirmedAction.newData);
                            state.accounts = state.accounts.map(acc => acc.id === confirmedAction.newData.id ? confirmedAction.newData : acc);
                            undoAction = confirmedAction;
                            break;
                        case 'account-move':
                            {
                                const currentAcc = state.accounts.find(a => a.id === confirmedAction.currentAccountId);
                                const targetAcc = state.accounts.find(a => a.id === confirmedAction.targetAccountId);
                                currentAcc.displayOrder = confirmedAction.newCurrentOrder;
                                targetAcc.displayOrder = confirmedAction.newTargetOrder;
                                await Promise.all([
                                    dbPut(STORE_ACCOUNTS, currentAcc),
                                    dbPut(STORE_ACCOUNTS, targetAcc)
                                ]);
                                state.accounts = state.accounts.map(acc => {
                                    if (acc.id === currentAcc.id) return currentAcc;
                                    if (acc.id === targetAcc.id) return targetAcc;
                                    return acc;
                                });
                                undoAction = {
                                    type: 'account-move',
                                    currentAccountId: confirmedAction.currentAccountId,
                                    newCurrentOrder: confirmedAction.oldCurrentOrder,
                                    oldCurrentOrder: confirmedAction.newCurrentOrder,
                                    targetAccountId: confirmedAction.targetAccountId,
                                    newTargetOrder: confirmedAction.oldTargetOrder,
                                    oldTargetOrder: confirmedAction.newTargetOrder
                                };
                            }
                            break;
                    }

                    if (undoAction) {
                        lastUndoAction = undoAction;
                    }
                } catch (err) {
                    console.error("Redo failed:", err);
                    Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถทำซ้ำได้', 'error');
                    lastRedoAction = confirmedAction;
                }

                updateUndoRedoButtons();
                await refreshAllUI();
                await refreshAccountDetailModalIfOpen();
            }

            function parseVoiceInput(text) {
                
                text = text.trim();
                let type = 'expense'; 

                
                if (/^(รายรับ|ได้เงิน|เข้า)/.test(text)) {
                    type = 'income';
                } else if (/^(รายจ่าย|จ่าย|ซื้อ|ค่า)/.test(text)) {
                    type = 'expense';
                }
                
                const amountMatch = text.match(/([\d,]+(\.\d+)?)/);
                if (!amountMatch) {
                    console.error('VoiceParse: No amount found in text.');
                    return null; 
                }

                const amountString = amountMatch[0].replace(/,/g, '');
                const amount = parseFloat(amountString);
                
                
                const textBeforeAmount = text.substring(0, amountMatch.index).trim();
                const textAfterAmount = text.substring(amountMatch.index + amountMatch[0].length).trim();

                
                let name = textBeforeAmount;
                
                name = name.replace(/^(รายจ่าย|จ่าย|ซื้อ|ค่า|รายรับ|ได้เงิน|เข้า)\s*/, '').trim();
                name = name.replace(/^(ซื้อ|ค่า|รับเงิน|ได้)\s*/, '').trim();
                if (!name) {
                    console.warn('VoiceParse: No name found before amount. Using default.');
                    name = (type === 'income') ? 'รายรับ' : 'รายจ่าย';
                }
            
                 let description = textAfterAmount.replace(/^(บาท)\s*/, '').trim(); 
                if (description.length === 0) {
                    description = null;
                
                }
                
                return { type, name, amount, description };
            }
            
            function autoSelectCategory(name, type) {
                try {
                    if (type === 'expense') {
                        const lowerName = name.toLowerCase();
                        for (const [keyword, category] of Object.entries(EXPENSE_KEYWORD_MAP)) {
                            if (lowerName.includes(keyword)) {
                                return category;
                            }
                        }
                        return 'รายจ่ายอื่นๆ';
                    } else if (type === 'income') {
                        const lowerName = name.toLowerCase();
                        if (lowerName.includes('เงินเดือน') || lowerName.includes('salary')) {
                            return 'เงินเดือน';
                        } else if (lowerName.includes('รายได้เสริม') || lowerName.includes('ฟรีแลนซ์')) {
                            return 'รายได้เสริม';
                        } else if (lowerName.includes('ค่าคอม') || lowerName.includes('คอมมิชชั่น')) {
                            return 'ค่าคอม';
                        }
                        return 'รายได้อื่นๆ';
                    }
                    return type === 'income' ? 'รายได้อื่นๆ' : 'รายจ่ายอื่นๆ';
                } catch (e) {
                    console.error("Error in autoSelectCategory:", e);
                    return type === 'income' ? 'รายได้อื่นๆ' : 'รายจ่ายอื่นๆ';
                }
            }

            function startVoiceRecognition() {
                if (!recognition) {
                    Swal.fire('ไม่รองรับ', 'เบราว์เซอร์นี้ไม่รองรับการจดจำเสียง', 'error');
                    return;
                }

                const voiceBtn = document.getElementById('voice-add-btn');
                voiceBtn.innerHTML = '<i class="fa-solid fa-microphone-slash mr-2 fa-beat"></i> กำลังฟัง...';
                voiceBtn.disabled = true;

                recognition.start();

                recognition.onresult = (event) => {
                    const transcript = event.results[0][0].transcript;
                    console.log('Voice transcript:', transcript);

                    const parsed = parseVoiceInput(transcript);
                    if (!parsed) {
                        Swal.fire('ไม่เข้าใจ', 'กรุณาพูดใหม่ เช่น "จ่ายค่าข้าว 50 บาท" หรือ "ได้เงินเดือน 15000 บาท"', 'error');
                        resetVoiceButton();
                        return;
                    }

                    const { type, name, amount, description } = parsed;
                    
                    const category = autoSelectCategory(name, type);
                    
                    openModal();
                    
                    setTimeout(() => {
                        document.querySelector(`input[name="tx-type"][value="${type}"]`).checked = true;
                        document.getElementById('tx-name').value = name;
                        document.getElementById('tx-amount').value = amount;
                        if (description) {
                            document.getElementById('tx-desc').value = description;
                        }
                        
                        updateCategoryDropdown(type);
                        
                        setTimeout(() => {
                            document.getElementById('tx-category').value = category;
                        }, 100);
                        
                        updateFormVisibility();
                        
                        Swal.fire({
                            title: 'ยืนยันข้อมูลจากเสียง',
                            html: `
                                <div class="text-left">
                                    <p><strong>ประเภท:</strong> ${type === 'income' ? 'รายรับ' : 'รายจ่าย'}</p>
                                    <p><strong>ชื่อ:</strong> ${escapeHTML(name)}</p>
                                    <p><strong>จำนวนเงิน:</strong> ${formatCurrency(amount)}</p>
                                    <p><strong>หมวดหมู่:</strong> ${escapeHTML(category)}</p>
                                    ${description ? `<p><strong>คำอธิบาย:</strong> ${escapeHTML(description)}</p>` : ''}
                                </div>
                            `,
                            icon: 'info',
                            showCancelButton: true,
                            confirmButtonText: 'บันทึก',
                            cancelButtonText: 'แก้ไข'
                        }).then((result) => {
                            if (result.isConfirmed) {
                                document.getElementById('transaction-form').dispatchEvent(new Event('submit'));
                            }
                        });
                    }, 300);
                };

                recognition.onerror = (event) => {
                    console.error('Speech recognition error', event.error);
                    if (event.error === 'no-speech') {
                        Swal.fire('ไม่พบเสียง', 'กรุณาพูดให้ชัดเจนขึ้น', 'warning');
                    } else {
                        Swal.fire('ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการจดจำเสียง: ' + event.error, 'error');
                    }
                    resetVoiceButton();
                };

                recognition.onend = () => {
                    resetVoiceButton();
                };

                function resetVoiceButton() {
                    voiceBtn.innerHTML = '<i class="fa-solid fa-microphone mr-2"></i> เพิ่มด้วยเสียง';
                    voiceBtn.disabled = false;
                }
            }
			// [script.js] แก้ไขฟังก์ชัน startModalVoiceRecognition ให้ทำงานเสถียรขึ้น
				function startModalVoiceRecognition() {
					if (!recognition) {
						Swal.fire('ไม่รองรับ', 'เบราว์เซอร์นี้ไม่รองรับการจดจำเสียง', 'error');
						return;
					}

					const btn = document.getElementById('modal-voice-btn');
					const originalIcon = '<i class="fa-solid fa-microphone text-xl"></i>';
					
					// ฟังก์ชันสำหรับคืนค่าปุ่ม (ใช้ร่วมกันทั้งตอนจบและตอน Error)
					function resetBtn() {
						if (btn) {
							btn.innerHTML = originalIcon;
							btn.disabled = false;
							btn.classList.remove('animate-pulse'); // หยุด Effect ถ้ามี
						}
					}

					// 1. ลองสั่งหยุดของเก่าก่อน (เผื่อค้าง)
					try {
						recognition.abort(); 
					} catch (e) { 
						// ปล่อยผ่านถ้าไม่มีอะไรทำงานอยู่
					}

					// 2. เปลี่ยนไอคอนเป็นกำลังฟัง
					if (btn) {
						btn.innerHTML = '<i class="fa-solid fa-microphone-lines text-xl fa-beat text-red-500"></i>';
						btn.disabled = true;
					}

					// 3. เริ่มดักจับเสียง
					try {
						recognition.start();
					} catch (err) {
						console.error("Voice Start Error:", err);
						resetBtn();
						// ถ้า Error เพราะเปิดซ้ำ (Already started) ไม่ต้องแจ้งเตือน
						if (err.name !== 'InvalidStateError') {
							Swal.fire('ข้อผิดพลาด', 'ไม่สามารถเริ่มไมโครโฟนได้: ' + err.message, 'error');
						}
						return;
					}

					// --- Events ---
					recognition.onresult = (event) => {
						const transcript = event.results[0][0].transcript;
						console.log('Modal Voice transcript:', transcript);

						const parsed = parseVoiceInput(transcript);
						if (!parsed) {
							// แจ้งเตือน (แบบใหม่)
                            showToast("ไม่เข้าใจคำสั่งเสียง", "warning");
							resetBtn();
							return;
						}

						const { type, name, amount, description } = parsed;
						const category = autoSelectCategory(parsed.name, parsed.type);

						// --- เติมข้อมูลลงฟอร์ม ---
						const getEl = (id) => document.getElementById(id);

						if (name) getEl('tx-name').value = name;
						if (amount) {
							getEl('tx-amount').value = amount;
							// Trigger event ให้ระบบคำนวณทำงาน (เผื่อมี logic อื่น)
							getEl('tx-amount').dispatchEvent(new Event('keyup'));
						}
						
						if (description) {
								const currentDesc = getEl('tx-desc').value;
								getEl('tx-desc').value = currentDesc ? currentDesc + ' ' + description : description;
						}

						// อัปเดตประเภทและหมวดหมู่
						const currentType = document.querySelector('input[name="tx-type"]:checked').value;
						if (currentType !== type) {
							document.querySelector(`input[name="tx-type"][value="${type}"]`).checked = true;
							updateCategoryDropdown(type); 
							updateFormVisibility();       
						}

						// ใน setTimeout ที่มีอยู่แล้ว
						setTimeout(() => {
							if (getEl('tx-category')) {
								getEl('tx-category').value = category;
							}
							// ปรับ hint
							const hintEl = getEl('auto-fill-hint');
							if (hintEl) {
								hintEl.innerHTML = `<i class="fa-solid fa-magic"></i> เติมข้อมูลจากเสียง (หมวดหมู่: ${escapeHTML(category)})`;
								hintEl.classList.remove('hidden');
								setTimeout(() => hintEl.classList.add('hidden'), 4000);
							}
						}, 100);
					};

					recognition.onerror = (event) => {
						console.error('Speech recognition error', event.error);
						if (event.error === 'no-speech') {
							// ไม่ต้องแจ้งเตือนอะไรมาก แค่คืนค่าปุ่ม
						} else if (event.error === 'aborted') {
							// ผู้ใช้กดหยุดเอง หรือระบบสั่งหยุด
						} else {
							Swal.fire('ข้อผิดพลาด', 'การจดจำเสียงขัดข้อง: ' + event.error, 'error');
						}
						resetBtn();
					};

					recognition.onend = () => {
						resetBtn();
					};
				}
				
				/* =======================================================
				   [NEW V6] BUDGET FUNCTIONS
				   ======================================================= */

				// 1. ฟังก์ชันเตรียม Dropdown หมวดหมู่ในหน้าตั้งค่า
				function populateBudgetCategoryDropdown() {
					const dropdown = document.getElementById('input-budget-category');
					if (!dropdown) return;
					dropdown.innerHTML = '';
					
					// ดึงเฉพาะหมวดหมู่รายจ่าย
					const expenses = state.categories.expense || [];
					if (expenses.length === 0) {
						dropdown.innerHTML = '<option value="">ไม่มีหมวดหมู่</option>';
						return;
					}
					
					expenses.forEach(cat => {
						// เช็คว่าหมวดหมู่นี้ตั้งงบไปแล้วหรือยัง
						const exists = state.budgets.find(b => b.category === cat);
						const label = exists ? `${cat} (ตั้งแล้ว: ${formatCurrency(exists.amount)})` : cat;
						dropdown.insertAdjacentHTML('beforeend', `<option value="${escapeHTML(cat)}">${label}</option>`);
					});
				}

				// 2. ฟังก์ชันเรนเดอร์รายการในหน้าตั้งค่า
				function renderBudgetSettingsList() {
					const listEl = document.getElementById('list-budget-settings');
					if (!listEl) return;
					listEl.innerHTML = '';
					
					if (state.budgets.length === 0) {
						listEl.innerHTML = '<li class="text-gray-500 text-center p-2">ยังไม่ได้ตั้งงบประมาณ</li>';
						return;
					}

					state.budgets.forEach(budget => {
						// [แก้ไข] ปรับ Style ปุ่มให้เหมือนหัวข้ออื่น (สีน้ำเงิน/สีแดง ไม่มีพื้นหลัง)
						const li = `
							<li class="flex justify-between items-center bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
								<div>
									<span class="font-bold text-gray-700">${escapeHTML(budget.category)}</span>
									<span class="text-sm text-gray-500 block">วงเงิน: ${formatCurrency(budget.amount)}</span>
								</div>
								<div class="flex gap-2">
									<button class="text-blue-500 hover:text-blue-700 p-2 transition-colors" onclick="editBudget('${escapeHTML(budget.category)}')">
										<i class="fa-solid fa-pencil"></i>
									</button>
									<button class="text-red-500 hover:text-red-700 p-2 transition-colors" onclick="deleteBudget('${escapeHTML(budget.category)}')">
										<i class="fa-solid fa-trash-alt"></i>
									</button>
								</div>
							</li>`;
						listEl.insertAdjacentHTML('beforeend', li);
					});
				}

				// 3. ฟังก์ชันบันทึกงบประมาณ
				async function handleAddBudget(e) {
					e.preventDefault();
					const category = document.getElementById('input-budget-category').value;
					const amount = parseFloat(document.getElementById('input-budget-amount').value);

					if (!category || isNaN(amount) || amount <= 0) {
						Swal.fire('ข้อมูลไม่ถูกต้อง', 'กรุณาเลือกหมวดหมู่และใส่วงเงินให้ถูกต้อง', 'warning');
						return;
					}

					const newBudget = { category, amount };
					try {
						await dbPut(STORE_BUDGETS, newBudget);

						const idx = state.budgets.findIndex(b => b.category === category);
						if (idx >= 0) state.budgets[idx] = newBudget;
						else state.budgets.push(newBudget);

						// ✅ ADD ACTIVITY LOG
						const actionType = idx >= 0 ? '✏️ แก้ไขงบประมาณ' : '📊 เพิ่มงบประมาณ';
						addActivityLog(
							actionType,
							`${category} ${formatCurrency(amount)}`,
							'fa-sack-dollar',
							'text-orange-600'
						);

						renderBudgetSettingsList();
						populateBudgetCategoryDropdown();
						document.getElementById('form-add-budget').reset();
						renderBudgetWidget();
						Swal.fire('สำเร็จ', `ตั้งงบประมาณหมวด <b>${category}</b> เรียบร้อย`, 'success');
					} catch (err) {
						console.error(err);
						Swal.fire('Error', 'บันทึกไม่สำเร็จ', 'error');
					}
				}
				
				// [NEW] ฟังก์ชันแก้ไขงบประมาณ (ต้องใส่รหัสผ่าน)
				window.editBudget = async (category) => {
					const hasPermission = await promptForPassword('ยืนยันรหัสผ่านเพื่อแก้ไขงบประมาณ');
					if (!hasPermission) return;

					const budget = state.budgets.find(b => b.category === category);
					if (!budget) return;

					const { value: newAmount } = await Swal.fire({
						title: `แก้ไขงบหมวด: ${category}`,
						input: 'number',
						inputLabel: 'กำหนดวงเงินใหม่ (บาท)',
						inputValue: budget.amount,
						showCancelButton: true,
						confirmButtonColor: '#3b82f6',
						confirmButtonText: 'บันทึกแก้ไข',
						cancelButtonText: 'ยกเลิก',
						inputValidator: (value) => {
							if (!value || value <= 0) return 'กรุณาใส่วงเงินที่ถูกต้อง';
						}
					});

					if (newAmount) {
						try {
							const updatedBudget = { category, amount: parseFloat(newAmount) };
							await dbPut(STORE_BUDGETS, updatedBudget);

							const idx = state.budgets.findIndex(b => b.category === category);
							if (idx >= 0) state.budgets[idx] = updatedBudget;

							// ✅ ADD ACTIVITY LOG
							addActivityLog(
								'✏️ แก้ไขงบประมาณ',
								`${category} → ${formatCurrency(updatedBudget.amount)}`,
								'fa-pencil',
								'text-blue-600'
							);

							renderBudgetSettingsList();
							renderBudgetWidget();
							Swal.fire('เรียบร้อย', 'แก้ไขวงเงินงบประมาณแล้ว', 'success');
						} catch (err) {
							console.error(err);
							Swal.fire('Error', 'บันทึกไม่สำเร็จ', 'error');
						}
					}
				};

				// [UPDATE] ฟังก์ชันลบงบประมาณ (ต้องใส่รหัสผ่าน)
				window.deleteBudget = async (category) => {
					const hasPermission = await promptForPassword('ยืนยันรหัสผ่านเพื่อลบงบประมาณ');
					if (!hasPermission) return;

					const result = await Swal.fire({
						title: 'ยืนยันการลบ?',
						text: `คุณต้องการลบงบประมาณหมวด "${category}" ใช่ไหม?`,
						icon: 'warning',
						showCancelButton: true,
						confirmButtonColor: '#d33',
						confirmButtonText: 'ลบเลย',
						cancelButtonText: 'ยกเลิก'
					});

					if (result.isConfirmed) {
						try {
							await dbDelete(STORE_BUDGETS, category);
							state.budgets = state.budgets.filter(b => b.category !== category);

							// ✅ ADD ACTIVITY LOG
							addActivityLog(
								'🗑️ ลบงบประมาณ',
								category,
								'fa-trash',
								'text-red-600'
							);

							renderBudgetSettingsList();
							populateBudgetCategoryDropdown();
							renderBudgetWidget();
							Swal.fire('ลบแล้ว', 'รายการงบประมาณถูกลบเรียบร้อย', 'success');
						} catch (err) {
							console.error(err);
							Swal.fire('Error', 'ลบไม่สำเร็จ', 'error');
						}
					}
				};

				// 5. ฟังก์ชันคำนวณและแสดงผล Widget หน้าแรก (รองรับการดูย้อนหลัง)
				function renderBudgetWidget() {
					const widget = document.getElementById('home-budget-widget');
					const container = document.getElementById('budget-list-container');
					if (!widget || !container) return;

					if (state.budgets.length === 0) {
						widget.classList.add('hidden');
						return;
					}
					
					widget.classList.remove('hidden');
					container.innerHTML = '';

					// ใช้ state.homeCurrentDate เพื่อให้ดูเดือนที่เลือกอยู่ (ไม่ใช่แค่เดือนปัจจุบัน)
					const selectedDate = new Date(state.homeCurrentDate);
					const selectedMonth = selectedDate.getMonth();
					const selectedYear = selectedDate.getFullYear();

					const now = new Date();
					const currentRealMonth = now.getMonth();
					const currentRealYear = now.getFullYear();

					const isCurrentMonth = (selectedMonth === currentRealMonth && selectedYear === currentRealYear);
					const isPastMonth = (selectedYear < currentRealYear) || (selectedYear === currentRealYear && selectedMonth < currentRealMonth);

					// อัปเดตหัวข้อ Widget
					const monthName = selectedDate.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' });
					const headerTitle = widget.querySelector('h2');
					if (headerTitle) {
						headerTitle.innerHTML = `<i class="fa-solid fa-bullseye text-red-500 mr-2"></i> งบประมาณ (${monthName})`;
					}

					const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
					
					let daysRemaining = 0;
					if (isCurrentMonth) {
						daysRemaining = daysInMonth - now.getDate();
					} else if (!isPastMonth) {
						daysRemaining = daysInMonth;
					} 

					const expensesInSelectedMonth = state.transactions.filter(tx => {
						const d = new Date(tx.date);
						return tx.type === 'expense' && d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
					});

					state.budgets.forEach(budget => {
						const spent = expensesInSelectedMonth
							.filter(tx => tx.category === budget.category)
							.reduce((sum, tx) => sum + tx.amount, 0);

						const percent = Math.min((spent / budget.amount) * 100, 100);
						const remaining = budget.amount - spent;
						
						let barColor = 'bg-green-500';
						let statusText = 'ปกติ';
						let statusClass = 'text-green-600';

						if (percent >= 100) {
							barColor = 'bg-red-600';
							statusText = 'เกินงบแล้ว!';
							statusClass = 'text-red-600 font-bold'; 
							if (isCurrentMonth) statusClass += ' animate-pulse';
						} else if (percent >= 80) {
							barColor = 'bg-red-500';
							statusText = 'วิกฤต';
							statusClass = 'text-red-500 font-bold';
						} else if (percent >= 50) {
							barColor = 'bg-yellow-400';
							statusText = 'ระวัง';
							statusClass = 'text-yellow-600';
						}

						let adviceHtml = '';
						if (isCurrentMonth) {
							if (remaining > 0 && daysRemaining > 0) {
								const dailySafe = remaining / daysRemaining;
								adviceHtml = `<div class="text-xs text-gray-500 mt-1 flex items-center gap-1">
									<i class="fa-solid fa-calendar-day text-blue-400"></i> ใช้ได้อีกวันละ <span class="font-bold text-blue-600">${formatCurrency(dailySafe)}</span> (เหลือ ${daysRemaining} วัน)
								</div>`;
							} else if (remaining <= 0) {
								adviceHtml = `<div class="text-xs text-red-500 mt-1 font-bold">งบหมดแล้ว! พยายามลดรายจ่ายนะ</div>`;
							}
						} else if (isPastMonth) {
							if (remaining >= 0) {
								adviceHtml = `<div class="text-xs text-green-600 mt-1 flex items-center gap-1">
									<i class="fa-solid fa-check-circle"></i> ปิดงบเดือนนี้: <span class="font-bold">ประหยัดได้ ${formatCurrency(remaining)}</span> เยี่ยมมาก!
								</div>`;
							} else {
								adviceHtml = `<div class="text-xs text-red-500 mt-1 flex items-center gap-1">
									<i class="fa-solid fa-circle-exclamation"></i> ปิดงบเดือนนี้: <span class="font-bold">เกินงบไป ${formatCurrency(Math.abs(remaining))}</span>
								</div>`;
							}
						} else {
							 adviceHtml = `<div class="text-xs text-gray-400 mt-1">วางแผนล่วงหน้า</div>`;
						}

						// เพิ่ม class 'budget-item-click' เพื่อใช้อ้างอิง
						const html = `
							<div class="budget-item-click cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors border border-transparent hover:border-gray-200" data-category="${escapeHTML(budget.category)}">
								<div class="flex justify-between items-end mb-1">
									<span class="font-bold text-gray-700 text-sm">${escapeHTML(budget.category)} <i class="fa-solid fa-chevron-right text-gray-300 text-xs ml-1"></i></span>
									<span class="text-xs ${statusClass}">${statusText} (${Math.round(percent)}%)</span>
								</div>
								
								<div class="w-full bg-gray-200 rounded-full h-3 relative overflow-hidden dark:bg-gray-700">
									<div class="${barColor} h-3 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(0,0,0,0.2)]" style="width: ${percent}%"></div>
								</div>

								<div class="flex justify-between items-center mt-1">
									<span class="text-xs text-gray-500">${formatCurrency(spent)} / ${formatCurrency(budget.amount)}</span>
									<span class="text-xs font-bold ${remaining < 0 ? 'text-red-500' : 'text-gray-500'}">
										${remaining >= 0 ? 'คงเหลือ ' + formatCurrency(remaining) : 'เกิน ' + formatCurrency(Math.abs(remaining))}
									</span>
								</div>
								${adviceHtml}
							</div>
						`;
						container.insertAdjacentHTML('beforeend', html);
					});

					// [NEW] เพิ่มส่วนคลิกแล้วเด้งไปหน้ารายการ (Advanced Filter)
					container.querySelectorAll('.budget-item-click').forEach(item => {
						item.addEventListener('click', () => {
							const category = item.dataset.category;
							
							// 1. ตั้งค่า Filter ให้เป็น "รายจ่าย" + "ชื่อหมวดที่กด"
							state.advFilterType = 'expense';
							state.advFilterSearch = category;
							
							// 2. ตั้งวันที่ให้ตรงกับเดือนที่ดูอยู่บน Dashboard
							const d = new Date(state.homeCurrentDate);
							const y = d.getFullYear();
							const m = d.getMonth();
							// วันแรกของเดือน - วันสุดท้ายของเดือน
							state.advFilterStart = new Date(y, m, 1).toISOString().slice(0, 10);
							state.advFilterEnd = new Date(y, m + 1, 0).toISOString().slice(0, 10);
							
							// 3. อัปเดต UI ของตัวกรองหน้า List
							const startEl = document.getElementById('adv-filter-start');
							const endEl = document.getElementById('adv-filter-end');
							const typeEl = document.getElementById('adv-filter-type');
							const searchEl = document.getElementById('adv-filter-search');
							
							if (startEl) startEl.value = state.advFilterStart;
							if (endEl) endEl.value = state.advFilterEnd;
							if (typeEl) typeEl.value = 'expense';
							if (searchEl) searchEl.value = category;

							// 4. กระโดดไปหน้า List และสั่งค้นหาทันที
							showPage('page-list');
							if (typeof renderListPage === 'function') {
								renderListPage();
							}
						});
					});
				}
				
				// ฟังก์ชันอัปเดตระบบและล้างแคช (แก้ปัญหาโค้ดไม่เปลี่ยนในมือถือ)
				async function handleSystemUpdate() {
					const result = await Swal.fire({
						title: 'อัปเดตระบบ?',
						text: "ระบบจะทำการล้างแคชและโหลดโค้ดเวอร์ชันล่าสุด (ข้อมูลบัญชีจะไม่หาย)",
						icon: 'question',
						showCancelButton: true,
						confirmButtonColor: '#f97316',
						confirmButtonText: 'อัปเดตทันที',
						cancelButtonText: 'ยกเลิก',
						customClass: { popup: state.isDarkMode ? 'swal2-popup' : '' },
						background: state.isDarkMode ? '#1a1a1a' : '#fff',
						color: state.isDarkMode ? '#e5e7eb' : '#545454'
					});

					if (result.isConfirmed) {
						Swal.fire({
							title: 'กำลังอัปเดต...',
							html: 'กรุณารอสักครู่ ระบบกำลังดึงข้อมูลล่าสุด',
							allowOutsideClick: false,
							didOpen: () => { Swal.showLoading(); }
						});

						try {
							// 1. ถอนการติดตั้ง Service Worker ตัวเก่า (ตัวการที่จำไฟล์)
							if ('serviceWorker' in navigator) {
								const registrations = await navigator.serviceWorker.getRegistrations();
								for (const registration of registrations) {
									await registration.unregister();
								}
							}

							// 2. ลบ Cache Storage ทั้งหมด
							if ('caches' in window) {
								const keys = await caches.keys();
								await Promise.all(keys.map(key => caches.delete(key)));
							}

							// 3. รีโหลดหน้าจอแบบ Force Reload
							setTimeout(() => {
								window.location.reload(true);
							}, 1000);

						} catch (error) {
							console.error("Update failed:", error);
							// ถ้าพัง ให้รีโหลดธรรมดา
							window.location.reload();
						}
					}
				}
				
				// ============================================
				// BIOMETRIC AUTHENTICATION FUNCTIONS
				// ============================================

				// 1. ลงทะเบียน (Register) - ผูกเครื่องนี้กับแอพ
				async function registerBiometric() {
					if (!window.PublicKeyCredential) {
						Swal.fire('ไม่รองรับ', 'อุปกรณ์นี้ไม่รองรับการสแกนนิ้ว/ใบหน้า', 'error');
						return;
					}

					const hasPermission = await promptForPassword('ยืนยันรหัสผ่านเพื่อตั้งค่าสแกนนิ้ว');
					if (!hasPermission) return;

					Swal.fire({
						title: 'กำลังลงทะเบียน...',
						text: 'กรุณาสแกนลายนิ้วมือหรือใบหน้า',
						allowOutsideClick: false,
						didOpen: () => { Swal.showLoading(); }
					});

					try {
						const challenge = new Uint8Array(32);
						window.crypto.getRandomValues(challenge);

						const publicKey = {
							challenge: challenge,
							rp: { name: "Finance Manager Pro (Local)" },
							user: {
								id: new Uint8Array(16),
								name: "user",
								displayName: "Device Owner"
							},
							pubKeyCredParams: [{ alg: -7, type: "public-key" }, { alg: -257, type: "public-key" }],
							authenticatorSelection: { authenticatorAttachment: "platform", userVerification: "required" },
							timeout: 60000
						};

						const credential = await navigator.credentials.create({ publicKey });
						const credentialId = bufferToBase64url(credential.rawId);
						localStorage.setItem('local_biometric_id', credentialId);
						state.biometricId = credentialId;

						// ✅ ADD ACTIVITY LOG
						addActivityLog(
							'🖐️ เปิดใช้งาน Biometric',
							'สแกนนิ้ว/ใบหน้า',
							'fa-fingerprint',
							'text-blue-600'
						);

						renderSettings();
						Swal.fire('สำเร็จ', 'เปิดใช้งานสแกนนิ้ว/ใบหน้าสำหรับเครื่องนี้แล้ว', 'success');
					} catch (err) {
						console.error(err);
						Swal.fire('ล้มเหลว', 'การลงทะเบียนถูกยกเลิกหรือไม่สำเร็จ', 'error');
					}
				}

				// 2. ยกเลิก (Unregister)
				async function removeBiometric() {
					const hasPermission = await promptForPassword('ยืนยันรหัสผ่านเพื่อยกเลิกสแกนนิ้ว');
					if (!hasPermission) return;

					const result = await Swal.fire({
						title: 'ยกเลิกการสแกน?',
						text: "คุณจะต้องใช้รหัสผ่านในการเข้าใช้งานแทน",
						icon: 'warning',
						showCancelButton: true,
						confirmButtonColor: '#d33',
						confirmButtonText: 'ยกเลิกการใช้',
						cancelButtonText: 'กลับ'
					});

					if (result.isConfirmed) {
						localStorage.removeItem('local_biometric_id');
						state.biometricId = null;

						// ✅ ADD ACTIVITY LOG
						addActivityLog(
							'🖐️ ปิดใช้งาน Biometric',
							'สแกนนิ้ว/ใบหน้า',
							'fa-fingerprint',
							'text-gray-600'
						);

						renderSettings();
						Swal.fire('เรียบร้อย', 'ยกเลิกการสแกนนิ้วบนเครื่องนี้แล้ว', 'success');
					}
				}
				// 3. ตรวจสอบตัวตน (Verify) - ใช้ตอน Login หรือ Prompt
				async function verifyBiometricIdentity() {
					if (!state.biometricId) return false;

					try {
						const savedIdBuffer = base64urlToBuffer(state.biometricId);
						const challenge = new Uint8Array(32);
						window.crypto.getRandomValues(challenge);

						const publicKey = {
							challenge: challenge,
							allowCredentials: [{
								id: savedIdBuffer,
								type: 'public-key',
								transports: ['internal']
							}],
							userVerification: "required"
						};

						const assertion = await navigator.credentials.get({ publicKey });
						
						if (assertion) {
							return true; // สแกนผ่าน
						}
					} catch (err) {
						console.error("Biometric verify failed:", err);
					}
					return false;
				}
				
				// --- ฟังก์ชันส่งแจ้งเตือน LINE (เวอร์ชันรองรับรายการล่วงหน้า) ---
				async function sendLineAlert(transactionData, action = 'add') {
					
					// ตรวจสอบว่า action นี้ได้รับอนุญาตให้แจ้งเตือนหรือไม่
					const notifyActions = state.lineNotifyActions || { add: true, edit: true, delete: true };
					if (!notifyActions[action]) {
						console.log(`LINE Alert: Skipped ${action} (disabled by user)`);
						return; // ไม่ต้องแจ้งเตือน
					}

					// 1. ดึงรายการ ID ทั้งหมด
					let targetIds = [];
					try {
						const config = await dbGet(STORE_CONFIG, 'lineUserIds_List');
						if (config && Array.isArray(config.value)) {
							targetIds = config.value.map(item => (typeof item === 'string') ? item : item.id);
						}
					} catch (e) { console.error(e); }

					if (targetIds.length === 0) return;

					// 2. ตรวจสอบว่าเป็นรายการล่วงหน้าหรือไม่
					const txDate = new Date(transactionData.date);
					const now = new Date();
					// ถ้าเวลาในรายการมากกว่าเวลาปัจจุบัน ให้ถือว่าเป็นรายการล่วงหน้า
					const isFuture = txDate > now;
					
					// 3. เตรียม Header ตาม Action และสถานะเวลา
					let headerText = '';
					if (action === 'add') {
						headerText = isFuture ? '📅 เพิ่มรายการใหม่ล่วงหน้า' : '✨ เพิ่มรายการใหม่';
					} else if (action === 'edit') {
						headerText = isFuture ? '📝 แก้ไขรายการล่วงหน้า' : '✏️ แก้ไขรายการ';
					} else if (action === 'delete') {
						headerText = isFuture ? '🗑️ ลบรายการล่วงหน้า' : '🗑️ ลบรายการ';
					}

					// 4. เตรียมรายละเอียดข้อมูล
					const typeText = transactionData.type === 'income' ? '🟢 รายรับ' : (transactionData.type === 'expense' ? '🔴 รายจ่าย' : '🔵 โอนย้าย');
					const amountText = Number(transactionData.amount).toLocaleString('th-TH');
					
					let accountInfo = '';
					if (transactionData.type === 'transfer') {
						const fromAcc = state.accounts.find(a => a.id === transactionData.accountId);
						const toAcc = state.accounts.find(a => a.id === transactionData.toAccountId);
						accountInfo = `\n🏦 จาก: ${fromAcc ? fromAcc.name : 'ไม่ระบุ'}\n➡️ ไป: ${toAcc ? toAcc.name : 'ไม่ระบุ'}`;
					} else {
						const acc = state.accounts.find(a => a.id === transactionData.accountId);
						const accLabel = transactionData.type === 'income' ? 'เข้าบัญชี' : 'จากบัญชี';
						accountInfo = `\n🏦 ${accLabel}: ${acc ? acc.name : 'ไม่ระบุ'}`;
					}
					
					const dateText = txDate.toLocaleString('th-TH', { 
						year: 'numeric', month: 'short', day: 'numeric', 
						hour: '2-digit', minute: '2-digit' 
					});

					const descText = transactionData.desc ? `\n📝 บันทึก: ${transactionData.desc}` : '';

					// 5. ประกอบข้อความ
					const message = `${headerText}${accountInfo}\n${typeText}: ${transactionData.name}\n💰 จำนวน: ${amountText} บาท\n📂 หมวดหมู่: ${transactionData.category || '-'}\n📅 วันที่: ${dateText}${descText}`;

					// 6. ส่งข้อมูลไปยัง LINE Notify (ผ่าน Google Apps Script)
					const GAS_URL = window.LINE_CONFIG ? window.LINE_CONFIG.NOTIFY_GAS_URL : '';
					try {
						await fetch(GAS_URL, {
							method: 'POST',
							mode: 'no-cors',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify({ userIds: targetIds, message: message })
						});
						console.log(`ส่ง LINE Alert (${isFuture ? 'Future' : 'Normal'}) เรียบร้อย`);
					} catch (error) {
						console.error('ส่ง LINE ไม่ผ่าน:', error);
					}
				}
				
				// ============================================
				// ฟังก์ชันแจ้งเตือนแบบใหม่ (ซ้ายบน + ดีไซน์สวย)
				// ============================================
				function showToast(title, icon = 'success') {
					// เช็ค Dark Mode จากตัวแปร state ที่มีอยู่แล้วในไฟล์
					const isDark = state.isDarkMode; 

					const Toast = Swal.mixin({
						toast: true,
						// กำหนดตำแหน่งเป็น 'ซ้ายบน'
						position: 'top-start', 
						
						showConfirmButton: false,
						timer: 1500,
						timerProgressBar: true,
						
						// ปรับธีมสีให้เข้ากับแอป
						background: isDark ? '#1a1a1a' : '#ffffff',
						color: isDark ? '#e5e7eb' : '#1f2937',
						iconColor: icon === 'success' ? '#10b981' : (icon === 'error' ? '#ef4444' : '#3b82f6'),
						
						// ใช้ Tailwind Class ตกแต่ง (มุมโค้ง, เงา, ฟอนต์)
						customClass: {
							popup: 'rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 font-prompt mt-16 ml-2', // mt-16 เพื่อหลบ Header ด้านบนนิดนึง
							title: 'text-sm font-medium'
						},
						
						didOpen: (toast) => {
							toast.addEventListener('mouseenter', Swal.stopTimer)
							toast.addEventListener('mouseleave', Swal.resumeTimer)
						}
					});

					Toast.fire({
						icon: icon,
						title: title
					});
				}

            // Start the application
            initApp();
			
			window.showPage = showPage;
			window.openModal = openModal;
			window.startVoiceRecognition = startVoiceRecognition;
			window.handleSummaryCardClick = handleSummaryCardClick;   // ตอนนี้มีค่าแล้ว
			window.exportFilteredList = exportFilteredList;
			window.triggerReceiptUpload = function() {
				document.getElementById('home-receipt-input')?.click();
			};
			
			// ============================================
			// ฟังก์ชันสำหรับ Modal สาธิตในคู่มือ (Interactive Guide)
			// ============================================

			window.showDemoModal = function(title, content) {
				Swal.fire({
					title: title,
					html: content,
					icon: 'info',
					confirmButtonText: 'ปิด',
					customClass: {
						popup: 'rounded-3xl p-6 max-w-lg',
						title: 'text-2xl font-bold text-purple-600 dark:text-purple-400',
						htmlContainer: 'text-left text-gray-700 dark:text-gray-300 text-base'
					},
					background: document.body.classList.contains('dark') ? '#1a1a1a' : '#ffffff',
					color: document.body.classList.contains('dark') ? '#e5e7eb' : '#1f2937'
				});
			};

			// ============================================
			// ฟังก์ชัน Modal สาธิตสำหรับทุกฟังก์ชัน (ปรับปรุงใหม่)
			// ============================================

			window.showPwaDemo = function() {
				showDemoModal(
					'📱 ติดตั้งแอป (PWA)',
					`<div class="text-center space-y-4">
						<div class="text-6xl text-purple-600">
							<i class="fa-solid fa-mobile-screen-button"></i>
						</div>
						<p class="text-gray-700 dark:text-gray-300">ติดตั้งแอปไว้ที่หน้าจอโฮมเพื่อใช้งานได้เหมือนแอปทั่วไป รองรับการใช้งานแบบออฟไลน์</p>
						<div class="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl text-left">
							<p class="font-bold flex items-center gap-2 text-purple-700 dark:text-purple-300"><i class="fa-brands fa-android text-green-600"></i> Android / Chrome</p>
							<p class="text-sm ml-6 text-gray-600 dark:text-gray-400">กดเมนูสามจุด → “ติดตั้งแอป” หรือ “Add to Home screen”</p>
							<p class="font-bold flex items-center gap-2 mt-2 text-purple-700 dark:text-purple-300"><i class="fa-brands fa-apple text-gray-600"></i> iPhone / Safari</p>
							<p class="text-sm ml-6 text-gray-600 dark:text-gray-400">กดไอคอนแชร์ → “เพิ่มไปยังหน้าจอโฮม”</p>
						</div>
						<button onclick="Swal.close(); showPage('page-settings');" class="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-full text-sm font-bold shadow-md transition">
							<i class="fa-regular fa-eye mr-1"></i> ดูหน้าตั้งค่า
						</button>
					</div>`
				);
			};

			window.showPasswordDemo = function() {
				showDemoModal(
					'🔑 รหัสผ่านเริ่มต้น',
					`<div class="text-center space-y-4">
						<div class="text-6xl text-green-600">
							<i class="fa-solid fa-key"></i>
						</div>
						<p class="text-gray-700 dark:text-gray-300">รหัสผ่านเริ่มต้นคือ <span class="font-mono bg-gray-200 dark:bg-gray-700 px-3 py-1 rounded-lg text-purple-700 dark:text-purple-400 text-lg">1234</span></p>
						<p class="text-sm text-gray-500 dark:text-gray-400">ควรเปลี่ยนทันทีที่เข้าสู่ระบบครั้งแรก</p>
						<div class="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-xl text-left text-sm">
							<p class="font-bold text-yellow-800 dark:text-yellow-400 flex items-center gap-2"><i class="fa-solid fa-lightbulb"></i> วิธีเปลี่ยน</p>
							<p class="text-gray-600 dark:text-gray-400 ml-6">ไปที่ <span class="bg-purple-100 dark:bg-purple-900/30 px-2 py-0.5 rounded text-purple-700 dark:text-purple-400">ตั้งค่า → จัดการรหัสผ่าน</span></p>
						</div>
						<button onclick="Swal.close(); showPage('page-settings');" class="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-full text-sm font-bold shadow-md transition">
							<i class="fa-solid fa-gear mr-1"></i> ไปที่ตั้งค่า
						</button>
					</div>`
				);
			};

			window.showBiometricDemo = function() {
				showDemoModal(
					'🖐️ Biometric',
					`<div class="text-center space-y-4">
						<div class="text-6xl text-blue-600">
							<i class="fa-solid fa-fingerprint"></i>
						</div>
						<p class="text-gray-700 dark:text-gray-300">ใช้ลายนิ้วมือหรือใบหน้าแทนรหัสผ่าน เพื่อความสะดวกและปลอดภัย</p>
						<div class="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl text-left text-sm">
							<p class="font-bold text-blue-800 dark:text-blue-400 flex items-center gap-2"><i class="fa-solid fa-circle-check"></i> เงื่อนไข</p>
							<ul class="list-disc list-inside text-gray-600 dark:text-gray-400 ml-2">
								<li>อุปกรณ์ต้องรองรับ (มีเซ็นเซอร์สแกน)</li>
								<li>ต้องตั้งรหัสผ่านไว้ก่อน</li>
							</ul>
						</div>
						<button onclick="Swal.close(); showPage('page-settings');" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full text-sm font-bold shadow-md transition">
							<i class="fa-solid fa-gear mr-1"></i> ตั้งค่า Biometric
						</button>
					</div>`
				);
			};

			window.showSummaryCardDemo = function() {
				showDemoModal(
					'💳 การ์ดสรุป',
					`<div class="space-y-4">
						<div class="grid grid-cols-3 gap-2">
							<div class="bg-green-100 dark:bg-green-900/30 p-2 rounded-lg text-center">
								<i class="fa-solid fa-arrow-down text-green-600 text-xl"></i>
								<div class="text-xs font-bold text-green-800 dark:text-green-400">รายรับ</div>
							</div>
							<div class="bg-red-100 dark:bg-red-900/30 p-2 rounded-lg text-center">
								<i class="fa-solid fa-arrow-up text-red-600 text-xl"></i>
								<div class="text-xs font-bold text-red-800 dark:text-red-400">รายจ่าย</div>
							</div>
							<div class="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg text-center">
								<i class="fa-solid fa-wallet text-blue-600 text-xl"></i>
								<div class="text-xs font-bold text-blue-800 dark:text-blue-400">คงเหลือ</div>
							</div>
						</div>
						<p class="text-gray-700 dark:text-gray-300 text-sm">คลิกที่การ์ดเพื่อกรองรายการตามประเภทนั้น ๆ ทันที เช่น คลิกการ์ดรายจ่าย จะพาไปหน้ารายการพร้อมกรองเฉพาะรายจ่าย</p>
						<button onclick="Swal.close(); showPage('page-home');" class="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-full text-sm font-bold shadow-md transition">
							<i class="fa-regular fa-eye mr-1"></i> ดูตัวอย่างที่หน้าแรก
						</button>
					</div>`
				);
			};

			window.showBudgetDemo = function() {
				showDemoModal(
					'📊 งบประมาณรายจ่าย',
					`<div class="space-y-4">
						<div class="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-xl">
							<p class="font-bold text-orange-800 dark:text-orange-400 mb-2">หมวดหมู่: อาหารและเครื่องดื่ม</p>
							<div class="w-full bg-gray-200 rounded-full h-4 mb-1">
								<div class="bg-green-500 h-4 rounded-full" style="width: 45%"></div>
							</div>
							<p class="text-sm text-gray-600 dark:text-gray-400">ใช้ไป 2,250 / 5,000 บาท (45%)</p>
							<p class="text-xs text-gray-500 mt-2">คลิกที่หมวดหมู่เพื่อดูรายการเจาะลึก</p>
						</div>
						<p class="text-sm text-gray-700 dark:text-gray-300">ตั้งวงเงินแต่ละหมวดหมู่ที่หน้า <span class="bg-purple-100 dark:bg-purple-900/30 px-2 py-0.5 rounded text-purple-700 dark:text-purple-400">บัญชี → ตั้งค่างบประมาณ</span></p>
						<button onclick="Swal.close(); showPage('page-accounts');" class="w-full bg-orange-600 hover:bg-orange-700 text-white py-2 rounded-full text-sm font-bold shadow-md transition">
							<i class="fa-solid fa-gear mr-1"></i> จัดการงบประมาณ
						</button>
					</div>`
				);
			};

			window.showAccountsSummaryDemo = function() {
				showDemoModal(
					'🏦 บัญชีทั้งหมด',
					`<div class="space-y-4">
						<div class="grid grid-cols-2 gap-2">
							<div class="bg-gray-50 dark:bg-gray-700/50 p-2 rounded-lg flex items-center gap-2">
								<i class="fa-solid fa-wallet text-purple-600"></i>
								<span class="text-sm">เงินสด</span>
							</div>
							<div class="bg-gray-50 dark:bg-gray-700/50 p-2 rounded-lg flex items-center gap-2">
								<i class="fa-solid fa-credit-card text-blue-600"></i>
								<span class="text-sm">บัตรเครดิต</span>
							</div>
						</div>
						<p class="text-sm text-gray-700 dark:text-gray-300">คลิกสั้นที่การ์ดเพื่อดูประวัติบัญชีนั้น กดค้าง (0.8 วินาที) เพื่อส่งออก Excel เฉพาะบัญชี</p>
						<button onclick="Swal.close(); showPage('page-home');" class="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-full text-sm font-bold shadow-md transition">
							<i class="fa-regular fa-eye mr-1"></i> ดูที่หน้าแรก
						</button>
					</div>`
				);
			};

			window.showAddButtonsDemo = function() {
				showDemoModal(
					'➕ ปุ่มเพิ่มรายการด่วน',
					`<div class="space-y-3">
						<div class="grid grid-cols-2 gap-2">
							<div class="bg-purple-600 text-white p-2 rounded-lg text-center text-sm">
								<i class="fa-solid fa-plus"></i> ธุรกรรม
							</div>
							<div class="bg-teal-500 text-white p-2 rounded-lg text-center text-sm">
								<i class="fa-solid fa-image"></i> รูปภาพ
							</div>
							<div class="bg-blue-500 text-white p-2 rounded-lg text-center text-sm">
								<i class="fa-solid fa-microphone"></i> เสียง
							</div>
							<div class="bg-yellow-500 text-white p-2 rounded-lg text-center text-sm">
								<i class="fa-solid fa-bolt"></i> จดด่วน
							</div>
						</div>
						<p class="text-sm text-gray-700 dark:text-gray-300">แต่ละปุ่มมีฟังก์ชันแตกต่างกัน:</p>
						<ul class="list-disc list-inside text-xs text-gray-600 dark:text-gray-400">
							<li><b>ธุรกรรม:</b> เปิดฟอร์มกรอกรายละเอียด</li>
							<li><b>รูปภาพ:</b> สแกน OCR จากใบเสร็จ</li>
							<li><b>เสียง:</b> พูดคำสั่งบันทึกรายการ</li>
							<li><b>จดด่วน:</b> บันทึกจำนวนเงินและโน๊ตไว้ก่อน</li>
						</ul>
						<button onclick="Swal.close(); showPage('page-home');" class="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-full text-sm font-bold shadow-md transition">
							<i class="fa-regular fa-eye mr-1"></i> ดูที่หน้าแรก
						</button>
					</div>`
				);
			};

			// กราฟหน้าแรก
			window.showChartHomeDemo = function() {
				showDemoModal(
					'📊 กราฟหน้าแรก',
					`<div class="space-y-3">
						<p class="text-sm text-gray-700 dark:text-gray-300">กราฟในหน้าแรกมี 2 แบบ:</p>
						<ul class="list-disc list-inside text-sm text-gray-600 dark:text-gray-400">
							<li><b>สัดส่วนรายรับ vs รายจ่าย</b> – แสดงสัดส่วนรายรับและรายจ่ายทั้งหมดในช่วงเวลาที่เลือก</li>
							<li><b>Top 10 รายจ่าย</b> – แสดง 10 รายการที่ใช้เงินสูงสุด</li>
						</ul>
						<p class="text-xs text-gray-500 mt-2">คลิกที่ส่วนของกราฟเพื่อดูรายละเอียดเพิ่มเติม</p>
						<button onclick="Swal.close(); showPage('page-home');" class="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-full text-sm font-bold shadow-md transition">
							<i class="fa-regular fa-eye mr-1"></i> ไปที่หน้าแรก
						</button>
					</div>`
				);
			};

			// กราฟหน้ารายการ
			window.showChartListDemo = function() {
				showDemoModal(
					'📈 กราฟหน้ารายการ',
					`<div class="space-y-3">
						<p class="text-sm text-gray-700 dark:text-gray-300">กราฟในหน้ารายการมี 2 แบบ:</p>
						<ul class="list-disc list-inside text-sm text-gray-600 dark:text-gray-400">
							<li><b>หมวดหมู่ (โดนัท)</b> – แสดงสัดส่วนรายจ่ายตามหมวดหมู่ (5 อันดับแรก + อื่นๆ)</li>
							<li><b>แนวโน้มตามวัน</b> – แสดงยอดรายจ่ายในแต่ละวัน (7 วันล่าสุด)</li>
						</ul>
						<p class="text-xs text-gray-500 mt-2">กราฟจะอัปเดตตามข้อมูลและช่วงเวลาที่คุณกรอง</p>
						<button onclick="Swal.close(); showPage('page-list');" class="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-full text-sm font-bold shadow-md transition">
							<i class="fa-regular fa-eye mr-1"></i> ไปที่หน้ารายการ
						</button>
					</div>`
				);
			};

			window.showFilterDemo = function() {
				showDemoModal(
					'🔍 ตัวกรองขั้นสูง',
					`<div class="space-y-3">
						<div class="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg text-sm">
							<div class="flex gap-2 mb-2">
								<span class="bg-purple-100 dark:bg-purple-900/30 px-2 py-1 rounded text-purple-700 dark:text-purple-400 text-xs">ช่วงวันที่</span>
								<span class="bg-purple-100 dark:bg-purple-900/30 px-2 py-1 rounded text-purple-700 dark:text-purple-400 text-xs">ประเภท</span>
							</div>
							<p class="text-gray-600 dark:text-gray-400">ค้นหา: <span class="bg-gray-200 dark:bg-gray-600 px-2 py-0.5 rounded text-xs">กาแฟ</span></p>
						</div>
						<p class="text-sm text-gray-700 dark:text-gray-300">กรองตามช่วงวันที่, ประเภท (รายรับ/จ่าย/โอน), และคำค้นหา (ชื่อ, หมวดหมู่, หมายเหตุ, บัญชี)</p>
						<button onclick="Swal.close(); showPage('page-list');" class="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-full text-sm font-bold shadow-md transition">
							<i class="fa-regular fa-eye mr-1"></i> ไปที่หน้ารายการ
						</button>
					</div>`
				);
			};

			window.showExportDemo = function() {
				showDemoModal(
					'📤 ส่งออก Excel',
					`<div class="text-center space-y-3">
						<div class="text-6xl text-green-600">
							<i class="fa-solid fa-file-excel"></i>
						</div>
						<p class="text-sm text-gray-700 dark:text-gray-300">กดปุ่ม Export Excel เพื่อดาวน์โหลดไฟล์ .xlsx ที่มีทั้งสรุปยอดตามเงื่อนไขและรายการละเอียด</p>
						<p class="text-xs text-gray-500">ไฟล์มีสองชีท: สรุปภาพรวม และ รายการเดินบัญชี</p>
						<button onclick="Swal.close(); exportFilteredList();" class="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-full text-sm font-bold shadow-md transition">
							<i class="fa-solid fa-download mr-1"></i> ทดลองส่งออก (ใช้ข้อมูลจริง)
						</button>
					</div>`
				);
			};

			window.showCalendarDemo = function() {
				showDemoModal(
					'📆 ปฏิทินการเงิน',
					`<div class="space-y-3">
						<div class="flex justify-center gap-3">
							<span class="w-3 h-3 rounded-full bg-green-500"></span><span class="text-xs">รายรับ</span>
							<span class="w-3 h-3 rounded-full bg-red-500"></span><span class="text-xs">รายจ่าย</span>
							<span class="w-3 h-3 rounded-full bg-blue-500"></span><span class="text-xs">โอน</span>
						</div>
						<p class="text-sm text-gray-700 dark:text-gray-300">คลิกที่วันที่เพื่อดูสรุปรายการและเพิ่มรายการ/แจ้งเตือน สามารถแสดงวันหยุด/วันพระ/ยอดเงินได้</p>
						<button onclick="Swal.close(); showPage('page-calendar');" class="w-full bg-amber-600 hover:bg-amber-700 text-white py-2 rounded-full text-sm font-bold shadow-md transition">
							<i class="fa-regular fa-eye mr-1"></i> ไปที่ปฏิทิน
						</button>
					</div>`
				);
			};

			window.showManageAccountsDemo = function() {
				showDemoModal(
					'🏦 จัดการบัญชี',
					`<div class="space-y-3">
						<div class="grid grid-cols-3 gap-1 text-center text-xs">
							<div class="bg-indigo-50 dark:bg-indigo-900/20 p-2 rounded"><i class="fa-solid fa-plus text-indigo-600"></i> เพิ่ม</div>
							<div class="bg-indigo-50 dark:bg-indigo-900/20 p-2 rounded"><i class="fa-solid fa-pencil text-indigo-600"></i> แก้ไข</div>
							<div class="bg-indigo-50 dark:bg-indigo-900/20 p-2 rounded"><i class="fa-solid fa-trash text-indigo-600"></i> ลบ</div>
							<div class="bg-indigo-50 dark:bg-indigo-900/20 p-2 rounded"><i class="fa-solid fa-arrows-up-down text-indigo-600"></i> จัดเรียง</div>
							<div class="bg-indigo-50 dark:bg-indigo-900/20 p-2 rounded"><i class="fa-solid fa-paintbrush text-indigo-600"></i> ไอคอน</div>
							<div class="bg-indigo-50 dark:bg-indigo-900/20 p-2 rounded"><i class="fa-solid fa-eye-slash text-indigo-600"></i> ซ่อน</div>
						</div>
						<p class="text-sm text-gray-700 dark:text-gray-300">สามารถปรับปรุงยอด (ดอกเบี้ย/ค่าธรรมเนียม) ได้ในหน้าการแก้ไขบัญชี</p>
						<button onclick="Swal.close(); showPage('page-accounts');" class="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-full text-sm font-bold shadow-md transition">
							<i class="fa-regular fa-eye mr-1"></i> ไปที่หน้าบัญชี
						</button>
					</div>`
				);
			};

			window.showCategoriesDemo = function() {
				showDemoModal(
					'📂 หมวดหมู่',
					`<div class="space-y-3">
						<div class="flex flex-wrap gap-2">
							<span class="bg-green-100 dark:bg-green-900/30 px-3 py-1 rounded-full text-xs text-green-700 dark:text-green-400">อาหาร</span>
							<span class="bg-green-100 dark:bg-green-900/30 px-3 py-1 rounded-full text-xs text-green-700 dark:text-green-400">เดินทาง</span>
							<span class="bg-green-100 dark:bg-green-900/30 px-3 py-1 rounded-full text-xs text-green-700 dark:text-green-400">ช้อปปิ้ง</span>
							<span class="bg-red-100 dark:bg-red-900/30 px-3 py-1 rounded-full text-xs text-red-700 dark:text-red-400">เงินเดือน</span>
							<span class="bg-red-100 dark:bg-red-900/30 px-3 py-1 rounded-full text-xs text-red-700 dark:text-red-400">รายได้เสริม</span>
						</div>
						<p class="text-sm text-gray-700 dark:text-gray-300">เพิ่ม/ลบหมวดหมู่รายรับ/รายจ่ายได้ตามต้องการ ที่หน้า <span class="bg-purple-100 dark:bg-purple-900/30 px-2 py-0.5 rounded text-purple-700 dark:text-purple-400">บัญชี → หมวดหมู่</span></p>
						<button onclick="Swal.close(); showPage('page-accounts');" class="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-full text-sm font-bold shadow-md transition">
							<i class="fa-regular fa-eye mr-1"></i> ไปที่หน้าบัญชี
						</button>
					</div>`
				);
			};

			window.showFrequentItemsDemo = function() {
				showDemoModal(
					'⭐ รายการที่ใช้บ่อย',
					`<div class="space-y-3">
						<div class="flex flex-wrap gap-2">
							<span class="bg-yellow-100 dark:bg-yellow-900/30 px-3 py-1 rounded-full text-xs text-yellow-700 dark:text-yellow-400">ข้าวมันไก่</span>
							<span class="bg-yellow-100 dark:bg-yellow-900/30 px-3 py-1 rounded-full text-xs text-yellow-700 dark:text-yellow-400">กาแฟ</span>
							<span class="bg-yellow-100 dark:bg-yellow-900/30 px-3 py-1 rounded-full text-xs text-yellow-700 dark:text-yellow-400">ค่าน้ำ</span>
						</div>
						<p class="text-sm text-gray-700 dark:text-gray-300">ระบบ Auto-Learn จะจำชื่อรายการ หมวดหมู่ และราคาล่าสุดให้อัตโนมัติ เมื่อพิมพ์ชื่อที่เคยบันทึก</p>
						<p class="text-xs text-gray-500">สามารถเพิ่มรายการโปรดเองได้ที่หน้า บัญชี → รายการที่ใช้บ่อย</p>
						<button onclick="Swal.close(); openModal();" class="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-full text-sm font-bold shadow-md transition">
							<i class="fa-solid fa-plus mr-1"></i> ทดลองเพิ่มรายการ
						</button>
					</div>`
				);
			};

			window.showRecurringDemo = function() {
				showDemoModal(
					'🔄 รายการประจำ',
					`<div class="space-y-3">
						<div class="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
							<p class="font-bold text-purple-800 dark:text-purple-400">Netflix (รายจ่าย)</p>
							<p class="text-sm text-gray-600 dark:text-gray-400">จำนวน: 199 บาท ทุกเดือน</p>
							<p class="text-xs text-gray-500">วันถัดไป: 15/03/2026</p>
						</div>
						<p class="text-sm text-gray-700 dark:text-gray-300">ตั้งค่ารายการที่เกิดซ้ำ (ทุกวัน/สัปดาห์/เดือน/ปี) ระบบจะสร้างธุรกรรมให้อัตโนมัติเมื่อถึงกำหนด</p>
						<button onclick="Swal.close(); openRecurringModal();" class="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-full text-sm font-bold shadow-md transition">
							<i class="fa-solid fa-clock-rotate-left mr-1"></i> ตั้งค่ารายการประจำ
						</button>
					</div>`
				);
			};

			window.showSettingsGeneralDemo = function() {
				showDemoModal(
					'⚙️ ตั้งค่าทั่วไป',
					`<div class="space-y-3">
						<div class="grid grid-cols-3 gap-2 text-center text-xs">
							<div><i class="fa-solid fa-font text-blue-600 text-xl"></i><br>ขนาดตัวอักษร</div>
							<div><i class="fa-solid fa-moon text-indigo-600 text-xl"></i><br>Dark mode</div>
							<div><i class="fa-solid fa-eye-slash text-gray-600 text-xl"></i><br>ซ่อนยอด</div>
						</div>
						<p class="text-sm text-gray-700 dark:text-gray-300">ปรับขนาดตัวอักษร 6 ระดับ, เปิด/ปิด Dark mode, ซ่อนยอดคงเหลือในหน้าแรก</p>
						<button onclick="Swal.close(); showPage('page-settings');" class="w-full bg-slate-600 hover:bg-slate-700 text-white py-2 rounded-full text-sm font-bold shadow-md transition">
							<i class="fa-regular fa-eye mr-1"></i> ไปที่ตั้งค่า
						</button>
					</div>`
				);
			};

			window.showSecurityDemo = function() {
				showDemoModal(
					'🔒 ความปลอดภัย',
					`<div class="space-y-3">
						<div class="grid grid-cols-2 gap-2 text-sm">
							<div class="bg-red-50 dark:bg-red-900/20 p-2 rounded text-center">🔑 รหัสผ่าน</div>
							<div class="bg-red-50 dark:bg-red-900/20 p-2 rounded text-center">⏱️ Auto-lock</div>
							<div class="bg-red-50 dark:bg-red-900/20 p-2 rounded text-center">✅ Auto-confirm</div>
							<div class="bg-red-50 dark:bg-red-900/20 p-2 rounded text-center">🖐️ Biometric</div>
						</div>
						<p class="text-sm text-gray-700 dark:text-gray-300">ตั้งรหัสผ่าน, กำหนดเวลาล็อคอัตโนมัติ, เปิดใช้งานยืนยันทันที, และสแกนนิ้ว/ใบหน้า</p>
						<button onclick="Swal.close(); showPage('page-settings');" class="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-full text-sm font-bold shadow-md transition">
							<i class="fa-regular fa-eye mr-1"></i> ไปที่ตั้งค่า
						</button>
					</div>`
				);
			};

			window.showLineNotifyDemo = function() {
				showDemoModal(
					'📢 LINE แจ้งเตือน',
					`<div class="space-y-3">
						<div class="text-center text-5xl text-green-500">
							<i class="fa-brands fa-line"></i>
						</div>
						<p class="text-sm text-gray-700 dark:text-gray-300">เพิ่ม User ID เพื่อรับแจ้งเตือนเมื่อมีรายการ新增/แก้ไข/ลบ</p>
						<div class="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg text-xs">
							<p><b>วิธีหา User ID:</b></p>
							<p>1. เพิ่มเพื่อนบอท <span class="bg-purple-100 dark:bg-purple-900/30 px-1 rounded">@LINE_OA</span></p>
							<p>2. พิมพ์คำว่า "id" ในแชท</p>
							<p>3. นำรหัส U... ไปใส่ในช่องตั้งค่า</p>
						</div>
						<button onclick="Swal.close(); showPage('page-settings');" class="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-full text-sm font-bold shadow-md transition">
							<i class="fa-regular fa-eye mr-1"></i> ไปที่ตั้งค่า LINE
						</button>
					</div>`
				);
			};

			window.showDataManagementDemo = function() {
				showDemoModal(
					'💾 จัดการข้อมูล',
					`<div class="space-y-3">
						<div class="grid grid-cols-2 gap-2 text-center text-xs">
							<div class="bg-blue-50 dark:bg-blue-900/20 p-2 rounded">📦 JSON</div>
							<div class="bg-blue-50 dark:bg-blue-900/20 p-2 rounded">📊 Excel</div>
							<div class="bg-blue-50 dark:bg-blue-900/20 p-2 rounded">☁️ Cloud</div>
							<div class="bg-blue-50 dark:bg-blue-900/20 p-2 rounded">↩️ Undo/Redo</div>
						</div>
						<p class="text-sm text-gray-700 dark:text-gray-300">สำรองข้อมูล, นำเข้า, อัปเดตเวอร์ชัน, ล้างแคช, รีเซ็ตข้อมูล (เลือกเฉพาะเครื่อง/cloud/ทั้งสอง)</p>
						<button onclick="Swal.close(); showPage('page-settings');" class="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-full text-sm font-bold shadow-md transition">
							<i class="fa-regular fa-eye mr-1"></i> ไปที่ตั้งค่า
						</button>
					</div>`
				);
			};

			window.showSmartVoiceDemo = function() {
				showDemoModal(
					'🧠 ผู้ช่วยเสียงอัจฉริยะ (Smart Voice)',
					`<div class="space-y-4">
						<div class="text-center">
							<div class="inline-block bg-gradient-to-r from-blue-500 to-cyan-500 text-white p-4 rounded-full shadow-lg mb-2">
								<i class="fa-solid fa-microphone text-4xl"></i>
							</div>
							<p class="text-sm font-bold text-gray-800 dark:text-gray-200">ปุ่มลอยสีฟ้า <span class="text-blue-500">●</span> ที่มุมขวาล่างของหน้าจอ</p>
						</div>
						
						<div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800">
							<p class="text-sm text-gray-700 dark:text-gray-300 font-medium mb-2">📍 ตำแหน่งปุ่ม:</p>
							<p class="text-sm text-gray-600 dark:text-gray-400">อยู่เหนือปุ่ม <span class="bg-purple-100 px-2 py-0.5 rounded">กลับด้านบน</span> เล็กน้อย มองเห็นเป็นวงกลมสีฟ้าสดใส พร้อมไอคอนไมค์</p>
						</div>
						
						<div class="max-h-96 overflow-y-auto pr-2 space-y-4">
							<!-- หมวดการนำทาง -->
							<div>
								<p class="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center"><i class="fa-solid fa-compass text-blue-500 mr-2"></i> การนำทาง</p>
								<div class="grid grid-cols-2 gap-2 text-xs">
									<div class="bg-gray-50 dark:bg-gray-800 p-2 rounded-lg border border-gray-200 dark:border-gray-700">🔹 "หน้าแรก"</div>
									<div class="bg-gray-50 dark:bg-gray-800 p-2 rounded-lg border">🔹 "เปิดบัญชี"</div>
									<div class="bg-gray-50 dark:bg-gray-800 p-2 rounded-lg border">🔹 "ปฏิทิน"</div>
									<div class="bg-gray-50 dark:bg-gray-800 p-2 rounded-lg border">🔹 "ตั้งค่า"</div>
									<div class="bg-gray-50 dark:bg-gray-800 p-2 rounded-lg border">🔹 "รายการ"</div>
									<div class="bg-gray-50 dark:bg-gray-800 p-2 rounded-lg border">🔹 "คู่มือ"</div>
								</div>
							</div>

							<!-- หมวดการตั้งค่าด่วน -->
							<div>
								<p class="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center"><i class="fa-solid fa-sliders text-purple-500 mr-2"></i> การตั้งค่าด่วน</p>
								<div class="grid grid-cols-2 gap-2 text-xs">
									<div class="bg-gray-50 dark:bg-gray-800 p-2 rounded-lg border">🔹 "โหมดมืด"</div>
									<div class="bg-gray-50 dark:bg-gray-800 p-2 rounded-lg border">🔹 "โหมดสว่าง"</div>
									<div class="bg-gray-50 dark:bg-gray-800 p-2 rounded-lg border">🔹 "ซ่อนยอดเงิน"</div>
									<div class="bg-gray-50 dark:bg-gray-800 p-2 rounded-lg border">🔹 "แสดงยอดเงิน"</div>
									<div class="bg-gray-50 dark:bg-gray-800 p-2 rounded-lg border">🔹 "ล็อกแอป"</div>
									<div class="bg-gray-50 dark:bg-gray-800 p-2 rounded-lg border">🔹 "เปลี่ยนรหัสผ่าน"</div>
								</div>
							</div>

							<!-- หมวดจัดการข้อมูล -->
							<div>
								<p class="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center"><i class="fa-solid fa-database text-green-600 mr-2"></i> จัดการข้อมูล</p>
								<div class="grid grid-cols-2 gap-2 text-xs">
									<div class="bg-gray-50 dark:bg-gray-800 p-2 rounded-lg border">🔹 "สำรองข้อมูล"</div>
									<div class="bg-gray-50 dark:bg-gray-800 p-2 rounded-lg border">🔹 "ส่งออก Excel"</div>
									<div class="bg-gray-50 dark:bg-gray-800 p-2 rounded-lg border">🔹 "นำเข้าข้อมูล"</div>
									<div class="bg-gray-50 dark:bg-gray-800 p-2 rounded-lg border">🔹 "อัปเดตระบบ"</div>
									<div class="bg-gray-50 dark:bg-gray-800 p-2 rounded-lg border">🔹 "ล้างข้อมูลทั้งหมด"</div>
									<div class="bg-gray-50 dark:bg-gray-800 p-2 rounded-lg border">🔹 "รีเซ็ตระบบ" (Hard Reset)</div>
								</div>
							</div>

							<!-- หมวดย้อนกลับ/ทำซ้ำ -->
							<div>
								<p class="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center"><i class="fa-solid fa-rotate-left text-yellow-600 mr-2"></i> ย้อนกลับ/ทำซ้ำ</p>
								<div class="grid grid-cols-2 gap-2 text-xs">
									<div class="bg-gray-50 dark:bg-gray-800 p-2 rounded-lg border">🔹 "ย้อนกลับ"</div>
									<div class="bg-gray-50 dark:bg-gray-800 p-2 rounded-lg border">🔹 "ทำซ้ำ"</div>
								</div>
							</div>

							<!-- หมวดเพิ่มรายการ -->
							<div>
								<p class="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center"><i class="fa-solid fa-plus-circle text-green-600 mr-2"></i> เพิ่มรายการ</p>
								<div class="grid grid-cols-2 gap-2 text-xs">
									<div class="bg-gray-50 dark:bg-gray-800 p-2 rounded-lg border">🔹 "จ่ายค่ากาแฟ 60"</div>
									<div class="bg-gray-50 dark:bg-gray-800 p-2 rounded-lg border">🔹 "ได้เงินเดือน 15000"</div>
									<div class="bg-gray-50 dark:bg-gray-800 p-2 rounded-lg border">🔹 "โอนเข้าบัญชีออมทรัพย์ 2000"</div>
									<div class="bg-gray-50 dark:bg-gray-800 p-2 rounded-lg border">🔹 "จดด่วน 500"</div>
								</div>
							</div>

							<!-- หมวดค้นหา/กรอง -->
							<div>
								<p class="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center"><i class="fa-solid fa-magnifying-glass text-indigo-500 mr-2"></i> ค้นหา/กรอง</p>
								<div class="grid grid-cols-2 gap-2 text-xs">
									<div class="bg-gray-50 dark:bg-gray-800 p-2 rounded-lg border">🔹 "ค้นหาค่าน้ำ"</div>
									<div class="bg-gray-50 dark:bg-gray-800 p-2 rounded-lg border">🔹 "ดูรายจ่าย"</div>
									<div class="bg-gray-50 dark:bg-gray-800 p-2 rounded-lg border">🔹 "ดูรายรับ"</div>
									<div class="bg-gray-50 dark:bg-gray-800 p-2 rounded-lg border">🔹 "ดูเดือนนี้"</div>
								</div>
							</div>

							<!-- หมวดฟังก์ชันพิเศษ (Budget, Recurring) -->
							<div>
								<p class="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center"><i class="fa-solid fa-clock-rotate-left text-orange-500 mr-2"></i> ฟังก์ชันพิเศษ</p>
								<div class="grid grid-cols-2 gap-2 text-xs">
									<div class="bg-gray-50 dark:bg-gray-800 p-2 rounded-lg border">🔹 "ตั้งค่างบประมาณ"</div>
									<div class="bg-gray-50 dark:bg-gray-800 p-2 rounded-lg border">🔹 "รายการประจำ"</div>
									<div class="bg-gray-50 dark:bg-gray-800 p-2 rounded-lg border">🔹 "งบประมาณอาหาร"</div>
								</div>
							</div>
						</div>

						<div class="flex justify-center mt-2">
							<button onclick="Swal.close(); activateGlobalVoice();" class="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-full text-sm font-bold shadow-md transition">
								<i class="fa-solid fa-microphone mr-1"></i> ทดลองพูด
							</button>
						</div>
						<p class="text-xs text-gray-400 text-center mt-1">* กดปุ่มทดลองพูดเพื่อลองใช้คำสั่งเสียงจริง</p>
					</div>`
				);
			};

			window.showTroubleshootDemo = function() {
				showDemoModal(
					'🔧 เคล็ดลับเพิ่มเติมสำหรับแก้ไขปัญหา',
					`<div class="space-y-4">
						<div class="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-xl border border-yellow-200 dark:border-yellow-700">
							<div class="flex items-start gap-3">
								<i class="fa-solid fa-circle-exclamation text-yellow-600 text-xl mt-0.5"></i>
								<div>
									<p class="font-bold text-yellow-800 dark:text-yellow-400">แอปค้าง / ช้า</p>
									<p class="text-sm text-gray-700 dark:text-gray-300 mt-1">ให้กดปุ่ม <span class="inline-flex items-center gap-1 bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full text-xs font-bold"><i class="fa-solid fa-rotate"></i> ตรวจสอบและอัปเดตเวอร์ชัน</span> ที่อยู่ในหน้าตั้งค่า → <span class="bg-purple-100 px-2 py-0.5 rounded text-xs">จัดการข้อมูล</span></p>
								</div>
							</div>
						</div>
						
						<div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-700">
							<div class="flex items-start gap-3">
								<i class="fa-solid fa-rotate text-blue-600 text-xl mt-0.5"></i>
								<div>
									<p class="font-bold text-blue-800 dark:text-blue-400">อัปเดตแล้วข้อมูลไม่เปลี่ยน</p>
									<p class="text-sm text-gray-700 dark:text-gray-300 mt-1">เมื่อมีแถบแจ้งเตือนจาก Service Worker ให้กดปุ่ม <span class="inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-bold"><i class="fa-solid fa-bolt"></i> อัปเดตทันที</span> (ปุ่มสีฟ้าที่ปรากฏด้านล่าง)</p>
								</div>
							</div>
						</div>
						
						<div class="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-200 dark:border-red-700">
							<div class="flex items-start gap-3">
								<i class="fa-solid fa-lock text-red-600 text-xl mt-0.5"></i>
								<div>
									<p class="font-bold text-red-800 dark:text-red-400">ลืมรหัสผ่าน</p>
									<p class="text-sm text-gray-700 dark:text-gray-300 mt-1">ต้องใช้ปุ่ม <span class="inline-flex items-center gap-1 bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-xs font-bold border border-gray-300"><i class="fa-solid fa-power-off text-red-400"></i> ล้างระบบ (Hard Reset)</span> ในหน้าตั้งค่า → <span class="bg-purple-100 px-2 py-0.5 rounded text-xs">จัดการข้อมูล</span> (ข้อมูลที่ไม่ได้ซิงค์จะหาย)</p>
								</div>
							</div>
						</div>
						
						<div class="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl border border-purple-200 dark:border-purple-700">
							<p class="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
								<i class="fa-solid fa-lightbulb text-purple-600 mt-0.5"></i>
								<span><b class="text-purple-700">เคล็ดลับ:</b> ปุ่มเหล่านี้ทั้งหมดอยู่ในหน้าตั้งค่า ส่วน "จัดการข้อมูล" คุณสามารถกดปุ่มด้านล่างเพื่อไปดูได้ทันที</span>
							</p>
						</div>
						
						<div class="flex justify-center mt-2">
							<button onclick="Swal.close(); showPage('page-settings');" class="bg-purple-600 hover:bg-purple-700 text-white py-2 px-6 rounded-full text-sm font-bold shadow-md transition">
								<i class="fa-solid fa-gear mr-1"></i> ไปที่หน้าตั้งค่า
							</button>
						</div>
					</div>`
				);
			};
			
			// เพิ่มฟังก์ชันสำหรับสั่งงานด้วยเสียง
			window.showVoiceDemo = function() {
				showDemoModal(
					'🎤 สั่งงานด้วยเสียง',
					`<div class="space-y-3">
						<div class="text-center text-5xl text-blue-600">
							<i class="fa-solid fa-microphone-lines"></i>
						</div>
						<p class="text-sm text-gray-700 dark:text-gray-300">ระบบรองรับการสั่งงานด้วยเสียง 3 รูปแบบ:</p>
						<ul class="list-disc list-inside text-sm text-gray-600 dark:text-gray-400">
							<li><b>ปุ่มไมค์หน้าแรก</b> – พูดชื่อรายการและจำนวนเงิน เช่น "จ่ายค่ากาแฟ 60 บาท"</li>
							<li><b>ปุ่มไมค์ในฟอร์ม</b> – ใช้เพิ่มรายละเอียดขณะกรอกข้อมูล</li>
							<li><b>ปุ่มลอยสีฟ้า (Smart Voice)</b> – สั่งงานทั่วไป เช่น "เปิดปฏิทิน", "ค้นหาค่าน้ำ"</li>
						</ul>
						<p class="text-xs text-gray-500 mt-2">คำสั่งที่รองรับ: เพิ่มรายการ, เปิดหน้า, ค้นหา, จดด่วน, บันทึก, ยกเลิก ฯลฯ</p>
						<div class="flex gap-2 mt-2">
							<button onclick="Swal.close(); startVoiceRecognition();" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-full text-sm font-bold shadow-md transition">
								<i class="fa-solid fa-play mr-1"></i> ทดลองพูด
							</button>
							<button onclick="Swal.close(); showPage('page-home');" class="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-full text-sm font-bold shadow-md transition">
								<i class="fa-regular fa-eye mr-1"></i> ดูหน้าแรก
							</button>
						</div>
					</div>`
				);
			};
			
			// เพิ่มฟังก์ชันสำหรับสแกนใบเสร็จ
			window.showReceiptDemo = function() {
				showDemoModal(
					'📸 สแกนใบเสร็จ (OCR)',
					`<div class="space-y-3">
						<div class="text-center text-5xl text-teal-600">
							<i class="fa-solid fa-receipt"></i>
						</div>
						<p class="text-sm text-gray-700 dark:text-gray-300">ระบบจะอ่านข้อความจากรูปภาพและกรอกข้อมูลให้อัตโนมัติ</p>
						<div class="bg-teal-50 dark:bg-teal-900/20 p-3 rounded-lg text-sm">
							<p class="font-bold text-teal-800 dark:text-teal-400">ตัวอย่างผลลัพธ์:</p>
							<ul class="list-disc list-inside text-gray-600 dark:text-gray-400">
								<li>วันที่: 20/02/2026 14:30</li>
								<li>ยอดเงิน: 450.00 บาท</li>
								<li>ร้านค้า: คาเฟ่ อเมซอน</li>
							</ul>
						</div>
						<p class="text-xs text-gray-500">* คลิกปุ่ม "เพิ่มด้วยรูปภาพ" ในหน้าแรกเพื่อลองใช้จริง</p>
						<div class="flex gap-2 mt-2">
							<button onclick="Swal.close(); triggerReceiptUpload();" class="flex-1 bg-teal-600 hover:bg-teal-700 text-white py-2 rounded-full text-sm font-bold shadow-md transition">
								<i class="fa-solid fa-image mr-1"></i> ทดลองเลือกรูป
							</button>
							<button onclick="Swal.close(); showPage('page-home');" class="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-full text-sm font-bold shadow-md transition">
								<i class="fa-regular fa-eye mr-1"></i> ดูหน้าแรก
							</button>
						</div>
					</div>`
				);
			};

			// เพิ่มฟังก์ชันสำหรับเครื่องคิดเลขในตัว
			window.showCalcDemo = function() {
				showDemoModal(
					'🧮 เครื่องคิดเลขในตัว',
					`<div class="space-y-3">
						<div class="text-center text-5xl text-purple-600">
							<i class="fa-solid fa-calculator"></i>
						</div>
						<p class="text-sm text-gray-700 dark:text-gray-300">ขณะกรอกจำนวนเงิน กดไอคอนเครื่องคิดเลขเพื่อเปิดหน้าต่างคำนวณ</p>
						<div class="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
							<p class="font-bold text-purple-800 dark:text-purple-400">ตัวอย่างสูตร:</p>
							<p class="font-mono bg-gray-200 dark:bg-gray-700 p-2 rounded text-center">150 + 20 * 2</p>
							<p class="text-sm mt-1">= 190</p>
						</div>
						<p class="text-xs text-gray-500">กดปุ่ม "=" หรือ Enter เพื่อใส่ผลลัพธ์ในช่องจำนวนเงิน</p>
						<div class="flex gap-2 mt-2">
							<button onclick="Swal.close(); setTimeout(() => openCalculator('tx-amount', 'calculator-popover', 'calc-preview', 'calc-display'), 150);" class="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-full text-sm font-bold shadow-md transition">
								<i class="fa-solid fa-calculator mr-1"></i> เปิดเครื่องคิดเลข
							</button>
							<button onclick="Swal.close(); openModal();" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-full text-sm font-bold shadow-md transition">
								<i class="fa-solid fa-plus mr-1"></i> เพิ่มรายการ
							</button>
						</div>
					</div>`
				);
			};
			
			// ฟังก์ชันสำหรับตัวอย่างการจัดการรายการ
			window.showItemManageDemo = function() {
				showDemoModal(
					'✏️ การจัดการรายการ',
					`<div class="space-y-3">
						<div class="text-center text-5xl text-amber-600">
							<i class="fa-solid fa-pen-to-square"></i>
						</div>
						<p class="text-sm text-gray-700 dark:text-gray-300">รายการธุรกรรมสามารถจัดการได้ดังนี้:</p>
						<ul class="list-disc list-inside text-sm text-gray-600 dark:text-gray-400">
							<li><b>ปุ่มดินสอ</b> – แก้ไขรายการ (ต้องยืนยันรหัสผ่าน)</li>
							<li><b>ปุ่มถังขยะ</b> – ลบรายการ (ต้องยืนยันรหัสผ่าน)</li>
							<li><b>ไอคอนใบเสร็จ</b> – ดูรูปใบเสร็จแนบ (ซูม/แพนได้)</li>
						</ul>
						<p class="text-xs text-gray-500 mt-2">รายการที่มีใบเสร็จจะแสดงไอคอน receipt ให้คลิกดู</p>
						<div class="flex gap-2 mt-2">
							<button onclick="Swal.close(); showPage('page-list');" class="flex-1 bg-amber-600 hover:bg-amber-700 text-white py-2 rounded-full text-sm font-bold shadow-md transition">
								<i class="fa-regular fa-eye mr-1"></i> ไปหน้ารายการ
							</button>
							<button onclick="Swal.close(); openModal();" class="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-full text-sm font-bold shadow-md transition">
								<i class="fa-solid fa-plus mr-1"></i> เพิ่มรายการใหม่
							</button>
						</div>
					</div>`
				);
			};
			
			window.checkForUpdate = async function() {
				try {
					// ดึงเวอร์ชันปัจจุบันจากตัวแปร global
					const currentVersion = APP_VERSION;
					
					// fetch ไฟล์ version.js จากเซิร์ฟเวอร์ (เพิ่ม timestamp เพื่อป้องกัน cache)
					const response = await fetch('version.js?t=' + Date.now());
					const text = await response.text();
					
					// ค้นหา APP_VERSION ในเนื้อหา (สมมติว่าไฟล์มีรูปแบบ const APP_VERSION = '...';)
					const match = text.match(/APP_VERSION\s*=\s*['"]([^'"]+)['"]/);
					if (match) {
						const latestVersion = match[1];
						if (currentVersion === latestVersion) {
							Swal.fire({
								icon: 'info',
								title: 'ไม่มีอัปเดต',
								text: 'คุณกำลังใช้เวอร์ชันล่าสุด (' + currentVersion + ') อยู่แล้ว',
								confirmButtonText: 'ตกลง'
							});
						} else {
							Swal.fire({
								icon: 'warning',
								title: 'พบเวอร์ชันใหม่',
								html: 'เวอร์ชันปัจจุบัน: ' + currentVersion + '<br>เวอร์ชันล่าสุด: ' + latestVersion + '<br><br>กรุณากดปุ่ม "อัปเดตระบบ" ในหน้าตั้งค่าเพื่ออัปเดต',
								confirmButtonText: 'ตกลง'
							});
						}
					} else {
						Swal.fire('ไม่สามารถตรวจสอบเวอร์ชันได้', 'กรุณาลองอีกครั้ง', 'error');
					}
				} catch (err) {
					console.error('Check update error:', err);
					Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์', 'error');
				}
			};
			
			// ============================================
			// ฟังก์ชัน: ล้างระบบแบบถอนรากถอนโคน (Hard Reset)
			// ============================================
			async function handleHardReset() {
				// [ใหม่] 1. ตรวจสอบสิทธิ์ก่อน (รหัสผ่าน หรือ สแกนนิ้ว)
				const hasPermission = await promptForPassword('ยืนยันรหัสผ่านเพื่อล้างระบบ');
				if (!hasPermission) return; // ถ้าใส่ผิด หรือกดยกเลิก ให้จบการทำงานทันที

				// 2. แจ้งเตือนยืนยันอีกครั้ง (Double Check)
				const result = await Swal.fire({
					title: '⚠️ ยืนยันการล้างระบบ?',
					html: `
						<div class="text-left text-sm">
							<p class="text-red-600 font-bold mb-2">ข้อมูลในเครื่องจะหายถาวร!</p>
							<p>ระบบจะทำการ:</p>
							<ul class="list-disc pl-5 space-y-1 text-gray-600">
								<li>ลบ Service Worker (ตัวจัดการออฟไลน์)</li>
								<li>ลบ Cache ไฟล์ระบบทั้งหมด</li>
								<li><b>ลบฐานข้อมูลในเครื่องทั้งหมด (Database)</b></li>
								<li>รีเซ็ตการตั้งค่าทุกอย่าง</li>
							</ul>
							<p class="mt-3 font-bold text-gray-500">ข้อมูลที่ไม่ได้ Sync ขึ้น Cloud จะกู้คืนไม่ได้</p>
						</div>
					`,
					icon: 'warning',
					showCancelButton: true,
					confirmButtonColor: '#374151', // สีเทาเข้ม
					cancelButtonColor: '#d33',
					confirmButtonText: 'ยอมรับและล้างระบบ',
					cancelButtonText: 'ยกเลิก'
				});

				if (result.isConfirmed) {
					Swal.fire({
						title: 'กำลังล้างระบบ...',
						html: 'กรุณารอสักครู่ ระบบกำลังรีเซ็ตตัวเอง<br>ห้ามปิดหน้าจอนี้',
						allowOutsideClick: false,
						didOpen: async () => {
							Swal.showLoading();
							
							try {
								// 1. ถอนการติดตั้ง Service Worker
								if ('serviceWorker' in navigator) {
									const registrations = await navigator.serviceWorker.getRegistrations();
									for (const registration of registrations) {
										await registration.unregister();
										console.log('Service Worker Unregistered');
									}
								}

								// 2. ลบ Cache Storage
								if ('caches' in window) {
									const keys = await caches.keys();
									await Promise.all(keys.map(key => caches.delete(key)));
									console.log('Caches Cleared');
								}

								// 3. ลบ LocalStorage
								localStorage.clear();
								sessionStorage.clear();

								// 4. ลบ IndexedDB
								if (db) {
									db.close();
								}
								
								const DB_NAME_TO_DELETE = 'expenseTrackerDB_JamesIT'; 
								const deleteDbRequest = indexedDB.deleteDatabase(DB_NAME_TO_DELETE);
								
								deleteDbRequest.onsuccess = () => {
									console.log('Database Deleted Successfully');
									window.location.reload(true);
								};

								deleteDbRequest.onerror = (e) => {
									console.error('Could not delete DB:', e);
									window.location.reload(true);
								};

								deleteDbRequest.onblocked = () => {
									console.warn('DB Delete Blocked - Forcing Reload');
									window.location.reload(true);
								};

								setTimeout(() => {
									 window.location.reload(true);
								}, 3000);

							} catch (error) {
								console.error("Hard Reset Error:", error);
								window.location.reload(true);
							}
						}
					});
				}
			}
			
			function checkNotifications() {
				const alerts = [];
				const today = new Date();
				today.setHours(0, 0, 0, 0); // เที่ยงคืนของวันนี้

				// [แก้ไข] สร้าง string YYYY-MM-DD จาก Local Time (แทน toISOString ที่เป็น UTC)
				// เพื่อให้ตรงกับวันที่ใน tx.date ที่เก็บเป็น Local Time
				const year = today.getFullYear();
				const month = String(today.getMonth() + 1).padStart(2, '0');
				const day = String(today.getDate()).padStart(2, '0');
				const todayStr = `${year}-${month}-${day}`;

				// ดึงรายการทั้งหมดที่เป็นของ "วันนี้"
				const todaysTransactions = state.transactions.filter(tx => tx.date.startsWith(todayStr));

				todaysTransactions.forEach(tx => {
					// ข้ามรายการที่ผู้ใช้กด "ไม่ต้องแจ้งเตือนอีก"
					if (state.ignoredNotifications.includes(tx.id)) return;

					// 1. ตรวจสอบ "รายการประจำ" (Recurring)
					if (state.notifySettings.recurring && tx.id.startsWith('tx-rec-')) {
						alerts.push({
							id: tx.id,
							title: 'รายการประจำถึงกำหนด',
							message: `${tx.name} (${formatCurrency(tx.amount)})`,
							icon: 'fa-rotate'
						});
					}
					
					// 2. ตรวจสอบ "รายการล่วงหน้า" (Scheduled)
					// เงื่อนไข: เป็น ID ปกติ (tx-...) แต่ "วันที่สร้าง" ต้องเกิดขึ้น "ก่อนวันนี้"
					else if (state.notifySettings.scheduled && tx.id.startsWith('tx-') && !tx.id.startsWith('tx-rec-') && !tx.id.startsWith('tx-adj-')) {
						const parts = tx.id.split('-');
						if (parts.length >= 2) {
							const timestamp = parseInt(parts[1]); // แกะเวลาที่สร้างจาก ID
							if (!isNaN(timestamp)) {
								const createdDate = new Date(timestamp);
								createdDate.setHours(0,0,0,0);
								
								// ถ้าวันที่สร้าง (Created) < วันนี้ (Today) แสดงว่าลงล่วงหน้าไว้ -> แจ้งเตือน
								// ถ้าวันที่สร้าง == วันนี้ แสดงว่าเพิ่งลงเมื่อกี้ -> ไม่ต้องเตือน (เงื่อนไขถูกต้องแล้ว)
								if (createdDate < today) {
									alerts.push({
										id: tx.id,
										title: 'รายการล่วงหน้าถึงกำหนด',
										message: `${tx.name} (${formatCurrency(tx.amount)})`,
										icon: 'fa-clock'
									});
								}
							}
						}
					}
				});

				// ... (โค้ดส่วนตรวจสอบ Budget และ Custom Notify คงเดิม) ...
                // คุณสามารถก๊อปปี้ส่วน Budget และ Custom Notify จากไฟล์เดิมมาต่อท้ายได้เลยครับ
                // หรือใช้โค้ดเต็มด้านล่างนี้
                
				// 3. ตรวจสอบ "งบประมาณ" (Budget) ใกล้หมด (>80%)
				if (state.notifySettings.budget && state.budgets) {
					const currentMonth = todayStr.slice(0, 7);
					const expenseByCat = {};
					
					state.transactions.forEach(tx => {
						if (tx.type === 'expense' && tx.date.startsWith(currentMonth)) {
							if (!expenseByCat[tx.category]) expenseByCat[tx.category] = 0;
							expenseByCat[tx.category] += tx.amount;
						}
					});

					state.budgets.forEach(bg => {
						const used = expenseByCat[bg.category] || 0;
						const percent = (used / bg.amount) * 100;
						const alertId = `budget_${bg.category}_${currentMonth}`;

						if (percent >= 80 && !state.ignoredNotifications.includes(alertId)) {
							alerts.push({
								id: alertId,
								title: 'งบประมาณใกล้หมด!',
								message: `หมวด ${bg.category} ใช้ไปแล้ว ${percent.toFixed(1)}% (${formatCurrency(used)}/${formatCurrency(bg.amount)})`,
								icon: 'fa-triangle-exclamation',
								color: 'text-red-600'
							});
						}
					});
				}

				// 4. ตรวจสอบ "การแจ้งเตือนพิเศษ" (Custom)
				state.customNotifications.forEach(notif => {
					const targetDate = new Date(notif.date);
					targetDate.setHours(0, 0, 0, 0);

					const diffTime = targetDate - today;
					const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
					const advanceDays = parseInt(notif.advanceDays) || 0;

					// ตรวจสอบว่าอยู่ในช่วงวันที่ต้องเตือนหรือไม่ (วันนี้ หรือ ล่วงหน้า)
					if (diffDays >= 0 && diffDays <= advanceDays) {
						
						// [แก้ไข] ย้ายการเช็คเวลามาไว้ตรงนี้ เพื่อให้ครอบคลุมทั้ง "วันนี้" และ "วันล่วงหน้า"
						// ถ้าไม่ได้เลือก "เตือนทั้งวัน" (isAllDay = false) และระบุเวลาไว้
						if (notif.isAllDay === false && notif.time) {
							const now = new Date();
							const currentHM = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
							
							// ถ้าเวลาปัจจุบัน "น้อยกว่า" เวลาที่ตั้งไว้ -> ให้ข้ามไปเลย (ยังไม่แสดงแจ้งเตือน)
							// ผลลัพธ์: การแจ้งเตือนจะซ่อนอยู่จนกว่าจะถึงเวลา ไม่ว่าเป็นวันไหนก็ตาม
							if (currentHM < notif.time) {
								return; 
							}
						}

						// --- ส่วนการสร้าง Alert (Logic เดิม) ---
						if (diffDays === 0 && advanceDays >= 1) {
							// กรณีครบกำหนด (และเคยมีการเตือนล่วงหน้ามาก่อน)
							const dueAlertId = `${notif.id}_due`; 

							if (!state.ignoredNotifications.includes(dueAlertId)) {
								alerts.push({
									id: dueAlertId,
									title: '🚨 ครบกำหนดวันนี้!', 
									message: `${notif.message} (ถึงกำหนดแล้ว)`,
									icon: 'fa-exclamation-circle',
									color: 'text-red-600'
								});
							}
						}
						else {
							// กรณีเตือนล่วงหน้า หรือ เตือนวันนี้ปกติ
							if (!state.ignoredNotifications.includes(notif.id)) {
								let daysText = diffDays === 0 ? 'วันนี้' : `อีก ${diffDays} วัน`;
								
								// เพิ่มการแสดงเวลาในข้อความ เพื่อความชัดเจน
								if (notif.time && notif.isAllDay === false) {
									daysText += ` เวลา ${notif.time} น.`;
								}

								alerts.push({
									id: notif.id,
									title: diffDays === 0 ? 'แจ้งเตือนพิเศษ (วันนี้)' : 'แจ้งเตือนพิเศษ',
									message: `${notif.message} (${daysText})`,
									icon: diffDays === 0 ? 'fa-star' : 'fa-clock',
									color: diffDays === 0 ? 'text-red-600' : 'text-yellow-600'
								});
							}
						}
					}
				});

				if (alerts.length > 0) {
					alerts.forEach(alertItem => {
						const cloudAlert = { 
							...alertItem, 
							isRead: false,
							timestamp: new Date().toISOString()
						};
						saveToCloud(STORE_NOTIFICATIONS, cloudAlert);
					});
					showNotificationModal(alerts);
				}
			}
			// แทนที่ฟังก์ชัน showNotificationModal ตัวเดิม
			async function showNotificationModal(alerts) {
				const modal = document.getElementById('notification-modal');
				const content = document.getElementById('notification-content');
				const btnIgnore = document.getElementById('btn-notify-ignore');
				const btnAck = document.getElementById('btn-notify-ack');
				
				if(!modal || !content) return;

				// --- [เพิ่มใหม่] ส่วนบันทึกประวัติ (History Logging) ---
				const today = new Date();
				const dateStr = today.toISOString().slice(0, 10);
				const timeStr = today.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
				let historyChanged = false;

				alerts.forEach(alert => {
					// สร้าง Key เพื่อเช็คว่าวันนี้บันทึกรายการนี้ไปหรือยัง (กันซ้ำ)
					const historyKey = `${dateStr}_${alert.id}`;
					
					// เช็คว่าในประวัติมี Key นี้หรือยัง
					const alreadyLogged = state.notificationHistory.some(h => h.historyKey === historyKey);

					if (!alreadyLogged) {
						state.notificationHistory.unshift({
							historyKey: historyKey,
							date: dateStr,
							time: timeStr,
							timestamp: new Date().toISOString(),
							action: alert.title || '',
							details: alert.message || '',
							icon: alert.icon || 'fa-bell',
							color: alert.color || 'text-gray-500'
						});
						historyChanged = true;
					}
				});

				// ถ้ามีการเพิ่มประวัติใหม่ ให้บันทึกลง DB
				if (historyChanged) {
					// จำกัดประวัติไว้แค่ 100 รายการล่าสุด เพื่อไม่ให้หนักเครื่อง
					if (state.notificationHistory.length > 100) {
						state.notificationHistory = state.notificationHistory.slice(0, 100);
					}
					await dbPut(STORE_CONFIG, { key: 'notification_history', value: state.notificationHistory });
					
					// ถ้าเปิดหน้า History อยู่ให้รีเฟรช
					if(typeof renderNotificationHistory === 'function') renderNotificationHistory();
				}
				// -----------------------------------------------------

				// สร้าง HTML สำหรับ Modal (เหมือนเดิม)
				content.innerHTML = alerts.map(alert => `
					<div class="bg-gray-50 p-4 rounded-2xl border-l-8 ${alert.color ? alert.color.replace('text', 'border') : 'border-purple-500'} shadow-sm flex items-start gap-4">
						<div class="mt-1 text-2xl ${alert.color || 'text-purple-600'}">
							<i class="fa-solid ${alert.icon}"></i>
						</div>
						<div>
							<h3 class="font-bold text-xl text-gray-800">${alert.title}</h3>
							<p class="text-gray-600 text-lg">${alert.message}</p>
						</div>
					</div>
				`).join('');

				modal.classList.remove('hidden');

				btnAck.onclick = () => {
					modal.classList.add('hidden');
					
					// +++ [แทรกตรงนี้] แจ้ง Cloud ว่ารายการเหล่านี้ "อ่านแล้ว" +++
					// เครื่องอื่นที่เปิดอยู่ จะได้รับข้อมูลนี้และปิด Modal ลงอัตโนมัติ
					alerts.forEach(alertItem => {
						saveToCloud(STORE_NOTIFICATIONS, { 
							id: alertItem.id, 
							isRead: true 
						});
					});
				};

				btnIgnore.onclick = async () => {
					const newIgnored = alerts.map(a => a.id);
					state.ignoredNotifications = [...state.ignoredNotifications, ...newIgnored];
					await dbPut(STORE_CONFIG, { key: 'ignored_notifications', value: state.ignoredNotifications });
					modal.classList.add('hidden');
					showToast('จะไม่แจ้งเตือนรายการเหล่านี้อีก', 'success');
				};
			}
			
			// --- ฟังก์ชันแสดงรายการแจ้งเตือนในหน้าตั้งค่า ---
			function renderCustomNotificationsList() {
				const container = document.getElementById('custom-notification-list');
				if (!container) return;

				if (!state.customNotifications || state.customNotifications.length === 0) {
					container.innerHTML = '<p class="text-gray-400 text-center py-4 border-2 border-dashed border-gray-100 rounded-xl">ไม่มีรายการแจ้งเตือน</p>';
					return;
				}

				// เรียงลำดับตามวันที่เป้าหมาย
				const sortedNotis = [...state.customNotifications].sort((a, b) => new Date(a.date) - new Date(b.date));

				let html = '';
				sortedNotis.forEach(noti => {
					const dateObj = new Date(noti.date);
					const dateStr = dateObj.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' });
					
					// คำนวณวันแจ้งเตือนจริง
					const alertDate = new Date(dateObj);
					alertDate.setDate(alertDate.getDate() - (noti.advanceDays || 0));
					const alertDateStr = alertDate.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });

					html += `
						<div class="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 hover:shadow-sm transition">
							<div class="flex items-start gap-3">
								<div class="bg-orange-100 text-orange-600 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
									<i class="fa-regular fa-bell"></i>
								</div>
								<div>
									<div class="font-bold text-gray-800">${noti.message}</div>
									<div class="text-sm text-gray-500">
										เป้าหมาย: <span class="text-purple-600 font-medium">${dateStr}</span>
										${noti.advanceDays > 0 ? `<span class="bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full ml-1">เตือนก่อน ${noti.advanceDays} วัน (${alertDateStr})</span>` : ''}
									</div>
								</div>
							</div>
							<button onclick="deleteCustomNotification('${noti.id}')" class="text-gray-400 hover:text-red-500 p-2 transition">
								<i class="fa-solid fa-trash"></i>
							</button>
						</div>
					`;
				});

				container.innerHTML = html;
			}

			// ฟังก์ชันลบแจ้งเตือน
			async function deleteCustomNotification(id) {
				const result = await Swal.fire({
					title: 'ลบการแจ้งเตือน?',
					text: "คุณต้องการลบรายการนี้ใช่ไหม",
					icon: 'warning',
					showCancelButton: true,
					confirmButtonColor: '#ef4444',
					confirmButtonText: 'ลบ',
					cancelButtonText: 'ยกเลิก'
				});

				if (result.isConfirmed) {
					state.customNotifications = state.customNotifications.filter(n => n.id !== id);
					await dbPut(STORE_CONFIG, { key: 'custom_notifications_list', value: state.customNotifications });
					renderCustomNotificationsList();
					showToast('ลบเรียบร้อย', 'success');
				}
			}

			// ============================================
			// [UPDATED] DUAL ANALYTICS CHARTS (รองรับ Dark Mode)
			// ============================================
			function renderAnalyticsChart(filteredData) {
				const container = document.getElementById('analytics-section');
				const ctxCat = document.getElementById('chart-category');
				const ctxTime = document.getElementById('chart-time');
				
				// ถ้าไม่มีข้อมูล ให้ซ่อนทั้งแผง
				if (!filteredData || filteredData.length === 0) {
					if(container) container.classList.add('hidden');
					return;
				}
				if(container) container.classList.remove('hidden');

				// 1. เตรียมข้อมูล
				// ------------------------------------------
				const catMap = {};
				filteredData.forEach(tx => {
					if (state.advFilterType === 'all' && tx.type !== 'expense') return; 
					if (state.advFilterType !== 'all' && tx.type !== state.advFilterType) return;

					const cat = tx.category || 'อื่นๆ';
					catMap[cat] = (catMap[cat] || 0) + tx.amount;
				});

				const sortedCats = Object.entries(catMap).sort((a, b) => b[1] - a[1]);
				const catLabels = [];
				const catData = [];
				let otherSum = 0;
				
				sortedCats.forEach((item, index) => {
					if (index < 5) {
						catLabels.push(item[0]);
						catData.push(item[1]);
					} else {
						otherSum += item[1];
					}
				});
				if (otherSum > 0) {
					catLabels.push('อื่นๆ');
					catData.push(otherSum);
				}

				const dateMap = {};
				const sortedByDate = [...filteredData].sort((a, b) => new Date(a.date) - new Date(b.date));
				
				sortedByDate.forEach(tx => {
					if (state.advFilterType !== 'all' && tx.type !== state.advFilterType) return;
					
					const d = new Date(tx.date);
					const dateKey = `${d.getDate()}/${d.getMonth()+1}`;
					dateMap[dateKey] = (dateMap[dateKey] || 0) + tx.amount;
				});
				const timeLabels = Object.keys(dateMap);
				const timeData = Object.values(dateMap);


				// 2. ตั้งค่าสี (Color Config)
				// ------------------------------------------
				// เช็คว่ากำลังเปิด Dark Mode อยู่หรือไม่
				const isDark = state.isDarkMode || document.body.classList.contains('dark');
				const textColor = isDark ? '#e5e7eb' : '#4b5563';  // สีขาวเทา vs สีเทาเข้ม
				const gridColor = isDark ? '#374151' : '#e5e7eb'; // สีเส้น Grid

				// --- Graph 1: Doughnut ---
				if (chartInstanceCategory) chartInstanceCategory.destroy();
				
				if (ctxCat) {
					chartInstanceCategory = new Chart(ctxCat, {
						type: 'doughnut',
						data: {
							labels: catLabels,
							datasets: [{
								data: catData,
								backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#C9CBCF'],
								borderWidth: 0,
								hoverOffset: 10
							}]
						},
						options: {
							responsive: true,
							maintainAspectRatio: false,
							layout: { padding: 0 },
							cutout: '65%',
							plugins: {
								legend: { 
									position: 'top', 
									align: 'start',
									labels: { 
										boxWidth: 10, 
										padding: 10, 
										font: { size: 11, family: "'Prompt', sans-serif" },
										usePointStyle: true,
										color: textColor // ปรับสีตัวอักษร Legend
									} 
								},
								tooltip: {
									callbacks: {
										label: function(context) {
											return ' ' + context.label + ': ' + formatCurrency(context.raw);
										}
									}
								}
							}
						}
					});
				}

				// --- Graph 2: Bar ---
				if (chartInstanceTime) chartInstanceTime.destroy();

				if (ctxTime) {
					chartInstanceTime = new Chart(ctxTime, {
						type: 'bar',
						data: {
							labels: timeLabels,
							datasets: [{
								label: 'ยอดเงิน',
								data: timeData,
								backgroundColor: '#8b5cf6',
								borderRadius: 4,
								barPercentage: 0.7,
							}]
						},
						options: {
							responsive: true,
							maintainAspectRatio: false,
							layout: { padding: { top: 10, bottom: 0, left: 0, right: 0 } },
							plugins: {
								legend: { display: false },
								tooltip: {
									callbacks: { label: (c) => formatCurrency(c.raw) }
								}
							},
							scales: {
								x: { 
									grid: { display: false }, 
									ticks: { 
										font: { size: 10 }, 
										maxRotation: 0, 
										autoSkip: true,
										color: textColor // ปรับสีตัวอักษรแกน X
									} 
								},
								y: { 
									display: false, 
									beginAtZero: true 
								}
							}
						}
					});
				}
			}
			
			// [NEW] ฟังก์ชันสำหรับสวิตช์ เปิด/ปิด การแสดงบัญชี
			window.toggleAccountVisibility = async function(accountId, isChecked) {
				const account = state.accounts.find(a => a.id === accountId);
				if (account) {
					account.isVisible = isChecked; // อัปเดตสถานะ
					await dbPut(STORE_ACCOUNTS, account); // บันทึกลงฐานข้อมูล
					
					// รีเฟรชหน้าจอทั้งหมดเพื่อให้เห็นผลทันที
					renderAccountSettingsList(); 
					if (typeof renderAll === 'function') renderAll();
				}
			};
			
			// ============================================
			// QUICK DRAFT FUNCTIONS (แก้ไขให้เข้ากับของเดิม)
			// ============================================
			// 1. ฟังก์ชันสั่งงานด้วยเสียงสำหรับ Draft (ปรับปรุงใหม่ รองรับ Browser มากขึ้น)
			window.startQuickDraftVoice = function() {
				// ตรวจสอบหาตัว API ทั้งแบบมาตรฐาน และแบบ Webkit (Chrome/Safari)
				const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

				if (!SpeechRecognition) {
					Swal.fire({
						icon: 'error',
						title: 'ไม่รองรับการสั่งเสียง',
						html: 'Browser นี้ไม่รองรับฟีเจอร์แปลงเสียงเป็นข้อความ<br><br>แนะนำให้ใช้ <b>Google Chrome</b> หรือ <b>Safari</b><br>และต้องใช้งานผ่าน <b>HTTPS</b> เท่านั้น'
					});
					return;
				}

				// สร้าง Object recognition ถ้ายังไม่มี
				if (!window.recognition) {
					window.recognition = new SpeechRecognition();
					window.recognition.lang = 'th-TH'; // ภาษาไทย
					window.recognition.continuous = false; // ฟังทีละประโยคแล้วหยุด
					window.recognition.interimResults = false;

					// ตั้งค่า Event Handlers (ทำแค่ครั้งเดียวตอนสร้าง)
					window.recognition.onresult = (event) => {
						const transcript = event.results[0][0].transcript;
						console.log('Draft Voice:', transcript);

						// เรียกใช้ฟังก์ชัน parseVoiceInput ตัวเดิมของคุณ
						const parsed = parseVoiceInput(transcript); 

						if (parsed && parsed.amount) {
							document.getElementById('draft-amount').value = parsed.amount;
							
							let fullNote = parsed.name || '';
							if (parsed.description) fullNote += ' ' + parsed.description;
							if (!fullNote.trim()) fullNote = transcript.replace(parsed.amount, '').replace('บาท', '').trim();

							document.getElementById('draft-note').value = fullNote;
						} else {
							document.getElementById('draft-note').value = transcript;
						}
						stopVoiceUI();
					};

					window.recognition.onerror = (event) => {
						console.error("Voice Error:", event.error);
						stopVoiceUI();
						
						let msg = 'เกิดข้อผิดพลาดในการรับเสียง';
						if (event.error === 'not-allowed') msg = 'กรุณากดอนุญาตให้ใช้ไมโครโฟน';
						if (event.error === 'network') msg = 'กรุณาตรวจสอบอินเทอร์เน็ต';
						
						if (event.error !== 'no-speech' && event.error !== 'aborted') {
							showToast(msg, 'error');
						}
					};

					window.recognition.onend = () => {
						stopVoiceUI();
					};
				}

				// เริ่มต้นการทำงาน UI
				const btn = document.getElementById('btn-draft-voice');
				const originalHtml = '<i class="fa-solid fa-microphone"></i> พูดเพื่อจด (เช่น "ข้าว 50")';
				
				btn.innerHTML = '<i class="fa-solid fa-microphone-lines fa-beat"></i> กำลังฟัง...';
				btn.classList.add('bg-red-500', 'text-white', 'border-red-600');
				btn.classList.remove('bg-gray-100', 'text-gray-600');

				try {
					window.recognition.start();
				} catch (e) {
					// กรณีมีการกดรัวๆ หรือ service ทำงานค้างอยู่
					console.warn("Recognition already started or error:", e);
					window.recognition.stop();
				}

				// ฟังก์ชันคืนค่าปุ่ม
				function stopVoiceUI() {
					if(btn) {
						btn.innerHTML = originalHtml;
						btn.classList.remove('bg-red-500', 'text-white', 'border-red-600', 'fa-beat');
						btn.classList.add('bg-gray-100', 'text-gray-600');
					}
				}
			}

			// 2. บันทึก Draft (Update: เพิ่ม window. นำหน้า)
			window.saveQuickDraft = async function() {
				const amountVal = document.getElementById('draft-amount').value;
				const noteVal = document.getElementById('draft-note').value.trim();

				if (!amountVal || parseFloat(amountVal) <= 0) {
					Swal.fire('ระบุยอดเงิน', 'กรุณาใส่จำนวนเงิน', 'warning');
					return;
				}

				const now = new Date();
				const localIsoString = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);

				const draft = {
					id: `draft-${Date.now()}`,
					amount: parseFloat(amountVal),
					desc: noteVal || 'รายการเร่งด่วน',
					date: localIsoString
				};

				try {
					if (typeof db === 'undefined') {
						console.error("Database not initialized");
						return;
					}

					await dbPut(STORE_DRAFTS, draft);

					// ===== ส่วนที่เพิ่ม: ตรวจสอบการเรียนรู้คำสั่ง =====
					if (state.pendingCommandToLearn && state.pendingCommandToLearn.action === 'quickDraft') {
						const savedData = {
							amount: draft.amount,
							desc: draft.desc,
							action: 'quickDraft'
						};
						await askToLearnCommand(state.pendingCommandToLearn.text, savedData);
						state.pendingCommandToLearn = null;
					}
					// ==============================================

					if (typeof closeQuickDraftModal === 'function') closeQuickDraftModal();
					if (typeof renderDraftsWidget === 'function') renderDraftsWidget();

					showToast('จดร่างรายการไว้แล้ว', 'success');
				} catch (err) {
					console.error(err);
					Swal.fire('Error', 'บันทึกไม่สำเร็จ: ' + err.message, 'error');
				}
			};

			// 3. แสดง Widget รายการ Draft
			window.renderDraftsWidget = async function() {
				const container = document.getElementById('home-drafts-container');
				if (!container) return;

				try {
					const drafts = await dbGetAll(STORE_DRAFTS);
					
					if (drafts.length === 0) {
						container.classList.add('hidden');
						return;
					}

					container.classList.remove('hidden');
					const listEl = document.getElementById('drafts-list');
					listEl.innerHTML = '';

					drafts.forEach(draft => {
						// [ส่วนที่ 1] แปลงวันที่และเวลาให้เป็น format ไทย
						// ถ้าระบบใหม่มี draft.date ก็ใช้เลย / ถ้าระบบเก่าไม่มี ให้ดึงจาก id (timestamp)
						let dateObj;
						if (draft.date) {
							dateObj = new Date(draft.date);
						} else {
							// รองรับข้อมูลเก่าที่เก็บ id เป็น timestamp (ตัดคำว่า draft- ออก)
							const timestamp = parseInt(draft.id.replace('draft-', ''));
							dateObj = new Date(timestamp);
						}

						const dateStr = dateObj.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' });
						const timeStr = dateObj.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

						// [ส่วนที่ 2] HTML เพิ่มส่วนแสดงวันที่ (บรรทัดล่างสุด)
						const html = `
							<div class="flex justify-between items-center bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-xl border border-yellow-200 dark:border-yellow-700 mb-3 cursor-pointer hover:bg-yellow-100 dark:hover:bg-yellow-900/40 transition shadow-sm group"
								 onclick="convertDraftToTx('${draft.id}')">
								<div class="flex items-center gap-4">
									<div class="bg-yellow-200 dark:bg-yellow-600/80 text-yellow-800 dark:text-yellow-100 w-10 h-10 rounded-full flex items-center justify-center shadow-sm">
										<i class="fa-solid fa-pen-nib text-lg"></i>
									</div>
									<div>
										<div class="font-black text-xl text-gray-800 dark:text-white mb-0.5">${formatCurrency(draft.amount)}</div>
										<div class="text-sm font-medium text-gray-600 dark:text-gray-300">${escapeHTML(draft.desc)}</div>
										
										<div class="text-xs text-gray-400 dark:text-gray-500 mt-1 flex items-center gap-1">
											<i class="fa-regular fa-clock"></i> ${dateStr} ${timeStr} น.
										</div>
									</div>
								</div>
								<div class="text-gray-400 dark:text-gray-500 group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-colors">
									<i class="fa-solid fa-chevron-right text-xl"></i>
								</div>
							</div>
						`;
						listEl.insertAdjacentHTML('beforeend', html);
					});

				} catch (err) {
					console.error("Error loading drafts:", err);
				}
			}

			// 4. แปลง Draft เป็นรายการจริง
			window.convertDraftToTx = async function(draftId) {
				try {
					const draft = await dbGet(STORE_DRAFTS, draftId);
					if (!draft) return;

					openModal(); // เปิดหน้าบันทึก
					
					// เติมข้อมูลลงฟอร์ม
					document.getElementById('tx-amount').value = draft.amount;
					document.getElementById('tx-desc').value = draft.desc;
					
					// [เพิ่มใหม่] ตรวจสอบและเติมวันที่เดิม (ถ้ามี)
					if (draft.date) {
						document.getElementById('tx-date').value = draft.date;
					} else {
						// กรณี Draft เก่าที่ไม่มีวันที่เก็บไว้ ให้ใช้วันปัจจุบัน
						const now = new Date();
						document.getElementById('tx-date').value = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
					}
					
					// Trigger ให้คำนวณเลข (ถ้ามีระบบคำนวณ)
					const amountInput = document.getElementById('tx-amount');
					if(amountInput) amountInput.dispatchEvent(new Event('keyup'));

					// [ใหม่] ฝาก ID ไว้ใน input ที่ซ่อนไว้ (ยังไม่ลบจาก DB)
					const hiddenInput = document.getElementById('hidden-draft-id');
					if(hiddenInput) hiddenInput.value = draftId;

					// *** ลบโค้ด dbDelete เดิมออกไปแล้ว ***
					
					showToast('ดึงข้อมูลมาแล้ว กรุณาตรวจสอบและกดบันทึก', 'info');
					
				} catch (err) {
					console.error(err);
				}
			}

			// 5. เปิด/ปิด Modal
			window.openQuickDraftModal = () => {
				const modal = document.getElementById('quick-draft-modal');
				if(modal) {
					modal.classList.remove('hidden');
					setTimeout(() => {
						const input = document.getElementById('draft-amount');
						if(input) input.focus();
					}, 100);
				}
			}

			window.closeQuickDraftModal = () => {
				const modal = document.getElementById('quick-draft-modal');
				if(modal) {
					modal.classList.add('hidden');
					document.getElementById('draft-amount').value = '';
					document.getElementById('draft-note').value = '';
				}
			}
			
			// ============================================
			// SMART VOICE COMMAND (ผู้ช่วยสั่งงานด้วยเสียง)
			// ============================================

			window.activateVoiceCommand = function() {
				// 1. ตรวจสอบ API
				const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
				if (!SpeechRecognition) {
					Swal.fire('ไม่รองรับ', 'Browser นี้ไม่รองรับคำสั่งเสียง', 'error');
					return;
				}

				const btn = document.getElementById('smart-voice-btn');
				const ripple = document.getElementById('smart-voice-ripple');
				const icon = btn.querySelector('i');

				// 2. แต่งปุ่มให้รู้ว่ากำลังฟัง
				btn.classList.remove('from-blue-500', 'to-cyan-500');
				btn.classList.add('from-red-500', 'to-pink-500', 'scale-110');
				icon.classList.remove('fa-microphone');
				icon.classList.add('fa-ear-listen', 'fa-beat');
				ripple.classList.add('animate-ping', 'opacity-75');

				// 3. เริ่มฟัง
				const recognition = new SpeechRecognition();
				recognition.lang = 'th-TH';
				recognition.continuous = false; // ฟังประโยคเดียวจบ
				recognition.interimResults = false;

				recognition.onresult = (event) => {
					const transcript = event.results[0][0].transcript.trim();
					console.log('Voice Command:', transcript);
					
					// ส่งไปประมวลผล
					executeCommand(transcript);
				};

				recognition.onerror = (event) => {
					console.error(event.error);
					if(event.error !== 'no-speech') {
						showToast('ฟังไม่ทัน กรุณาลองใหม่', 'warning');
					}
				};

				recognition.onend = () => {
					// คืนค่าปุ่มสู่สภาพเดิม
					btn.classList.add('from-blue-500', 'to-cyan-500');
					btn.classList.remove('from-red-500', 'to-pink-500', 'scale-110');
					icon.classList.add('fa-microphone');
					icon.classList.remove('fa-ear-listen', 'fa-beat');
					ripple.classList.remove('animate-ping', 'opacity-75');
				};

				try {
					recognition.start();
					showToast('พูดคำสั่งได้เลย... (เช่น "กลับบ้าน", "ค้นหา ข้าว")', 'info');
				} catch (e) {
					console.warn(e);
				}
			}
			
			// ฟังก์ชันสำหรับปุ่มไมค์ใน modal สอนคำสั่ง
			function startVoiceForCommand() {
				const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
				if (!SpeechRecognition) {
					Swal.fire('ไม่รองรับ', 'เบราว์เซอร์นี้ไม่รองรับการจดจำเสียง', 'error');
					return;
				}

				const micBtn = document.getElementById('btn-voice-command-mic');
				const input = document.getElementById('voice-command-text');
				if (!micBtn || !input) return;

				// เปลี่ยนไอคอนขณะกำลังฟัง
				const originalHtml = micBtn.innerHTML;
				micBtn.innerHTML = '<i class="fa-solid fa-microphone-lines fa-beat text-xl text-red-500"></i>';
				micBtn.disabled = true;

				const recognition = new SpeechRecognition();
				recognition.lang = 'th-TH';
				recognition.interimResults = false;
				recognition.maxAlternatives = 1;

				recognition.onresult = (event) => {
					const transcript = event.results[0][0].transcript;
					input.value = transcript;
					input.dispatchEvent(new Event('input', { bubbles: true })); // กระตุ้น event ถ้ามี validation
					stopListening();
				};

				recognition.onerror = (event) => {
					console.error('Speech error:', event.error);
					if (event.error !== 'no-speech' && event.error !== 'aborted') {
						Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถจดจำเสียงได้', 'error');
					}
					stopListening();
				};

				recognition.onend = () => {
					stopListening();
				};

				recognition.start();

				function stopListening() {
					micBtn.innerHTML = originalHtml;
					micBtn.disabled = false;
					recognition.stop();
				}
			}

			// ============================================
			// SMART VOICE COMMAND (GLOBAL BRAIN V.7)
			// ============================================
			window.activateGlobalVoice = async function() {
				if (!document.getElementById('app-lock-screen').classList.contains('hidden')) {
					showToast('กรุณาปลดล็อคแอปก่อนใช้คำสั่งเสียง', 'warning');
					return;
				}
				// 1. ตรวจสอบ API
				const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
				if (!SpeechRecognition) {
					Swal.fire('ไม่รองรับ', 'Browser นี้ไม่รองรับคำสั่งเสียง', 'error');
					return;
				}

				const btn = document.getElementById('smart-voice-btn');
				if (!btn) return;
				const icon = btn.querySelector('i');
				const originalTitle = btn.title || 'ผู้ช่วยเสียง';

				// 2. แต่งปุ่มให้รู้ว่ากำลังฟัง (UI Feedback)
				btn.classList.remove('from-blue-500', 'to-cyan-500');
				btn.classList.add('from-red-500', 'to-pink-500', 'scale-125', 'ring-4', 'ring-red-200');
				if (icon) {
					icon.classList.remove('fa-microphone');
					icon.classList.add('fa-ear-listen', 'fa-beat-fade');
				}
				btn.title = 'กำลังฟัง... พูดคำสั่งได้เลย';

				// 3. เริ่มฟัง
				const recognition = new SpeechRecognition();
				recognition.lang = 'th-TH';
				recognition.continuous = false;
				recognition.interimResults = false;

				recognition.onresult = async (event) => {
					const transcript = event.results[0][0].transcript.trim();
					console.log('Global Voice Command:', transcript);
					await processGlobalCommand(transcript);
				};

				recognition.onerror = (event) => {
					console.error(event.error);
					if (event.error !== 'no-speech' && event.error !== 'aborted') {
						showToast('ฟังไม่ทัน กรุณาลองใหม่', 'warning');
					}
					// onend จะถูกเรียกอยู่แล้ว ดังนั้นไม่ต้องคืนค่าปุ่มซ้ำ
				};

				recognition.onend = () => {
					// คืนค่าปุ่มสู่สภาพเดิม
					btn.classList.add('from-blue-500', 'to-cyan-500');
					btn.classList.remove('from-red-500', 'to-pink-500', 'scale-125', 'ring-4', 'ring-red-200');
					if (icon) {
						icon.classList.add('fa-microphone');
						icon.classList.remove('fa-ear-listen', 'fa-beat-fade');
					}
					btn.title = originalTitle;
				};

				try {
					recognition.start();
					showToast('พูดคำสั่งได้เลย... (เช่น "กลับบ้าน", "จ่ายค่าไฟ 500")', 'info');
				} catch (e) {
					console.warn(e);
					// กรณี error ให้คืนค่าปุ่มทันที
					btn.classList.add('from-blue-500', 'to-cyan-500');
					btn.classList.remove('from-red-500', 'to-pink-500', 'scale-125', 'ring-4', 'ring-red-200');
					if (icon) {
						icon.classList.add('fa-microphone');
						icon.classList.remove('fa-ear-listen', 'fa-beat-fade');
					}
					btn.title = originalTitle;
					showToast('ไม่สามารถเริ่มฟังเสียงได้', 'error');
				}
			};
			
			// ค้นหาคำสั่งที่ใกล้เคียงที่สุด (ใช้ similarity อย่างง่าย)
			async function findLearnedCommand(spokenText) {
				try {
					const allCommands = await dbGetAll(STORE_VOICE_COMMANDS);
					if (!allCommands || allCommands.length === 0) return null;

					const spokenLower = spokenText.toLowerCase().trim();

					// 1. Exact match (กรณีพูดตรงกับคำสั่งที่เคยบันทึก)
					const exactMatch = allCommands.find(cmd => cmd.command.toLowerCase() === spokenLower);
					if (exactMatch) {
						exactMatch.useCount = (exactMatch.useCount || 0) + 1;
						await dbPut(STORE_VOICE_COMMANDS, exactMatch);
						return exactMatch;
					}

					// 2. Token overlap scoring (เฉพาะคำที่มีความหมาย)
					const spokenTokens = spokenLower.split(/\s+/).filter(t => t.length > 1);
					if (spokenTokens.length === 0) return null;

					let bestMatch = null;
					let bestScore = 0;

					for (const cmd of allCommands) {
						const cmdTokens = cmd.command.toLowerCase().split(/\s+/).filter(t => t.length > 1);
						if (cmdTokens.length === 0) continue;

						// นับจำนวน token ที่ตรงกัน
						const matchCount = spokenTokens.filter(t => cmdTokens.includes(t)).length;
						// คะแนน = สัดส่วนของ token ที่ตรงกัน เทียบกับจำนวน token ของคำสั่งที่บันทึก
						const score = matchCount / cmdTokens.length;

						// ต้องมีคะแนน >= 0.7 และมากกว่าคะแนนเดิม
						if (score >= 0.7 && score > bestScore) {
							bestScore = score;
							bestMatch = cmd;
						}
					}

					if (bestMatch) {
						bestMatch.useCount = (bestMatch.useCount || 0) + 1;
						await dbPut(STORE_VOICE_COMMANDS, bestMatch);
					}

					return bestMatch;
				} catch (err) {
					console.error('Error finding learned command:', err);
					return null;
				}
			}

			// ==========================================
			// GLOBAL BRAIN PROCESSOR V.2 (ฉบับสมองกลอัจฉริยะ)
			// ==========================================
			async function processGlobalCommand(text) {
				if (!text) return;

				// ทำความสะอาดข้อความ
				text = text.trim().replace(/[.。,]+$/, "").replace(/\s+/g, ' ');
				const lowerText = text.toLowerCase();

				console.log("🧠 SMART BRAIN V.7 Analyzing:", text);

				// ===== 0. ตรวจสอบคำสั่งที่เรียนรู้ก่อน =====
				const learned = await findLearnedCommand(text);
				if (learned) {
					console.log('🎓 Found learned command:', learned);
					await executeLearnedCommand(learned);
					return;
				}

				// ===== 1. PRIORITY: คำสั่งระบบด่วน =====
				// ปิด/ยกเลิก ทุกอย่าง
				if (lowerText.match(/^(ปิด|ยกเลิก|หยุด|ออก|esc|cancel|ปิดหน้าต่าง|ไปต่อ)/)) {
					closeEverything();
					showToast('ยกเลิกแล้ว', 'info');
					return;
				}

				// บันทึก/ตกลง (ระบุ modal context)
				if (lowerText.match(/^(บันทึก|เสร็จ|เรียบร้อย|save|ตกลง|ok|โอเค|ยืนยัน|ใช่)/)) {
					const saved = clickSaveButton(state.activeModalId);
					if (saved) return;
				}

				// ความช่วยเหลือ
				if (lowerText.match(/^(ช่วยเหลือ|ช่วย|help|คู่มือ|สอน|วิธีใช้|ใช้งาน)/)) {
					showPage('page-guide');
					speak("เปิดหน้าคู่มือการใช้งานแล้ว คุณสามารถถามเกี่ยวกับวิธีใช้ได้");
					return;
				}

				// ===== 2. CONTEXT AWARE =====
				const activeContext = detectCurrentContext();
				if (activeContext !== 'home') {
					const handled = handleContextualCommand(text, activeContext);
					if (handled) return;
				}

				// ===== 3. SMART MENU NAVIGATION =====
				const menuHandled = handleMenuNavigation(lowerText, text);
				if (menuHandled) return;

				// ===== 4. SMART DATA ENTRY =====
				const dataHandled = handleSmartDataEntry(text, lowerText);
				if (dataHandled) return;

				// ===== 5. SMART SEARCH =====
				const searchHandled = handleSmartSearch(text, lowerText);
				if (searchHandled) return;

				// ===== 6. SETTINGS & CONFIG =====
				const settingsHandled = handleSmartSettings(text, lowerText);
				if (settingsHandled) return;

				// ===== 7. SMART TRANSACTION DETECTION =====
				const transactionHandled = handleTransactionDetection(text, lowerText);
				if (transactionHandled) return;

				// ===== 8. FALLBACK =====
				handleFallbackCommand(text);
			}
			
			async function executeLearnedCommand(cmd) {
				console.log('Executing learned command:', cmd);

				switch (cmd.action) {
					case 'openPage':
						if (cmd.page) {
							showPage(cmd.page);
							speak(`เปิด${getPageName(cmd.page)}แล้ว`);
						}
						break;

					case 'openSettingsSection':
						showPage('page-settings');
						setTimeout(() => {
							const section = document.getElementById(cmd.section);
							if (section) {
								if (section.classList.contains('hidden')) {
									const toggle = document.querySelector(`[data-target="${cmd.section}"]`);
									if (toggle) toggle.click();
								}
								section.scrollIntoView({ behavior: 'smooth' });
							}
						}, 300);
						speak(`เปิดหน้าการตั้งค่าส่วน${cmd.section || ''}แล้ว`);
						break;

					case 'toggleDarkMode':
						document.getElementById('toggle-dark-mode')?.click();
						setTimeout(() => {
							speak(state.isDarkMode ? 'เปิดโหมดมืดแล้ว' : 'ปิดโหมดมืดแล้ว');
						}, 50);
						break;

					case 'toggleBalanceVisibility':
						document.getElementById('toggle-show-balance')?.click();
						setTimeout(() => {
							speak(state.showBalanceCard ? 'แสดงยอดคงเหลือแล้ว' : 'ซ่อนยอดคงเหลือแล้ว');
						}, 50);
						break;

					case 'changePassword':
						setTimeout(() => {
							handleManagePassword();
							// รอให้ handleManagePassword ทำงานเสร็จและ Swal แสดงเต็มที่
							setTimeout(() => {
								speak('กำลังเปิดหน้าจัดการรหัสผ่าน');
							}, 500); // ให้เวลาหลังจากเปิด Swal 200ms
						}, 500);
						break;

					case 'backupData':
						setTimeout(() => {
							handleBackup();
							setTimeout(() => {
								speak('กำลังเปิดศูนย์สำรองข้อมูล');
							}, 500);
						}, 500);
						break;

					case 'addTransaction':
					openModal();
					setTimeout(() => {
						// ✅ ตั้งค่าประเภทรายการ
						if (cmd.defaultType) {
							const radio = document.querySelector(`input[name="tx-type"][value="${cmd.defaultType}"]`);
							if (radio) radio.checked = true;
							updateFormVisibility();                 // ซ่อน/แสดงฟิลด์ตามประเภท
							updateCategoryDropdown(cmd.defaultType); // โหลดหมวดหมู่ตามประเภท
						}

						// เติมชื่อรายการ (รอให้ dropdown หมวดหมู่อัปเดตก่อน)
						if (cmd.defaultName) {
							document.getElementById('tx-name').value = cmd.defaultName;
						}

						// ตั้งค่าหมวดหมู่ (ต้องรอสักครู่ให้ dropdown เตรียมข้อมูลเสร็จ)
						if (cmd.defaultCategory) {
							setTimeout(() => {
								const catSelect = document.getElementById('tx-category');
								if (catSelect) catSelect.value = cmd.defaultCategory;
							}, 200);
						}

						if (cmd.defaultAmount) {
							document.getElementById('tx-amount').value = cmd.defaultAmount;
							document.getElementById('tx-amount').dispatchEvent(new Event('keyup'));
						}
						if (cmd.defaultDesc) {
							document.getElementById('tx-desc').value = cmd.defaultDesc;
						}
						speak('เปิดฟอร์มเพิ่มรายการตามที่คุณสอนไว้');
					}, 300);
					break;

					case 'quickDraft':
						openQuickDraftModal();
						setTimeout(() => {
							if (cmd.defaultAmount) document.getElementById('draft-amount').value = cmd.defaultAmount;
							document.getElementById('draft-note').value = cmd.defaultDesc || cmd.command;
							speak('จดบันทึกด่วนตามที่คุณสอนไว้');
						}, 300);
						break;
						
					case 'exportData':
						setTimeout(() => {
							handleBackup();  // เรียกฟังก์ชันสำรองข้อมูลที่มีอยู่แล้ว
							setTimeout(() => {
								speak('กำลังเปิดศูนย์สำรองข้อมูล');
							}, 500);
						}, 500);
						break;

					case 'importData':
						setTimeout(() => {
							document.getElementById('btn-import').click(); // คลิกปุ่มนำเข้า
							setTimeout(() => {
								speak('เตรียมนำเข้าข้อมูล กรุณาเลือกไฟล์');
							}, 500);
						}, 500);
						break;

					case 'clearAllData':
						setTimeout(() => {
							handleClearAll();  // ฟังก์ชันล้างข้อมูลทั้งหมด
							// handleClearAll จะจัดการป๊อปอัปและเสียงพูดเอง
						}, 500);
						break;

					case 'hardReset':
						setTimeout(() => {
							handleHardReset(); // ฟังก์ชันรีเซ็ตระบบ
						}, 500);
						break;
						
					case 'systemUpdate':
						setTimeout(() => {
							handleSystemUpdate();
							setTimeout(() => {
								speak('กำลังตรวจสอบและอัปเดตระบบ');
							}, 500);
						}, 500);
						break;
						
					case 'undo':
						setTimeout(() => {
							handleUndo();  // ฟังก์ชันย้อนกลับที่มีอยู่แล้ว
							setTimeout(() => {
								speak('ย้อนกลับรายการล่าสุด');
							}, 500);
						}, 500);
						break;

					case 'redo':
						setTimeout(() => {
							handleRedo();  // ฟังก์ชันทำซ้ำที่มีอยู่แล้ว
							setTimeout(() => {
								speak('ทำซ้ำรายการล่าสุด');
							}, 500);
						}, 500);
						break;

					case 'lockApp':
						setTimeout(() => {
							lockApp(); // ฟังก์ชันล็อคหน้าจอ
							speak('ล็อคแอปแล้ว');
						}, 500);
						break;

					case 'openAccountsPage':
						showPage('page-accounts');
						speak('เปิดหน้าบัญชีแล้ว');
						break;

					case 'openBudgetSettings':
						showPage('page-accounts');
						setTimeout(() => {
							// ขยายส่วนงบประมาณ (ถ้ายังไม่เปิด)
							const budgetContent = document.getElementById('settings-budget-content');
							const budgetHeader = document.querySelector('[data-target="settings-budget-content"]');
							if (budgetContent && budgetHeader && budgetContent.classList.contains('hidden')) {
								budgetHeader.click();
							}
							if (budgetContent) budgetContent.scrollIntoView({ behavior: 'smooth' });
							speak('เปิดหน้าการตั้งค่างบประมาณแล้ว');
						}, 300);
						break;

					case 'openRecurringSettings':
						showPage('page-accounts');
						setTimeout(() => {
							// ขยายส่วนรายการประจำ
							const recContent = document.getElementById('settings-recurring-content');
							const recHeader = document.getElementById('btn-manage-recurring');
							if (recContent && recHeader && recContent.classList.contains('hidden')) {
								recHeader.click();
							}
							if (recContent) recContent.scrollIntoView({ behavior: 'smooth' });
							speak('เปิดหน้าการตั้งค่ารายการประจำแล้ว');
						}, 300);
						break;

					case 'search':
						showPage('page-list');
						setTimeout(() => {
							const searchInput = document.getElementById('adv-filter-search');
							if (searchInput) {
								const keyword = cmd.defaultKeyword || cmd.command;
								searchInput.value = keyword;
								searchInput.dispatchEvent(new Event('input'));
								speak(`ค้นหารายการที่เกี่ยวข้องกับ ${keyword}`);
							} else {
								speak('เปิดหน้ารายการแล้ว');
							}
						}, 300);
						break;

					case 'filterByType':
						filterByType(cmd.filterType);
						break;

					case 'applyTimeFilter':
						applyTimeFilter(cmd.period);
						break;

					default:
						showToast('ไม่รู้จัก Action นี้', 'warning');
				}
			}

			function getPageName(pageId) {
				const map = {
					'page-home': 'หน้าแรก',
					'page-list': 'หน้ารายการ',
					'page-calendar': 'ปฏิทิน',
					'page-accounts': 'หน้าบัญชี',
					'page-settings': 'ตั้งค่า',
					'page-guide': 'คู่มือ'
				};
				return map[pageId] || pageId;
			}

			// ===== ฟังก์ชันช่วยตรวจจับ Context =====
			function detectCurrentContext() {
				// 1. ตรวจสอบว่ามี Swal เปิดอยู่ไหม (ควรตรวจก่อน เพราะ Swal เป็น global)
				if (document.querySelector('.swal2-container')) return 'swal';

				// 2. ใช้ state.activeModalId
				if (state.activeModalId) {
					if (state.activeModalId === 'form-modal') return 'transaction-form';
					if (state.activeModalId === 'quick-draft-modal') return 'quick-draft';
					if (state.activeModalId.includes('recurring')) return 'recurring-form';
					return 'modal'; // modal ทั่วไปที่ไม่ได้ระบุ
				}

				// 3. ตรวจสอบหน้า active
				const activePage = document.querySelector('.app-page:not(.hidden)');
				if (activePage) {
					if (activePage.id === 'page-home') return 'home';
					if (activePage.id === 'page-list') return 'list';
					if (activePage.id === 'page-calendar') return 'calendar';
					if (activePage.id === 'page-accounts') return 'accounts';
					if (activePage.id === 'page-settings') return 'settings';
					if (activePage.id === 'page-guide') return 'guide';
				}

				return 'home';
			}

			// ===== ฟังก์ชันจัดการคำสั่งตาม Context =====
			function handleContextualCommand(text, context) {
				const lowerText = text.toLowerCase();
				
				switch(context) {
					case 'transaction-form':
						// ในหน้าเพิ่มรายการ
						if (lowerText.match(/^(ประเภท|หมวดหมู่|category)/)) {
							document.getElementById('type-income').focus();
							speak("เลือกประเภทรายการ กด 1 สำหรับรายรับ กด 2 สำหรับรายจ่าย");
							return true;
						}
						if (lowerText.match(/^(จำนวน|เงิน|amount|บาท)/)) {
							document.getElementById('amount').focus();
							speak("กรุณาพูดจำนวนเงิน");
							return true;
						}
						if (lowerText.match(/^(รายละเอียด|หมายเหตุ|note|อะไร)/)) {
							document.getElementById('note').focus();
							speak("กรุณาพูกรายละเอียด");
							return true;
						}
						if (lowerText.match(/^(วันที่|date)/)) {
							document.getElementById('date').focus();
							speak("กรุณาพูดวันที่ในรูปแบบ วันเดือนปี");
							return true;
						}
						break;
						
					case 'list':
						// ในหน้ารายการ
						if (lowerText.match(/^(เรียง|sort|จัด)/)) {
							const sortBtn = document.querySelector('[data-sort]');
							if (sortBtn) sortBtn.click();
							speak("เรียงลำดับรายการแล้ว");
							return true;
						}
						if (lowerText.match(/^(กรอง|filter|เฉพาะ)/)) {
							document.getElementById('adv-filter-search').focus();
							speak("กรุณาพูดคำค้นหาที่ต้องการกรอง");
							return true;
						}
						if (lowerText.match(/^(ส่งออก|export|excel|พิมพ์)/)) {
							exportData();
							speak("กำลังส่งออกข้อมูล");
							return true;
						}
						break;
						
					case 'calendar':
						// ในหน้าปฏิทิน
						if (lowerText.match(/^(วันนี้|today)/)) {
							// กลับไปที่วันปัจจุบัน
							if (typeof calendar !== 'undefined') calendar.today();
							speak("แสดงวันนี้");
							return true;
						}
						if (lowerText.match(/^(เดือนหน้า|next)/)) {
							if (typeof calendar !== 'undefined') calendar.next();
							speak("แสดงเดือนหน้า");
							return true;
						}
						if (lowerText.match(/^(เดือนก่อน|previous)/)) {
							if (typeof calendar !== 'undefined') calendar.prev();
							speak("แสดงเดือนก่อนหน้า");
							return true;
						}
						break;
				}
				
				return false;
			}

			// ===== ฟังก์ชันเมนูอัจฉริยะ =====
			function handleMenuNavigation(lowerText, originalText) {
				// รายการคำสุภาพที่ควรตัดทิ้ง
				const politeSuffixes = ['ครับ', 'ค่ะ', 'จ้ะ', 'จ้า', 'นะ', 'หน่อย', 'ที', 'น่ะ', 'ละ', 'หละ', 'จั๊บ', 'เด้อ', 'เถอะ', 'ซิ'];
				// ฟังก์ชันตัดคำสุภาพ
				const trimPolite = (str) => {
					let trimmed = str;
					for (const suf of politeSuffixes) {
						if (trimmed.endsWith(suf)) {
							trimmed = trimmed.slice(0, -suf.length).trim();
						}
					}
					return trimmed;
				};

				const cleanText = trimPolite(lowerText); // ข้อความที่ตัดคำสุภาพทิ้งแล้ว

				// แมปคำสั่งกับหน้า
				const menuMap = {
					'หน้าแรก|home|หลัก|dashboard|เริ่มต้น': 'page-home',
					'รายการ|ประวัติ|list|ทั้งหมด|transaction': 'page-list',
					'ปฏิทิน|calendar|ตาราง|นัดหมาย': 'page-calendar',
					'บัญชี|account|ธนาคาร|กระเป๋า': 'page-accounts',
					'ตั้งค่า|setting|config|configuration|เครื่องมือ': 'page-settings',
					'คู่มือ|guide|help|วิธีใช้|สอน': 'page-guide',
					// ถ้ามีหน้าเพิ่มเติมก็ใส่ได้
				};

				// ตรวจสอบคำสั่งเปิด/ไปที่
				// กรณีมีคำนำหน้า (เปิด, ไป, ไปที่, ดู, แสดง, ที่, หน้า, เมนู)
				const prefixes = ['เปิด', 'ไป', 'ไปที่', 'ดู', 'แสดง', 'ที่', 'หน้า', 'เมนู'];
				for (const prefix of prefixes) {
					if (cleanText.startsWith(prefix)) {
						const rest = cleanText.slice(prefix.length).trim();
						if (rest === '') continue;
						// ดูว่า rest ตรงกับ keywords อะไร
						for (const [keywords, pageId] of Object.entries(menuMap)) {
							const kwList = keywords.split('|');
							for (const kw of kwList) {
								if (rest.includes(kw)) { // ใช้ includes เพื่อจับคู่บางส่วน เช่น "รายการ" ใน "รายการธุรกรรม"
									showPage(pageId);
									const pageNames = {
										'page-home': 'หน้าแรก',
										'page-list': 'หน้ารายการ',
										'page-calendar': 'หน้าปฏิทิน',
										'page-accounts': 'หน้าบัญชี',
										'page-settings': 'หน้าตั้งค่า',
										'page-guide': 'หน้าคู่มือ'
									};
									speak(`เปิด${pageNames[pageId] || pageId}แล้ว`);
									return true;
								}
							}
						}
						return false; // ถ้ามีคำนำหน้าแต่ไม่ match กับหน้าใด
					}
				}

				// กรณีไม่มีคำนำหน้า ให้ดูว่าข้อความตรงกับชื่อหน้าหรือไม่ (ใช้ includes)
				for (const [keywords, pageId] of Object.entries(menuMap)) {
					const kwList = keywords.split('|');
					for (const kw of kwList) {
						if (cleanText.includes(kw)) {
							showPage(pageId);
							const pageNames = {
								'page-home': 'หน้าแรก',
								'page-list': 'หน้ารายการ',
								'page-calendar': 'หน้าปฏิทิน',
								'page-accounts': 'หน้าบัญชี',
								'page-settings': 'หน้าตั้งค่า',
								'page-guide': 'หน้าคู่มือ'
							};
							speak(`เปิด${pageNames[pageId] || pageId}แล้ว`);
							return true;
						}
					}
				}

				// คำสั่งย่อยในเมนูตั้งค่า
				if (cleanText.includes('ตั้งค่า')) {
					const settingsMap = {
						'ธีม|theme|สี|โหมด': 'theme-settings',
						'ภาษา|language|ไทย|อังกฤษ': 'language-settings',
						'เสียง|sound|พูด|voice': 'voice-settings',
						'แจ้งเตือน|notification': 'notification-settings',
						'ข้อมูล|data|สำรอง|backup': 'backup-settings',
						'ความปลอดภัย|security|รหัส': 'security-settings',
						'เกี่ยวกับ|about|เวอร์ชั่น': 'about-section'
					};

					for (const [key, sectionId] of Object.entries(settingsMap)) {
						const kwList = key.split('|');
						for (const kw of kwList) {
							if (cleanText.includes(kw)) {
								showPage('page-settings');
								setTimeout(() => {
									const section = document.getElementById(sectionId);
									if (section && section.classList.contains('hidden')) {
										const toggleBtn = document.querySelector(`[data-target="${sectionId}"]`);
										if (toggleBtn) toggleBtn.click();
									}
									if (section) section.scrollIntoView({ behavior: 'smooth' });
								}, 300);
								speak(`เปิดหน้าการตั้งค่า${kw}แล้ว`);
								return true;
							}
						}
					}
				}

				return false;
			}

			// ===== ฟังก์ชันใส่ข้อมูลอัจฉริยะ =====
			function handleSmartDataEntry(text, lowerText) {
				// จดด่วน - รองรับช่องว่างไม่จำกัด และอาจมี "บาท" อยู่ตรงกลาง
				const draftMatch = lowerText.match(/^(จดด่วน|จด|โน้ต|บันทึก|note|draft|จดไว|ช่วยจำ)[\s　]*(.+)/i);
				if (draftMatch) {
					openQuickDraftModal();
					let content = draftMatch[2]; // ส่วนที่เหลือหลังคำนำหน้า
					content = content.trim();

					// แยกตัวเลข (จำนวนเงิน) และข้อความ
					const amountMatch = content.match(/(\d+(?:\.\d+)?)/);
					let amount = null;
					let note = '';

					if (amountMatch) {
						amount = parseFloat(amountMatch[0]);
						// ตัดตัวเลขและคำว่า "บาท" ออก เหลือข้อความล้วน
						note = content.replace(amountMatch[0], '').replace(/บาท|฿/gi, '').trim();
					} else {
						note = content;
					}

					// รอให้ Modal แสดงแล้วค่อยกรอกข้อมูล
					setTimeout(() => {
						if (amount) document.getElementById('draft-amount').value = amount;
						if (note) document.getElementById('draft-note').value = note;
					}, 100);

					return true; // ✅ สำคัญมาก: หยุดการทำงาน ไม่ให้ไป transaction detection
				}
				
				// เพิ่มบัญชีใหม่
				if (lowerText.match(/^(เพิ่ม|สร้าง)บัญชี\s*(.+)/)) {
					showPage('page-accounts');
					const accountName = text.replace(/^(เพิ่ม|สร้าง)บัญชี\s*/i, '');
					setTimeout(() => {
						document.getElementById('input-account-name').value = accountName;
						document.getElementById('input-account-name').focus();
						speak(`เตรียมเพิ่มบัญชี ${accountName} กรุณาระบุยอดเริ่มต้น`);
					}, 500);
					return true;
				}
				
				// เพิ่มหมวดหมู่
				if (lowerText.match(/^(เพิ่ม|สร้าง)หมวดหมู่\s*(.+)/)) {
					showPage('page-settings');
					const categoryName = text.replace(/^(เพิ่ม|สร้าง)หมวดหมู่\s*/i, '');
					setTimeout(() => {
						const categorySection = document.getElementById('category-settings');
						if (categorySection && categorySection.classList.contains('hidden')) {
							document.querySelector('[data-target="category-settings"]').click();
						}
						document.getElementById('new-category-name').value = categoryName;
						document.getElementById('new-category-name').focus();
						speak(`เตรียมเพิ่มหมวดหมู่ ${categoryName} กรุณาเลือกสีและประเภท`);
					}, 500);
					return true;
				}
				
				return false;
			}

			// ===== ฟังก์ชันค้นหาอัจฉริยะ (รองรับ "หา", "ค้นหา" แบบมี/ไม่มีคำตาม) =====
			function handleSmartSearch(text, lowerText) {
				// รายการคำสั่งค้นหา
				const searchCommands = ['ค้นหา', 'หา', 'search', 'filter', 'กรอง'];
				
				// รายการคำสุภาพที่มักต่อท้าย (ถ้ามีคำเหล่านี้ต่อท้าย ให้ตัดทิ้ง)
				const politeSuffixes = ['ครับ', 'ค่ะ', 'จ้ะ', 'จ้า', 'นะ', 'หน่อย', 'ที', 'หน่อยครับ', 'หน่อยค่ะ', 'ทีครับ', 'ทีค่ะ', 'น่ะ', 'ละ'];
				
				// ฟังก์ชันตัดคำสุภาพท้ายออก
				const trimPoliteSuffix = (str) => {
					let trimmed = str;
					for (const suffix of politeSuffixes) {
						if (trimmed.endsWith(suffix)) {
							trimmed = trimmed.slice(0, -suffix.length).trim();
						}
					}
					return trimmed;
				};

				// 1. ตรวจสอบว่าขึ้นต้นด้วยคำสั่งค้นหาหรือไม่
				let matchedCommand = null;
				let restOfText = '';
				
				for (const cmd of searchCommands) {
					if (lowerText.startsWith(cmd)) {
						matchedCommand = cmd;
						restOfText = lowerText.slice(cmd.length).trim();
						break;
					}
				}
				
				if (matchedCommand) {
					// ถ้ามีคำสั่งค้นหา
					if (restOfText === '') {
						// กรณีพูดแค่ "ค้นหา" หรือ "หา" เฉยๆ
						showPage('page-list');
						setTimeout(() => {
							const searchInput = document.getElementById('adv-filter-search') ||
											  document.querySelector('input[type="search"]') ||
											  document.querySelector('input[placeholder*="ค้นหา"]');
							if (searchInput) {
								searchInput.focus();
								speak('กรุณาพิมพ์คำที่ต้องการค้นหา');
							}
						}, 300);
						return true;
					} else {
						// มีข้อความต่อท้าย ให้ตัดคำสุภาพออก แล้วดูว่ายังเหลืออะไรเป็นคำค้นหรือไม่
						const cleanedRest = trimPoliteSuffix(restOfText);
						if (cleanedRest === '') {
							// ต่อท้ายมีแต่คำสุภาพ (เช่น "ค้นหาหน่อย" -> เหลือ "")
							showPage('page-list');
							setTimeout(() => {
								const searchInput = document.getElementById('adv-filter-search') ||
												  document.querySelector('input[type="search"]') ||
												  document.querySelector('input[placeholder*="ค้นหา"]');
								if (searchInput) {
									searchInput.focus();
									speak('กรุณาพิมพ์คำที่ต้องการค้นหา');
								}
							}, 300);
							return true;
						} else {
							// มีคำค้นจริงๆ
							const keyword = cleanedRest;
							showPage('page-list');
							setTimeout(() => {
								const searchInput = document.getElementById('adv-filter-search') ||
												  document.querySelector('input[type="search"]') ||
												  document.querySelector('input[placeholder*="ค้นหา"]');
								if (searchInput) {
									searchInput.value = keyword;
									searchInput.focus();
									
									const event = new Event('input', { bubbles: true });
									searchInput.dispatchEvent(event);
									const changeEvent = new Event('change', { bubbles: true });
									searchInput.dispatchEvent(changeEvent);
									
									setTimeout(() => {
										const results = document.querySelectorAll('.transaction-item, .list-item, tbody tr');
										const count = results.length > 0 ? results.length - 1 : 0;
										speak(`พบ ${count} รายการที่ตรงกับ "${keyword}"`);
									}, 800);
								}
							}, 300);
							return true;
						}
					}
				}

				// 2. กรณีค้นหาทั่วไป (ใช้ regex เดิม เผื่อมีรูปแบบอื่นๆ)
				const searchMatch = lowerText.match(/^(ค้นหา|หา|search|filter|กรอง|ดู)\s+(.+)/);
				if (searchMatch) {
					const keyword = searchMatch[2].trim();
					showPage('page-list');
					setTimeout(() => {
						const searchInput = document.getElementById('adv-filter-search') ||
										  document.querySelector('input[type="search"]') ||
										  document.querySelector('input[placeholder*="ค้นหา"]');
						if (searchInput) {
							searchInput.value = keyword;
							searchInput.focus();
							
							const event = new Event('input', { bubbles: true });
							searchInput.dispatchEvent(event);
							const changeEvent = new Event('change', { bubbles: true });
							searchInput.dispatchEvent(changeEvent);
							
							setTimeout(() => {
								const results = document.querySelectorAll('.transaction-item, .list-item, tbody tr');
								const count = results.length > 0 ? results.length - 1 : 0;
								speak(`พบ ${count} รายการที่ตรงกับ "${keyword}"`);
							}, 800);
						}
					}, 300);
					return true;
				}

				// 3. ค้นหาเฉพาะประเภทรายจ่าย
				if (lowerText.match(/^(รายจ่าย|จ่าย|เสีย|outcome|expense)/)) {
					filterByType('expense');
					speak("แสดงรายจ่ายทั้งหมด");
					return true;
				}

				// 4. ค้นหาเฉพาะประเภทรายรับ
				if (lowerText.match(/^(รายรับ|รับ|ได้|income|revenue)/)) {
					filterByType('income');
					speak("แสดงรายรับทั้งหมด");
					return true;
				}

				// 5. ค้นหาตามช่วงเวลา
				const timeMatch = lowerText.match(/(วันนี้|เมื่อวาน|สัปดาห์นี้|เดือนนี้|ปีนี้|7วัน|30วัน)/);
				if (timeMatch) {
					applyTimeFilter(timeMatch[1]);
					speak(`แสดงข้อมูล${timeMatch[1]}`);
					return true;
				}

				// 6. ถ้าไม่ตรงเงื่อนไขใดเลย
				return false;
			}

			// ===== ฟังก์ชันตั้งค่าอัจฉริยะ =====
			function handleSmartSettings(text, lowerText) {
				// เปลี่ยนธีม
				if (lowerText.match(/^(โหมดมืด|dark|ดำ|night)/)) {
					document.getElementById('toggle-dark-mode').click();
					speak("เปลี่ยนเป็นโหมดมืดแล้ว");
					return true;
				}
				
				if (lowerText.match(/^(โหมดสว่าง|light|ขาว|day)/)) {
					document.getElementById('toggle-dark-mode').click();
					speak("เปลี่ยนเป็นโหมดสว่างแล้ว");
					return true;
				}
				
				// เปลี่ยนภาษา
				if (lowerText.match(/^(ภาษาไทย|ไทย|thai)/)) {
					setLanguage('th');
					speak("เปลี่ยนภาษาเป็นไทยแล้ว");
					return true;
				}
				
				if (lowerText.match(/^(ภาษาอังกฤษ|อังกฤษ|english)/)) {
					setLanguage('en');
					speak("เปลี่ยนภาษาเป็นอังกฤษแล้ว");
					return true;
				}
				
				// ควบคุมเสียง
				if (lowerText.match(/^(เสียงเปิด|พูด|เสียง|voice on)/)) {
					localStorage.setItem('voiceEnabled', 'true');
					speak("เปิดเสียงพูดแล้ว");
					return true;
				}
				
				if (lowerText.match(/^(เสียงปิด|เงียบ|mute|silent)/)) {
					localStorage.setItem('voiceEnabled', 'false');
					speak("ปิดเสียงพูดแล้ว");
					return true;
				}
				
				// สำรองข้อมูล
				if (lowerText.match(/^(สำรอง|backup|export|เก็บ)/)) {
					handleBackup();
					speak("กำลังเปิดศูนย์สำรองข้อมูล");
					return true;
				}
				
				// นำเข้าข้อมูล
				if (lowerText.match(/^(กู้คืน|restore|import|นำเข้า)/)) {
					document.getElementById('btn-import').click();
					speak("เตรียมนำเข้าข้อมูล กรุณาเลือกไฟล์");
					return true;
				}
				
				return false;
			}

			// ===== ฟังก์ชันตรวจจับธุรกรรมอัตโนมัติ =====
			function handleTransactionDetection(text, lowerText) {
				// ดึงตัวเลขที่เป็นจำนวนเงิน (พยายามหาตัวเลขที่ตามหลัง "บาท" หรืออยู่ท้ายประโยค)
				let amount = null;
				// กรณีมีคำว่า "บาท"
				const bahtMatch = text.match(/(\d[\d,]*\.?\d*)\s*(บาท|฿|baht)/i);
				if (bahtMatch) {
					amount = parseFloat(bahtMatch[1].replace(/,/g, ''));
				} else {
					// ถ้าไม่มี "บาท" ให้เอาตัวเลขสุดท้ายในประโยค (น่าจะเป็นยอดเงิน)
					const numberMatches = text.match(/(\d[\d,]*\.?\d*)/g);
					if (numberMatches && numberMatches.length > 0) {
						amount = parseFloat(numberMatches[numberMatches.length - 1].replace(/,/g, ''));
					}
				}
				if (!amount || amount <= 0) return false;

				// กำหนดประเภท (transfer มีคำว่า "โอน" เป็นหลัก)
				let type = null;
				if (lowerText.includes('โอน')) {
					type = 'transfer';
				} else if (lowerText.includes('จ่าย') || lowerText.includes('ซื้อ') || lowerText.includes('ค่า') || lowerText.includes('ชำระ')) {
					type = 'expense';
				} else if (lowerText.includes('รับ') || lowerText.includes('ได้') || lowerText.includes('เงินเดือน')) {
					type = 'income';
				} else {
					// ไม่สามารถระบุได้
					return false;
				}

				// ดึงชื่อรายการ (ส่วนหน้าของประโยคก่อนตัวเลข)
				let name = text.substring(0, text.indexOf(amountMatch[0])).trim();
				name = name.replace(/^(จ่าย|ซื้อ|ค่า|รับ|ได้|โอน|ให้|ส่ง)\s*/i, '').trim();
				if (!name) name = (type === 'income' ? 'รายรับ' : (type === 'expense' ? 'รายจ่าย' : 'โอนย้าย'));

				// หมวดหมู่ (ใช้ autoSelectCategory)
				const category = autoSelectCategory(name, type);

				// วันที่ (ตรวจจับหรือใช้วันนี้)
				let date = detectDate(text) || new Date().toISOString().slice(0, 10);

				// เปิด modal และกรอกข้อมูล
				openModal();
				setTimeout(() => {
					if (type === 'transfer') {
						document.querySelector('input[name="tx-type"][value="transfer"]').checked = true;
						updateFormVisibility(); // ซ่อนหมวดหมู่
					} else {
						document.querySelector(`input[name="tx-type"][value="${type}"]`).checked = true;
						updateCategoryDropdown(type);
						setTimeout(() => {
							const catSelect = document.getElementById('tx-category');
							if (catSelect) catSelect.value = category;
						}, 100);
					}
					document.getElementById('tx-amount').value = amount;
					document.getElementById('tx-name').value = name;
					document.getElementById('tx-date').value = date + 'T' + new Date().toTimeString().slice(0,5);
					const desc = text.replace(amountMatch[0], '').replace(/(จ่าย|ซื้อ|ค่า|รับ|ได้|โอน|ให้|ส่ง)/g, '').trim();
					if (desc) document.getElementById('tx-desc').value = desc;
				}, 300);

				return true;
			}
			
			function openVoiceCommandModal(commandId = null, commandText = '') {
				const modal = document.getElementById('voice-command-modal');
				const form = document.getElementById('voice-command-form');
				const titleEl = document.getElementById('voice-modal-title');
				const idInput = document.getElementById('voice-command-id');
				const textInput = document.getElementById('voice-command-text');
				const actionSelect = document.getElementById('voice-command-action');
				const dynamicDiv = document.getElementById('voice-command-dynamic-fields');

				form.reset();
				dynamicDiv.innerHTML = '<p class="text-sm text-gray-500 dark:text-gray-400 italic">เลือก Action เพื่อกำหนดรายละเอียดเพิ่มเติม</p>';

				if (commandId) {
					// แก้ไข
					(async () => {
						const allCommands = await dbGetAll(STORE_VOICE_COMMANDS);
						const cmd = allCommands.find(c => c.id === commandId);
						if (!cmd) return;
						titleEl.textContent = 'แก้ไขคำสั่ง';
						idInput.value = cmd.id;
						textInput.value = cmd.command;
						actionSelect.value = cmd.action;
						renderDynamicFields(cmd.action, cmd);
					})();
				} else {
					// เพิ่มใหม่
					titleEl.textContent = 'สอนคำสั่งใหม่';
					idInput.value = '';
					if (commandText) {
						textInput.value = commandText; // ✅ เติมข้อความที่พูดลงไป
					}
				}

				// ผูก event เมื่อเปลี่ยน action
				actionSelect.onchange = () => {
					renderDynamicFields(actionSelect.value);
				};

				modal.classList.remove('hidden');
				state.activeModalId = 'voice-command-modal';
				
				// [เพิ่ม] ผูกปุ่มไมค์หลังจาก modal เปิด
				const micBtn = document.getElementById('btn-voice-command-mic');
				if (micBtn) {
					const newMicBtn = micBtn.cloneNode(true);  // ล้าง event เก่า
					micBtn.parentNode.replaceChild(newMicBtn, micBtn);
					newMicBtn.addEventListener('click', startVoiceForCommand);
				}
			}
			window.openVoiceCommandModal = openVoiceCommandModal;

			function closeVoiceCommandModal() {
				document.getElementById('voice-command-modal').classList.add('hidden');
				state.activeModalId = null;
			}
			window.closeVoiceCommandModal = closeVoiceCommandModal;
			
			function renderDynamicFields(action, existingData = null) {
				const container = document.getElementById('voice-command-dynamic-fields');
				container.innerHTML = '';

				if (!action) {
					container.innerHTML = '<p class="text-sm text-gray-500 dark:text-gray-400 italic">เลือก Action เพื่อกำหนดรายละเอียดเพิ่มเติม</p>';
					return;
				}

				let html = '';
				switch (action) {
					case 'openPage':
						html = `
							<label class="block text-gray-700 dark:text-gray-300 font-medium mb-1">📄 เลือกหน้า</label>
							<select id="vc-page" class="w-full p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg">
								<option value="page-home" ${existingData?.page === 'page-home' ? 'selected' : ''}>หน้าแรก</option>
								<option value="page-list" ${existingData?.page === 'page-list' ? 'selected' : ''}>รายการ</option>
								<option value="page-calendar" ${existingData?.page === 'page-calendar' ? 'selected' : ''}>ปฏิทิน</option>
								<option value="page-accounts" ${existingData?.page === 'page-accounts' ? 'selected' : ''}>บัญชี</option>
								<option value="page-settings" ${existingData?.page === 'page-settings' ? 'selected' : ''}>ตั้งค่า</option>
								<option value="page-guide" ${existingData?.page === 'page-guide' ? 'selected' : ''}>คู่มือ</option>
							</select>
						`;
						break;
					case 'openSettingsSection':
						html = `
							<label class="block text-gray-700 dark:text-gray-300 font-medium mb-1">⚙️ เลือกส่วนในตั้งค่า</label>
							<select id="vc-settings-section" class="w-full p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg">
								<option value="theme-settings" ${existingData?.section === 'theme-settings' ? 'selected' : ''}>ธีม (มืด/สว่าง)</option>
								<option value="security-settings" ${existingData?.section === 'security-settings' ? 'selected' : ''}>ความปลอดภัย (รหัสผ่าน)</option>
								<option value="backup-settings" ${existingData?.section === 'backup-settings' ? 'selected' : ''}>สำรองข้อมูล</option>
								<option value="voice-settings" ${existingData?.section === 'voice-settings' ? 'selected' : ''}>เสียง</option>
							</select>
						`;
						break;
					case 'toggleDarkMode':
					case 'toggleBalanceVisibility':
					case 'backupData':
					case 'changePassword':
						html = '<p class="text-sm text-gray-500">✅ Action นี้ไม่ต้องการรายละเอียดเพิ่มเติม</p>';
						break;
					case 'addTransaction':
					html = `
						<label class="block text-gray-700 dark:text-gray-300 font-medium mb-1">📊 ประเภทรายการ</label>
						<select id="vc-tx-type" class="w-full p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg mb-3">
							<option value="expense" ${existingData?.defaultType === 'expense' ? 'selected' : ''}>รายจ่าย</option>
							<option value="income" ${existingData?.defaultType === 'income' ? 'selected' : ''}>รายรับ</option>
							<option value="transfer" ${existingData?.defaultType === 'transfer' ? 'selected' : ''}>โอนย้าย</option>
						</select>

						<label class="block text-gray-700 dark:text-gray-300 font-medium mb-1">💰 ชื่อรายการเริ่มต้น</label>
						<input list="vc-tx-name-datalist" id="vc-tx-name" value="${existingData?.defaultName || ''}" 
							   class="w-full p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg mb-1" 
							   placeholder="พิมพ์หรือเลือกชื่อรายการ">
						<datalist id="vc-tx-name-datalist">
							${generateItemOptions()}
						</datalist>
						<p class="text-xs text-gray-500 mb-3">สามารถพิมพ์ชื่อใหม่หรือเลือกจากที่มีอยู่</p>

						<label class="block text-gray-700 dark:text-gray-300 font-medium mb-1">📂 หมวดหมู่เริ่มต้น</label>
						<select id="vc-tx-category" class="w-full p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg mb-3">
							${generateCategoryOptions(existingData?.defaultType || 'expense', existingData?.defaultCategory)}
						</select>

						<label class="block text-gray-700 dark:text-gray-300 font-medium mb-1">🔢 จำนวนเงินเริ่มต้น</label>
						<input type="number" id="vc-tx-amount" value="${existingData?.defaultAmount || ''}" class="w-full p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg mb-3" placeholder="50">

						<label class="block text-gray-700 dark:text-gray-300 font-medium mb-1">📝 หมายเหตุเริ่มต้น</label>
						<input type="text" id="vc-tx-desc" value="${existingData?.defaultDesc || ''}" class="w-full p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg" placeholder="เช่น ไม่ใส่ความหวาน">
					`;
					break;
					case 'quickDraft':
						html = `
							<label class="block text-gray-700 dark:text-gray-300 font-medium mb-1">🔢 จำนวนเงินเริ่มต้น</label>
							<input type="number" id="vc-draft-amount" value="${existingData?.defaultAmount || ''}" class="w-full p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg mb-2" placeholder="100">
							<label class="block text-gray-700 dark:text-gray-300 font-medium mb-1">📝 ข้อความเริ่มต้น</label>
							<input type="text" id="vc-draft-note" value="${existingData?.defaultDesc || ''}" class="w-full p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg" placeholder="เช่น ซื้อของ">
						`;
						break;
					case 'search':
						html = `
							<label class="block text-gray-700 dark:text-gray-300 font-medium mb-1">🔍 คำค้นหาเริ่มต้น</label>
							<input type="text" id="vc-search-keyword" value="${existingData?.defaultKeyword || ''}" class="w-full p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg" placeholder="เช่น กาแฟ">
						`;
						break;
					case 'filterByType':
						html = `
							<label class="block text-gray-700 dark:text-gray-300 font-medium mb-1">📊 ประเภทที่ต้องการกรอง</label>
							<select id="vc-filter-type" class="w-full p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg">
								<option value="income" ${existingData?.filterType === 'income' ? 'selected' : ''}>รายรับ</option>
								<option value="expense" ${existingData?.filterType === 'expense' ? 'selected' : ''}>รายจ่าย</option>
							</select>
						`;
						break;
					case 'applyTimeFilter':
						html = `
							<label class="block text-gray-700 dark:text-gray-300 font-medium mb-1">⏱️ ช่วงเวลา</label>
							<select id="vc-time-period" class="w-full p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg">
								<option value="today" ${existingData?.period === 'today' ? 'selected' : ''}>วันนี้</option>
								<option value="this_week" ${existingData?.period === 'this_week' ? 'selected' : ''}>สัปดาห์นี้</option>
								<option value="this_month" ${existingData?.period === 'this_month' ? 'selected' : ''}>เดือนนี้</option>
								<option value="this_year" ${existingData?.period === 'this_year' ? 'selected' : ''}>ปีนี้</option>
							</select>
						`;
						break;
					default:
						html = '<p class="text-sm text-gray-500">⚠️ ไม่มีฟิลด์เพิ่มเติมสำหรับ Action นี้</p>';
				}
				container.innerHTML = html;
				
				if (action === 'addTransaction') {
					const typeSelect = document.getElementById('vc-tx-type');
					if (typeSelect) {
						typeSelect.addEventListener('change', function() {
							const catSelect = document.getElementById('vc-tx-category');
							if (catSelect) {
								catSelect.innerHTML = generateCategoryOptions(this.value);
							}
						});
					}
				}
			}
			
			// Helper: สร้าง options สำหรับชื่อรายการ (จาก frequentItems + autoCompleteList)
			function generateItemOptions() {
				let options = '';
				const existingNames = new Set();

				// เพิ่มจากรายการที่ใช้บ่อย
				if (state.frequentItems && state.frequentItems.length) {
					state.frequentItems.forEach(item => {
						options += `<option value="${escapeHTML(item)}">`;
						existingNames.add(item);
					});
				}
				// เพิ่มจาก Auto‑Learn (ที่ไม่ซ้ำ)
				if (state.autoCompleteList && state.autoCompleteList.length) {
					state.autoCompleteList.forEach(item => {
						if (!existingNames.has(item.name)) {
							options += `<option value="${escapeHTML(item.name)}">`;
							existingNames.add(item.name);
						}
					});
				}
				return options;
			}

			// Helper: สร้าง options สำหรับหมวดหมู่ ตาม type
			function generateCategoryOptions(type, selectedCategory = '') {
				let categories = [];
				if (type === 'transfer') {
					categories = ['โอนย้าย']; // หรือจะปล่อยว่างก็ได้
				} else {
					categories = state.categories[type] || [];
				}
				let options = '';
				categories.forEach(cat => {
					const selected = (cat === selectedCategory) ? 'selected' : '';
					options += `<option value="${escapeHTML(cat)}" ${selected}>${escapeHTML(cat)}</option>`;
				});
				if (categories.length === 0) {
					options = '<option value="">-- ไม่มีหมวดหมู่ --</option>';
				}
				return options;
			}
			
			async function saveVoiceCommand(e) {
				e.preventDefault();
				const idInput = document.getElementById('voice-command-id');
				const text = document.getElementById('voice-command-text').value.trim();
				const action = document.getElementById('voice-command-action').value;

				if (!text || !action) {
					Swal.fire('ข้อมูลไม่ครบ', 'กรุณากรอกคำพูดและเลือก Action', 'warning');
					return;
				}

				// เก็บค่าจาก dynamic fields
				const params = {};
				switch (action) {
					case 'openPage':
						params.page = document.getElementById('vc-page')?.value;
						break;
					case 'openSettingsSection':
						params.section = document.getElementById('vc-settings-section')?.value;
						break;
					case 'addTransaction':
						params.defaultType = document.getElementById('vc-tx-type')?.value;
						params.defaultName = document.getElementById('vc-tx-name')?.value;
						params.defaultCategory = document.getElementById('vc-tx-category')?.value;
						params.defaultAmount = parseFloat(document.getElementById('vc-tx-amount')?.value) || 0;
						params.defaultDesc = document.getElementById('vc-tx-desc')?.value;
						break;
					case 'quickDraft':
						params.defaultAmount = parseFloat(document.getElementById('vc-draft-amount')?.value) || 0;
						params.defaultDesc = document.getElementById('vc-draft-note')?.value;
						break;
					case 'search':
						params.defaultKeyword = document.getElementById('vc-search-keyword')?.value;
						break;
					case 'filterByType':
						params.filterType = document.getElementById('vc-filter-type')?.value;
						break;
					case 'applyTimeFilter':
						params.period = document.getElementById('vc-time-period')?.value;
						break;
					// action อื่น ๆ ไม่มี params
				}

				const command = {
					id: idInput.value || `voice_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
					command: text,
					action: action,
					...params,
					createdAt: idInput.value ? undefined : new Date().toISOString(),
					updatedAt: new Date().toISOString(),
					useCount: 0,
				};

				try {
					await dbPut(STORE_VOICE_COMMANDS, command);
					const actionType = idInput.value ? '✏️ แก้ไขคำสั่งเสียง' : '🎤 เพิ่มคำสั่งเสียง';
					addActivityLog(
						actionType,
						`"${text}" → ${action}`,
						'fa-microphone',
						'text-blue-600'
					);
					closeVoiceCommandModal();
					renderVoiceCommandsList(); // ต้องมีฟังก์ชันนี้อยู่แล้ว
					showToast('บันทึกคำสั่งเรียบร้อย', 'success');
				} catch (err) {
					console.error(err);
					Swal.fire('Error', 'บันทึกไม่สำเร็จ', 'error');
				}
			}

			// ผูก event กับ form
			document.getElementById('voice-command-form').addEventListener('submit', saveVoiceCommand);

			// ============================================
			// ฟังก์ชันจัดการเมื่อไม่รู้จักคำสั่ง (แต่พยายามเดาข้อมูล)
			// ============================================
			function handleFallbackCommand(text) {
				// -------------------------------
				// 1. พยายามแยกข้อมูลจากข้อความด้วย parseVoiceInput
				// -------------------------------
				const parsed = parseVoiceInput(text);

				// ถ้าแยกได้และมีจำนวนเงินที่ถูกต้อง (>0) ให้เติมฟอร์ม
				if (parsed && parsed.amount > 0) {
					let { type, name, amount, description } = parsed;

					// ถ้าไม่มีชื่อรายการ ให้ตั้งชื่อเริ่มต้นตามประเภท
					if (!name || name.trim() === '') {
						name = (type === 'income') ? 'รายรับ' :
							   (type === 'expense') ? 'รายจ่าย' : 'โอนย้าย';
					}

					// หาหมวดหมู่ที่เหมาะสมจากชื่อและประเภท
					const category = autoSelectCategory(name, type);

					// เปิด Modal เพิ่มรายการ
					openModal();

					// รอให้ Modal แสดงผล (setTimeout สั้นๆ) แล้วค่อยเติมข้อมูล
					setTimeout(() => {
						// --- เลือกประเภทธุรกรรม ---
						const radio = document.querySelector(`input[name="tx-type"][value="${type}"]`);
						if (radio) radio.checked = true;

						// --- อัปเดตการแสดงผลฟอร์มตามประเภท (ซ่อน/แสดงหมวดหมู่ ฯลฯ) ---
						if (typeof updateFormVisibility === 'function') {
							updateFormVisibility();
						}

						// --- เติมชื่อรายการ ---
						const nameInput = document.getElementById('tx-name');
						if (nameInput) nameInput.value = name;

						// --- เติมจำนวนเงิน ---
						const amountInput = document.getElementById('tx-amount');
						if (amountInput) {
							amountInput.value = amount;
							// Trigger event เพื่อให้เครื่องคิดเลขแสดงตัวอย่าง
							amountInput.dispatchEvent(new Event('keyup'));
						}

						// --- เติมคำอธิบาย (ถ้ามี) ---
						if (description && description.trim() !== '') {
							const descInput = document.getElementById('tx-desc');
							if (descInput) descInput.value = description;
						}

						// --- เลือกหมวดหมู่ (ต้องรอให้ dropdown เตรียมข้อมูลก่อน) ---
						setTimeout(() => {
							if (type !== 'transfer') {
								// อัปเดตรายการหมวดหมู่ตามประเภท
								updateCategoryDropdown(type);
								const catSelect = document.getElementById('tx-category');
								if (catSelect) {
									catSelect.value = category;
								}
							}
						}, 100); // รอ 100ms ให้ dropdown โหลดเสร็จ

					}, 200); // รอ 200ms ให้ Modal แสดงสมบูรณ์

					// แจ้งเตือนสั้นๆ ว่าช่วยเติมข้อมูลให้แล้ว
					showToast('📝 เติมข้อมูลจากคำพูดให้แล้ว', 'info');
					return; // จบการทำงาน ไม่ต้องแสดงเมนู fallback
				}

				// -------------------------------
				// 2. ถ้าแยกข้อมูลไม่ได้ หรือไม่มีจำนวนเงิน ให้ใช้ fallback เดิม
				// -------------------------------
				console.warn("ไม่เข้าใจคำสั่ง:", text);

				if (text.length < 3) {
					showToast('ไม่เข้าใจคำสั่ง: ' + text, 'info');
					speak('ขอโทษค่ะ ไม่เข้าใจคำสั่ง กรุณาพูดใหม่อีกครั้ง');
					return;
				}

				showToast("ไม่เข้าใจคำสั่ง \"" + text + "\" คุณสามารถสอนคำสั่งนี้ได้", "info");

				setTimeout(() => {
					Swal.fire({
						title: '🤔 ไม่เข้าใจคำสั่ง',
						html: `
							<div class="text-center py-2">
								<p class="text-lg text-gray-600 dark:text-gray-300 mb-4">"${escapeHTML(text)}"</p>
								<p class="text-base text-gray-500 dark:text-gray-400 mb-4">คุณต้องการทำอะไรกับคำสั่งนี้?</p>
								<div class="grid grid-cols-2 gap-3">
									<button id="fallback-add-tx" class="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-xl text-lg shadow-lg transition transform hover:scale-105 flex items-center justify-center gap-2">
										<i class="fa-solid fa-plus"></i> เพิ่มรายการ
									</button>
									<button id="fallback-quick-draft" class="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-4 rounded-xl text-lg shadow-lg transition transform hover:scale-105 flex items-center justify-center gap-2">
										<i class="fa-solid fa-pen"></i> จดด่วน
									</button>
									<button id="fallback-search" class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-xl text-lg shadow-lg transition transform hover:scale-105 flex items-center justify-center gap-2">
										<i class="fa-solid fa-magnifying-glass"></i> ค้นหา
									</button>
									<button id="fallback-teach" class="bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-4 rounded-xl text-lg shadow-lg transition transform hover:scale-105 flex items-center justify-center gap-2">
										<i class="fa-solid fa-microphone-lines"></i> เพิ่มคำสั่งใหม่
									</button>
								</div>
							</div>
						`,
						showConfirmButton: false,
						showCloseButton: true,
						customClass: {
							closeButton: 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 text-3xl absolute top-2 right-2',
							popup: state.isDarkMode ? 'swal2-popup' : '',
						},
						background: state.isDarkMode ? '#1a1a1a' : '#ffffff',
						color: state.isDarkMode ? '#e5e7eb' : '#1f2937',
						didOpen: () => {
							document.getElementById('fallback-add-tx').addEventListener('click', () => {
								Swal.close();
								state.pendingCommandToLearn = { text, action: 'addTransaction', timestamp: Date.now() };
								openModal();
							});
							document.getElementById('fallback-quick-draft').addEventListener('click', () => {
								Swal.close();
								state.pendingCommandToLearn = { text, action: 'quickDraft', timestamp: Date.now() };
								openQuickDraftModal();
							});
							document.getElementById('fallback-search').addEventListener('click', () => {
								Swal.close();
								showPage('page-list');
								setTimeout(() => {
									const searchInput = document.getElementById('adv-filter-search');
									if (searchInput) {
										searchInput.value = text;
										searchInput.dispatchEvent(new Event('input'));
										speak(`ค้นหารายการที่เกี่ยวข้องกับ ${text}`);
									}
								}, 300);
							});
							document.getElementById('fallback-teach').addEventListener('click', () => {
								Swal.close();
								openVoiceCommandModal(null, text);
							});
						}
					});
				}, 200);
			}
			
			async function askToLearnCommand(spokenText, data) {
				// spokenText คือ คำสั่งที่ผู้ใช้พูด
				// data คือ object ที่มีข้อมูลที่เพิ่งบันทึก (เช่น name, category, amount, desc, action)
				const { value: shouldLearn } = await Swal.fire({
					title: '📝 ต้องการให้จำคำสั่งนี้ไหม?',
					html: `ครั้งต่อไปที่พูด "<b>${escapeHTML(spokenText)}</b>" ระบบจะดำเนินการให้อัตโนมัติตามที่คุณทำล่าสุด`,
					icon: 'question',
					showCancelButton: true,
					confirmButtonText: '✅ จำไว้',
					cancelButtonText: '❌ ไม่ต้อง',
					confirmButtonColor: '#10b981',
					cancelButtonColor: '#6b7280',
					customClass: { popup: state.isDarkMode ? 'swal2-popup' : '' },
					background: state.isDarkMode ? '#1a1a1a' : '#ffffff',
					color: state.isDarkMode ? '#e5e7eb' : '#1f2937',
				});

				if (shouldLearn) {
					const commandId = `voice_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
					let defaultName = data.name || '';
					let defaultCategory = data.category || '';
					let defaultAmount = data.amount || 0;
					let defaultDesc = data.desc || '';

					const learnedItem = {
						id: commandId,
						command: spokenText,
						action: data.action || 'addTransaction',
						defaultType: data.type,
						defaultName,
						defaultCategory,
						defaultAmount,
						defaultDesc,
						params: {},
						createdAt: new Date().toISOString(),
						useCount: 1
					};

					try {
						// ตรวจสอบซ้ำก่อนบันทึก
						const existing = await dbGetAll(STORE_VOICE_COMMANDS);
						const spokenLower = spokenText.trim().toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ''); // ตัดเครื่องหมายวรรคตอน
						const duplicate = existing.find(cmd => {
							return cmd.command.trim().toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '') === spokenLower;
						});
						if (duplicate) {
							const overwrite = await Swal.fire({
								title: 'มีคำสั่งนี้อยู่แล้ว',
								text: 'ต้องการอัปเดตข้อมูลใหม่หรือไม่?',
								icon: 'warning',
								showCancelButton: true,
								confirmButtonText: 'อัปเดต',
								cancelButtonText: 'ยกเลิก',
								confirmButtonColor: '#f97316',
								customClass: { popup: state.isDarkMode ? 'swal2-popup' : '' },
								background: state.isDarkMode ? '#1a1a1a' : '#ffffff',
								color: state.isDarkMode ? '#e5e7eb' : '#1f2937',
							});
							if (overwrite.isConfirmed) {
								duplicate.defaultType = defaultType;
								duplicate.defaultName = defaultName;
								duplicate.defaultCategory = defaultCategory;
								duplicate.defaultAmount = defaultAmount;
								duplicate.defaultDesc = defaultDesc;
								duplicate.action = data.action;
								duplicate.updatedAt = new Date().toISOString();
								await dbPut(STORE_VOICE_COMMANDS, duplicate);
								showToast('✅ อัปเดตคำสั่งแล้ว', 'success');
							}
						} else {
							await dbPut(STORE_VOICE_COMMANDS, learnedItem);
							showToast('✅ จำคำสั่งไว้แล้ว', 'success');
						}
					} catch (err) {
						console.error('Error saving voice command:', err);
						showToast('❌ ไม่สามารถบันทึกคำสั่งได้', 'error');
					}
				}
			}

			// ===== ฟังก์ชันตรวจจับหมวดหมู่ =====
			function detectCategory(text) {
				const categories = {
					'อาหาร': ['ข้าว', 'อาหาร', 'กิน', 'ร้าน', 'อาหาร', 'น้ำ', 'เครื่องดื่ม', 'กาแฟ'],
					'เดินทาง': ['รถ', 'น้ำมัน', 'แท็กซี่', 'รถเมล์', 'บีทีเอส', 'เอ็มอาร์ที', 'ทางด่วน'],
					'ช้อปปิ้ง': ['ซื้อ', 'ช้อป', 'ของ', 'สินค้า', 'ออนไลน์', 'ลาซาด้า', 'ช้อปปี้'],
					'บันเทิง': ['หนัง', 'คอนเสิร์ต', 'เที่ยว', 'เล่น', 'เกม', 'เน็ต', 'อินเทอร์เน็ต'],
					'การศึกษา': ['หนังสือ', 'เรียน', 'คอร์ส', 'ติว', 'การศึกษา'],
					'สุขภาพ': ['หมอ', 'ยา', 'โรงพยาบาล', 'ตรวจ', 'สุขภาพ', 'ออกกำลังกาย'],
					'บิล': ['ค่าไฟ', 'ค่าน้ำ', 'อินเทอร์เน็ต', 'โทรศัพท์', 'บิล', 'ค่าใช้จ่าย'],
					'เงินเดือน': ['เงินเดือน', 'รายได้', 'ค่าจ้าง', 'งาน'],
					'โอน': ['โอน', 'ส่ง', 'ให้', 'รับ']
				};
				
				const lowerText = text.toLowerCase();
				for (const [category, keywords] of Object.entries(categories)) {
					for (const keyword of keywords) {
						if (lowerText.includes(keyword)) {
							return category;
						}
					}
				}
				
				return null;
			}

			// ===== ฟังก์ชันตรวจจับวันที่ =====
			function detectDate(text) {
				const today = new Date();
				const tomorrow = new Date(today);
				tomorrow.setDate(tomorrow.getDate() + 1);
				
				const yesterday = new Date(today);
				yesterday.setDate(yesterday.getDate() - 1);
				
				const formatDate = (date) => date.toISOString().split('T')[0];
				
				if (text.match(/(วันนี้|today|now)/i)) {
					return formatDate(today);
				}
				
				if (text.match(/(พรุ่งนี้|tomorrow)/i)) {
					return formatDate(tomorrow);
				}
				
				if (text.match(/(เมื่อวาน|yesterday)/i)) {
					return formatDate(yesterday);
				}
				
				// พยายามตรวจจับวันที่ไทย
				const thaiDateMatch = text.match(/(\d{1,2})\s*\/\s*(\d{1,2})\s*\/\s*(\d{2,4})/);
				if (thaiDateMatch) {
					let [_, day, month, year] = thaiDateMatch;
					year = year.length === 2 ? `25${year}` : year;
					return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
				}
				
				return formatDate(today); // ค่าเริ่มต้นเป็นวันนี้
			}

			// ===== ฟังก์ชันปิดทุกอย่าง =====
			function closeEverything() {
				// ปิด modal ทั้งหมด
				if (typeof closeModal === 'function') closeModal();
				if (typeof closeRecurringModal === 'function') closeRecurringModal();
				if (typeof closeQuickDraftModal === 'function') closeQuickDraftModal();
				if (typeof closeVoiceCommandModal === 'function') closeVoiceCommandModal(); // เพิ่มตรงนี้

				// ปิด Swal
				if (typeof Swal !== 'undefined') {
					Swal.close();
				}

				// ซ่อน dropdown ทั้งหมด
				document.querySelectorAll('.dropdown-content').forEach(el => {
					el.classList.add('hidden');
				});
			}

			// ===== ฟังก์ชันคลิกปุ่มบันทึก =====
			function clickSaveButton(modalId = null) {
				let selector = 'button[type="submit"]:not([disabled])';
				if (modalId) {
					selector = `#${modalId} ${selector}`;
				}
				const btn = document.querySelector(selector);
				if (btn && window.getComputedStyle(btn).display !== 'none') {
					btn.click();
					return true;
				}
				return false;
			}

			// ===== ฟังก์ชันกรองตามประเภท =====
			function filterByType(type) {
				// เปลี่ยนไปหน้ารายการ
				showPage('page-list');
				
				// อัปเดต dropdown ในหน้า list
				const typeSelect = document.getElementById('adv-filter-type');
				if (typeSelect) {
					typeSelect.value = type;
				}
				
				// อัปเดต state
				state.advFilterType = type;
				
				// รีเฟรชหน้ารายการ
				if (typeof renderListPage === 'function') {
					renderListPage();
				}
				
				// พูดแจ้งเตือน
				const typeName = type === 'income' ? 'รายรับ' : (type === 'expense' ? 'รายจ่าย' : 'โอนย้าย');
				speak(`แสดงเฉพาะ${typeName}`);
			}

			// ===== ฟังก์ชันกรองตามช่วงเวลา =====
			function applyTimeFilter(period) {
				showPage('page-list');
				// แมปค่า period (เช่น 'today', 'this_week', 'this_month') ไปเป็นวันที่จริง
				const now = new Date();
				let startDate, endDate;
				
				switch (period) {
					case 'today':
						startDate = endDate = now.toISOString().slice(0, 10);
						break;
					case 'this_week':
						// วันจันทร์ของสัปดาห์นี้
						const first = now.getDate() - now.getDay() + 1; // ปรับให้วันจันทร์เป็นวันแรก
						startDate = new Date(now.setDate(first)).toISOString().slice(0, 10);
						endDate = new Date(now.setDate(first + 6)).toISOString().slice(0, 10);
						break;
					case 'this_month':
						startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
						endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
						break;
					case 'this_year':
						startDate = new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10);
						endDate = new Date(now.getFullYear(), 11, 31).toISOString().slice(0, 10);
						break;
					default:
						return;
				}
				
				document.getElementById('adv-filter-start').value = startDate;
				document.getElementById('adv-filter-end').value = endDate;
				renderListPage();
				
				const periodMap = { 'today': 'วันนี้', 'this_week': 'สัปดาห์นี้', 'this_month': 'เดือนนี้', 'this_year': 'ปีนี้' };
				speak(`แสดงข้อมูล${periodMap[period] || period}`);
			}

			// ===== ฟังก์ชันพูด (เลือกเสียงภาษาไทยโดยอัตโนมัติ) =====
			let isSpeaking = false;
			let speakingText = '';

			// ฟังก์ชันสำหรับสั่งให้ระบบพูด (แก้ไขใหม่รองรับสวิตช์เปิด-ปิด)
			function speak(text, button = null) {
				// ✅ 1. เช็คการตั้งค่า: ถ้าปิดเสียงอยู่ (state.isVoiceEnabled = false) ให้หยุดการทำงานทันที
				if (typeof state !== 'undefined' && state.isVoiceEnabled === false) return;
				
				// ✅ 2. เช็คว่า Browser รองรับระบบเสียงหรือไม่
				if (!('speechSynthesis' in window)) return;

				const cleaned = text.trim(); // ตัดช่องว่างหน้าหลัง

				// --- ส่วน Logic เดิม (จัดการการพูดซ้ำ/หยุด) ---
				if (typeof isSpeaking !== 'undefined' && isSpeaking) {
					if (speakingText === cleaned) {
						// กรณีพูดอยู่แล้วกดปุ่มเดิมซ้ำ → ให้หยุดพูด
						window.speechSynthesis.cancel();
						isSpeaking = false;
						speakingText = '';
						
						// ลบ Effect ที่ปุ่ม
						if (button) {
							button.classList.remove('animate-pulse', 'scale-105', 'shadow-lg', 'bg-opacity-80');
						}
						return;
					} else {
						// กรณีพูดเรื่องอื่นอยู่แล้วกดปุ่มใหม่ → หยุดอันเก่าเพื่อเตรียมพูดอันใหม่
						window.speechSynthesis.cancel();
						// หมายเหตุ: isSpeaking จะถูกจัดการต่อใน onend ของอันเก่าอัตโนมัติ
					}
				}

				// --- เริ่มกระบวนการพูด ---
				const utterance = new SpeechSynthesisUtterance(cleaned);
				utterance.lang = 'th-TH';
				utterance.rate = 1.0;
				utterance.pitch = 1.0;

				// เลือกเสียงภาษาไทย (พยายามหาเสียงไทยที่ดีที่สุด)
				const setThaiVoice = () => {
					const voices = speechSynthesis.getVoices();
					// หาเสียงที่มีรหัส th หรือ TH
					const thaiVoice = voices.find(v => v.lang.includes('th') || v.lang.includes('TH'));
					if (thaiVoice) utterance.voice = thaiVoice;
				};
				
				// ตรวจสอบว่ารายการเสียงโหลดมาหรือยัง
				if (speechSynthesis.getVoices().length > 0) {
					setThaiVoice();
				} else {
					speechSynthesis.onvoiceschanged = setThaiVoice;
				}

				// Event: เมื่อเริ่มพูด
				utterance.onstart = () => {
					isSpeaking = true;
					speakingText = cleaned;
					// เพิ่ม Effect ให้ปุ่มดูมีชีวิตชีวา
					if (button) {
						button.classList.add('animate-pulse', 'scale-105', 'shadow-lg', 'bg-opacity-80', 'transition-all', 'duration-300');
					}
				};

				// Event: เมื่อพูดจบ หรือเกิด Error
				utterance.onend = utterance.onerror = () => {
					// เช็คว่าจบประโยคที่กำลังพูดอยู่จริงไหม (กัน case แย่งกันพูด)
					if (speakingText === cleaned) {
						isSpeaking = false;
						speakingText = '';
						// ลบ Effect ออกจากปุ่ม
						if (button) {
							button.classList.remove('animate-pulse', 'scale-105', 'shadow-lg', 'bg-opacity-80');
						}
					}
				};

				// สั่งให้พูด
				window.speechSynthesis.speak(utterance);
			}
			
			window.speak = speak;

			// ฟังก์ชันช่วยเลือกเสียงภาษาไทย
			function selectThaiVoice(utterance) {
				const voices = window.speechSynthesis.getVoices();
				
				// ลองหา voice ไทยจากหลายๆ ชื่อ
				const thaiVoice = voices.find(voice => 
					voice.lang.includes('th') || 
					voice.name.includes('Thai') || 
					voice.name.includes('ภาษาไทย') ||
					voice.name.includes('Kanya') ||  // เสียงไทยบน macOS
					voice.name.includes('Narisa') || // เสียงไทยบน iOS
					voice.name.includes('Premwadee') // เสียงไทยบน Windows
				);

				if (thaiVoice) {
					utterance.voice = thaiVoice;
					console.log('✅ ใช้เสียง:', thaiVoice.name);
				} else {
					console.warn('⚠️ ไม่พบเสียงภาษาไทย ใช้เสียง default แทน');
				}
			}
			
			function extractNameFromText(text, amountMatch) {
				let name = text.substring(0, amountMatch.index).trim();
				name = name.replace(/^(จ่าย|ซื้อ|ค่า|รายจ่าย|รับ|ได้|รายรับ|โอน)\s*/i, '').trim();
				return name || 'รายการ';
			}
			
			async function importICS(file) {
				const reader = new FileReader();
				reader.onload = async (e) => {
					try {
						const icsData = e.target.result;
						const jcalData = ICAL.parse(icsData);
						const comp = new ICAL.Component(jcalData);
						const vevents = comp.getAllSubcomponents('vevent');

						if (vevents.length === 0) {
							showToast('ไม่พบเหตุการณ์ในไฟล์นี้', 'warning');
							return;
						}

						// --- ชุดสีสำหรับกลุ่ม (เหมือนเดิม) ---
						const groupColors = [
							'#FF5733', '#33FF57', '#3357FF', '#FF33F1', '#F1FF33',
							'#33FFF5', '#FF8C33', '#8C33FF', '#FF3366', '#33FF99',
							'#6633FF', '#FF9933', '#00CC99', '#CC00CC', '#FFCC00'
						];

						// ******************************
						// [1] ตรวจสอบสีที่ใช้ไปแล้ว
						// ******************************
						// ดึงสีที่ใช้ไปแล้วจาก groups ที่มีอยู่
						const usedColors = state.icsImports
							.map(g => g.color)
							.filter(c => c !== undefined); // กรองเอาเฉพาะที่มีสี

						// หาสีที่ยังไม่ถูกใช้
						let availableColors = groupColors.filter(c => !usedColors.includes(c));

						// เลือกสีสำหรับกลุ่มนี้
						const groupColor = availableColors.length > 0 
							? availableColors[Math.floor(Math.random() * availableColors.length)]
							: groupColors[Math.floor(Math.random() * groupColors.length)];
						// ******************************

						// --- สร้างกลุ่ม (import group) ---
						const groupId = `import_${Date.now()}`;
						const group = {
							id: groupId,
							fileName: file.name,
							importedAt: new Date().toISOString(),
							eventCount: vevents.length,
							isVisible: true,
							color: groupColor   // [2] เก็บสีของกลุ่มไว้ด้วย
						};

						// --- แปลงแต่ละ event ---
						const eventsToAdd = [];
						vevents.forEach((vevent, idx) => {
							const summary = vevent.getFirstPropertyValue('summary') || 'ไม่มีชื่อ';
							const dtstart = vevent.getFirstPropertyValue('dtstart');
							if (!dtstart) return;

							// ใช้ฟังก์ชันใหม่
							const { start, allDay } = formatICSDate(dtstart);

							eventsToAdd.push({
								id: `${groupId}_${idx}`,
								title: summary,
								start: start,
								allDay: allDay,
								color: groupColor,
								textColor: '#ffffff',
								importId: groupId,
								source: 'ics_import'
							});
						});

						// --- บันทึกลง IndexedDB ---
						await dbPut(STORE_ICS_IMPORTS, group);
						for (const ev of eventsToAdd) {
							await dbPut(STORE_IMPORTED_EVENTS, ev);
						}

						// --- อัปเดต state ---
						state.icsImports = await dbGetAll(STORE_ICS_IMPORTS);
						state.importedEvents = await dbGetAll(STORE_IMPORTED_EVENTS);

						// --- รีเฟรชหน้าจอ ---
						renderCalendarView();
						closeImportedEventsModal();
						openImportedEventsModal();
						
						addActivityLog(
							'📂 นำเข้ากิจกรรม ICS',
							`นำเข้า ${eventsToAdd.length} รายการจาก "${file.name}"`,
							'fa-file-import',
							'text-purple-600'
						);

						showToast(`นำเข้า ${eventsToAdd.length} รายการจากไฟล์ ${file.name} สำเร็จ`, 'success');
					} catch (err) {
						console.error('ICS import error:', err);
						showToast('ไม่สามารถอ่านไฟล์ ICS ได้ (ไฟล์อาจเสียหาย)', 'error');
					}
				};
				reader.readAsText(file);
			}
			
			async function openImportedEventsModal() {
				const modal = document.getElementById('imported-events-modal');
				const groupsDiv = document.getElementById('imported-groups-list');
				if (!modal || !groupsDiv) return;

				// โหลดข้อมูลล่าสุด
				state.icsImports = await dbGetAll(STORE_ICS_IMPORTS) || [];
				state.importedEvents = await dbGetAll(STORE_IMPORTED_EVENTS) || [];

				if (state.icsImports.length === 0) {
					groupsDiv.innerHTML = '<p class="text-center text-gray-400 py-8 border-2 border-dashed border-gray-200 rounded-xl">ยังไม่มีกิจกรรมที่นำเข้า</p>';
				} else {
					let html = '';
					// เรียงกลุ่มตามวันที่นำเข้า (ใหม่สุดก่อน)
					const sortedGroups = [...state.icsImports].sort((a, b) => new Date(b.importedAt) - new Date(a.importedAt));

					sortedGroups.forEach(group => {
						const eventsInGroup = state.importedEvents.filter(ev => ev.importId === group.id);
						const visible = group.isVisible !== false;
						// ใช้สีจาก group.color ถ้ามี ถ้าไม่มีให้ใช้สี default
						const groupColor = group.color || '#8b5cf6';

						html += `
							<div class="group-item bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-200 dark:border-gray-600 mb-3" data-group-id="${group.id}">
								<div class="flex items-center justify-between">
									<div class="flex items-center gap-3">
										<!-- แถบสี (สี่เหลี่ยม) ใช้ style background-color -->
										<div class="w-6 h-6 rounded-full" style="background-color: ${groupColor}; border: 2px solid rgba(255,255,255,0.3);"></div>
										
										<!-- สวิตช์เปิด/ปิดกลุ่ม -->
										<label class="relative inline-flex items-center cursor-pointer">
											<input type="checkbox" class="sr-only peer group-visibility-toggle" data-group="${group.id}" ${visible ? 'checked' : ''}>
											<div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
										</label>

										<div>
											<span class="font-bold text-gray-800 dark:text-gray-200">${escapeHTML(group.fileName)}</span>
											<span class="text-xs text-gray-500 dark:text-gray-400 block">นำเข้าเมื่อ ${new Date(group.importedAt).toLocaleDateString('th-TH')} • ${eventsInGroup.length} รายการ</span>
										</div>
									</div>
									<div class="flex gap-1">
										<button class="text-red-500 hover:text-red-700 delete-group-btn p-2" data-group="${group.id}" title="ลบกลุ่มนี้">
											<i class="fa-solid fa-trash"></i>
										</button>
									</div>
								</div>

								<!-- รายการย่อย (คงเดิม) -->
								<div class="mt-3 ml-14 space-y-1 max-h-40 overflow-y-auto">
									${eventsInGroup.map(ev => `
										<div class="flex justify-between items-center py-1 border-b border-gray-100 dark:border-gray-700 text-sm">
											<span class="text-gray-700 dark:text-gray-300">📌 ${escapeHTML(ev.title)} <span class="text-gray-400 text-xs">(${ev.start})</span></span>
											<button class="text-red-400 hover:text-red-600 delete-event-btn" data-event="${ev.id}" title="ลบรายการนี้">
												<i class="fa-solid fa-times-circle"></i>
											</button>
										</div>
									`).join('')}
								</div>
							</div>
						`;
					});
					groupsDiv.innerHTML = html;

					// ใช้ event delegation ที่ groupsDiv
					groupsDiv.addEventListener('change', async (e) => {
						const target = e.target;
						if (target.matches('.group-visibility-toggle')) {
							const groupId = target.dataset.group;
							const isChecked = target.checked;
							await toggleGroupVisibility(groupId, isChecked);
						}
					});

					// --- ผูก event สำหรับปุ่มลบกลุ่ม ---
					groupsDiv.querySelectorAll('.delete-group-btn').forEach(btn => {
						btn.addEventListener('click', async (e) => {
							e.stopPropagation();
							const groupId = e.currentTarget.dataset.group;
							const group = state.icsImports.find(g => g.id === groupId);
							const confirm = await Swal.fire({
								title: 'ลบกลุ่มนี้?',
								text: `คุณต้องการลบ "${group?.fileName || 'กลุ่ม'}" และกิจกรรมทั้งหมดในกลุ่มนี้ใช่หรือไม่`,
								icon: 'warning',
								showCancelButton: true,
								confirmButtonColor: '#ef4444',
								confirmButtonText: 'ลบ',
								cancelButtonText: 'ยกเลิก'
							});
							if (confirm.isConfirmed) {
								await deleteGroup(groupId);
							}
						});
					});

					// --- ผูก event สำหรับปุ่มลบทีละรายการ ---
					groupsDiv.querySelectorAll('.delete-event-btn').forEach(btn => {
						btn.addEventListener('click', async (e) => {
							e.stopPropagation();
							const eventId = e.currentTarget.dataset.event;
							const confirm = await Swal.fire({
								title: 'ลบรายการนี้?',
								text: 'คุณต้องการลบกิจกรรมนี้ใช่หรือไม่',
								icon: 'question',
								showCancelButton: true,
								confirmButtonColor: '#ef4444',
								confirmButtonText: 'ลบ',
								cancelButtonText: 'ยกเลิก'
							});
							if (confirm.isConfirmed) {
								await deleteSingleEvent(eventId);
							}
						});
					});
				}

				// แสดง modal
				modal.classList.remove('hidden');
			}

			function closeImportedEventsModal() {
				document.getElementById('imported-events-modal').classList.add('hidden');
			}
			
			async function toggleGroupVisibility(groupId, isVisible) {
				const group = state.icsImports.find(g => g.id === groupId);
				if (!group) return;
				group.isVisible = isVisible;
				await dbPut(STORE_ICS_IMPORTS, group);
				// รีเฟรชปฏิทิน
				renderCalendarView();
				// อัปเดต state
				state.icsImports = await dbGetAll(STORE_ICS_IMPORTS);
			}

			async function deleteGroup(groupId) {
				// ลบเหตุการณ์ทั้งหมดในกลุ่มนี้
				const eventsToDelete = state.importedEvents.filter(ev => ev.importId === groupId);
				for (const ev of eventsToDelete) {
					await dbDelete(STORE_IMPORTED_EVENTS, ev.id);
				}
				// ลบกลุ่ม
				await dbDelete(STORE_ICS_IMPORTS, groupId);

				// อัปเดต state
				state.icsImports = state.icsImports.filter(g => g.id !== groupId);
				state.importedEvents = state.importedEvents.filter(ev => ev.importId !== groupId);

				// ปิด modal และเปิดใหม่เพื่อรีเฟรช
				closeImportedEventsModal();
				openImportedEventsModal();
				renderCalendarView();
				showToast('ลบกลุ่มและกิจกรรมเรียบร้อย', 'success');
				const group = state.icsImports.find(g => g.id === groupId);
				const groupName = group?.fileName || 'ไม่ทราบชื่อ';

				addActivityLog(
					'🗑️ ลบกลุ่มกิจกรรม',
					`ลบกลุ่ม "${groupName}" (${eventsToDelete.length} รายการ)`,
					'fa-trash',
					'text-red-600'
				);
			}

			async function deleteSingleEvent(eventId) {
				const event = state.importedEvents.find(ev => ev.id === eventId);
				if (!event) return;

				await dbDelete(STORE_IMPORTED_EVENTS, eventId);
				state.importedEvents = state.importedEvents.filter(ev => ev.id !== eventId);

				// อัปเดตจำนวนในกลุ่ม
				const group = state.icsImports.find(g => g.id === event.importId);
				if (group) {
					group.eventCount -= 1;
					if (group.eventCount <= 0) {
						// ถ้าไม่มีรายการเหลือ ให้ลบกลุ่มทิ้งด้วย
						await dbDelete(STORE_ICS_IMPORTS, group.id);
						state.icsImports = state.icsImports.filter(g => g.id !== group.id);
					} else {
						await dbPut(STORE_ICS_IMPORTS, group);
					}
				}

				// รีเฟรช modal และปฏิทิน
				closeImportedEventsModal();
				openImportedEventsModal();
				renderCalendarView();
				showToast('ลบรายการแล้ว', 'success');
				addActivityLog(
					'🗑️ ลบกิจกรรม',
					`"${event.title}"`,
					'fa-calendar-times',
					'text-red-600'
				);
			}
			
			// ทำให้ฟังก์ชันเป็น global
			window.closeImportedEventsModal = function() {
				const modal = document.getElementById('imported-events-modal');
				if (modal) modal.classList.add('hidden');
			};
			

        });