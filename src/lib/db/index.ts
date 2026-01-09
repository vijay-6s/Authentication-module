import { MongoClient } from "mongodb";

class MongoDBClient {
    private url: string;
    private dbName: string;
    private client: MongoClient;

    constructor() {
        this.url = process.env.MONGODB_URL!;
        this.dbName = process.env.DB_NAME || "test";
        this.client = new MongoClient(this.url, {
            tlsAllowInvalidCertificates: true,
        });
    }

    async init() {
        console.log("Connecting to mongodb...");
        try {
            await this.client.connect();
            console.log("Connected to mongodb");
        } catch (error) {
            console.log(`dbError: could not connect to mongodb`)
        }
    }

    getDb() {
        return this.client.db(this.dbName);
    }

    getCollection(collectionName:string) {
        return this.getDb().collection(collectionName);
    }

    close() {
        this.client.close();
    }
}

export const mongodbClient = new MongoDBClient;