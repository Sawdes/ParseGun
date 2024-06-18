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
        let interval = (hours: number) => {
            return hours * 60 * 60 * 1000;
        }
        setInterval(Manager.parsePinnedProducts, interval(12))

        await Manager.parsePinnedProducts()
    }

    static async parsePinnedProducts() {
        const users = Mongo.users.find({})

        for await (let user of users) {
            logger.info(`parsetask user: ${JSON.stringify(user, null, 2)}`)
            await TelegramBot.client.sendMessage(user.TelegramId, {
                message: `<b>---- Парсинг закрепленных товаров... ----</b>`
            })
            await TelegramBot.client.sendMessage(user.TelegramId, {
                message: `⏳`
            })
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
                        message: `💰Изменилась цена!                    
${OzonProduct.getStringProductTelegram(parsedProduct)}

Прошедшая: ${product.lastPrice}
Актуальная: ${parsedProduct.lastPrice}
Разница: ${parsedProduct.lastPrice - product.lastPrice}`
                    });
                } else {
                    await TelegramBot.client.sendMessage(user.TelegramId, {
                        message: `💰Цена не изменилась.                   
${OzonProduct.getStringProductTelegram(parsedProduct)}
Прошедшая: ${product.lastPrice}RUB
Актуальная: ${parsedProduct.lastPrice}RUB`
                    })
                }
            }
            await TelegramBot.client.sendMessage(user.TelegramId, {
                message: `<b>---- Завершенно. ----</b>`
            })
        }
    }
}