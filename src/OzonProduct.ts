import { ObjectId } from "mongodb";
import { Mongo } from "./Mongo";
import { logger } from "./logger";
import { Parser } from "./Parser";

export class OzonProduct {
    article: number | null
    url: string | null
    nameProduct: string | null;
    lastPrice: number | null;

    constructor(article: number | null, url: string | null, nameProduct: string | null, lastPrice: number | null) {
        this.article  = article
        this.url = url
        this.nameProduct = nameProduct
        this.lastPrice = lastPrice
    }

    static async init(link: string) {
        logger.info("initOzonProduct...")
        const {article, nameProduct, price } = await Parser.parseOzonProduct(link)
        const getProductDB = async () => await Mongo.ozonProducts.findOne({"article": article})
        if(await getProductDB() == null) {
            logger.info('New product! Add in db...')
            await Mongo.ozonProducts.insertOne({article, url:link, nameProduct, lastPrice: price})
            return await getProductDB()
        } else {
            logger.info('Product already exist. Update info...')
            Mongo.users.updateOne(
                {"article": article},
                {
                  $set: {
                      "name": nameProduct,
                      "lastProduct": price
                    }
                }
            )
            return await getProductDB()
        }
    }

    static getStringProductTelegram(product: any): string {
        return `
        📦Товар: <i>"${product.nameProduct}"</i>

        article: <code>${product.article}</code>
        URL: <a href="${product.url}">click to follow the link</a>
        last price: <code>${product.lastPrice}RUB</code>
        `
    }

    static async getPinnedProductArticle(article: number) {
        return await Mongo.users.findOne(
          {"article": article},
        );
    }

    static async pinProduct(req: { user: { TelegramId: number; } }, product: any) {
        await Mongo.users.updateOne(
          {TelegramId: req.user.TelegramId},
          {
            $push: {
              "pinnedOzonProducts": new ObjectId(product._id) as any
            }
          }
        );
    }
}

// export class WildProduct {
//     static article: number | null
//     static url: string | null
//     static nameProduct: string | null;
//     static lastPrice: number | null;

//     static async init(link: string) {
//         logger.info("initWildProduct...")
//         // const parseWildProduct = await Parser.parseWildProduct(link)
//         // OzonProduct.article = parseWildProduct.article ?? null
//         // OzonProduct.url = parseWildProduct.link
//         // OzonProduct.nameProduct = parseWildProduct.nameProduct ?? null
//         // OzonProduct.lastPrice = parseWildProduct.price ?? null
//         return WildProduct
//     }
// }