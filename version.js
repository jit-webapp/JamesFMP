// ============================================
// เวอร์ชันและสถานะของแอปพลิเคชัน
// ============================================

// เวอร์ชันหลัก
var APP_VERSION = 'v8.6.23';
var APP_LAST_UPDATED = '09-03-2026';
var APP_LAST_UPDATED_TH = '9 มีนาคม 2569';

// ช่องสำหรับพิมพ์รายละเอียดการอัปเดต (ให้พิมพ์ไว้ในเครื่องหมาย ` `)
var APP_UPDATE_NOTES = `
<b>⚙️ แก้ไข bug</b>
เพื่อให้พื้นที่หน้าแรกบนมือถือเหลือเยอะที่สุด ผมได้รื้อโครงสร้างส่วน "ปุ่มเพิ่มรายการทั้ง 4 ปุ่ม" และ "ปุ่มตัวกรอง (Filter)" ใหม่ทั้งหมด โดยใช้เทคนิคดังนี้:
เปลี่ยนปุ่มเพิ่มรายการเป็น Grid 2x2: จากเดิมที่เรียงต่อกันแนวตั้ง 4 บรรทัด (กินพื้นที่จอไปเกือบครึ่ง) เปลี่ยนเป็นกล่องสี่เหลี่ยมเรียงคู่กันแบบ 2x2 (คล้ายเมนูแอปธนาคาร) ช่วยประหยัดพื้นที่แนวตั้งได้มากกว่า 50%
ย่อขนาดปุ่มตัวกรอง (ทั้งหมด, รายรับ, รายจ่าย): ลด Padding และขนาดฟอนต์ให้เล็กลง เปลี่ยนเป็นรูปทรงกะทัดรัด (Compact Tabs)
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