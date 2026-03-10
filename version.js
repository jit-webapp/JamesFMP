// ============================================
// เวอร์ชันและสถานะของแอปพลิเคชัน
// ============================================

// เวอร์ชันหลัก
var APP_VERSION = 'v8.6.26';
var APP_LAST_UPDATED = '09-03-2026';
var APP_LAST_UPDATED_TH = '9 มีนาคม 2569';

// ช่องสำหรับพิมพ์รายละเอียดการอัปเดต (ให้พิมพ์ไว้ในเครื่องหมาย ` `)
var APP_UPDATE_NOTES = `
<b>⚙️ แก้ไข bug</b>
- เพิ่ม UX ตอนสลับแอปให้ลื่นไหล: โค้ดจะพยายามดึงหน้าสแกนนิ้วขึ้นมาอัตโนมัติ แต่ถ้าเบราว์เซอร์มือถือเรื่องมาก ทำการบล็อกไม่ให้หน้าต่างสแกนเด้ง (เพราะเรายังไม่ได้แตะจอ) ระบบจะไม่พัง แต่จะสั่งให้ ปุ่มสแกนนิ้วกระพริบดุ๊กดิ๊กเตือนผู้ใช้ ให้จิ้มที่ปุ่มสแกนเพื่อปลดล็อคแทน
- เพิ่ม ระบบศูนย์กลางควบคุมขนาดตัวอักษร
- แก้ไขปัญหา รหัสผ่านผิด 100%: เบราว์เซอร์จะไม่มองว่าปุ่มสแกนนิ้วคือการส่งรหัสผ่านอีกต่อไป กดกี่ครั้งก็ไม่เด้ง Error
- แก้ไขปัญหา ไม่สแกนนิ้วออโต้เมื่อสลับแอปกลับมา (Foreground)
- แก้ไขปัญหา เมื่อปลดล็อคสำเร็จ ระบบควรพาผู้ใช้กลับไปสู่ "หน้าเดิม" ที่เปิดค้างไว้ก่อนที่แอปจะล็อค พร้อมกับอัปเดตสีของไอคอนเมนูให้ถูกต้อง
`;

var APP_STATUS = '';

// ชื่อแบบมีวงเล็บ
var APP_STATUS_DISPLAY = APP_STATUS ? `(${APP_STATUS})` : '';

// ชื่อแบบสั้นสำหรับ manifest (ไม่มีวงเล็บ)
var APP_SHORT_NAME = APP_STATUS ? `FMPro${APP_STATUS_DISPLAY}` : 'FMPro';

// Export ไปยัง window (เช็คก่อนว่ามี object window หรือไม่)
if (typeof window !== 'undefined') {
    window.APP_VERSION = APP_VERSION;
    window.APP_LAST_UPDATED = APP_LAST_UPDATED;
    window.APP_LAST_UPDATED_TH = APP_LAST_UPDATED_TH;
    window.APP_STATUS = APP_STATUS;
    window.APP_STATUS_DISPLAY = APP_STATUS_DISPLAY;
    window.APP_SHORT_NAME = APP_SHORT_NAME;
}