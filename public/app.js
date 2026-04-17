// ============================================
// ZELTA PREMIUM - Telegram Mini App
// Main Application Logic
// ============================================

// --- Translations ---
const translations = {
  uz: {
      headline: "Zelta Premium \u2014 Interyerda yangi davr",
    subtext: "Birinchi 50 ta mijozga xonasi uchun bepul 3D-vizualizatsiya sovg'a qilinadi.",
    callCardTitle: "Operator bilan bog\u2018lanish",
    callCardSubtitle: "+99855 520 9595",
    showroomTitle: "Showroom lokatsiyasi",
    showroomSubtitle: "Toshkent, Samarqand darvoza",
    trustLine: "Ma\u2018lumotlaringiz xavfsiz saqlanadi",
    ctaButton: "Bepul imkoniyatdan foydalanish",
    offerTitle: "Maxsus taklif",
    offerCounter: "Siz {n}-bo\u2018lib ushbu imkoniyatga ega bo\u2018ldingiz",
    offerDesc: "Zelta Premium birinchi 50 ta mijozga bepul masofaviy 3D render xizmatini taqdim etadi. Xonangizdagi mebelning real ko\u2018rinishini oling.",
    processTitle: "Jarayon qanday ishlaydi:",
    processStep1: "3 ta xona suratini yuklang",
    processStep2: "Telefon raqamingizni qoldiring",
    processStep3: "Mutaxassis 20 daqiqada bog\u2018lanadi",
    offerCta: "Davom etish",
    photoTitle: "Xona suratlarini yuklang",
    photoSubtitle: "Iltimos, 3 ta xona suratini yuklang. Bu bizga aniq 3D render tayyorlashga yordam beradi.",
    photoTip1: "Xona yorug\u2018 bo\u2018lsin",
    photoTip2: "Burchaklardan olingan rasmlar bo\u2018lsin",
    photoTip3: "Mebel joylashadigan joy aniq ko\u2018rinsin",
    photoSlot: "Surat",
    photoReplace: "Almashtirish",
    photoRequired: "Iltimos, 3 ta surat yuklang",
    photoCta: "Davom etish",
    phoneTitle: "Telefon raqamingiz",
    phoneSubtitle: "Rahmat. Endi telefon raqamingizni qoldiring. Mutaxassisimiz siz bilan 20 daqiqa ichida bog\u2018lanadi.",
    phonePrivacy: "Raqamingiz faqat konsultatsiya uchun ishlatiladi va uchinchi shaxslarga berilmaydi.",
    phoneInvalid: "Iltimos, to\u2018g\u2018ri telefon raqam kiriting",
    phoneCta: "Davom etish",
    qualTitle: "Qo\u2018shimcha ma\u2018lumot",
    qualSubtitle: "Qaysi xona uchun mebel qidiryapsiz? Bu bizga aniqroq taklif tayyorlashga yordam beradi.",
    qualFurniture: "Mebel turi",
    qualBedroom: "Yotoqxona",
    qualLiving: "Mehmonxona",
    qualDining: "Stol-stul",
    qualOther: "Boshqa",
    qualRoomType: "Xona turi",
    qualRoomNew: "Yangi xona",
    qualRoomRenovation: "Ta\u2018mir",
    qualRoomExisting: "Mavjud xona",
    qualSkip: "O\u2018tkazib yuborish",
    qualCta: "Yuborish",
    successTitle: "So\u2018rovingiz qabul qilindi",
    successMessage: "Rahmat. Mutaxassisimiz render bo\u2018yicha ishni boshlab, siz bilan 20 daqiqa ichida bog\u2018lanadi.",
    successPortfolio: "Portfolio ko\u2018rish",
    successCall: "Operator bilan bog\u2018lanish",
    successThank: "Zelta Premium ni tanlaganingiz uchun rahmat",
    ctaScreen1: "Bepul imkoniyatdan foydalanish"
  },
  ru: {
    headline: "Zelta Premium \u2014 \u041d\u043e\u0432\u0430\u044f \u044d\u0440\u0430 \u0438\u043d\u0442\u0435\u0440\u044c\u0435\u0440\u0430",
    subtext: "\u041f\u0435\u0440\u0432\u044b\u043c 50 \u043a\u043b\u0438\u0435\u043d\u0442\u0430\u043c \u2014 \u0431\u0435\u0441\u043f\u043b\u0430\u0442\u043d\u0430\u044f 3D-\u0432\u0438\u0437\u0443\u0430\u043b\u0438\u0437\u0430\u0446\u0438\u044f \u0432\u0430\u0448\u0435\u0439 \u043a\u043e\u043c\u043d\u0430\u0442\u044b \u0432 \u043f\u043e\u0434\u0430\u0440\u043e\u043a.",
    callCardTitle: "\u0421\u0432\u044f\u0437\u0430\u0442\u044c\u0441\u044f \u0441 \u043e\u043f\u0435\u0440\u0430\u0442\u043e\u0440\u043e\u043c",
    callCardSubtitle: "+99855 520 9595",
    showroomTitle: "\u0420\u0430\u0441\u043f\u043e\u043b\u043e\u0436\u0435\u043d\u0438\u0435 \u0448\u043e\u0443\u0440\u0443\u043c\u0430",
    showroomSubtitle: "\u0422\u0430\u0448\u043a\u0435\u043d\u0442, \u0421\u0430\u043c\u0430\u0440\u043a\u0430\u043d\u0434 \u0434\u0430\u0440\u0432\u0430\u0437\u0430",
    trustLine: "\u0412\u0430\u0448\u0438 \u0434\u0430\u043d\u043d\u044b\u0435 \u043d\u0430\u0434\u0451\u0436\u043d\u043e \u0437\u0430\u0449\u0438\u0449\u0435\u043d\u044b",
    ctaButton: "\u0412\u043e\u0441\u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u044c\u0441\u044f \u0431\u0435\u0441\u043f\u043b\u0430\u0442\u043d\u043e",
    offerTitle: "\u0421\u043f\u0435\u0446\u0438\u0430\u043b\u044c\u043d\u043e\u0435 \u043f\u0440\u0435\u0434\u043b\u043e\u0436\u0435\u043d\u0438\u0435",
    offerCounter: "\u0412\u044b {n}-\u0439 \u043a\u043b\u0438\u0435\u043d\u0442, \u043f\u043e\u043b\u0443\u0447\u0438\u0432\u0448\u0438\u0439 \u044d\u0442\u0443 \u0432\u043e\u0437\u043c\u043e\u0436\u043d\u043e\u0441\u0442\u044c",
    offerDesc: "Zelta Premium \u043f\u0440\u0435\u0434\u043e\u0441\u0442\u0430\u0432\u043b\u044f\u0435\u0442 \u043f\u0435\u0440\u0432\u044b\u043c 50 \u043a\u043b\u0438\u0435\u043d\u0442\u0430\u043c \u0431\u0435\u0441\u043f\u043b\u0430\u0442\u043d\u044b\u0439 \u0443\u0434\u0430\u043b\u0451\u043d\u043d\u044b\u0439 3D-\u0440\u0435\u043d\u0434\u0435\u0440. \u041f\u043e\u043b\u0443\u0447\u0438\u0442\u0435 \u0440\u0435\u0430\u043b\u0438\u0441\u0442\u0438\u0447\u043d\u0443\u044e \u0432\u0438\u0437\u0443\u0430\u043b\u0438\u0437\u0430\u0446\u0438\u044e \u043c\u0435\u0431\u0435\u043b\u0438 \u0432 \u0432\u0430\u0448\u0435\u043c \u0438\u043d\u0442\u0435\u0440\u044c\u0435\u0440\u0435.",
    processTitle: "\u041a\u0430\u043a \u044d\u0442\u043e \u0440\u0430\u0431\u043e\u0442\u0430\u0435\u0442:",
    processStep1: "\u0417\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u0435 3 \u0444\u043e\u0442\u043e\u0433\u0440\u0430\u0444\u0438\u0438 \u043a\u043e\u043c\u043d\u0430\u0442\u044b",
    processStep2: "\u041e\u0441\u0442\u0430\u0432\u044c\u0442\u0435 \u043d\u043e\u043c\u0435\u0440 \u0442\u0435\u043b\u0435\u0444\u043e\u043d\u0430",
    processStep3: "\u0421\u043f\u0435\u0446\u0438\u0430\u043b\u0438\u0441\u0442 \u0441\u0432\u044f\u0436\u0435\u0442\u0441\u044f \u0432 \u0442\u0435\u0447\u0435\u043d\u0438\u0435 20 \u043c\u0438\u043d\u0443\u0442",
    offerCta: "\u041f\u0440\u043e\u0434\u043e\u043b\u0436\u0438\u0442\u044c",
    photoTitle: "\u0417\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u0435 \u0444\u043e\u0442\u043e\u0433\u0440\u0430\u0444\u0438\u0438 \u043a\u043e\u043c\u043d\u0430\u0442\u044b",
    photoSubtitle: "\u041f\u043e\u0436\u0430\u043b\u0443\u0439\u0441\u0442\u0430, \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u0435 3 \u0444\u043e\u0442\u043e\u0433\u0440\u0430\u0444\u0438\u0438 \u043a\u043e\u043c\u043d\u0430\u0442\u044b. \u042d\u0442\u043e \u043f\u043e\u043c\u043e\u0436\u0435\u0442 \u043d\u0430\u043c \u043f\u043e\u0434\u0433\u043e\u0442\u043e\u0432\u0438\u0442\u044c \u0442\u043e\u0447\u043d\u0443\u044e 3D-\u0432\u0438\u0437\u0443\u0430\u043b\u0438\u0437\u0430\u0446\u0438\u044e.",
    photoTip1: "\u041a\u043e\u043c\u043d\u0430\u0442\u0430 \u0434\u043e\u043b\u0436\u043d\u0430 \u0431\u044b\u0442\u044c \u0445\u043e\u0440\u043e\u0448\u043e \u043e\u0441\u0432\u0435\u0449\u0435\u043d\u0430",
    photoTip2: "\u0421\u043d\u0438\u043c\u0430\u0439\u0442\u0435 \u0438\u0437 \u0443\u0433\u043b\u043e\u0432 \u043a\u043e\u043c\u043d\u0430\u0442\u044b",
    photoTip3: "\u041c\u0435\u0441\u0442\u043e \u0434\u043b\u044f \u043c\u0435\u0431\u0435\u043b\u0438 \u0434\u043e\u043b\u0436\u043d\u043e \u0431\u044b\u0442\u044c \u0445\u043e\u0440\u043e\u0448\u043e \u0432\u0438\u0434\u043d\u043e",
    photoSlot: "\u0424\u043e\u0442\u043e",
    photoReplace: "\u0417\u0430\u043c\u0435\u043d\u0438\u0442\u044c",
    photoRequired: "\u041f\u043e\u0436\u0430\u043b\u0443\u0439\u0441\u0442\u0430, \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u0435 3 \u0444\u043e\u0442\u043e\u0433\u0440\u0430\u0444\u0438\u0438",
    photoCta: "\u041f\u0440\u043e\u0434\u043e\u043b\u0436\u0438\u0442\u044c",
    phoneTitle: "\u0412\u0430\u0448 \u043d\u043e\u043c\u0435\u0440 \u0442\u0435\u043b\u0435\u0444\u043e\u043d\u0430",
    phoneSubtitle: "\u0421\u043f\u0430\u0441\u0438\u0431\u043e. \u0422\u0435\u043f\u0435\u0440\u044c \u043e\u0441\u0442\u0430\u0432\u044c\u0442\u0435 \u0432\u0430\u0448 \u043d\u043e\u043c\u0435\u0440 \u0442\u0435\u043b\u0435\u0444\u043e\u043d\u0430. \u041d\u0430\u0448 \u0441\u043f\u0435\u0446\u0438\u0430\u043b\u0438\u0441\u0442 \u0441\u0432\u044f\u0436\u0435\u0442\u0441\u044f \u0441 \u0432\u0430\u043c\u0438 \u0432 \u0442\u0435\u0447\u0435\u043d\u0438\u0435 20 \u043c\u0438\u043d\u0443\u0442.",
    phonePrivacy: "\u0412\u0430\u0448 \u043d\u043e\u043c\u0435\u0440 \u0438\u0441\u043f\u043e\u043b\u044c\u0437\u0443\u0435\u0442\u0441\u044f \u0438\u0441\u043a\u043b\u044e\u0447\u0438\u0442\u0435\u043b\u044c\u043d\u043e \u0434\u043b\u044f \u043a\u043e\u043d\u0441\u0443\u043b\u044c\u0442\u0430\u0446\u0438\u0438 \u0438 \u043d\u0435 \u043f\u0435\u0440\u0435\u0434\u0430\u0451\u0442\u0441\u044f \u0442\u0440\u0435\u0442\u044c\u0438\u043c \u043b\u0438\u0446\u0430\u043c.",
    phoneInvalid: "\u041f\u043e\u0436\u0430\u043b\u0443\u0439\u0441\u0442\u0430, \u0432\u0432\u0435\u0434\u0438\u0442\u0435 \u043a\u043e\u0440\u0440\u0435\u043a\u0442\u043d\u044b\u0439 \u043d\u043e\u043c\u0435\u0440 \u0442\u0435\u043b\u0435\u0444\u043e\u043d\u0430",
    phoneCta: "\u041f\u0440\u043e\u0434\u043e\u043b\u0436\u0438\u0442\u044c",
    qualTitle: "\u0414\u043e\u043f\u043e\u043b\u043d\u0438\u0442\u0435\u043b\u044c\u043d\u0430\u044f \u0438\u043d\u0444\u043e\u0440\u043c\u0430\u0446\u0438\u044f",
    qualSubtitle: "\u0414\u043b\u044f \u043a\u0430\u043a\u043e\u0439 \u043a\u043e\u043c\u043d\u0430\u0442\u044b \u0432\u044b \u043f\u043e\u0434\u0431\u0438\u0440\u0430\u0435\u0442\u0435 \u043c\u0435\u0431\u0435\u043b\u044c? \u042d\u0442\u043e \u043f\u043e\u043c\u043e\u0436\u0435\u0442 \u043d\u0430\u043c \u043f\u043e\u0434\u0433\u043e\u0442\u043e\u0432\u0438\u0442\u044c \u0431\u043e\u043b\u0435\u0435 \u0442\u043e\u0447\u043d\u043e\u0435 \u043f\u0440\u0435\u0434\u043b\u043e\u0436\u0435\u043d\u0438\u0435.",
    qualFurniture: "\u0422\u0438\u043f \u043c\u0435\u0431\u0435\u043b\u0438",
    qualBedroom: "\u0421\u043f\u0430\u043b\u044c\u043d\u044f",
    qualLiving: "\u0413\u043e\u0441\u0442\u0438\u043d\u0430\u044f",
    qualDining: "\u041e\u0431\u0435\u0434\u0435\u043d\u043d\u0430\u044f \u0433\u0440\u0443\u043f\u043f\u0430",
    qualOther: "\u0414\u0440\u0443\u0433\u043e\u0435",
    qualRoomType: "\u0422\u0438\u043f \u043f\u043e\u043c\u0435\u0449\u0435\u043d\u0438\u044f",
    qualRoomNew: "\u041d\u043e\u0432\u043e\u0435 \u043f\u043e\u043c\u0435\u0449\u0435\u043d\u0438\u0435",
    qualRoomRenovation: "\u0420\u0435\u043c\u043e\u043d\u0442",
    qualRoomExisting: "\u0421\u0443\u0449\u0435\u0441\u0442\u0432\u0443\u044e\u0449\u0435\u0435",
    qualSkip: "\u041f\u0440\u043e\u043f\u0443\u0441\u0442\u0438\u0442\u044c",
    qualCta: "\u041e\u0442\u043f\u0440\u0430\u0432\u0438\u0442\u044c",
    successTitle: "\u0417\u0430\u044f\u0432\u043a\u0430 \u043f\u0440\u0438\u043d\u044f\u0442\u0430",
    successMessage: "\u0421\u043f\u0430\u0441\u0438\u0431\u043e. \u041d\u0430\u0448 \u0441\u043f\u0435\u0446\u0438\u0430\u043b\u0438\u0441\u0442 \u043f\u0440\u0438\u0441\u0442\u0443\u043f\u0438\u0442 \u043a \u043f\u043e\u0434\u0433\u043e\u0442\u043e\u0432\u043a\u0435 \u0440\u0435\u043d\u0434\u0435\u0440\u0430 \u0438 \u0441\u0432\u044f\u0436\u0435\u0442\u0441\u044f \u0441 \u0432\u0430\u043c\u0438 \u0432 \u0442\u0435\u0447\u0435\u043d\u0438\u0435 20 \u043c\u0438\u043d\u0443\u0442.",
    successPortfolio: "\u0421\u043c\u043e\u0442\u0440\u0435\u0442\u044c \u043f\u043e\u0440\u0442\u0444\u043e\u043b\u0438\u043e",
    successCall: "\u0421\u0432\u044f\u0437\u0430\u0442\u044c\u0441\u044f \u0441 \u043e\u043f\u0435\u0440\u0430\u0442\u043e\u0440\u043e\u043c",
    successThank: "\u0411\u043b\u0430\u0433\u043e\u0434\u0430\u0440\u0438\u043c \u0437\u0430 \u0432\u044b\u0431\u043e\u0440 Zelta Premium",
    ctaScreen1: "\u0412\u043e\u0441\u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u044c\u0441\u044f \u0431\u0435\u0441\u043f\u043b\u0430\u0442\u043d\u043e"
  }
};

// --- State ---
let currentScreen = 1;
let currentLang = 'uz';
let uploadedPhotos = [null, null, null];
let currentPhotoSlot = null;
let leadData = {
  telegram_user_id: null,
  telegram_username: null,
  full_name: null,
  selected_language: 'uz',
  phone_number: null,
  furniture_interest: null,
  room_type: null,
  photos: [],
  source: 'telegram_mini_app'
};

// --- Telegram WebApp Init ---
let tg = null;
try {
  tg = window.Telegram && window.Telegram.WebApp;
  if (tg) {
    tg.ready();
    tg.expand();
    tg.setHeaderColor('#0a0a0a');
    tg.setBackgroundColor('#0a0a0a');
    
    // Get user data
    if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
      const user = tg.initDataUnsafe.user;
      leadData.telegram_user_id = user.id;
      leadData.telegram_username = user.username || null;
      leadData.full_name = [user.first_name, user.last_name].filter(Boolean).join(' ') || null;
    }

    // Back button handling
    tg.BackButton.onClick(function() {
      if (currentScreen > 1) {
        goToScreen(currentScreen - 1);
      }
    });
  }
} catch(e) {
  console.log('[Zelta] Telegram WebApp not available, running in browser mode');
}

// --- Language ---
function setLanguage(lang) {
  currentLang = lang;
  leadData.selected_language = lang;
  
  // Update switcher UI
  document.getElementById('langUz').classList.toggle('active', lang === 'uz');
  document.getElementById('langRu').classList.toggle('active', lang === 'ru');
  
  // Update all translatable elements
  applyTranslations();
  
  // Save to session
  try { sessionStorage.setItem('zelta_lang', lang); } catch(e) {}
}

function applyTranslations() {
  const t = translations[currentLang];
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (t[key]) {
      let text = t[key];
      // Handle parameterized strings
      const param = el.getAttribute('data-i18n-param');
      if (param) {
        text = text.replace('{n}', param);
      }
      el.textContent = text;
    }
  });
  
  // Update CTA button text
  updateCTAButton();
}

function updateCTAButton() {
  const t = translations[currentLang];
  const btn = document.getElementById('ctaBtn');
  const container = document.getElementById('ctaContainer');
  
  switch(currentScreen) {
    case 1:
      btn.textContent = t.ctaButton;
      btn.disabled = false;
      container.style.display = 'none';
      // Update inline CTA button text
      document.querySelectorAll('.cta-inline button[data-i18n="ctaScreen1"]').forEach(b => {
        b.textContent = t.ctaScreen1 || t.ctaButton;
      });
      break;
    case 2:
      btn.textContent = t.offerCta;
      btn.disabled = false;
      container.style.display = 'block';
      break;
    case 3:
      btn.textContent = t.photoCta;
      btn.disabled = uploadedPhotos.filter(p => p !== null).length < 3;
      container.style.display = 'block';
      break;
    case 4:
      btn.textContent = t.phoneCta;
      btn.disabled = false;
      container.style.display = 'block';
      break;
    case 5:
      btn.textContent = t.qualCta;
      btn.disabled = false;
      container.style.display = 'block';
      break;
    case 6:
      container.style.display = 'none';
      break;
  }
}

// --- Navigation ---
function goToScreen(num) {
  // Hide all screens
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  
  // Show target screen
  document.getElementById('screen' + num).classList.add('active');
  currentScreen = num;
  
  // Update progress bar
  for (let i = 1; i <= 6; i++) {
    const dot = document.getElementById('dot' + i);
    dot.classList.remove('active', 'completed');
    if (i === num) dot.classList.add('active');
    else if (i < num) dot.classList.add('completed');
  }
  document.getElementById('progressLabel').textContent = num + '/6';
  
  // Telegram back button
  if (tg) {
    if (num > 1 && num < 6) {
      tg.BackButton.show();
    } else {
      tg.BackButton.hide();
    }
  }
  
  // Update CTA
  updateCTAButton();
  
  // Scroll to top
  window.scrollTo(0, 0);
}

// --- CTA Handler ---
function handleCTA() {
  switch(currentScreen) {
    case 1:
      goToScreen(2);
      break;
    case 2:
      goToScreen(3);
      break;
    case 3:
      if (uploadedPhotos.filter(p => p !== null).length < 3) {
        document.getElementById('photoError').classList.add('visible');
        return;
      }
      document.getElementById('photoError').classList.remove('visible');
      goToScreen(4);
      break;
    case 4:
      if (!validatePhone()) {
        document.getElementById('phoneError').classList.add('visible');
        return;
      }
      document.getElementById('phoneError').classList.remove('visible');
      leadData.phone_number = '+998' + document.getElementById('phoneInput').value.replace(/\s/g, '');
      goToScreen(5);
      break;
    case 5:
      submitLead();
      break;
  }
}

// --- Photo Upload ---
function triggerPhotoUpload(slot) {
  currentPhotoSlot = slot;
  document.getElementById('photoInput').click();
}

function handlePhotoUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const slot = currentPhotoSlot;
  const reader = new FileReader();
  
  reader.onload = function(e) {
    uploadedPhotos[slot - 1] = {
      data: e.target.result,
      file: file
    };
    
    const slotEl = document.getElementById('photoSlot' + slot);
    slotEl.classList.add('filled');
    slotEl.innerHTML = `
      <img src="${e.target.result}" alt="Photo ${slot}">
      <button class="replace-btn" onclick="event.stopPropagation(); triggerPhotoUpload(${slot})" data-i18n="photoReplace">${translations[currentLang].photoReplace}</button>
    `;
    
    // Update CTA state
    const count = uploadedPhotos.filter(p => p !== null).length;
    document.getElementById('ctaBtn').disabled = count < 3;
    
    if (count >= 3) {
      document.getElementById('photoError').classList.remove('visible');
    }
  };
  
  reader.readAsDataURL(file);
  // Reset input so same file can be re-selected
  event.target.value = '';
}

// --- Phone Validation ---
function formatPhone(input) {
  let val = input.value.replace(/\D/g, '');
  if (val.length > 9) val = val.substring(0, 9);
  
  // Format: XX XXX XX XX
  let formatted = '';
  if (val.length > 0) formatted += val.substring(0, 2);
  if (val.length > 2) formatted += ' ' + val.substring(2, 5);
  if (val.length > 5) formatted += ' ' + val.substring(5, 7);
  if (val.length > 7) formatted += ' ' + val.substring(7, 9);
  
  input.value = formatted;
}

function validatePhone() {
  const val = document.getElementById('phoneInput').value.replace(/\s/g, '');
  return val.length === 9 && /^\d{9}$/.test(val);
}

// --- Qualification ---
function selectOption(el, type) {
  // Deselect siblings
  el.parentElement.querySelectorAll('.qual-option').forEach(o => o.classList.remove('selected'));
  el.classList.add('selected');
  
  if (type === 'furniture') {
    leadData.furniture_interest = el.getAttribute('data-value');
  } else if (type === 'room') {
    leadData.room_type = el.getAttribute('data-value');
  }
}

// --- Submit Lead ---
async function submitLead() {
  // Collect all data
  leadData.submitted_at = new Date().toISOString();
  
  const btn = document.getElementById('ctaBtn');
  btn.disabled = true;
  btn.textContent = '...';
  
  try {
    // Prepare form data with photos
    const formData = new FormData();
    formData.append('lead_data', JSON.stringify(leadData));
    
    // Append photo files
    uploadedPhotos.forEach((photo, idx) => {
      if (photo && photo.file) {
        formData.append('photo_' + (idx + 1), photo.file);
      }
    });
    
    const response = await fetch('/api/leads', {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) throw new Error('Submit failed');
    
    const result = await response.json();
    console.log('[Zelta] Lead submitted:', result);
    
  } catch (err) {
    console.log('[Zelta] Submit error (lead saved locally):', err);
    // Save locally as fallback
    try {
      const leads = JSON.parse(localStorage.getItem('zelta_leads') || '[]');
      leads.push({...leadData, photos_count: uploadedPhotos.filter(p => p).length});
      localStorage.setItem('zelta_leads', JSON.stringify(leads));
    } catch(e) {}
  }
  
  // Always go to success screen
  goToScreen(6);
  
  // Try to close via Telegram after delay
  if (tg) {
    // Send data back to bot
    try {
      tg.sendData(JSON.stringify({
        type: 'lead_submitted',
        phone: leadData.phone_number,
        language: leadData.selected_language,
        furniture: leadData.furniture_interest,
        room: leadData.room_type
      }));
    } catch(e) {}
  }
}

// --- Skip Qualification ---
function skipQualification() {
  submitLead();
}

// --- Init ---
document.addEventListener('DOMContentLoaded', function() {
  // Restore language
  try {
    const savedLang = sessionStorage.getItem('zelta_lang');
    if (savedLang) setLanguage(savedLang);
  } catch(e) {}
  
  // Apply initial translations
  applyTranslations();
  
  // Set initial screen
  goToScreen(1);
});
