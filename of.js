module.exports = {
      // Функция для генерации случайной строки
      generateRandomNumber: function (length) {
        const characters = '123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
          result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return result;
      },






}