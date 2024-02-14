const { Markup } = require('telegraf');
const dbHandlers = require('./dbHandlers');
const config = require('../data/config.json');
const { mainKeyboard, generalCommands, adminCommands } = require('./keyboardConfig');

module.exports = function (bot) {
// Команда для добавления кнопки
bot.command('addbutton', (ctx) => {
    ctx.session.isAddingButton = true;
    ctx.reply('Введите название кнопки:');
});

// Обработка текста для добавления кнопки
bot.on('text', (ctx) => {
    if (ctx.session.isAddingButton) {
        const title = ctx.message.text;
        const command = title.toLowerCase().replace(/\s+/g, '_');

        dbHandlers.addNewButton(title, command, (err) => {
            if (err) {
                ctx.reply('Произошла ошибка при добавлении кнопки.');
                console.error(err);
            } else {
                ctx.reply('Кнопка добавлена.');
            }
        });

        ctx.session.isAddingButton = false;
    }
});

// Команда для удаления кнопки
bot.command('deletebutton', (ctx) => {
    dbHandlers.getAllButtons((err, rows) => {
        if (err) {
            ctx.reply('Произошла ошибка при загрузке кнопок.');
            console.error(err);
            return;
        }

        if (rows.length === 0) {
            ctx.reply('Кнопок для удаления нет.');
            return;
        }

        const buttonsDB = rows.map(row => Markup.button.callback(row.title, `delete_${row.title}`));
        const keyboardDB = Markup.inlineKeyboard(buttonsDB);
        ctx.reply('Выберите кнопку для удаления:', keyboardDB);
    });
});

// Обработка действий для удаления кнопки
bot.action(/delete_(.+)/, (ctx) => {
    const titleToDelete = ctx.match[1];

    if (titleToDelete === '🏠 Главное меню') {
        ctx.reply('Нельзя удалить кнопку "Главное меню".');
        return;
    }

    dbHandlers.deleteButton(titleToDelete, (err) => {
        if (err) {
            ctx.reply('Произошла ошибка при удалении кнопки.');
            console.error(err);
        } else {
            ctx.reply(`Кнопка "${titleToDelete}" была удалена.`);
        }
    });
});


bot.action(/set_lang_(.+)/, (ctx) => {
    const selectedLang = ctx.match[1]; // 'ru' или 'en'
    const userId = ctx.from.id;

    dbHandlers.setUserLanguage(userId, selectedLang, (err) => {
        if (err) {
            ctx.reply('Произошла ошибка при сохранении предпочтительного языка.');
            return;
        }
        // Язык установлен, теперь отображаем меню на выбранном языке
        ctx.reply(selectedLang === 'ru' ? 'Язык установлен на Русский.' : 'Language is set to English.');
        // Здесь ваша логика для отображения меню в зависимости от языка
    });
});

};