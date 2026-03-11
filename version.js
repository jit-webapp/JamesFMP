// ============================================
// เวอร์ชันและสถานะของแอปพลิเคชัน
// ============================================

// เวอร์ชันหลัก
var APP_VERSION = 'v8.6.33';
var APP_LAST_UPDATED = '11-03-2026';
var APP_LAST_UPDATED_TH = '11 มีนาคม 2569';

// ช่องสำหรับพิมพ์รายละเอียดการอัปเดต (ให้พิมพ์ไว้ในเครื่องหมาย ` `)
var APP_UPDATE_NOTES = `
<b>⚙️ แก้ไข bug</b>
- ทำให้ปุ่ม Smart Voice ลากได้ (Draggable) และกระดิกเมื่ออยู่นิ่ง
- พร้อม tooltip แนะนำที่แสดง 10 วินาที แล้วซ่อน และวนใหม่ทุก 30 วินาที
- ปรับตำแหน่ง tooltip ไม่ให้ล้นขอบจออัตโนมัติ
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