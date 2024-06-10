import { TelegramBot } from './telegram'
import { logger } from './logger';
import { Mongo } from './db';
import { Parser } from './parser';

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

const initMainProcess = () => ParseGun.init()
initMainProcess()