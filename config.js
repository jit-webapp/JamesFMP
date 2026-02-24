// ============================================
// ไฟล์รวมค่าคงที่และการตั้งค่าต่าง ๆ ของระบบ
// ============================================

// Firebase Configuration
const FIREBASE_CONFIG = {
    apiKey: "AIzaSyAlbj8xCy1wvMub_YSpXRzX8cCBCxpygU8",
	authDomain: "jamesfmp-12b63.firebaseapp.com",
	projectId: "jamesfmp-12b63",
	storageBucket: "jamesfmp-12b63.firebasestorage.app",
	messagingSenderId: "665963407303",
	appId: "1:665963407303:web:a61568fac2fc5d966f5be2",
	measurementId: "G-R4SV072W63"
};

// LINE Integration
const LINE_CONFIG = {
	//Beta Version
    //OA_BOT_URL: "https://line.me/R/ti/p/@473mwbfr", // URL สำหรับแอดเพื่อนบอท
    //NOTIFY_GAS_URL: "https://script.google.com/macros/s/AKfycbxPpU4YA-L6a5FH0dG6xb9u52gxxbuc5zBlWWkQg2DMDbMRwGNyCn-k4ISPPYRPtRw_/exec", // Google Apps Script สำหรับส่ง LINE Notify
	
	//Full Version
    OA_BOT_URL: "https://line.me/R/ti/p/@915iftwn", // URL สำหรับแอดเพื่อนบอท
    NOTIFY_GAS_URL: "https://script.google.com/macros/s/AKfycbzMNMT2zIi08L7wcNhJU1Oq0rgx25f6jkb5rX8PM_7OEI1iP1sk_9BSjO2I5wTPEdVh/exec", // Google Apps Script สำหรับส่ง LINE Notify
//etWUZCUQiR6uatjHiBh+FN5LMfp1YEwZSzvLgU1znc0hbOo6F0oKQw+ZXQ5JVjX/7dsvTlSYPKYQ4qz/bukqN5MOMVmBXp6XG6UPMFzuQlKljAzBQuTiW+wL+tdI+Cfh0+scH5BJ9wexSlpgRsoi6wdB04t89/1O/w1cDnyilFU=
};

// รหัสผ่าน Master (สำหรับการกู้คืนฉุกเฉิน)
const MASTER_PASSWORD_HASH = '90b7a8f04fb00f2cf16545e365f4da47ace5446c49ced401d843b3f9e79efc09';

// ค่าคงที่อื่น ๆ (ถ้ามี)
const APP_DEFAULTS = {
    DEFAULT_PASSWORD: '1234',
    DEFAULT_FREQUENT_ITEMS: ['กินข้าว', 'รายจ่ายทั่วไป'],
    COMPRESS_MAX_WIDTH: 1024,
    COMPRESS_QUALITY: 0.7,
    MAX_FILE_SIZE_MB: 100,
    AUTO_LOCK_DEFAULT: 10,
    SUGGEST_FAVORITE_THRESHOLD: 3
};

// Export ให้ window เพื่อให้ script อื่นเรียกใช้ได้
window.FIREBASE_CONFIG = FIREBASE_CONFIG;
window.LINE_CONFIG = LINE_CONFIG;
window.MASTER_PASSWORD_HASH = MASTER_PASSWORD_HASH;
window.APP_DEFAULTS = APP_DEFAULTS;