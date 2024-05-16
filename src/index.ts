import puppeteer from 'puppeteer-extra';
// import * as XLSX from 'xlsx';
// import * as fs from 'fs';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import fs from 'fs';
import {KnownDevices, Page} from 'puppeteer'
import startBot from './telegram'
import config from "../.temp/config.json"
// import AdblockerPlugin from 'puppeteer-extra-plugin-adblocker';
puppeteer.use(StealthPlugin())

export let pages: Page[] = []

async function parsergunlaunch() {
    const browser = await puppeteer.launch(config.puppeteerUserConf);
    const page = await browser.newPage()
    await page.setViewport({ width: 720, height: 1280, isMobile:true })

    const cookiesString = fs.readFileSync('./.temp/cookies1.json', {'encoding': 'utf-8'})
    const cookies = JSON.parse(cookiesString)
    await page.setCookie(...cookies)

    let userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
    await page.setUserAgent(userAgent);
    
    await page.emulate(KnownDevices['iPhone 6'])

    await page.reload({waitUntil: 'domcontentloaded'})
    pages.push(page)
}

export async function parse(page: Page, link: string) {
    console.log(`go to page...`)
    await page.goto(link, {waitUntil: 'networkidle2', timeout: 0})
    await new Promise(resolve => setTimeout(resolve, 1));
    // await page.click('#reload-button')
    // await page.waitForNavigation()
    // await page.reload()
    await page.waitForSelector(config.priceSpanOzon)
    await page.locator(config.priceSpanOzon).scroll()
    await page.screenshot({ path: './.temp/media/ozon.png'})
    
    let price = await page.waitForSelector(config.priceSpanOzon)
    let priceText = await page.evaluate(el => el?.textContent, price)
    console.log(priceText)
    // const cookies = await page.cookies();
    // fs.writeFileSync('./temp/cookies1.json', JSON.stringify(cookies, null, 2));

    console.log(`All done, check the screenshots. ✨`)
    return priceText
}

(async () => {
    await parsergunlaunch()
    await startBot()
})(); 