console.log("Launching bot ...........");
const { Telegraf } = require("telegraf");
const config = require("../data/config.json");
const sessionConfig = require("./sessionConfig");
const adminCommands = require("./adminCommands");
const botCommands = require("./botCommands");
const dbHandlers = require("./dbHandlers");
const of = require("./of");

const bot = new Telegraf(config.tokenBot);

sessionConfig(bot);
dbHandlers.initializeDb();
botCommands(bot);
adminCommands(bot);

bot.launch();
console.log("Bot launched successfully");
