// ============================================
// เวอร์ชันและสถานะของแอปพลิเคชัน
// ============================================

// เวอร์ชันหลัก
var APP_VERSION = 'v8.6.57';
var APP_LAST_UPDATED = '14-03-2026';
var APP_LAST_UPDATED_TH = '14 มีนาคม 2569';

// ช่องสำหรับพิมพ์รายละเอียดการอัปเดต (ให้พิมพ์ไว้ในเครื่องหมาย ` `)
var APP_UPDATE_NOTES = `
<b>⚙️ เพิ่มฟีเจอร์ </b>
- แสดงรายละเอียดเป็นสีและเพิ่ม icon ให้ ActivityLog
- แก้ไข ระบบเคาะ 2 ครั้งเพื่อล็อค (Double Tap)
- เพิ่มรายการที่บันทึกไว้ หมวดหมู่รายรับ หมวดหมู่รายจ่าย ให้สามารถแก้ไขได้
- แก้ไข Undo Redo
- เพิ่ม ระบบเปลี่ยนสีได้อิสระ รองรับ Hex Code ใหม่ๆ
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