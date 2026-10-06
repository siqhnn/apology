// Telegram Bot Configuration
const CONFIG = {
  // Токен бота, в которого отправляются уведомления (arya_prostila_bot)
  NOTIFY_BOT_TOKEN: '8624580033:AAFCH-7QLaZCM6E3popcFZYMAjOTXeJrFtc',
  
  // Токен бота с мини-аппом (Arya_prosti_menya_bot)
  APP_BOT_TOKEN: '8845832819:AAHURSk53YBabVAVY0862yBmuthA6f0sN1Y',

  // Твой Telegram Chat ID (куда бот отправляет сообщения Данилу).
  // Если запустить python bot.py и нажать /start в @arya_prostila_bot, ID определится автоматически!
  // Также его можно передавать в ссылке на WebApp, например: ?to=ТВОЙ_CHAT_ID
  DANIL_CHAT_ID: '8517486335', 

  // Тексты для убегающей кнопки «Нет»
  NO_BUTTON_PHRASES: [
    'Нет 🙈',
    'Не поймаешь! 💨',
    'Эй, не надо! 🥺',
    'Кнопка сломалась 🛠️',
    'Попробуй левую! 💖',
    'Даже не думай 😜',
    'Только «Пенис»! 🥹',
    'Ой, улетела! 🚀',
    'Мимо! 🏃‍♀️'
  ]
};

// Экспорт для браузера / модулей
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}
