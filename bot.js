// ============================================
// ZELTA PREMIUM - Telegram Bot
// Launches Mini App + handles fallback
// ============================================

const TelegramBot = require('node-telegram-bot-api');
const path = require('path');
const fs = require('fs');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const MINI_APP_URL = process.env.MINI_APP_URL || 'https://your-domain.com';
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID;

if (!BOT_TOKEN) {
  console.error('[Zelta Bot] ERROR: TELEGRAM_BOT_TOKEN environment variable is required');
  process.exit(1);
}

const bot = new TelegramBot(BOT_TOKEN, { polling: true });
console.log('[Zelta Bot] Starting...');

// Image paths
const BEFORE_IMG = path.join(__dirname, 'public', 'images', 'before.jpg');
const AFTER_IMG = path.join(__dirname, 'public', 'images', 'after.jpg');

// --- /start command ---
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const firstName = msg.from.first_name || '';
  const lang = msg.from.language_code;
  const isRussian = lang && lang.startsWith('ru');

  try {
    // Step 1: Send before/after photos as album
    const beforeExists = fs.existsSync(BEFORE_IMG);
    const afterExists = fs.existsSync(AFTER_IMG);

    if (beforeExists && afterExists) {
      await bot.sendMediaGroup(chatId, [
        {
          type: 'photo',
          media: fs.createReadStream(BEFORE_IMG),
          caption: isRussian ? '📷 До — пустая комната' : '📷 Oldin — bo\'sh xona'
        },
        {
          type: 'photo',
          media: fs.createReadStream(AFTER_IMG),
          caption: isRussian ? '✨ После — мебель расставлена в 3D' : '✨ Keyin — mebel 3D da joylashtirildi'
        }
      ]);
    }

    // Step 2: Send main message with CTA
    const textUz = `Assalomu alaykum${firstName ? ', ' + firstName : ''}! 

Yuqoridagi rasmlarni ko'rdingizmi?
Bo'sh xonaga mebelni *virtual joylashtirib ko'rsatamiz* — aynan shunday natija olasiz!

🎁 *Birinchi 50 ta mijoz uchun bu xizmat BEPUL!*

Faqat 3 ta narsa kerak:
📸 Xonangiz rasmini yuboring
📱 Telefon raqamingizni qoldiring
⏰ 20 daqiqada menejer aloqaga chiqadi

👇 *Hoziroq boshlang:*`;

    const textRu = `Здравствуйте${firstName ? ', ' + firstName : ''}!

Видели фото выше?
Мы *виртуально расставим мебель* в вашей комнате — именно такой результат вы получите!

🎁 *Для первых 50 клиентов эта услуга БЕСПЛАТНА!*

Нужно всего 3 вещи:
📸 Отправьте фото комнаты
📱 Оставьте номер телефона
⏰ Менеджер свяжется за 20 минут

👇 *Начните прямо сейчас:*`;

    const text = isRussian ? textRu : textUz;

    await bot.sendMessage(chatId, text, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{
            text: isRussian ? '🏠 Получить бесплатную 3D-визуализацию' : '🏠 Bepul 3D-vizualizatsiya olish',
            web_app: { url: MINI_APP_URL }
          }],
          [{
            text: isRussian ? '📞 Позвонить оператору' : '📞 Operatorga qo\'ng\'iroq',
            url: 'https://t.me/zeltacallcenter'
          }]
        ]
      }
    });

  } catch (err) {
    console.error('[Zelta Bot] Error sending start message:', err.message);
    // Fallback
    const fallbackText = isRussian
      ? `Здравствуйте! Для бесплатной 3D-визуализации откройте: ${MINI_APP_URL}\n\nИли свяжитесь: @zeltacallcenter`
      : `Assalomu alaykum! Bepul 3D-vizualizatsiya uchun oching: ${MINI_APP_URL}\n\nYoki bog'laning: @zeltacallcenter`;
    await bot.sendMessage(chatId, fallbackText);
  }
});

// --- /help command ---
bot.onText(/\/help/, async (msg) => {
  const chatId = msg.chat.id;
  const lang = msg.from.language_code;
  const isRussian = lang && lang.startsWith('ru');

  const textUz = `*Zelta Premium yordam*

📱 Konsultatsiyani boshlash: /start
📞 Operator: +99855 520 9595
💬 Telegram: @zeltacallcenter
📸 Instagram: @zeltapremium.uz`;

  const textRu = `*Помощь Zelta Premium*

📱 Начать консультацию: /start
📞 Оператор: +99855 520 9595
💬 Telegram: @zeltacallcenter
📸 Instagram: @zeltapremium.uz`;

  await bot.sendMessage(chatId, isRussian ? textRu : textUz, { parse_mode: 'Markdown' });
});

// --- /operator command ---
bot.onText(/\/operator/, async (msg) => {
  const chatId = msg.chat.id;
  const lang = msg.from.language_code;
  const isRussian = lang && lang.startsWith('ru');

  const text = isRussian
    ? '📞 Позвоните: +99855 520 9595\n💬 Или напишите оператору:'
    : '📞 Qo\'ng\'iroq qiling: +99855 520 9595\n💬 Yoki operatorga yozing:';

  await bot.sendMessage(chatId, text, {
    reply_markup: {
      inline_keyboard: [
        [{ text: '💬 @zeltacallcenter', url: 'https://t.me/zeltacallcenter' }]
      ]
    }
  });
});

// --- Handle web_app_data ---
bot.on('web_app_data', async (msg) => {
  const chatId = msg.chat.id;
  try {
    const data = JSON.parse(msg.web_app_data.data);
    if (data.type === 'lead_submitted') {
      const isRussian = data.language === 'ru';
      const confirmText = isRussian
        ? '✅ Ваша заявка принята! Наш специалист свяжется с вами в течение 20 минут.'
        : '✅ So\'rovingiz qabul qilindi! Mutaxassisimiz 20 daqiqa ichida bog\'lanadi.';
      await bot.sendMessage(chatId, confirmText);

      if (ADMIN_CHAT_ID) {
        const adminText = `🔔 *Yangi lead!*\n📞 ${data.phone || 'N/A'}\n🌐 ${isRussian ? 'Русский' : "O'zbek"}\n🪑 ${data.furniture || 'N/A'}\n⏰ 20 daqiqa SLA!`;
        await bot.sendMessage(ADMIN_CHAT_ID, adminText, { parse_mode: 'Markdown' });
      }
    }
  } catch (err) {
    console.error('[Zelta Bot] web_app_data error:', err);
  }
});

// --- Auto-reply for common messages ---
const autoReplies = {
  uz: {
    keywords: ['salom', 'assalom', 'hayrli', 'narx', 'narxi', 'qancha', 'baho', 'mebel', 'divan', 'krovat', 'shkaf', 'stol', 'stul', 'karavot', 'yotoq'],
    greeting: ['salom', 'assalom', 'hayrli'],
    price: ['narx', 'narxi', 'qancha', 'baho'],
    furniture: ['mebel', 'divan', 'krovat', 'shkaf', 'stol', 'stul', 'karavot', 'yotoq']
  }
};

bot.on('message', async (msg) => {
  if (msg.text && msg.text.startsWith('/')) return;
  if (msg.web_app_data) return;
  if (!msg.text) return;

  const chatId = msg.chat.id;
  const lang = msg.from.language_code;
  const isRussian = lang && lang.startsWith('ru');
  const text = msg.text.toLowerCase().trim();

  // Check for greetings
  const greetings = ['salom', 'assalom', 'hayrli', 'привет', 'здравствуйте', 'салом', 'хаирли'];
  const isGreeting = greetings.some(g => text.includes(g));

  // Check for price questions
  const priceWords = ['narx', 'qancha', 'baho', 'цена', 'сколько', 'стоимость', 'прайс', 'price'];
  const isPrice = priceWords.some(p => text.includes(p));

  // Check for furniture words
  const furnitureWords = ['mebel', 'divan', 'krovat', 'shkaf', 'stol', 'stul', 'karavot', 'yotoq', 'мебель', 'диван', 'кровать', 'шкаф', 'стол', 'стул', 'кухня'];
  const isFurniture = furnitureWords.some(f => text.includes(f));

  let reply = '';

  if (isGreeting) {
    reply = isRussian
      ? `Здравствуйте! 😊\n\nМы — *Zelta Premium*, премиальный мебельный бренд.\n\nСейчас у нас акция: *бесплатная 3D-визуализация* для первых 50 клиентов!\n\nОтправьте фото комнаты — мы покажем, как будет выглядеть мебель 👇`
      : `Assalomu alaykum! 😊\n\nBiz — *Zelta Premium*, premium mebel brendi.\n\nHozir aksiya: birinchi 50 ta mijozga *bepul 3D-vizualizatsiya*!\n\nXonangiz rasmini yuboring — mebelni qanday ko'rinishini ko'rsatamiz 👇`;
  } else if (isPrice) {
    reply = isRussian
      ? `Цены зависят от модели и материала.\n\nНо сейчас у нас *бесплатная услуга*: мы расставим мебель в вашей комнате в 3D!\n\nОтправьте фото комнаты — менеджер подберёт варианты и цены 👇`
      : `Narxlar model va materialga qarab farq qiladi.\n\nLekin hozir *bepul xizmat* bor: xonangizga mebelni 3D da joylashtirib ko'rsatamiz!\n\nXonangiz rasmini yuboring — menejer variant va narxlarni taklif qiladi 👇`;
  } else if (isFurniture) {
    reply = isRussian
      ? `Отличный выбор! У нас широкий ассортимент премиальной мебели.\n\n*Бесплатно* покажем, как мебель будет смотреться в вашей комнате!\n\nОтправьте фото комнаты — мы сделаем 3D-визуализацию 👇`
      : `Ajoyib tanlov! Bizda premium mebellarning keng assortimenti bor.\n\nMebelni xonangizda qanday ko'rinishini *bepul* ko'rsatamiz!\n\nXonangiz rasmini yuboring — 3D-vizualizatsiya qilamiz 👇`;
  } else {
    reply = isRussian
      ? `Спасибо за сообщение!\n\nМы предлагаем *бесплатную 3D-визуализацию* мебели в вашей комнате.\n\nНажмите кнопку ниже, чтобы начать 👇`
      : `Xabaringiz uchun rahmat!\n\nBiz xonangizga mebelni *bepul 3D-vizualizatsiya* qilib ko'rsatamiz.\n\nBoshlash uchun quyidagi tugmani bosing 👇`;
  }

  await bot.sendMessage(chatId, reply, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [{
          text: isRussian ? '🏠 Бесплатная 3D-визуализация' : '🏠 Bepul 3D-vizualizatsiya',
          web_app: { url: MINI_APP_URL }
        }],
        [{
          text: isRussian ? '📞 Связаться с оператором' : '📞 Operator bilan bog\'lanish',
          url: 'https://t.me/zeltacallcenter'
        }]
      ]
    }
  });
});

// --- Error handling ---
bot.on('polling_error', (err) => {
  console.error('[Zelta Bot] Polling error:', err.message);
});

console.log('[Zelta Bot] Bot is running and waiting for messages...');
