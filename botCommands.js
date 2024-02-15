const { Markup } = require("telegraf");
const dbHandlers = require("./dbHandlers");
const config = require("../data/config.json");
const {
  mainKeyboard,
  getMenuForLang,
  generalCommands,
  adminCommands,
} = require("./keyboardConfig");

let lastMassage;

module.exports = function (bot) {
  // Установка команд для пользователя и администратора
  bot.telegram.setMyCommands(generalCommands);
  bot.telegram.setMyCommands(adminCommands, {
    scope: { type: "chat", chat_id: config.admin_id },
  });

  bot.start(async (ctx) => {
    try {
      const userId = ctx.from.id;
      const userName = ctx.from.first_name;
  
      // Проверяем, зарегистрирован ли пользователь
      const userRegStatus = await dbHandlers.Users.userCheckReg(userId);
      if (!userRegStatus.exists) {
        // Пользователь не зарегистрирован, предлагаем выбрать язык
        ctx.reply(
          "Пожалуйста, выберите ваш язык / Please, choose your language:",
          Markup.inlineKeyboard([
            Markup.button.callback("Русский 🇷🇺", "create_user_ru"),
            Markup.button.callback("English 🇬🇧", "create_user_en"),
          ])
        );
      } else {
        // Пользователь зарегистрирован, получаем его язык
        const userLang = await dbHandlers.Users.getUserLanguage(userId);
        if (userLang) {
          // Язык пользователя найден, отображаем меню в зависимости от языка
          const isAdmin = userId.toString() === config.admin_id; // Или ваша логика определения админа
          ctx.reply(
            `Добро пожаловать ${userName}`,
            getMenuForLang(userLang, isAdmin)
          );
        } else {
          // Обработка случая, если язык пользователя не найден
          ctx.reply("Ваш язык не найден. Пожалуйста, выберите язык:");
        }
      }
    } catch (err) {
      console.error(err);
      ctx.reply("Произошла ошибка при проверке вашего профиля.");
    }
  });

  bot.hears(/🏠 Главное меню|🏠 Main page/, (ctx) => {
    const isAdmin = ctx.from.id.toString() === config.admin_id; // Или ваша логика определения админа
    const keyboardMain = mainKeyboard(isAdmin); // mainKeyboard - функция, возвращающая клавиатуру
    ctx.reply("Вы в главном меню:", keyboardMain);
  });

  bot.hears(/👤 Профиль|👤 Profile/, async (ctx) => {
    try {
      const userProfile = await dbHandlers.Users.getUserProfile(ctx.from.id);
      if (!userProfile) {
        ctx.reply("Произошла ошибка при получении профиля.");
        return;
      }
  
      // Составление сообщения профиля
      const profileMessage = userProfile.lang === "ru"
      ? `*Привет* ${userProfile.name}\n` +
        `💰 *Баланс:* \`${userProfile.balance.toFixed(2)}\`*$*\n` +
        `🔄 *Рефералов:* ${userProfile.referrals}\n` +
        `🎁 *Накопительная скидка:* ${userProfile.discountPercent}*%*\n` +
        `📅 *Регистрация:* ${userProfile.registrationDate}\n` +
        `🆔 *ID:* \`${userProfile.id}\`\n` +
        `🌐 *Язык:* ${userProfile.lang}`
      /////////////////////////////////////////////////////////////////////////
      : `*Hello* ${userProfile.name}\n` +
        `💰 *Balance:* \`${userProfile.balance.toFixed(2)}\`*$*\n` +
        `🔄 *Referals:* ${userProfile.referrals}\n` +
        `🎁 *Discount:* ${userProfile.discountPercent}*%*\n` +
        `📅 *Registration:* ${userProfile.registrationDate}\n` +
        `🆔 *ID:* \`${userProfile.id}\`\n` +
        `🌐 *Lang:* ${userProfile.lang}`;
  
      const profileKeyboard = Markup.inlineKeyboard([
        [
          Markup.button.callback(userProfile.lang == "ru" ? "💵 Пополнить баланс" : "💵 Add funds", "replenish_balance"),
          Markup.button.callback(userProfile.lang == "ru" ? "👥 Реферальная система" : "👥 Referal system", "referral_system"),
        ],
        [
          Markup.button.callback(userProfile.lang == "ru" ? "🔧 Техническая поддержка" : "🔧 Technical support", "tech_support"),
          Markup.button.callback(userProfile.lang == "ru" ? "💸 Вывести средства" : "💸 Withdrawal funds", "withdraw_funds"),
        ],
        [
          Markup.button.callback(userProfile.lang == "ru" ? "🛍 Мои покупки" : "🛍 My pursharge", "my_purchases"),
          Markup.button.callback(userProfile.lang == "ru" ? "🌐 Смена языка" : "🌐 Change lang", userProfile.lang == "ru" ? "set_lang_en" : "set_lang_ru"),
        ],
      ]);
  
      // Отправка сообщения профиля пользователю
      await ctx.replyWithMarkdownV2(profileMessage, profileKeyboard);
    } catch (err) {
      console.error("Ошибка при получении профиля:", err);
      ctx.reply("Произошла ошибка при получении профиля.");
    }
  });
  

  bot.hears(/🛍 Магазин|🛍 Shop/, async (ctx) => {
    try {
      const userProfile = await dbHandlers.Users.getUserProfile(ctx.from.id);
      const buttons = await dbHandlers.Buttons.getAllButtons();
  
      let buttonsDB = buttons.map((button) => Markup.button.text(button.title));
      buttonsDB.push(Markup.button.text(userProfile.lang == "ru" ? "🏠 Главное меню" : "🏠 Main page"));
      const keyboardDB = Markup.keyboard(buttonsDB, { columns: 2 }).resize();
  
      ctx.reply("Выберите категорию:", keyboardDB);
    } catch (err) {
      console.error("Ошибка при загрузке кнопок или профиля:", err);
      ctx.reply("Произошла ошибка при загрузке кнопок.");
    }
  });
  

  // Действие при нажатии на кнопку "Поддержка"
  bot.hears("🆘 Поддержка", (ctx) => {
    ctx.reply("Как мы можем помочь вам сегодня?");
    // Здесь можно добавить логику для предоставления помощи пользователю или контактных данных поддержки
  });

  // Действие при нажатии на кнопку "FAQ"
  bot.hears("❓ FAQ", (ctx) => {
    ctx.reply("Часто задаваемые вопросы:");
    // Здесь можно добавить логику для отображения FAQ
  });

  // Действие при нажатии на кнопку "Управление товарами" (только для администратора)
  bot.hears("🛠 Управление товарами", (ctx) => {
    if (ctx.from.id.toString() === config.admin_id) {
      ctx.reply("Функции управления товарами:");
      // Здесь можно добавить логику для управления товарами
    } else {
      ctx.reply("У вас нет доступа к этой функции.");
    }
  });

  // Действие при нажатии на кнопку "Настройки"
  bot.hears("⚙️ Настройки", (ctx) => {
    ctx.reply("Настройки системы:");
    // Здесь можно добавить логику для изменения настроек системы или бота
  });

  // Действие при нажатии на кнопку "Общие функции"
  bot.hears("🌐 Общие функции", (ctx) => {
    ctx.reply("Общедоступные функции:");
    // Здесь можно добавить логику для выполнения общих функций
  });

  // Действие при нажатии на кнопку "Статистика" (только для администратора)
  bot.hears("📊 Статистика", (ctx) => {
    if (ctx.from.id.toString() === config.admin_id) {
      ctx.reply("Статистика магазина:");
      // Здесь можно добавить логику для отображения статистики магазина
    } else {
      ctx.reply("У вас нет доступа к этой функции.");
    }
  });

  // Действие при нажатии на кнопку "Платежные системы"
  bot.hears("💳 Платежные системы", (ctx) => {
    ctx.reply("Информация о платежных системах:");
    // Здесь можно добавить логику для информации о платежных системах, используемых в магазине
  });

  // Добавьте здесь дополнительные обработчики команд и действий
};
