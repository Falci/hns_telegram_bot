const bcurl = require('bcurl');

class Telegram {
  constructor(token) {
    this.prefix = `/bot${token}`;
    this.client = bcurl.client('https://api.telegram.org');
  }

  static escape(text) {
    return text.replace(/([\[\]_*()~`>#+-=|{}.!])/g, `\\$1`);
  }

  sendTyping(chat) {
    const data = { chat_id: chat, action: 'typing' };
    return this.client.post(`${this.prefix}/sendChatAction`, data);
  }

  sendReply(chat, message, text) {
    const data = {
      chat_id: chat,
      reply_to_message_id: message,
      text,
      parse_mode: 'MarkdownV2',
    };
    return this.client.post(`${this.prefix}/sendMessage`, data);
  }
}

module.exports = Telegram;
