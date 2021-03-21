const Telegram = require('./telegram');

const plugin = exports;

class Plugin {
  constructor(node) {
    this.node = node;
    this.http = node.http;
    this.logger = node.logger.context('telegram-bot');
    this.telegram = new Telegram(node.config.str('telegram-token'));

    this.init();
  }

  init() {
    const commands = {
      info: (param, callback) => this.getInfo(callback),
      send: (raw, callback) => this.sendRaw(raw, callback),
    };

    this.http.post('/plugins/telegram_bot', async (req, res) => {
      const { text, chat, message_id } = req.body.message;
      const [trigger, command, ...params] = text.split(' ');
      const param = params.join(' ');

      await this.telegram.sendTyping(chat.id);

      if (trigger === '/start') {
        this.telegram.sendReply(
          chat.id,
          message_id,
          `Try this: \\\`/hns info\\\``
        );
        return res.json(200, { ok: true });
      }

      const [action] = trigger.split('@');

      if (action !== '/hns' || !Object.keys(commands).includes(command)) {
        this.logger.info('Invalid command: %s', text);
        return res.json(200, { ok: false });
      }

      try {
        await commands[command](param, (m) =>
          this.telegram.sendReply(chat.id, message_id, m)
        );

        this.logger.debug('Command success: %s(%s)', command, param);
        res.json(200, { ok: true });
      } catch (e) {
        this.logger.info('Command failed: %s(%s): %s', command, param, e);
        return res.json(200, { ok: false });
      }
    });
  }

  async getInfo(reply) {
    const { result } = await this.node.rpc.call({
      method: 'getinfo',
    });

    const { blocks, difficulty } = result;
    const message = [`*Blocks:* ${blocks}`, `*Difficulty:* ${difficulty}`];

    await reply(message.join('\n'));
  }

  async sendRaw(data, reply) {
    const { result } = await this.node.rpc.call({
      method: 'sendrawtransaction',
      params: [data],
    });

    await reply(Telegram.escape(JSON.stringify(result, null, 2)));
  }

  async open() {}

  close() {}
}

plugin.id = 'telegram_bot';
plugin.init = function init(node) {
  return new Plugin(node);
};
