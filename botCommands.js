const { Markup } = require('telegraf');
const dbHandlers = require('./dbHandlers');
const config = require('../data/config.json');
const { mainKeyboard, generalCommands, adminCommands } = require('./keyboardConfig');

module.exports = function (bot) {
    // Установка команд для пользователя и администратора
    bot.telegram.setMyCommands(generalCommands);
    bot.telegram.setMyCommands(adminCommands, { scope: { type: 'chat', chat_id: config.admin_id } });

    
    bot.start((ctx) => {
        dbHandlers.checkAndCreateUser(ctx.from.id, ctx.from.first_name, (err) => {
            if (err) {
                ctx.reply('Произошла ошибка при регистрации вашего профиля.');
                console.error(err);
            } else {
                ctx.reply(`Добро пожаловать, ${ctx.from.first_name}! Ваш профиль создан.`);
                // Здесь можно отправить основную клавиатуру
            }
        });
        // Проверяем, является ли пользователь админом
        const isAdmin = ctx.from.id.toString() === config.admin_id;      
        if (ctx.from.id.toString() === config.admin_id) {
          // Пользователь является администратором
          dbHandlers.checkBotFirstRun((err, isFirstRun) => {
            if (err) {
              console.error("Произошла ошибка при проверке первого запуска:", err);
              return;
            }
            if (isFirstRun) {
              ctx.reply("Привет, Админ! Это первый запуск бота.");
              ctx.reply('Выберите действие:', mainKeyboard(isAdmin));
              // Здесь можно выполнить дополнительные действия для админа
            } else {
              ctx.reply('Выберите действие:', mainKeyboard(isAdmin));
            }
          });
        } else {
          // Пользователь не является администратором
          ctx.reply(`Добро пожаловать в наш магазин!`);
          ctx.reply('Выберите действие:', mainKeyboard(isAdmin));
        }
      });
    
    
      bot.hears('🏠 Главное меню', (ctx) => {
        const isAdmin = ctx.from.id.toString() === config.admin_id; // Или ваша логика определения админа
        const keyboardMain = mainKeyboard(isAdmin); // mainKeyboard - функция, возвращающая клавиатуру
        ctx.reply('Вы в главном меню:', keyboardMain);
    });
    
    // Обработка команды "Профиль"
    bot.hears('👤 Профиль', async (ctx) => {
        // Предположим, что у вас есть функция, которая возвращает данные пользователя по его ID
        dbHandlers.getUserProfile(ctx.from.id, (err, userProfile) => {
          if (err) {
            ctx.reply('Произошла ошибка при получении профиля.');
            console.error(err);
            return;
          }
      
          // Составление сообщения профиля
          let profileMessage = `*Привет* ${userProfile.name}\n`;
          profileMessage += "💰 *Баланс:* `"+userProfile.balance.toFixed(2)+"`*$*\n";
          profileMessage += `🔄 *Рефералов:* ${userProfile.referrals}\n`;
          profileMessage += `🎁 *Накопительная скидка:* ${userProfile.discountPercent}*%*\n`;
          profileMessage += `📅 *Регистрация:* ${userProfile.registrationDate}\n`;
          profileMessage += "🆔 *ID:* `"+ctx.from.id+"`";

          const profileKeyboard = Markup.inlineKeyboard([
            [Markup.button.callback('💵 Пополнить баланс', 'replenish_balance'), Markup.button.callback('👥 Реферальная система', 'referral_system')],
            [Markup.button.callback('🔧 Техническая поддержка', 'tech_support'), Markup.button.callback('💸 Вывести средства', 'withdraw_funds')],
            [Markup.button.callback('🛍 Мои покупки', 'my_purchases')]
          ]);
          // Отправка сообщения профиля пользователю
          ctx.replyWithMarkdown(profileMessage, profileKeyboard);
        });
      });
      bot.action('replenish_balance', (ctx) => {
        // Логика пополнения баланса
        ctx.answerCbQuery(); // Отвечаем на callback запрос
        ctx.reply('Функция пополнения баланса в разработке.');
      });

    // Действие при нажатии на кнопку "Магазин"
    bot.hears('🛍 Магазин', (ctx) => {
        dbHandlers.getAllButtons((err, rows) => {
            if (err) {
                ctx.reply('Произошла ошибка при загрузке кнопок.');
                console.error(err);
                return;
            }

            // Создание клавиатуры из загруженных кнопок
            const buttonsDB = rows.map(row => Markup.button.text(row.title));
            buttonsDB.push(Markup.button.text('🏠 Главное меню'));
            const keyboardDB = Markup.keyboard(buttonsDB, { columns: 2 }).resize();
            ctx.reply('Выберите категорию:', keyboardDB);
        });
    });


  
  // Действие при нажатии на кнопку "Поддержка"
  bot.hears('🆘 Поддержка', (ctx) => {
    ctx.reply('Как мы можем помочь вам сегодня?');
    // Здесь можно добавить логику для предоставления помощи пользователю или контактных данных поддержки
  });
  
  // Действие при нажатии на кнопку "FAQ"
  bot.hears('❓ FAQ', (ctx) => {
    ctx.reply('Часто задаваемые вопросы:');
    // Здесь можно добавить логику для отображения FAQ
  });
  
  // Действие при нажатии на кнопку "Управление товарами" (только для администратора)
  bot.hears('🛠 Управление товарами', (ctx) => {
    if (ctx.from.id.toString() === config.admin_id) {
      ctx.reply('Функции управления товарами:');
      // Здесь можно добавить логику для управления товарами
    } else {
      ctx.reply('У вас нет доступа к этой функции.');
    }
  });
  
  // Действие при нажатии на кнопку "Настройки"
  bot.hears('⚙️ Настройки', (ctx) => {
    ctx.reply('Настройки системы:');
    // Здесь можно добавить логику для изменения настроек системы или бота
  });
  
  // Действие при нажатии на кнопку "Общие функции"
  bot.hears('🌐 Общие функции', (ctx) => {
    ctx.reply('Общедоступные функции:');
    // Здесь можно добавить логику для выполнения общих функций
  });
  
  // Действие при нажатии на кнопку "Статистика" (только для администратора)
  bot.hears('📊 Статистика', (ctx) => {
    if (ctx.from.id.toString() === config.admin_id) {
      ctx.reply('Статистика магазина:');
      // Здесь можно добавить логику для отображения статистики магазина
    } else {
      ctx.reply('У вас нет доступа к этой функции.');
    }
  });
  
  // Действие при нажатии на кнопку "Платежные системы"
  bot.hears('💳 Платежные системы', (ctx) => {
    ctx.reply('Информация о платежных системах:');
    // Здесь можно добавить логику для информации о платежных системах, используемых в магазине
  });

    // Добавьте здесь дополнительные обработчики команд и действий
};