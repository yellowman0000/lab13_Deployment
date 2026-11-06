// Edit this file before deploying the tester to Vercel (or any static host).
// Priority when the page loads:
//   1. ?api=https://... in the page URL (handy share link)
//   2. the last URL you used in this browser (localStorage)
//   3. same origin, when the backend itself serves this page at /visual/
//   4. defaultApi below
window.GACHA_TESTER_CONFIG = {
  // Example: 'https://gacha-6688123.onrender.com' or 'https://gacha-6688123.up.railway.app'
  defaultApi: 'http://localhost:8085',
  presets: [
    { id: 'direct', en: 'Local direct port · localhost:8085', th: 'พอร์ตตรงในเครื่อง · localhost:8085', url: 'http://localhost:8085' },
    { id: 'npm', en: 'Local NPM proxy · gacha.test/backend', th: 'NPM ในเครื่อง · gacha.test/backend', url: 'http://gacha.test/backend' },
    { id: 'vm', en: 'Ubuntu VM through NPM (edit IP)', th: 'Ubuntu VM ผ่าน NPM (แก้ IP)', url: 'http://192.168.64.10/backend' },
    { id: 'railway', en: 'Railway (edit domain)', th: 'Railway (แก้ domain)', url: 'https://YOUR-APP.up.railway.app' },
    { id: 'render', en: 'Render (edit domain)', th: 'Render (แก้ domain)', url: 'https://YOUR-APP.onrender.com' }
  ]
};
