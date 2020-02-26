import {DocumentClient} from "aws-sdk/lib/dynamodb/document_client";
import {PromiseResult} from "aws-sdk/lib/request";
import {Configuration} from "../utils/Configuration";
import {NUMBER_TYPE} from "../assets/Enums";
/* tslint:disable */
let AWS: { DynamoDB: { DocumentClient: new (arg0: any) => DocumentClient; }; };
if (process.env._X_AMZN_TRACE_ID) {
    AWS = require("aws-xray-sdk").captureAWS(require("aws-sdk"));
} else {
    console.log("Serverless Offline detected; skipping AWS X-Ray setup")
    AWS = require("aws-sdk");
}

/* tslint:enable */

export class DynamoDBService {
    private static client: DocumentClient;
    private readonly tableName: string;

    /**
     * Constructor for the DynamoDBService
     */
    public constructor() {
        const config: any = Configuration.getInstance().getDynamoDBConfig();
        this.tableName = config.table;

        if (!DynamoDBService.client) {
            console.log("config for DynamoDB Client: ", config.params);
            DynamoDBService.client = new AWS.DynamoDB.DocumentClient(config.params);
        }
    }

    /**
     * Scan the entire table and retrieve all data
     * @returns Promise<PromiseResult<DocumentClient.ScanOutput, AWS.AWSError>>
     */
    public scan(): Promise<PromiseResult<DocumentClient.ScanOutput, AWS.AWSError>> {
        return DynamoDBService.client.scan({TableName: this.tableName})
            .promise();
    }

    /**
     * Retrieves the item with the given key
     * @param key - the key of the item you wish to fetch
     * @param attributes - optionally, you can request only a set of attributes
     * @returns Promise<PromiseResult<DocumentClient.GetItemOutput, AWS.AWSError>>
     */
    public get(key: DocumentClient.Key, attributes?: DocumentClient.AttributeNameList): Promise<PromiseResult<DocumentClient.GetItemOutput, AWS.AWSError>> {
        const query: DocumentClient.GetItemInput = {
            TableName: this.tableName,
            Key: key,
        };

        if (attributes) {
            Object.assign(query, {AttributesToGet: attributes});
        }

        return DynamoDBService.client.get(query)
            .promise();
    }

    /**
     * Replaces the provided item, or inserts it if it does not exist
     * @param item - item to be inserted or updated
     * @returns Promise<PromiseResult<DocumentClient.PutItemOutput, AWS.AWSError>>
     */
    public put(item: any): Promise<PromiseResult<DocumentClient.PutItemOutput, AWS.AWSError>> {
        const query: DocumentClient.PutItemInput = {
            TableName: this.tableName,
            Item: item,
            ReturnValues: "ALL_OLD",
            ConditionExpression: "testNumber <> :testNumberVal",
            ExpressionAttributeValues: {
                ":testNumberVal": item.testNumber
            }
        };

        return DynamoDBService.client.put(query)
            .promise();
    }

    /**
     * Deletes the item with the given key and returns the item deleted
     * @param key - the key of the item you wish to delete
     * @returns Promise<PromiseResult<DocumentClient.DeleteItemOutput, AWS.AWSError>>
     */
    public delete(key: DocumentClient.Key): Promise<PromiseResult<DocumentClient.DeleteItemOutput, AWS.AWSError>> {
        const query: DocumentClient.DeleteItemInput = {
            TableName: this.tableName,
            Key: key,
            ReturnValues: "ALL_OLD",
        };

        return DynamoDBService.client.delete(query)
            .promise();
    }

    /**
     * Retrieves a list of batches containing results for the given keys
     * @param keys - a list of keys you wish to retrieve
     * @returns Promise<PromiseResult<BatchGetItemOutput, AWS.AWSError>>
     */
    public batchGet(keys: DocumentClient.KeyList): Promise<Array<PromiseResult<DocumentClient.BatchGetItemOutput, AWS.AWSError>>> {
        const keyList: DocumentClient.KeyList = keys.slice();
        const keyBatches: DocumentClient.KeyList[] = [];

        while (keyList.length > 0) {
            keyBatches.push(keyList.splice(0, 100));
        }

        const promiseBatch: Array<Promise<PromiseResult<DocumentClient.BatchGetItemOutput, AWS.AWSError>>> = keyBatches.map((batch: DocumentClient.KeyList) => {
            const query: DocumentClient.BatchGetItemInput = {
                RequestItems: {
                    [this.tableName]: {
                        Keys: batch,
                    },
                },
            };

            return DynamoDBService.client.batchGet(query)
                .promise();
        });

        return Promise.all(promiseBatch);
    }

    /**
     * Updates or creates the items provided, and returns a list of result batches
     * @param items - items to add or update
     * @returns Promise<PromiseResult<DocumentClient.BatchWriteItemOutput, AWS.AWSError>[]>
     */
    public batchPut(items: any[]): Promise<Array<PromiseResult<DocumentClient.BatchWriteItemOutput, AWS.AWSError>>> {
        const itemList: DocumentClient.WriteRequests = items.slice();
        const itemBatches: DocumentClient.WriteRequests[] = [];

        while (itemList.length > 0) {
            itemBatches.push(itemList.splice(0, 25));
        }

        const promiseBatch: Array<Promise<PromiseResult<DocumentClient.BatchWriteItemOutput, AWS.AWSError>>> = itemBatches.map((batch: any[]) => {
            const query: DocumentClient.BatchWriteItemInput = {
                RequestItems: {
                    [this.tableName]: batch.map((item: any) => ({PutRequest: {Item: item}})),
                },
            };

            return DynamoDBService.client.batchWrite(query)
                .promise();
        });

        return Promise.all(promiseBatch);
    }

    /**
     * Deletes the items provided, and returns a list of result batches
     * @param keys - keys for the items to delete
     * @returns Promise<PromiseResult<DocumentClient.BatchWriteItemOutput, AWS.AWSError>[]>
     */
    public batchDelete(keys: DocumentClient.KeyList): Promise<Array<PromiseResult<DocumentClient.BatchWriteItemOutput, AWS.AWSError>>> {
        const keyList: DocumentClient.KeyList = keys.slice();
        const keyBatches: DocumentClient.KeyList[] = [];

        while (keyList.length > 0) {
            keyBatches.push(keyList.splice(0, 25));
        }

        const promiseBatch: Array<Promise<PromiseResult<DocumentClient.BatchWriteItemOutput, AWS.AWSError>>> = keyBatches.map((batch: any[]) => {
            const query: DocumentClient.BatchWriteItemInput = {
                RequestItems: {
                    [this.tableName]: batch.map((item: any) => ({DeleteRequest: {Key: item}})),
                },
            };

            return DynamoDBService.client.batchWrite(query)
                .promise();
        });

        return Promise.all(promiseBatch);
    }

    /**
     * Performs a write transaction on the specified table.
     * @param item - the item to be inserted or updated during the transaciton.
     * @param oldItem - the current item that already exists in the database.
     */
    public transactWrite(item: any, oldItem?: any, numberType: string = NUMBER_TYPE.TEST_NUMBER): Promise<PromiseResult<DocumentClient.TransactWriteItemsOutput, AWS.AWSError>> {
        const query: DocumentClient.TransactWriteItemsInput = {
            TransactItems: [
                {
                    Put: {
                        TableName: this.tableName,
                        Item: item,
                        ConditionExpression: "",
                        ExpressionAttributeValues: {}
                    }
                }
            ]
        };
        if (numberType === NUMBER_TYPE.TRAILER_ID) {
            Object.assign(query.TransactItems[0].Put, {
                ConditionExpression: "trailerId = :oldTrailerId",
                ExpressionAttributeValues: {
                    ":oldTrailerId": oldItem.trailerId
                }
            });
        } else {
            Object.assign(query.TransactItems[0].Put, {
                ConditionExpression: "testNumber = :OldTestNumber",
                ExpressionAttributeValues: {
                    ":OldTestNumber": oldItem.testNumber
                }
            });
        }
        return DynamoDBService.client.transactWrite(query).promise();
    }
}
