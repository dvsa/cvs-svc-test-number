/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable jest/no-identical-title */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable jest/no-conditional-expect */
// eslint-disable-next-line import/no-extraneous-dependencies
import { mockClient } from 'aws-sdk-client-mock';

import {
  BatchGetCommand,
  BatchGetCommandOutput,
  BatchWriteCommand,
  DeleteCommand,
  DynamoDBDocumentClient, GetCommand, PutCommand, ScanCommand,
} from '@aws-sdk/lib-dynamodb';
import { BatchWriteItemCommand, DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBService } from '../../src/services/DynamoDBService';

describe('DynamoDBService', () => {
  let branch: string | undefined = '';
  const dynamodbMock = mockClient(DynamoDBClient);
  const dynamoDBDocumentMock = mockClient(DynamoDBDocumentClient);

  beforeEach(() => {
    dynamodbMock.reset();
    dynamoDBDocumentMock.reset();
  });
  beforeAll(() => {
    branch = process.env.BRANCH;
    process.env.BRANCH = 'local';
  });
  afterAll(() => {
    process.env.BRANCH = branch;
    jest.restoreAllMocks();
    jest.resetModules();
  });
  describe('scan', () => {
    it('returns data on Successful Scan', async () => {
      dynamoDBDocumentMock.on(ScanCommand).resolves({
        Items: [
          { name: { S: 'Success' } },
        ],
      });
      const output = await new DynamoDBService().scan();
      expect(output.Items[0].name.S).toBe('Success');
    });

    it('returns error on failed query', async () => {
      dynamoDBDocumentMock.on(ScanCommand).rejects('It broke');

      expect.assertions(1);
      try {
        await new DynamoDBService().scan();
      } catch (e) {
        expect(e.message).toBe('It broke');
      }
    });
  });

  describe('get', () => {
    it('returns data on Successful Query', async () => {
      dynamoDBDocumentMock.on(GetCommand).resolves({
        Item:
          { name: { S: 'Success' } },
      });
      const output = await new DynamoDBService().get({ key: 'abc123' });

      expect(output.Item.name.S).toBe('Success');
    });

    it('Constructs correct query (key only)', async () => {
      let params = {};

      DynamoDBDocumentClient.prototype.send = jest.fn().mockImplementation((args: any) => {
        params = args;
        return {
          promise: () => Promise.resolve('Good'),
        };
      });
      const expectedParams = {
        TableName: 'cvs-local-test-number',
        Key: {
          key: 'abc123',
        },
      };

      expect.assertions(1);
      await new DynamoDBService().get({ key: 'abc123' });
      expect((params as GetCommand).input).toEqual(expectedParams);
    });

    it('Constructs correct query (key and attributes)', async () => {
      let params = {};
      DynamoDBDocumentClient.prototype.send = jest.fn().mockImplementation((args: any) => {
        params = args;
        return {
          promise: () => Promise.resolve('Good'),
        };
      });
      const expectedParams = {
        TableName: 'cvs-local-test-number',
        Key: {
          key: 'abc123',
        },
        AttributesToGet: ['someAttribute'],
      };
      expect.assertions(1);
      await new DynamoDBService().get({ key: 'abc123' }, ['someAttribute']);
      expect((params as GetCommand).input).toEqual(expectedParams);
    });

    it('returns error on failed query', async () => {
      dynamoDBDocumentMock.on(GetCommand).rejects('It broke');
      expect.assertions(1);
      try {
        await new DynamoDBService().get({ key: 'abc123' });
      } catch (e) {
        expect(e.message).toBe('It broke');
      }
    });
  });

  describe('put', () => {
    describe('on successful query', () => {
      it('returns expected data', async () => {
        dynamoDBDocumentMock.on(PutCommand).resolves({
          Attributes: {
            S: 'Success',
          },
        });

        const output = await new DynamoDBService().put({
          testNumber: 'abc123',
        });
        expect(output.Attributes.S).toBe('Success');
      });

      it('constructs correct query', async () => {
        let params = {};
        DynamoDBDocumentClient.prototype.send = jest.fn().mockImplementation((args: any) => {
          params = args;
          return {
            promise: () => Promise.resolve('Good'),
          };
        });
        const expectedParams = {
          TableName: 'cvs-local-test-number',
          Item: { testNumber: 'abc123' },
          ReturnValues: 'ALL_OLD',
          ConditionExpression: 'testNumber <> :testNumberVal',
          ExpressionAttributeValues: {
            ':testNumberVal': 'abc123',
          },
        };
        expect.assertions(1);
        await new DynamoDBService().put({ testNumber: 'abc123' });
        expect((params as PutCommand).input).toEqual(expectedParams);
      });
    });
    describe('on failing request', () => {
      it('returns error on failed query', async () => {
        dynamoDBDocumentMock.on(PutCommand).rejects('It broke');
        expect.assertions(1);
        try {
          await new DynamoDBService().put({ key: 'abc123' });
        } catch (e) {
          expect(e.message).toBe('It broke');
        }
      });
    });
  });

  describe('delete', () => {
    describe('on successful query', () => {
      it('returns expected data', async () => {
        dynamoDBDocumentMock.on(DeleteCommand).resolves({
          Attributes: {
            S: 'Success',
          },
        });
        const output = await new DynamoDBService().delete({ key: 'abc123' });
        expect(output.Attributes.S).toBe('Success');
      });

      it('constructs correct query', async () => {
        let params = {};
        DynamoDBDocumentClient.prototype.send = jest.fn().mockImplementation((args: any) => {
          params = args;
          return {
            promise: () => Promise.resolve('Good'),
          };
        });
        const expectedParams = {
          TableName: 'cvs-local-test-number',
          Key: { testNumber: 'abc123' },
          ReturnValues: 'ALL_OLD',
        };
        expect.assertions(1);
        await new DynamoDBService().delete({ testNumber: 'abc123' });
        expect((params as DeleteCommand).input).toEqual(expectedParams);
      });
    });
    describe('on failing request', () => {
      it('returns error on failed query', async () => {
        dynamoDBDocumentMock.on(DeleteCommand).rejects('It broke');
        expect.assertions(1);
        try {
          await new DynamoDBService().delete({ key: 'abc123' });
        } catch (e) {
          expect(e.message).toBe('It broke');
        }
      });
    });
  });

  describe('batchGet', () => {
    it('returns data on Successful Query', async () => {
      dynamoDBDocumentMock.on(BatchGetCommand).resolves({
        Responses: {
          TableName: [
            { S: 'Success' },
          ],
        },
      });
      const output: Array<BatchGetCommandOutput> = await new DynamoDBService().batchGet([{ key: 'abc123' }]);
      expect(output[0].Responses.TableName).toEqual([{ S: 'Success' }]);
      expect(output[0].Responses.TableName).toHaveLength(1);
    });

    it('Constructs correct query (1 key only)', async () => {
      let params = {};
      DynamoDBDocumentClient.prototype.send = jest.fn().mockImplementation((args: any) => {
        params = args;
        return {
          promise: () => Promise.resolve('Good'),
        };
      });
      const expectedParams = {
        RequestItems: {
          'cvs-local-test-number': {
            Keys: [
              {
                key: 'abc123',
              },
            ],
          },
        },
      };
      expect.assertions(1);
      await new DynamoDBService().batchGet([{ key: 'abc123' }]);
      expect((params as BatchGetCommand).input).toEqual(expectedParams);
    });

    it('Constructs correct query (multiple keys, <100)', async () => {
      let params = {};
      const sendMock = jest.fn();
      DynamoDBDocumentClient.prototype.send = sendMock.mockImplementation((args: any) => {
        params = args;
        return {
          promise: () => Promise.resolve('Good'),
        };
      });
      const expectedParams = {
        RequestItems: {
          'cvs-local-test-number': {
            Keys: [{ key: 'abc123' }, { key: 'abc234' }, { key: 'abc345' }],
          },
        },
      };
      expect.assertions(2);
      await new DynamoDBService().batchGet([{ key: 'abc123' }, { key: 'abc234' }, { key: 'abc345' }]);
      expect((params as BatchGetCommand).input).toEqual(expectedParams);
      // Calls DB only once
      expect(sendMock).toHaveBeenCalledTimes(1);
    });
    it('Batches large requests to keep within AWS  limits (<= 25 requests at a time)', async () => {
      dynamoDBDocumentMock.on(BatchGetCommand).resolves({
        Responses: {
          TableName: [
            { S: 'Good' },
          ],
        },
      });
      const params: any = [];
      // 110 queries should get put into 2 batches, of 100 and 10
      for (let i = 0; i < 110; i++) {
        params.push({ key: 'abc123' });
      }
      const result = await new DynamoDBService().batchGet(params);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      const resArr: string[] = result.map((item) => item.Responses.TableName[0].S);

      expect(resArr).toEqual(['Good', 'Good']);
    });

    it('returns error on failed query', async () => {
      dynamoDBDocumentMock.on(BatchGetCommand).rejects('It broke');
      expect.assertions(1);
      try {
        await new DynamoDBService().batchGet([{ key: 'abc123' }]);
      } catch (e) {
        expect(e.message).toBe('It broke');
      }
    });
  });

  describe('batchWrite', () => {
    it('returns data on Successful Query', async () => {
      const getMock = jest.fn().mockResolvedValue({ res: 'Success' });
      DynamoDBClient.prototype.send = getMock;
      const response = await new DynamoDBService().batchPut([{ testNumber: 'abc123' }]);
      expect(response).toEqual([{ res: 'Success' }]);
      expect(getMock).toHaveBeenCalled();
    });

    it('Constructs correct query (1 key only)', async () => {
      let params = {};
      DynamoDBClient.prototype.send = jest.fn().mockImplementation((args: any) => {
        params = args;
        return {
          promise: () => Promise.resolve('Good'),
        };
      });
      const expectedParams = {
        RequestItems: {
          'cvs-local-test-number': [
            {
              PutRequest: {
                Item: {
                  testNumber: 'abc123',
                },
              },
            },
          ],
        },
      };
      expect.assertions(1);
      await new DynamoDBService().batchPut([{ testNumber: 'abc123' }]);
      expect((params as BatchWriteItemCommand).input).toEqual(expectedParams);
    });

    it('Constructs correct query (multiple keys, <25)', async () => {
      let params = {};
      const batchGetMock = jest.fn().mockImplementation((args: any) => {
        params = args;
        return {
          promise: () => Promise.resolve('Good'),
        };
      });
      DynamoDBClient.prototype.send = batchGetMock;
      const expectedParams = {
        RequestItems: {
          'cvs-local-test-number': [
            {
              PutRequest: {
                Item: {
                  testNumber: 'abc123',
                },
              },
            },
            {
              PutRequest: {
                Item: {
                  testNumber: 'abc234',
                },
              },
            },
          ],
        },
      };
      expect.assertions(2);
      await new DynamoDBService().batchPut([{ testNumber: 'abc123' }, { testNumber: 'abc234' }]);
      expect((params as BatchWriteItemCommand).input).toEqual(expectedParams);
      // Calls DB only once
      expect(batchGetMock.mock.calls).toHaveLength(1);
    });
    it('Batches large requests to keep within AWS  limits (<= 25 requests at a time)', async () => {
      const batchGetMock = jest.fn().mockResolvedValue({ res: 'Good' });
      DynamoDBClient.prototype.send = batchGetMock;
      const params: any = [];
      // 110 queries should get put into 2 batches, of 100 and 10
      for (let i = 0; i < 55; i++) {
        params.push({ testNumber: 'abc123' });
      }
      expect.assertions(2);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/dot-notation
      const result = (await new DynamoDBService().batchPut(params)).map((obj) => obj['res']);

      expect(result).toEqual(['Good', 'Good', 'Good']);
      // Calls DB only once
      expect(batchGetMock.mock.calls).toHaveLength(3);
    });

    it('returns error on failed query', async () => {
      dynamodbMock.on(BatchWriteCommand).rejects('It broke');
      expect.assertions(1);
      try {
        await new DynamoDBService().batchPut([{ testNumber: 'abc123' }]);
      } catch (e) {
        expect(e.message).toBe('It broke');
      }
    });
  });

  describe('batchDelete', () => {
    it('returns data on Successful Query', async () => {
      const getMock = jest.fn().mockResolvedValue({ response: 'Success' });
      DynamoDBClient.prototype.send = getMock;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/dot-notation
      const output = (await new DynamoDBService().batchDelete([{ testNumber: 'abc123' }])).map((obj) => obj['response']);
      expect(output).toEqual(['Success']);
      expect(getMock.mock.calls).toHaveLength(1);
    });

    it('Constructs correct query (1 key only)', async () => {
      let params = {};
      DynamoDBClient.prototype.send = jest.fn().mockImplementation((args: any) => {
        params = args;
        return {
          promise: () => Promise.resolve('Good'),
        };
      });
      const expectedParams = {
        RequestItems: {
          'cvs-local-test-number': [
            {
              DeleteRequest: {
                Key: {
                  testNumber: 'abc123',
                },
              },
            },
          ],
        },
      };
      expect.assertions(1);
      await new DynamoDBService().batchDelete([{ testNumber: 'abc123' }]);
      expect((params as BatchWriteItemCommand).input).toEqual(expectedParams);
    });

    it('Constructs correct query (multiple keys, <25)', async () => {
      let params = {};
      const batchGetMock = jest.fn().mockImplementation((args: any) => {
        params = args;
        return {
          promise: () => Promise.resolve('Good'),
        };
      });
      DynamoDBClient.prototype.send = batchGetMock;
      const expectedParams = {
        RequestItems: {
          'cvs-local-test-number': [
            {
              DeleteRequest: {
                Key: {
                  testNumber: 'abc123',
                },
              },
            },
            {
              DeleteRequest: {
                Key: {
                  testNumber: 'abc234',
                },
              },
            },
          ],
        },
      };
      expect.assertions(2);
      await new DynamoDBService().batchDelete([{ testNumber: 'abc123' }, { testNumber: 'abc234' }]);
      expect((params as BatchWriteItemCommand).input).toEqual(expectedParams);
      // Calls DB only once
      expect(batchGetMock.mock.calls).toHaveLength(1);
    });
    it('Batches large requests to keep within AWS  limits (<= 25 requests at a time)', async () => {
      const batchGetMock = jest.fn().mockResolvedValue('Good');
      DynamoDBClient.prototype.send = batchGetMock;
      const params: any = [];
      // 110 queries should get put into 2 batches, of 100 and 10
      for (let i = 0; i < 55; i++) {
        params.push({ testNumber: 'abc123' });
      }
      expect.assertions(2);
      const result = await new DynamoDBService().batchDelete(params);
      expect(result).toEqual(['Good', 'Good', 'Good']);
      // Calls DB only once
      expect(batchGetMock.mock.calls).toHaveLength(3);
    });

    it('returns error on failed query', async () => {
      dynamodbMock.on(BatchWriteCommand).rejects('It broke');
      expect.assertions(1);
      try {
        await new DynamoDBService().batchDelete([{ testNumber: 'abc123' }]);
      } catch (e) {
        expect(e.message).toBe('It broke');
      }
    });
  });
});
