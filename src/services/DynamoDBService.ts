/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable global-require */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-underscore-dangle */
// eslint-disable-next-line import/no-extraneous-dependencies
import {
  BatchGetCommand, BatchGetCommandInput, BatchGetCommandOutput, DeleteCommand, DeleteCommandInput, DeleteCommandOutput, DynamoDBDocumentClient, GetCommand, GetCommandInput, GetCommandOutput, PutCommand, PutCommandInput, PutCommandOutput, ScanCommand, ScanCommandOutput,
} from '@aws-sdk/lib-dynamodb';
// eslint-disable-next-line import/no-extraneous-dependencies
import {
  BatchWriteItemCommand, BatchWriteItemCommandInput, BatchWriteItemCommandOutput, DynamoDBClient, DynamoDBClientConfig, PutRequest, TransactWriteItemsCommand, TransactWriteItemsCommandInput, TransactWriteItemsCommandOutput,
} from '@aws-sdk/client-dynamodb';
import { KeyNodeChildren } from '@aws-sdk/lib-dynamodb/dist-types/commands/utils';
import { Configuration } from '../utils/Configuration';

const AWSXRay = require('aws-xray-sdk');
/* tslint:disable */
/* tslint:enable */

export class DynamoDBService {
  private static client: DynamoDBDocumentClient;

  private static dynamoDbClient: DynamoDBClient;

  private readonly tableName: string;

  /**
   * Constructor for the DynamoDBService
   */
  public constructor() {
    const config: any = Configuration.getInstance().getDynamoDBConfig();
    this.tableName = config.table;

    if (!DynamoDBService.dynamoDbClient) {
      console.log('config for DynamoDB Client: ', config.params);
      DynamoDBService.dynamoDbClient = AWSXRay.captureAWSv3Client(new DynamoDBClient({ ...config.params as DynamoDBClientConfig }));
      DynamoDBService.client = DynamoDBDocumentClient.from(DynamoDBService.dynamoDbClient);
    }
  }

  /**
   * Scan the entire table and retrieve all data
   * @returns Promise<ScanCommandOutput>
   */
  public scan(): Promise<ScanCommandOutput> {
    const command = new ScanCommand({ TableName: this.tableName });
    return DynamoDBService.client.send(command);
  }

  /**
   * Retrieves the item with the given key
   * @param key - the key of the item you wish to fetch
   * @param attributes - optionally, you can request only a set of attributes
   * @returns Promise<GetCommandOutput>
   */
  public get(
    key: object,
    attributes?: string[],
  ): Promise<GetCommandOutput> {
    const query: GetCommandInput = {
      TableName: this.tableName,
      Key: key,
    };
    const command = new GetCommand(query);

    if (attributes) {
      Object.assign(query, { AttributesToGet: attributes });
    }
    return DynamoDBService.client.send(command);
  }

  /**
   * Replaces the provided item, or inserts it if it does not exist
   * @param item - item to be inserted or updated
   * @returns Promise<PromiseResult<DocumentClient.PutItemOutput, AWS.AWSError>>
   */
  public put(item: any): Promise<PutCommandOutput> {
    const query: PutCommandInput = {
      TableName: this.tableName,
      Item: item,
      ReturnValues: 'ALL_OLD',
      ConditionExpression: 'testNumber <> :testNumberVal',
      ExpressionAttributeValues: {
        ':testNumberVal': item.testNumber,
      },
    };
    const command = new PutCommand(query);

    return DynamoDBService.client.send(command);
  }

  /**
   * Deletes the item with the given key and returns the item deleted
   * @param key - the key of the item you wish to delete
   * @returns Promise<PromiseResult<DocumentClient.DeleteItemOutput, AWS.AWSError>>
   */
  public delete(key: object): Promise<DeleteCommandOutput> {
    const query: DeleteCommandInput = {
      TableName: this.tableName,
      Key: key,
      ReturnValues: 'ALL_OLD',
    };
    const command = new DeleteCommand(query);

    return DynamoDBService.client.send(command);
  }

  /**
   * Retrieves a list of batches containing results for the given keys
   * @param keys - a list of keys you wish to retrieve
   * @returns Promise<PromiseResult<BatchGetItemOutput, AWS.AWSError>>
   */
  public batchGet(
    keys: KeyNodeChildren[],
  ): Promise<Array<BatchGetCommandOutput>> {
    const keyList: KeyNodeChildren[] = keys.slice();
    const keyBatches: KeyNodeChildren[] = [];

    while (keyList.length > 0) {
      keyBatches.push(keyList.splice(0, 100));
    }
    const promiseBatch: Array<Promise<BatchGetCommandOutput>> = keyBatches.map(
      (batch: KeyNodeChildren[]) => {
        const query: BatchGetCommandInput = {
          RequestItems: {
            [this.tableName]: {
              Keys: batch,
            },
          },
        };

        return DynamoDBService.client.send(new BatchGetCommand(query));
      },
    );

    return Promise.all(promiseBatch);
  }

  /**
   * Updates or creates the items provided, and returns a list of result batches
   * @param items - items to add or update
   * @returns Promise<PromiseResult<DocumentClient.BatchWriteItemOutput, AWS.AWSError>[]>
   */
  public batchPut(items: any[]): Promise<Array<BatchWriteItemCommandOutput>> {
    const itemList: PutRequest[] = items.slice();
    const itemBatches: Array<PutRequest[]> = [];

    while (itemList.length > 0) {
      itemBatches.push(itemList.splice(0, 25));
    }
    const promiseBatch: Array<Promise<BatchWriteItemCommandOutput>> = itemBatches.map((batch: any[]) => {
      const query: BatchWriteItemCommandInput = {
        RequestItems: {
          [this.tableName]: batch.map((item: any) => ({
            PutRequest: { Item: item },
          })),
        },
      };

      return DynamoDBService.dynamoDbClient.send(new BatchWriteItemCommand(query));
    });

    return Promise.all(promiseBatch);
  }

  /**
   * Deletes the items provided, and returns a list of result batches
   * @param keys - keys for the items to delete
   * @returns Promise<PromiseResult<DocumentClient.BatchWriteItemOutput, AWS.AWSError>[]>
   */
  public batchDelete(
    keys: Array<Record<string, any> | undefined>,
  ): Promise<Array<BatchWriteItemCommandOutput>> {
    const keyList: Array<Record<string, any> | undefined> = keys.slice();
    const keyBatches: Array<Array<Record<string, any> | undefined>> = [];

    while (keyList.length > 0) {
      keyBatches.push(keyList.splice(0, 25));
    }

    const promiseBatch: Array<Promise<BatchWriteItemCommandOutput>> = keyBatches.map((batch: any[]) => {
      const query: BatchWriteItemCommandInput = {
        RequestItems: {
          [this.tableName]: batch.map((item: any) => ({
            DeleteRequest: { Key: item },
          })),
        },
      };

      return DynamoDBService.dynamoDbClient.send(new BatchWriteItemCommand(query));
    });

    return Promise.all(promiseBatch);
  }

  /**
   * Performs a write transaction on the specified table.
   * @param item - the item to be inserted or updated during the transaciton.
   * @param oldItem - the current item that already exists in the database.
   */
  public transactWrite(
    item: any,
    transactExpression: {
      ConditionExpression: string;
      ExpressionAttributeValues: any;
    },
  ): Promise<TransactWriteItemsCommandOutput> {
    const query: TransactWriteItemsCommandInput = {
      TransactItems: [
        {
          Put: {
            TableName: this.tableName,
            Item: item,
            ConditionExpression: transactExpression.ConditionExpression,
            ExpressionAttributeValues: transactExpression.ExpressionAttributeValues,
          },
        },
      ],
    };
    return DynamoDBService.dynamoDbClient.send(new TransactWriteItemsCommand(query));
  }
}
