const LocalSession = require('telegraf-session-local');

module.exports = function (bot) {
    const localSession = new LocalSession({ database: 'session_db.json' });
    bot.use(localSession.middleware());
};
