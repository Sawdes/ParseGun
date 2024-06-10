import { Collection, Document, MongoClient, ServerApiVersion } from "mongodb";
import config from "../.temp/config.json"
import { logger } from "./logger";
// import { generateRandomInt } from "./helpers";

export class Mongo {
  static client: MongoClient;
  static users: Collection<Document>
  static ozonProducts: Collection<Document>
  static wildProducts: Collection<Document>
  
  static async init() {
    try {
      Mongo.client = new MongoClient(config.mongo.uri, {
        serverApi: {
          version: ServerApiVersion.v1,
          strict: true,
          deprecationErrors: true,
        }
      });

      logger.info('Connecting to Database...')
      await Mongo.client.connect();

      logger.info('Ping to server Databse...')
      await Mongo.client.db("admin").command({ ping: 1 });
      logger.info("Pinged your deployment. Successfully connected to MongoDB!");

      await Mongo.client.db('parsegun').createCollection('users') // Init users collections
      Mongo.users = Mongo.client.db('parsegun').collection('users')

      await Mongo.client.db('parsegun').createCollection('ozonProducts') // Init Ozon products collections
      Mongo.ozonProducts = Mongo.client.db('parsegun').collection('ozonProducts')

      await Mongo.client.db('parsegun').createCollection('wildProducts') // Init Wildberries products collections
      Mongo.wildProducts = Mongo.client.db('parsegun').collection('wildProducts')
      // await Mongo.test()
    } catch(error) {
      // Ensures that the client will close when error
      logger.error(error)
      await Mongo.client.close();
    }
  }


  // static async test() {
  //   const _id = generateRandomInt(10000000, 99999999)
  //   const user = {
  //     name: "Sawdes",
  //     pinnedProducts_ids: [_id]
  //   }

  //   const product = {
  //     article: nowNumber
  //   }

  //   await Mongo.users.insertOne(user)
  //   await Mongo.products.insertOne(product)

  //   const userDB = await Mongo.users.findOne({name: "Daniil"})
  //   const productDB = async (article:number) => await Mongo.products.findOne({article: article})
  //   console.log(await productDB(userDB?.pinnedProducts_ids[0]))
  // }
}