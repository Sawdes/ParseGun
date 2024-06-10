import { Mongo } from "./db";
import { logger } from "./logger";
import { Parser } from "./parser";

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
        await Mongo.ozonProducts.insertOne({article, url:link, nameProduct, lastPrice: price})
        return new OzonProduct(article, link, nameProduct, price)
    }

    static async getStringProductTelegram(product: any): Promise<string> {
        return `
        <b>${product.nameProduct}:</b>
        
        article: <code>${product.article}</code>
        URL: <a href="${product.url}">click to follow the link</a>
        last price: <code>${product.lastPrice}RUB</code>
        `
    }
}

export class WildProduct {
    static article: number | null
    static url: string | null
    static nameProduct: string | null;
    static lastPrice: number | null;

    static async init(link: string) {
        logger.info("initWildProduct...")
        // const parseWildProduct = await Parser.parseWildProduct(link)
        // OzonProduct.article = parseWildProduct.article ?? null
        // OzonProduct.url = parseWildProduct.link
        // OzonProduct.nameProduct = parseWildProduct.nameProduct ?? null
        // OzonProduct.lastPrice = parseWildProduct.price ?? null
        return WildProduct
    }
}