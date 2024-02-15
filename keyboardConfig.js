const { Markup } = require("telegraf");

// Определение команд для общих пользователей и администраторов
const adminCommands = [
  { command: "start", description: "Вызов меню" },
  { command: "admin", description: "Административные функции" },
  { command: "addbutton", description: "Добавить кнопку" },
  { command: "deletebutton", description: "Удалить кнопку" },
];

const generalCommands = [
  { command: "start", description: "Вызов меню" },
  { command: "support", description: "Поддержка" },
  { command: "faq", description: "FAQ" },
];

// Функция для создания основной клавиатуры
function mainKeyboard(isAdmin) {
  const buttonsMain = [
    [Markup.button.text("👤 Профиль"), Markup.button.text("🛍 Магазин")],
    [Markup.button.text("🆘 Поддержка"), Markup.button.text("❓ FAQ")],
    ...(isAdmin ? [[Markup.button.text("🛠 Функции администратора")]] : []),
  ];

  return Markup.keyboard(buttonsMain).resize();
}

function getMenuForLang(lang, isAdmin) {
  const keyboards = {
    en: Markup.keyboard([
      [Markup.button.text("👤 Profile"), Markup.button.text("🛍 Shop")],
      [Markup.button.text("🆘 Support"), Markup.button.text("❓ FAQ")],
      ...(isAdmin ? [[Markup.button.text("🛠 Admin functions")]] : []),
    ]).resize(),
    ru: Markup.keyboard([
      [Markup.button.text("👤 Профиль"), Markup.button.text("🛍 Магазин")],
      [Markup.button.text("🆘 Поддержка"), Markup.button.text("❓ FAQ")],
      ...(isAdmin ? [[Markup.button.text("🛠 Функции администратора")]] : []),
    ]).resize(),
  };
  return keyboards[lang] || keyboards["en"];
}

// Экспорт настроек и функций клавиатуры
module.exports = {
  adminCommands,
  generalCommands,
  mainKeyboard,
  getMenuForLang,
};
