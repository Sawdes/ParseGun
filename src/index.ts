import { TelegramBot } from './TelegramBot'
import { logger } from './Logger';
import { Mongo } from './Mongo';
import { Parser } from './Parser';
import { Manager } from './Manager';

export class ParseGun {
    static async init() {
        logger.info('ParseGun init...')

        await Parser.init()
        await Mongo.init()
        TelegramBot.init()

        Manager.init()
    }
}

ParseGun.init()