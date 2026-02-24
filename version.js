// ============================================
// เวอร์ชันและสถานะของแอปพลิเคชัน
// ============================================

// เวอร์ชันหลัก
var APP_VERSION = 'v8.5.42';
var APP_LAST_UPDATED = '24-02-2026';
var APP_LAST_UPDATED_TH = '24 กุมภาพันธ์ 2569';

// สถานะของแอป (แก้ตรงนี้ที่เดียว!)
// - 'Beta'  ➜ จะแสดง (Beta)
// - ''      ➜ ไม่แสดงอะไรเลย (สำหรับเวอร์ชันเต็ม)
// Beta Version
//var APP_STATUS = 'Beta';
// Full Version
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