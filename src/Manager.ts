import { Mongo } from "./Mongo";
import { logger } from "./Logger";
import { Parser } from "./Parser";
import { TelegramBot } from "./TelegramBot";
import { OzonProduct } from "./OzonProduct";

export class Manager {
    tasks: any
    static async init() {
        logger.info("Init Manager...")

        logger.info("Set Interval...")
        setInterval(Manager.parsePinnedProducts, 7200000)

        // await Manager.getParseTask()
    }

    static async parsePinnedProducts() {
        const users = Mongo.users.find({})

        for await (let user of users) {
            logger.info(`parsetask user: ${JSON.stringify(user, null, 2)}`)
            for (let productId of user.pinnedOzonProducts) {
                const product = await Mongo.ozonProducts.findOne({_id: productId})
                const link = product?.url

                if (link == null || product == null) {
                    return
                }

                await Parser.parseOzonProduct(link)
                const parsedProduct = await Mongo.ozonProducts.findOne({_id: productId})
                if (parsedProduct == null) {
                    throw new Error('parsed product is null')
                }
                
                if (product.lastPrice !== parsedProduct.lastPrice) {
                    await TelegramBot.client.sendMessage(user.TelegramId, {
                        message: `✅Изменилась цена!                    
${OzonProduct.getStringProductTelegram(parsedProduct)}

Прошедшая: ${product.lastPrice}
Актуальная: ${parsedProduct.lastPrice}`
                    });
                }
            }
        }
    }


}