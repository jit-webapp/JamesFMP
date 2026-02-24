// 0. นำเข้าตัวแปร APP_VERSION จากไฟล์ version.js
importScripts('version.js?v=' + (new URL(location.href).searchParams.get('v')));

// 1. กำหนดชื่อ Cache โดยอิงจาก APP_VERSION
const CACHE_NAME = 'finance-manager-' + APP_VERSION;

// รายการไฟล์ที่ต้องการให้จำไว้ในเครื่อง (App Shell)
const ASSETS_TO_CACHE = [
  `./?v=${APP_VERSION}`,
  `./index.html?v=${APP_VERSION}`,
  `./script.js?v=${APP_VERSION}`,
  `./version.js?v=${APP_VERSION}`,
  `./styles.css?v=${APP_VERSION}`,
  `./config.js?v=${APP_VERSION}`, 
  `./guide.js?v=${APP_VERSION}`,
  `./manifest.json`,
  './icons/icon-192x192.png',
  './icons/icon-512x512.png',
  `./libs/tailwindcss.js?v=${APP_VERSION}`,
  `./libs/prompt.css?v=${APP_VERSION}`,
  `./libs/all.min.css?v=${APP_VERSION}`,
  `./libs/sweetalert2.js?v=${APP_VERSION}`,
  `./libs/chart.js?v=${APP_VERSION}`,
  `./libs/chartjs-plugin-datalabels.js?v=${APP_VERSION}`,
  `./libs/crypto-js.min.js?v=${APP_VERSION}`,
  `./libs/fullcalendar.min.js?v=${APP_VERSION}`,
  `./libs/panzoom.min.js?v=${APP_VERSION}`,
  `./libs/xlsx.full.min.js?v=${APP_VERSION}`,
  `./libs/tesseract.min.js?v=${APP_VERSION}`,
  './images/chart-bar-sample.png',
  './images/chart-doughnut-sample.png',
  './images/chart-pie-sample.png',
  './images/chart-trend-sample.png'
];

// 2. Event Install: ติดตั้งและบังคับข้ามการรอ (Skip Waiting)
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing new version:', CACHE_NAME);
  self.skipWaiting(); // บังคับอัปเดตทันที ไม่ต้องรอปิด Browser
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching app shell');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// รับคำสั่ง skipWaiting จาก Message (เผื่อใช้ปุ่มกดอัปเดต)
self.addEventListener('message', (event) => {
  if (event.data && event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});

// 3. Event Activate: ลบ Cache เก่าทิ้ง
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activated version:', APP_VERSION);
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) {
          console.log('[Service Worker] Removing old cache', key);
          return caches.delete(key);
        }
      }));
    })
  );
  return self.clients.claim();
});

// 4. Event Fetch: ดักจับการโหลดไฟล์ + Dynamic Caching
self.addEventListener('fetch', (event) => {
  // ข้ามการ Cache ข้อมูลจาก Firebase หรือ Google Auth
  if (event.request.url.includes('firestore.googleapis.com') || 
      event.request.url.includes('googleapis.com/auth')) {
    return; 
  }

  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then((cachedResponse) => {
      // 1. ถ้ามีในเครื่องแล้ว ใช้จากเครื่องเลย
      if (cachedResponse) {
        return cachedResponse;
      }

      // 2. ถ้าไม่มี ให้โหลดจากเน็ต
      return fetch(event.request).then((networkResponse) => {
        // ตรวจสอบความถูกต้องของ Response 
        // 🟢 เพิ่มเงื่อนไข .startsWith('http') เพื่อป้องกัน Error จาก Chrome Extension
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic' || !event.request.url.startsWith('http')) {
          return networkResponse;
        }

        // *** เก็บลงเครื่องอัตโนมัติ (สำหรับไอคอน Font Awesome และฟอนต์ที่โหลดสด) ***
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch((error) => {
         console.error('[Service Worker] Fetch failed:', error);
      });
    })
  );
});