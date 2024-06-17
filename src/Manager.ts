import { ObjectId } from "mongodb";
import { Mongo } from "./Mongo";
import { logger } from "./logger";
import { Parser } from "./Parser";
import { TelegramBot } from "./TelegramBot";
import { OzonProduct } from "./OzonProduct";

export class Manager {
    tasks: any
    static async init() {
        logger.info("Init Manager...")

        logger.info("Set Interval...")
        setInterval(Manager.getParseTask, 7200000)

        // await Manager.getParseTask()
    }

    static async getParseTask() {
        const users = Mongo.users.find({})

        for await (let user of users) {
            logger.info(`parsetask user: ${JSON.stringify(user, null, 2)}`)
            await TelegramBot.client.sendMessage(user.TelegramId, {
                message: '----Начало раассылки закрепленных товаров!----'
            });
            for (let productId of user.pinnedOzonProducts) {
                let product = await Mongo.ozonProducts.findOne({_id: productId})
                logger.info(`parsetask product: ${JSON.stringify(product, null, 2)}`)
                const link = product?.url

                if (link == null || product == null) {
                    return
                }

                await Parser.parseOzonProduct(link)
                product = await Mongo.ozonProducts.findOne({_id: productId})

                
                await TelegramBot.client.sendMessage(user.TelegramId, {
                    message: OzonProduct.getStringProductTelegram(product)
                });
            }
            await TelegramBot.client.sendMessage(user.TelegramId, {
                message: '----Конец раассылки закрепленных товаров!----'
            });
        }
    }


}