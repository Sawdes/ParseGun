import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
import { NewMessage, NewMessageEvent } from "telegram/events";
import config from "../.temp/config.json"
import { logger } from "./logger";
import { User } from "./User";
import { Mongo } from './Mongo';
import { OzonProduct } from "./OzonProduct";
import { isOzonURL, isValidURL } from "./helpers";
import { ObjectId } from "mongodb";

const stringSession = config.stringSession
const BOT_TOKEN = config.BOT_TOKEN

interface req {
  user: {
    _id: ObjectId,
    TelegramId: number,
    firstName: string,
    lastName: string,
    username: string,
    context: null | string,
    pinnedOzonProducts: ObjectId[]
  };
  message: string
}

export class TelegramBot {
  static client: TelegramClient;

  static async init() {
    TelegramBot.resetUsersContext()
    logger.info('Connecting to Telegram client...')
    TelegramBot.client = new TelegramClient(
      new StringSession(stringSession),
      config.apiId,
      config.apiHash,
      { connectionRetries: 5 }
    );
    await TelegramBot.client.start({
      botAuthToken: BOT_TOKEN,
    });
    TelegramBot.client.setParseMode('html')


    logger.info('Add handlers...')
    TelegramBot.client.addEventHandler(TelegramBot.messageHandler, new NewMessage());
  }

  static async resetUsersContext() {
    logger.info('Reset users context...')
    await Mongo.users.updateMany({"context": {"$ne": null}}, {$set:{context: null}})
  }

  static async messageHandler(event: NewMessageEvent): Promise<void> {
    try {
      const sender: any = await event.message.getSender()
      const message = event.message.message
      if (sender == undefined || message == undefined) {
        throw new Error('Sender or message is undefined')
      }
      logger.info(`
        Handler received event!
        sender:
          id:${sender.id} 
          username:${sender.username}
          message: ${message}
      `)
      TelegramBot.userHandler(sender)
      const user:any = await User.getUserDB(sender)
      if (user == null) {
        throw new Error('user is null')
      } else {
        TelegramBot.reqHandler({user, message})
      }
    } catch (error) {
      logger.error('Message handler error')
      logger.error(error)
    }
  }

  static async userHandler(sender: any): Promise<void> {
    try {
      if(await User.getUserDB(sender) == null) {
        logger.info('New user! Add user in database...')
        await Mongo.users.insertOne(new User(sender))
      } else {
        logger.info('User already exist.')
      }
    } catch (error) {
      logger.error('User handler error!')
      logger.error(error)
    }
  }

  static async reqHandler(req: req) {
    try {
      console.log(req)
      if(req.user == null || req.message == null) {
        throw new Error('Request user or message is null!')
      }
  
      if(req.user.context == null) {
        await TelegramBot.emptyContextHandler(req)
      } else {
        await TelegramBot.contextHandler(req)
      } 
    } catch (error) {
      TelegramBot.client.sendMessage(req.user.TelegramId, {
        message:'❌Произошла ошибка в процессе обработки запроса. Просьба обратиться к главному разработчику: @dan_blise'
      })
      await User.setContext(req, null)
      logger.error(error)
    }
  }

  static async emptyContextHandler(req: req) {
    switch (req.message) {
      case '/start':
        await TelegramBot.client.sendMessage(req.user.TelegramId, {
          message: 'Привет👋 Ипользуй команды в окне меню👇'
        })
        await TelegramBot.client.sendFile(req.user.TelegramId, {
          file: './media/menu.jpg',
          caption: `/pin_ozon_product для прикрепления товара.`
        })
        break;
      case '/profile':
        await TelegramBot.client.sendMessage(req.user.TelegramId, {
          message: `Твой профиль: ${JSON.stringify(req.user, null, 4)}`
        })
        break;
      case '/show_pinned_products':
        if(req.user.pinnedOzonProducts.length == 0) {
          await TelegramBot.client.sendMessage(req.user.TelegramId, {
            message: '❌Ни один товар не был прикреплён.'
          })
          break;
        }
        for (const pinnedProduct of req.user.pinnedOzonProducts) {
          await TelegramBot.client.sendMessage(req.user.TelegramId, {
            message: await OzonProduct.getStringProductTelegram(await Mongo.ozonProducts.findOne({_id: pinnedProduct}))
          })
        }
        break;
      case '/pin_ozon_product':
        if (req.user.pinnedOzonProducts.length >= 5) {
          await TelegramBot.client.sendMessage(req.user.TelegramId, {
            message: '❌Максимальное количество прикреплённых товаров: 5.'
          });
        } else {
          await TelegramBot.client.sendFile(req.user.TelegramId, {
            file: './media/share.png',
            caption: '👆Перейдите на https://www.ozon.ru/ и отправьте мне ссылку.'
          })
          await User.setContext(req, "pinOzonProduct")
        }
        break;
      case '/remove_all_products':
        await User.removeAllProduct(req);
        await TelegramBot.client.sendMessage(req.user.TelegramId, {
          message: '✅Успешно удалены все прикреплённые товары.'
        });
        break;
      default:
        await TelegramBot.client.sendMessage(req.user.TelegramId, {
          message: '❌Неизвестная команда. Пожалуйста, используй кнопку "МЕНЮ".'
        });
        break;
      }
  }

  static async contextHandler(req: req) {
    switch (req.user.context) {
      case 'pinOzonProduct':
        await User.setContext(req, 'pinningProduct')
        await TelegramBot.client.sendMessage(req.user.TelegramId, {message: '⌛️'});
        if (!isValidURL(req.message)) {
          await TelegramBot.client.sendMessage(req.user.TelegramId, {message: '❌Недопустимый URL-адрес'});
          await User.setContext(req, null)
          return
        } else if (!isOzonURL(req.message)) {
          await TelegramBot.client.sendMessage(req.user.TelegramId, {message: '❌Допустимы ссылки только домена ozon.'});
          await User.setContext(req, null)
          return
        }
        const product:any = await OzonProduct.init(req.message)
        if(await User.getIdPinnedProduct(req, product._id) == null) {
          await OzonProduct.pinProduct(req, product)
          await TelegramBot.client.sendMessage(req.user.TelegramId, {message: '✅Успешно прикреплён товар!'});
          await TelegramBot.client.sendMessage(req.user.TelegramId, {
            message: await OzonProduct.getStringProductTelegram(product)
          });
        } else {
          await TelegramBot.client.sendMessage(req.user.TelegramId, {message: '❌Товар уже прикреплён!'});
          await TelegramBot.client.sendMessage(req.user.TelegramId, {
            message: await OzonProduct.getStringProductTelegram(product)
          });
        }
        await User.setContext(req, null)
        break;
      case 'pinningProduct':
        await TelegramBot.client.sendMessage(req.user.TelegramId, {message: '❌Жди и заткнись, детка!'});
        break;
      default:
        break;
    }
  }
}