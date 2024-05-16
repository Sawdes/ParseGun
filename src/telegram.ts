import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
import { pages, parse } from ".";
import { NewMessage } from "telegram/events";
// import { CustomFile } from "telegram/client/uploads";
// import fs from "fs";
import config from "../.temp/config.json"

const stringSession = config.stringSession
const BOT_TOKEN = config.BOT_TOKEN

async function startBot() {
  const client = new TelegramClient(
    new StringSession(stringSession),
    config.apiId,
    config.apiHash,
    { connectionRetries: 5 }
  );
  await client.start({
    botAuthToken: BOT_TOKEN,
  });
  async function handler(event: any) {
    const sender = await event.message.getChat()
    const priceText = await parse(pages[0], event.message.message)
    await client.sendFile(sender, {file: './media/ozon.png'})
    await client.sendMessage(sender, {message: priceText ?? 'цена неизвестна'})
  }
  client.addEventHandler(handler, new NewMessage({}));
}

export default startBot