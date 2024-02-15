const { Markup } = require("telegraf");
const dbHandlers = require("./dbHandlers");
const of = require("./of");
const config = require("../data/config.json");
const {
  mainKeyboard,
  getMenuForLang,
  generalCommands,
  adminCommands,
} = require("./keyboardConfig");

module.exports = function (bot) {
    bot.command("addbutton", (ctx) => {
        ctx.session.isAddingButton = true; // Устанавливаем флаг, что пользователь находится в процессе добавления кнопки
        ctx.reply("Введите название кнопки:");
      });
      
      bot.on("text", async (ctx) => {
        if (ctx.session.isAddingButton) {
          const title = ctx.message.text;
          // Генерация случайного command из 4 символов
          const command = of.generateRandomNumber(4);
      
          try {
            await dbHandlers.Buttons.addNewButton(title, command);
            ctx.reply(`Кнопка добавлена. Command: ${command}`);
          } catch (err) {
            console.error(err);
            ctx.reply("Произошла ошибка при добавлении кнопки.");
          }
      
          ctx.session.isAddingButton = false; // Сбрасываем флаг, завершая процесс добавления
        }
      });
      

      
      

  bot.command("deletebutton", async (ctx) => {
    try {
      const buttons = await dbHandlers.Buttons.getAllButtons();
      if (buttons.length === 0) {
        ctx.reply("Кнопок для удаления нет.");
        return;
      }

      const buttonsDB = buttons.map((button) =>
        Markup.button.callback(button.command, `delete_${button.command}`)
      );
      const keyboardDB = Markup.inlineKeyboard([buttonsDB]);
      ctx.reply("Выберите кнопку для удаления:", keyboardDB);
    } catch (err) {
      console.error(err);
      ctx.reply("Произошла ошибка при загрузке кнопок.");
    }
  });

  bot.action(/delete_(.+)/, async (ctx) => {
    const titleToDelete = ctx.match[1];

    if (titleToDelete === "🏠 Главное меню") {
      ctx.reply('Нельзя удалить кнопку "Главное меню".');
      return;
    }

    try {
      await dbHandlers.Buttons.deleteButton(titleToDelete);
      ctx.reply(`Кнопка "${titleToDelete}" была удалена.`);
    } catch (err) {
      console.error(err);
      ctx.reply("Произошла ошибка при удалении кнопки.");
    }
  });


  bot.action(/set_lang_(ru|en)/, async (ctx) => {
    const selectedLang = ctx.match[1]; // 'ru' или 'en'
    const userId = ctx.from.id;
  
    try {
      // Устанавливаем выбранный язык для пользователя
      await dbHandlers.Users.setUserLanguage(userId, selectedLang);
      const userProfile = await dbHandlers.Users.getUserProfile(userId);
  
      // Определение сообщения в зависимости от выбранного языка
      const greetings = selectedLang === "ru" ? "Русский язык установлен. Добро пожаловать!" : "English language set. Welcome!";
      ctx.reply(greetings, getMenuForLang(userProfile.lang, ctx.from.id.toString() === config.admin_id));
  
      // Формирование сообщения профиля
      const profileMessage = `*${selectedLang === "ru" ? "Привет" : "Hello"}* ${userProfile.name}\n` +
        `${selectedLang === "ru" ? "💰 *Баланс:* " : "💰 *Balance:* "} \`${userProfile.balance.toFixed(2)}\`*$*\n` +
        `${selectedLang === "ru" ? "🔄 *Рефералов:* " : "🔄 *Referals:* "} ${userProfile.referrals}\n` +
        `${selectedLang === "ru" ? "🎁 *Накопительная скидка:* " : "🎁 *Discount:* "} ${userProfile.discountPercent}*%*\n` +
        `${selectedLang === "ru" ? "📅 *Регистрация:* " : "📅 *Registration:* "} ${userProfile.registrationDate}\n` +
        `🆔 *ID:* \`${userProfile.id}\`\n` +
        `${selectedLang === "ru" ? "🌐 *Язык:* " : "🌐 *Lang:* "} ${userProfile.lang}`;
  
      // Формирование клавиатуры профиля
      const profileKeyboard = Markup.inlineKeyboard([
        [
          Markup.button.callback(selectedLang === "ru" ? "💵 Пополнить баланс" : "💵 Add funds", "replenish_balance"),
          Markup.button.callback(selectedLang === "ru" ? "👥 Реферальная система" : "👥 Referal system", "referral_system"),
        ],
        [
          Markup.button.callback(selectedLang === "ru" ? "🔧 Техническая поддержка" : "🔧 Technical support", "tech_support"),
          Markup.button.callback(selectedLang === "ru" ? "💸 Вывести средства" : "💸 Withdrawal funds", "withdraw_funds"),
        ],
        [
          Markup.button.callback(selectedLang === "ru" ? "🛍 Мои покупки" : "🛍 My purchases", "my_purchases"),
          Markup.button.callback("🌐 Смена языка", selectedLang === "ru" ? "set_lang_en" : "set_lang_ru"),
        ],
      ]);
  
      // Отправка сообщения профиля пользователю
      await ctx.replyWithMarkdownV2(profileMessage, profileKeyboard);
    } catch (err) {
      console.error(err);
      ctx.reply(selectedLang === "ru" ? "Произошла ошибка при смене языка." : "An error occurred during language change.");
    }
  });


  bot.action(/create_user_(ru|en)/, async (ctx) => {
    const selectedLang = ctx.match[1]; // Получаем 'ru' или 'en' из действия
    const userId = ctx.from.id;
    const userName = ctx.from.first_name;
  
    try {
      // Создаем пользователя с выбранным языком
      await dbHandlers.Users.createUser(userId, userName, selectedLang);
  
      // Отправляем приветственное сообщение на выбранном языке
      const welcomeMessage = selectedLang === "ru" 
        ? "Язык установлен на Русский. Добро пожаловать!" 
        : "Language is set to English. Welcome!";
  
      // Получаем клавиатуру для выбранного языка
      const menuKeyboard = getMenuForLang(selectedLang, false);
  
      // Отправляем сообщение с клавиатурой
      ctx.reply(welcomeMessage, menuKeyboard);
    } catch (err) {
      console.error(err);
      const errorMessage = selectedLang === "ru"
        ? "Произошла ошибка при регистрации."
        : "An error occurred during registration.";
  
      // Отправляем сообщение об ошибке
      ctx.reply(errorMessage);
    }
  });
}; // module export
