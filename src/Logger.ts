import winston from 'winston';
const { combine, timestamp, align, colorize, printf } = winston.format;

export const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: combine(
        colorize({all: true}),
        timestamp({
            format: 'YYYY-MM-DD hh:mm:ss.SSS A',
        }),
        align(),
        printf((info) => `[${info.timestamp}] ${info.level}: ${info.message}`)
    ),
    transports: [
        new winston.transports.Console(),
        // new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: `./logs/${new Date().toLocaleString("ru", {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
            timeZone: 'UTC'
        })}.log`})
    ],
})