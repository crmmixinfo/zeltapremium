// ============================================
// ZELTA PREMIUM - Telegram Bot
// Launches Mini App + handles fallback
// ============================================

const TelegramBot = require('node-telegram-bot-api');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const MINI_APP_URL = process.env.MINI_APP_URL || 'https://your-domain.com';
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID;

if (!BOT_TOKEN) {
  console.error('[Zelta Bot] ERROR: TELEGRAM_BOT_TOKEN environment variable is required');
  console.log('[Zelta Bot] Set it with: export TELEGRAM_BOT_TOKEN=your_token_here');
  process.exit(1);
}

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

console.log('[Zelta Bot] Starting...');

// --- /start command ---
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const firstName = msg.from.first_name || '';
  const lang = msg.from.language_code;

  // Determine language
  const isRussian = lang && lang.startsWith('ru');

  const textUz = `Assalomu alaykum${firstName ? ', ' + firstName : ''}! 👋

*Zelta Premium* — premium mebel brendi.

Birinchi 50 ta mijozga *bepul 3D mebel joylashuv ko'rinishi* taqdim etilmoqda.

Quyidagi tugmani bosib, shaxsiy konsultatsiyani boshlang:`;

  const textRu = `Здравствуйте${firstName ? ', ' + firstName : ''}! 👋

*Zelta Premium* — премиальный мебельный бренд.

Первым 50 клиентам предоставляется *бесплатная 3D-визуализация расстановки мебели*.

Нажмите кнопку ниже, чтобы начать персональную консультацию:`;

  const text = isRussian ? textRu : textUz;
  const buttonText = isRussian ? '🏠 Начать консультацию' : '🏠 Konsultatsiyani boshlash';

  try {
    await bot.sendMessage(chatId, text, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[
          {
            text: buttonText,
            web_app: { url: MINI_APP_URL }
          }
        ]]
      }
    });
  } catch (err) {
    console.error('[Zelta Bot] Error sending start message:', err.message);
    // Fallback without web_app button
    const fallbackText = isRussian
      ? `Здравствуйте! Для консультации откройте: ${MINI_APP_URL}\n\nИли свяжитесь с оператором: @zeltacallcenter`
      : `Assalomu alaykum! Konsultatsiya uchun oching: ${MINI_APP_URL}\n\nYoki operator bilan bog'laning: @zeltacallcenter`;
    
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
📍 Showroom: Toshkent, Samarqand darvoza
📸 Instagram: @zeltapremium.uz`;

  const textRu = `*Помощь Zelta Premium*

📱 Начать консультацию: /start
📞 Оператор: +99855 520 9595
💬 Telegram: @zeltacallcenter
📍 Шоурум: Ташкент, Самарканд дарваза
📸 Instagram: @zeltapremium.uz`;

  await bot.sendMessage(chatId, isRussian ? textRu : textUz, { parse_mode: 'Markdown' });
});

// --- /operator command ---
bot.onText(/\/operator/, async (msg) => {
  const chatId = msg.chat.id;
  const lang = msg.from.language_code;
  const isRussian = lang && lang.startsWith('ru');

  const text = isRussian
    ? 'Свяжитесь с нашим оператором:'
    : 'Operatorimiz bilan bog\'laning:';

  const contactInfo = isRussian
    ? '📞 Позвоните: +99855 520 9595\n💬 Или напишите оператору:'
    : '📞 Qo\'ng\'iroq qiling: +99855 520 9595\n💬 Yoki operatorga yozing:';

  await bot.sendMessage(chatId, text + '\n\n' + contactInfo, {
    reply_markup: {
      inline_keyboard: [
        [{ text: '💬 @zeltacallcenter', url: 'https://t.me/zeltacallcenter' }]
      ]
    }
  });
});

// --- Handle web_app_data (when Mini App sends data back) ---
bot.on('web_app_data', async (msg) => {
  const chatId = msg.chat.id;
  
  try {
    const data = JSON.parse(msg.web_app_data.data);
    
    if (data.type === 'lead_submitted') {
      const lang = data.language;
      const isRussian = lang === 'ru';

      const confirmText = isRussian
        ? '✅ Ваша заявка принята! Наш специалист свяжется с вами в течение 20 минут.'
        : '✅ So\'rovingiz qabul qilindi! Mutaxassisimiz 20 daqiqa ichida bog\'lanadi.';

      await bot.sendMessage(chatId, confirmText);

      // Notify admin
      if (ADMIN_CHAT_ID) {
        const adminText = `🔔 *Yangi lead!*\n📞 ${data.phone || 'N/A'}\n🌐 ${isRussian ? 'Русский' : "O'zbek"}\n🪑 ${data.furniture || 'N/A'}\n⏰ 20 daqiqa SLA!`;
        await bot.sendMessage(ADMIN_CHAT_ID, adminText, { parse_mode: 'Markdown' });
      }
    }
  } catch (err) {
    console.error('[Zelta Bot] web_app_data error:', err);
  }
});

// --- Handle any text message (fallback) ---
bot.on('message', async (msg) => {
  // Skip commands
  if (msg.text && msg.text.startsWith('/')) return;
  // Skip web_app_data
  if (msg.web_app_data) return;

  const chatId = msg.chat.id;
  const lang = msg.from.language_code;
  const isRussian = lang && lang.startsWith('ru');

  const text = isRussian
    ? 'Для начала консультации нажмите /start или свяжитесь с оператором: @zeltacallcenter'
    : 'Konsultatsiyani boshlash uchun /start bosing yoki operator bilan bog\'laning: @zeltacallcenter';

  await bot.sendMessage(chatId, text, {
    reply_markup: {
      inline_keyboard: [[
        {
          text: isRussian ? '🏠 Начать' : '🏠 Boshlash',
          web_app: { url: MINI_APP_URL }
        }
      ]]
    }
  });
});

// --- Error handling ---
bot.on('polling_error', (err) => {
  console.error('[Zelta Bot] Polling error:', err.message);
});

console.log('[Zelta Bot] Bot is running and waiting for messages...');
