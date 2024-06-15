import { TelegramBot } from './TelegramBot'
import { logger } from './logger';
import { Mongo } from './Mongo';
import { Parser } from './Parser';

export class ParseGun {
    static async init() {
        logger.info('ParseGun init...')

        logger.info('Parser init...')
        await Parser.init()
        logger.info('Database init...')
        await Mongo.init()
        logger.info('Telegram init...')
        TelegramBot.init()
    }
}

ParseGun.init()