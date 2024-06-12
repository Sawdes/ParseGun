import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
import { NewMessage } from "telegram/events";
import config from "../.temp/config.json"
import { logger } from "./logger";
import { User } from "./user";
import { Mongo } from './db';
import { OzonProduct } from "./product";
import { isOzonURL, isValidURL } from "./helpers";

const stringSession = config.stringSession
const BOT_TOKEN = config.BOT_TOKEN



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
    TelegramBot.client.addEventHandler(TelegramBot.messageHandler, new NewMessage({}));
  }

  static async resetUsersContext() {
    logger.info('Reset users context...')
    await Mongo.users.updateMany({"context": {"$ne": null}}, {$set:{context: null}})
  }

  static async ozonProductHandler(url: any) {
    return await OzonProduct.init(url)
  }

  static async reqHandler(req: {user: any, message: any}) {
    try {
      if(req.user == null || req.message == null) {
        throw new Error('Request user or message is null!')
      }
  
      if(req.user.context == null) {
        await TelegramBot.emptyContextHandler(req)
      } else {
        await TelegramBot.contextHandler(req)
      } 
    } catch (error) {
      TelegramBot.client.sendMessage(req.user.TelegramId, {message: '❌An error occurred while processing the request. Please inform the developer about it: @dan_blise'})
      await Mongo.users.updateOne(
        {TelegramId: req.user.TelegramId},
        {
          $set: {
              "context": null,
          },
        }
      );
      logger.error(error)
    }
  }

  static async emptyContextHandler(req: {user: any, message: any}) {
    switch (req.message) {
      case '/start':
        await TelegramBot.client.sendMessage(req.user.TelegramId, {message: 'Hello! Please use commands.'})
        await TelegramBot.client.sendFile(req.user.TelegramId, {file: './media/button_image.jpg', caption: `Please use MENU button.
          /pin_ozon_product for pin product.`})
        break;
      case '/profile':
        await TelegramBot.client.sendMessage(req.user.TelegramId, {message: `Your profile: ${JSON.stringify(req.user, null, 4)}`})
        break;
      case '/show_pinned_products':
        if(req.user.pinnedOzonProducts.length == 0) {
          await TelegramBot.client.sendMessage(req.user.TelegramId, {message: '❌Not a single product attached.'})
          break;
        }
        for (const pinnedProduct of req.user.pinnedOzonProducts) {
          await TelegramBot.client.sendMessage(req.user.TelegramId, {message: await OzonProduct.getStringProductTelegram(await Mongo.ozonProducts.findOne({_id: pinnedProduct}))})
        }
        break;
      case '/pin_ozon_product':
        if (req.user.pinnedOzonProducts.length >= 5) {
          await TelegramBot.client.sendMessage(req.user.TelegramId, {message: '❌Max pinned products = 5'});
          return
        } else {
          await TelegramBot.client.sendMessage(req.user.TelegramId, {message: 'Go to https://www.ozon.ru/ and send me link.'})
          await Mongo.setContextForUser(req, "pinOzonProduct")
        }
        break;
      case '/pinned_products':
        await TelegramBot.client.sendMessage(req.user.TelegramId, {message: `Your profile: ${JSON.stringify(req.user.pinnedProducts, null, 4)}`})
        break;
      case '/remove_all_products':
        Mongo.removeAllProductForUser(req);
        await TelegramBot.client.sendMessage(req.user.TelegramId, {message: '✅Successfully remove all products.'});
        break;
      default:
        await TelegramBot.client.sendMessage(req.user.TelegramId, {message: '❌Unknown command. Please, use MENU button.'});
        break;
      }
  }

  static async contextHandler(req: {user: any, message: any}) {
    switch (req.user.context) {
      case 'pinOzonProduct':
        await Mongo.setContextForUser(req, 'pinningProduct')
        await TelegramBot.client.sendMessage(req.user.TelegramId, {message: '⌛️'});
        if (!isValidURL(req.message)) {
          await TelegramBot.client.sendMessage(req.user.TelegramId, {message: 'Invalid URl.'});
          await Mongo.setContextForUser(req, null)
          return
        } else if (!isOzonURL(req.message)) {
          await TelegramBot.client.sendMessage(req.user.TelegramId, {message: '❌Is not OZON.'});
          await Mongo.setContextForUser(req, null)
          return
        }
        const product:any = await TelegramBot.ozonProductHandler(req.message)
        if(await Mongo.getIdPinnedProductForUser(req, product._id) == null) {
          await Mongo.addPinnedOzonProduct(req, product)
          await TelegramBot.client.sendMessage(req.user.TelegramId, {message: '✅Successfully pin product!'});
          await TelegramBot.client.sendMessage(req.user.TelegramId, {message: await OzonProduct.getStringProductTelegram(product)});
        } else {
          await TelegramBot.client.sendMessage(req.user.TelegramId, {message: '❌Product already pinned!'});
          await TelegramBot.client.sendMessage(req.user.TelegramId, {message: await OzonProduct.getStringProductTelegram(product)});
        }
        await Mongo.setContextForUser(req, null)
        break;
      case 'pinningProduct':
        await TelegramBot.client.sendMessage(req.user.TelegramId, {message: '❌WAIT and fuck off, baby!'});
        break;
      default:
        break;
    }
  }

  static async userHandler(sender: any) {
    const getUserDB = async () => await Mongo.users.findOne({TelegramId: Number(sender.id)})
    if(await getUserDB() == null) {
      logger.info('New user! Add user in database...')
      await Mongo.users.insertOne(new User(sender))
      return await getUserDB()
    } else {
      logger.info('User already exist.')
      return await getUserDB()
    }
  }
  
  static async messageHandler(event: any) {
    try {
      const sender = await event.message.getChat()
      let message = event.message.message
      logger.info(`
      Handler received event!
      sender:
        id:${sender.id} 
        username:${sender.username}
        message: ${message}
      `)

      const user = await TelegramBot.userHandler(sender)
      if(user == null) {
        throw new Error('User is null!');
      }
      TelegramBot.reqHandler({user, message})
    } catch (error) {
      logger.error(error)
    }
  }
}