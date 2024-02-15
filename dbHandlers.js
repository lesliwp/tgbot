const { Sequelize, DataTypes } = require('sequelize');
const config = require('../data/config.json');

// Инициализация Sequelize
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: config.main_db,
});

const StatusBot = sequelize.define('StatusBot', {
  name: DataTypes.TEXT,
  firstRunBot: DataTypes.INTEGER,
  status: DataTypes.INTEGER,
  lastMessage: DataTypes.INTEGER
});

const Button = sequelize.define('Button', {
  title: DataTypes.TEXT,
  command: DataTypes.TEXT
});

const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, primaryKey: true },
  lastMessageBot: DataTypes.INTEGER,
  name: DataTypes.TEXT,
  balance: DataTypes.INTEGER,
  discountPercent: DataTypes.INTEGER,
  referrals: DataTypes.INTEGER,
  registrationDate: DataTypes.INTEGER,
  lang: DataTypes.TEXT,
  isAdmin: DataTypes.INTEGER
});

const Product = sequelize.define('Product', {
  category: DataTypes.TEXT,
  title: DataTypes.TEXT,
  description: DataTypes.TEXT,
  content: DataTypes.TEXT,
  discount: DataTypes.INTEGER,
  price: DataTypes.INTEGER
});

const Order = sequelize.define('Order', {
  userId: DataTypes.TEXT,
  productId: DataTypes.INTEGER,
  productPrice: DataTypes.INTEGER,
  orderTime: DataTypes.INTEGER
});

// Определение связей (если они есть)
// Например: User.hasMany(Order)
// Пользователи и Заказы (один-ко-многим)
User.hasMany(Order, { foreignKey: 'userId' });
Order.belongsTo(User, { foreignKey: 'userId' });

// Товары и Заказы (один-ко-многим)
Product.hasMany(Order, { foreignKey: 'productId' });
Order.belongsTo(Product, { foreignKey: 'productId' });



module.exports = {
  initializeDb: async () => {
    try {
      await sequelize.authenticate();
      console.log('Sequelize connection has been established successfully.');
      await sequelize.sync(); // Это создаст таблицы согласно определенным моделям, если они еще не созданы.
    } catch (error) {
      console.error('Unable to connect to the database:', error);
    }
  },
  // Объект для операций связанных с пользователями
  Users: {
    createUser: async (userId, name, lang) => {
      await User.create({
        id: userId,
        name,
        balance: 0,
        discountPercent: 0,
        referrals: 0,
        registrationDate: Math.floor(Date.now() / 1000),
        isAdmin: 0,
        lang
      });
    },
    userCheckReg: async (userId) => {
      const user = await User.findByPk(userId, {
        attributes: ['id', 'lang']
      });
      if (user) {
        return { exists: true, lang: user.lang };
      } else {
        return { exists: false };
      }
    },
    setUserLanguage: async (userId, lang) => {
      await User.update({ lang }, { where: { id: userId } });
    },
    getUserLanguage: async (userId) => {
      const user = await User.findByPk(userId, {
        attributes: ['lang']
      });
      return user ? user.lang : null;
    },
    getUserProfile: async (userId) => {
      const user = await User.findByPk(userId);
      if (user) {
        const registrationDate = new Date(user.registrationDate * 1000);
        const formattedDate = [
          registrationDate.getDate().toString().padStart(2, '0'),
          (registrationDate.getMonth() + 1).toString().padStart(2, '0'),
          registrationDate.getFullYear(),
        ].join('/');
        return {
          ...user.toJSON(),
          registrationDate: formattedDate
        };
      } else {
        throw new Error("User not found");
      }
    },
    setLastMessageBot: async (userId, lastMessageId) => {
      await User.update({ lastMessageBot: lastMessageId }, { where: { id: userId } });
    },
    getLastMessageBot: async (userId) => {
      const user = await User.findByPk(userId, {
        attributes: ['lastMessageBot']
      });
      if (user) {
        return user.lastMessageBot;
      } else {
        throw new Error("User not found");
      }
    }
  },

  // Объект для операций связанных с кнопками
  Buttons: {
    getAllButtons: async () => {
      return await Button.findAll({
        attributes: ['command']
      });
    },
    addNewButton: async (title, command) => {
      await Button.create({ title, command });
    },
    deleteButton: async (command) => {
      await Button.destroy({ where: { command } });
    }
  },

  // Объект для операций связанных с товарами
  Products: {
    getAllProducts: async () => {
      return await Product.findAll();
    }
  },

  // Объект для операций связанных со статусом бота
  BotStatus: {
    checkBotFirstRun: async () => {
      const bot = await StatusBot.findOne({ where: { status: 1488 } });
      if (!bot) {
        await StatusBot.create({ status: 1488 });
        console.log("Бот запущен впервые.");
        return true;
      } else {
        return false;
      }
    }
  }
};