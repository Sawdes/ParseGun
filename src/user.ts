import { ObjectId } from "mongodb";
import { Mongo } from "./Mongo";

export class User {
    TelegramId: number;
    firstName: string;
    lastName: string;
    username: string;
    context: string | null;

    constructor(sender: { id: number; firstName: string; lastName: string; username: string; }) {
        this.TelegramId = Number(sender.id),
        this.firstName = sender.firstName,
        this.lastName = sender.lastName,
        this.username = sender.username,
        this.context = null
    }

    static async getUserDB (sender: {id: number}) {
       return await Mongo.users.findOne({TelegramId: Number(sender.id)})
    }

    static async removeAllProduct(req: { user: { TelegramId: number; }}) {
        await Mongo.users.updateOne(
          {TelegramId: req.user.TelegramId},
          {
            $set: {
                "pinnedOzonProducts": [],
            },
          }
        );
    }

    static async getIdPinnedProduct(req: { user: { TelegramId: number; } }, id: ObjectId) {
        const user: any = await Mongo.users.findOne(
          {"TelegramId": req.user.TelegramId},
        );
        for(let i = 0; i < user.pinnedOzonProducts.length; i++) {
          if(String(id) == user.pinnedOzonProducts[i]) {
            return user.pinnedOzonProducts[i]
          }
        }
        return null
    }

    static async setContext(req: { user: { TelegramId: number; }}, context: string | null) {
        await Mongo.users.updateOne(
          {TelegramId: req.user.TelegramId},
          {
            $set: {
                "context": context,
            },
          }
        );
      }
}  