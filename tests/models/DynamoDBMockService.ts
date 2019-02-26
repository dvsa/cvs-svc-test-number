import {AWSError, Response} from "aws-sdk";
import {DocumentClient} from "aws-sdk/lib/dynamodb/document_client";
import {PromiseResult} from "aws-sdk/lib/request";
import {Configuration} from "../../src/utils/Configuration";

export class DynamoDBMockService {
    private db: any;
    private readonly keys: any;

    public constructor() {
        this.db = [];
        const config: any = Configuration.getInstance().getDynamoDBConfig();
        this.keys = config.keys;
    }

    /**
     * Seeds the database with the provided items
     * @param items - an array of items
     */
    public seed(items: any[]): void {
        this.batchPut(items);
    }

    /**
     * Empties the database
     */
    public empty(): void {
        this.db = [];
    }

    /**
     * Scan the entire table and retrieve all data
     * @returns Promise<PromiseResult<DocumentClient.ScanOutput, AWSError>>
     */
    public scan(): Promise<PromiseResult<DocumentClient.ScanOutput, AWSError>> {
        return new Promise((resolve, reject) => {
            const response = new Response<DocumentClient.ScanOutput, AWSError>();
            response.data = {
                Count: this.db.length,
                Items: this.db,
                ScannedCount: this.db.length
            };

            resolve({
                $response: response,
                Count: this.db.length,
                Items: this.db,
                ScannedCount: this.db.length
            });
        });
    }

    /**
     * Retrieves the item with the given key
     * @param key - the key of the item you wish to fetch
     * @param attributes - optionally, you can request only a set of attributes
     * @returns Promise<PromiseResult<DocumentClient.GetItemOutput, AWSError>>
     */
    public get(key: DocumentClient.Key, attributes?: DocumentClient.AttributeNameList): Promise<PromiseResult<DocumentClient.GetItemOutput, AWSError>> {
        return new Promise((resolve, reject) => {
            const response = {
                $response: new Response<DocumentClient.GetItemOutput, AWSError>()
            };

            const keyAttributes: any[] = Object.entries(key);

            const itemRetrieved = this.db.find((item: any) => {
                let isMatch: boolean = true;

                for (const attribute in keyAttributes) {
                    if (!(item[attribute[0]] === attribute[1])) {
                        isMatch = false;
                        break;
                    }
                }

                return isMatch;
            });

            if (itemRetrieved) {
                response.$response.data = { Item: itemRetrieved };
                Object.assign(response, { Item: itemRetrieved });

            }

            resolve(response);
        });
    }

    /**
     * Replaces the provided item, or inserts it if it does not exist
     * @param item - item to be inserted or updated
     * @returns Promise<PromiseResult<DocumentClient.PutItemOutput, AWSError>>
     */
    public put(item: any): Promise<PromiseResult<DocumentClient.PutItemOutput, AWSError>> {
        return new Promise((resolve, reject) => {
            const response: PromiseResult<DocumentClient.PutItemOutput, AWSError> = {
                $response: new Response<DocumentClient.GetItemOutput, AWSError>()
            };

            const itemIndex: number = this.db.findIndex((dbItem: any) => {
                let isMatch: boolean = true;

                for (const key of this.keys) {
                    if (dbItem[key] !== item[key]) {
                        isMatch = false;
                        break;
                    }
                }

                return isMatch;
            });

            if (itemIndex !== -1) {
                Object.assign(response, { Attributes: this.db[itemIndex] });
                this.db[itemIndex] = item;
            } else {
                this.db.push(item);
            }

            resolve(response);
        });
    }

    /**
     * Deletes the item with the given key and returns the item deleted
     * @param key - the key of the item you wish to delete
     * @returns Promise<PromiseResult<DocumentClient.DeleteItemOutput, AWSError>>
     */
    public delete(key: DocumentClient.Key): Promise<PromiseResult<DocumentClient.DeleteItemOutput, AWSError>> {
        return new Promise((resolve, reject) => {
            const response = {
                $response: new Response<DocumentClient.GetItemOutput, AWSError>()
            };

            const keyAttributes: any[] = Object.entries(key);

            const itemIndex: number = this.db.findIndex((item: any) => {
                let isMatch: boolean = true;

                for (const attribute of keyAttributes) {
                    if (!(item[attribute[0]] === attribute[1])) {
                        isMatch = false;
                        break;
                    }
                }

                return isMatch;
            });

            if (itemIndex) {
                Object.assign(response, { Attributes: this.db[itemIndex] });
                this.db.splice(itemIndex, 1);
            }

            resolve(response);
        });
    }

    /**
     * Retrieves a list of items with the given keys
     * @param keys - a list of keys you wish to retrieve
     * @returns Promise<PromiseResult<BatchGetItemOutput, AWSError>>
     */
    public batchGet(keys: DocumentClient.KeyList): Promise<PromiseResult<DocumentClient.BatchGetItemOutput, AWSError>> {
        return new Promise((resolve, reject) => {
            const config: any = Configuration.getInstance().getDynamoDBConfig();

            const response = {
                $response: new Response<DocumentClient.BatchGetItemOutput, AWSError>()
            };

            const keyAttributes: any[] = keys.map((key: DocumentClient.Key) => Object.entries(key));

            const items: number = this.db.filter((item: any) => {
                let isMatch: boolean = true;

                for (const keyAttribute of keyAttributes) {
                    for (const attribute of keyAttribute) {
                        if (!(item[attribute[0]] === attribute[1])) {
                            isMatch = false;
                            break;
                        }
                    }
                }

                return isMatch;
            });

            if (items) {
                Object.assign(response, { Responses: { [config.table]: items } });
            }

            resolve(response);
        });

    }

    /**
     * Updates or creates the items provided
     * @param items - items to add or update
     * @returns Promise<PromiseResult<DocumentClient.BatchWriteItemOutput, AWSError>>
     */
    public batchPut(items: any[]): Promise<PromiseResult<DocumentClient.BatchWriteItemOutput, AWSError>> {
        return new Promise((resolve, reject) => {
            items.forEach(async (item: any) => {
               await this.put(item);
            });

            const response = {
                $response: new Response<DocumentClient.BatchWriteItemOutput, AWSError>()
            };

            resolve(response);
        });
    }

    /**
     * Updates or creates the items provided
     * @param items - items to add or update
     * @returns Promise<PromiseResult<DocumentClient.BatchWriteItemOutput, AWSError>>
     */
    public batchDelete(items: DocumentClient.KeyList): Promise<PromiseResult<DocumentClient.BatchWriteItemOutput, AWSError>> {
        return new Promise((resolve, reject) => {
            items.forEach(async (item: any) => {
                await this.delete(item);
            });

            const response = {
                $response: new Response<DocumentClient.BatchWriteItemOutput, AWSError>()
            };

            resolve(response);
        });
    }
}
