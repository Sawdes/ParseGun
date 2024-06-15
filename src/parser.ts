import puppeteer from 'puppeteer';
import { Page } from 'puppeteer'
import fs from 'fs';
import { logger } from './logger';
import config from '../.temp/config.json'
import { Browser } from 'puppeteer';

export class Parser {
    static browser: Browser;

    static async init() {
        Parser.browser = await puppeteer.launch({
            headless: true,
        });
    }

    static async getPage() {
        const page = await Parser.browser.newPage()
        page.setDefaultTimeout(14000)
        await page.setViewport({ width: 1920, height: 1080})
    
        const cookiesString = fs.readFileSync('./.temp/cookies1.json', {'encoding': 'utf-8'})
        const cookies = JSON.parse(cookiesString)
        await page.setCookie(...cookies)
    
        await page.setUserAgent(config.userAgent);
        
        // await page.emulate(KnownDevices['iPhone 6'])
        return page
    }

    // static async parse(page: Page, link: string) {
    //     logger.info('Parse info...')
    //     logger.info('Go to page...')
    //     await page.goto(link, {waitUntil: 'networkidle2', timeout: 0})
    
    //     logger.info('Scroll and screenshot...')
    //     await page.locator(config.priceSpanOzon).scroll()
    //     await page.screenshot({ path: './.temp/media/ozon.png'})
    
    //     logger.info('Parse price...')
    //     let price = await page.waitForSelector(config.priceSpanOzon)
    //     let priceText = await page.evaluate(el => el?.textContent, price)
    
    //     logger.info(`All done, check the screenshot and price. ✨ Price: ${priceText}`)
    // //     return priceText
    // }

    static async initCookies(page: Page, link: string) {
        console.log(`go to page...`)
        await page.goto(link, {
            waitUntil: 'networkidle2',
            timeout: 0
        });
        await page.waitForNavigation();
        page.reload({waitUntil: 'networkidle2'})

        console.info('init cookies...')
        const cookies = await page.cookies();
        fs.writeFileSync('./temp/cookies1.json', JSON.stringify(cookies, null, 2));
    }

    static async parseOzonProduct(link: string) {
        logger.info('Parse ozon product...')
        const page = await Parser.getPage()
        logger.info('Go to page...')
        await page.goto(link, {waitUntil: 'networkidle2'})
        await page.screenshot({path: './.temp/media/screenshot.png'})
        // Parse article
        logger.info('Parse article...')
        const articleElementSelectors = [
            'button[data-widget="webDetailSKU"] > div',
        ]
        let articleElement = await Parser.parseElementOfSelectors(page, articleElementSelectors)
        let article = await page.evaluate((el) => parseFloat(String(el?.textContent?.trim().replace(/^\D+/g, ''))), articleElement)

        // Parse name
        logger.info('Parse name...')
        let nameProductElement = await page.waitForSelector('div[data-widget="webProductHeading"] > h1')
        let nameProduct = await page.evaluate((el) => String(el?.textContent?.trim()), nameProductElement)


        // Parse price
        logger.info('Parse price...')
        const priceElementSelectors = [
            'div[data-widget=webPrice] > div:nth-child(1) > div:nth-child(2) > div:nth-child(1) > div:nth-child(1) > span',
            'div[data-widget=webPrice] > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > span'
        ]
        let priceElement = await Parser.parseElementOfSelectors(page, priceElementSelectors)
        let price = await page.evaluate((el) => parseInt(String(el?.textContent?.trim().replace(/[^0-9\.-]+/g,""))), priceElement)

        // Return parsed info
        logger.info({article, link, nameProduct, price})
        page.close()
        return {article, link, nameProduct, price}
    }

    // static async parseWildProduct(link: string) {
    //     const page = Parser.pages[0]
    //     logger.info('Parse wild product...')
    //     logger.info('Go to page...')
    //     await page.goto(link, {waitUntil: 'networkidle2', timeout: 0})
    
    //     // logger.info('Scroll and screenshot...')
    //     // await page.locator(config.priceSpanOzon).scroll()
    //     // await page.screenshot({ path: './.temp/media/ozon.png'})
    //     logger.info('Parse article...')
    //     let articleElement = await page.waitForSelector('#productNmId')
    //     let article = await page.evaluate(el => parseFloat(String(el?.textContent?.trim())), articleElement)

    //     // logger.info('Parse url...')
    //     // await page.click("#layoutPage > div.b2.b4 > div:nth-child(4) > div.ln3_27.l9n_27.ln5_27.l6n_27.l7n_27 > div.ln3_27.ln4_27.ln5_27.n5l_27 > div.ln3_27.ln4_27.nl4_27.ln6_27.l7n_27 > div.km_27 > div > button")
    //     // await page.click("body > div.vue-portal-target > div > div.b606-a2 > div > div > div > div > button");
    //     // let urlText = await page.evaluate(async () => await navigator.clipboard.readText())

    //     logger.info('Parse name...')
    //     let nameProductElement = await page.waitForSelector('div.product-page__header-wrap > div.product-page__header > h1')
    //     let nameProduct = await page.evaluate(el => el?.textContent?.trim(), nameProductElement)
    
    //     logger.info('Parse price...')
    //     const priceElementSelectors = [
    //         'div[data-widget="webPrice"] > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > span',
    //         'div[data-widget="webPrice"] > div:nth-child(1) > div:nth-child(2) > div:nth-child(1) > div:nth-child(1) > span'

    //     ]
    //     let priceElement = await Parser.parseElementOfSelectors(page, priceElementSelectors)
    //     let price = await page.evaluate(el => parseInt(String(el?.textContent?.trim().replace(/[^0-9\.-]+/g,""))), priceElement)

    //     logger.info(`
    //         HELLOOFhndihnfiodsnf[oasiebdf]
    //     `)
    //     return {article, link, nameProduct, price}
    // }

    static async parseElementOfSelectors(page: Page, selectors: string[]) {
        let element = null
        for(let i = 0; i < selectors.length; i++) {
            element = await page.$(selectors[i])
            if(element !== null) {
                break;
            }
        }
        return element
    }
}