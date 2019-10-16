import AWS from "aws-sdk";
import {DynamoDBService} from "../../src/services/DynamoDBService";

describe("DynamoDBService", () =>  {
  afterAll(() => {
    jest.restoreAllMocks();
    jest.resetModules();
  });
  context("scan", () => {
    it("returns data on Successful Scan", async () => {
      AWS.DynamoDB.DocumentClient.prototype.scan = jest.fn().mockImplementation(() => {
        return {
          promise: () => Promise.resolve("Success")
        };
      });

      const output = await new DynamoDBService().scan();
      expect(output).toEqual("Success");
    });

    it("returns error on failed query", async () => {
      const myError = new Error("It broke");
      AWS.DynamoDB.DocumentClient.prototype.scan = jest.fn().mockImplementation(() => {
        return {
          promise: () => Promise.reject(myError)
        };
      });
      expect.assertions(1);
      try {
        await new DynamoDBService().scan();
      } catch (e) {
        expect(e.message).toEqual("It broke");
      }
    });
  }) ;

  context("get", () => {
    it("returns data on Successful Query", async () => {
      AWS.DynamoDB.DocumentClient.prototype.get = jest.fn().mockImplementation(() => {
        return {
          promise: () => Promise.resolve("Success")
        };
      });

      const output = await new DynamoDBService().get({key: "abc123"});
      expect(output).toEqual("Success");
    });

    it("Constructs correct query (key only)", async () => {
      let params = {};
      AWS.DynamoDB.DocumentClient.prototype.get = jest.fn().mockImplementation((args: any) => {
        params = args;
        return {
          promise: () => Promise.resolve("Good")
        };
      });
      const expectedParams = {
        TableName: "cvs-local-test-number",
        Key: {
          key: "abc123"
        },
      };
      expect.assertions(1);
      await new DynamoDBService().get({key: "abc123"});
      expect(params).toEqual(expectedParams);
    });

    it("Constructs correct query (key and attributes)", async () => {
      let params = {};
      AWS.DynamoDB.DocumentClient.prototype.get = jest.fn().mockImplementation((args: any) => {
        params = args;
        return {
          promise: () => Promise.resolve("Good")
        };
      });
      const expectedParams = {
        TableName: "cvs-local-test-number",
        Key: {
          key: "abc123"
        },
        AttributesToGet: ["someAttribute"]
      };
      expect.assertions(1);
      await new DynamoDBService().get({key: "abc123"}, ["someAttribute"]);
      expect(params).toEqual(expectedParams);
    });

    it("returns error on failed query", async () => {
      const myError = new Error("It broke");
      AWS.DynamoDB.DocumentClient.prototype.get = jest.fn().mockImplementation((args: any) => {
        return {
          promise: () => Promise.reject(myError)
        };
      });
      expect.assertions(1);
      try {
        await new DynamoDBService().get({key: "abc123"});
      } catch (e) {
        expect(e.message).toEqual("It broke");
      }
    });
  }) ;

  context("put", () => {
    context("on successful query", () => {
      it("returns response", async () => {
        let params = {};
        AWS.DynamoDB.DocumentClient.prototype.put = jest.fn().mockImplementation((args: any) => {
          params = args;
          return {
            promise: () => Promise.resolve("Success")
          };
        });
        const expectedParams = {
          TableName: "cvs-local-test-number",
          Item: {testNumber: "abc123"},
          ReturnValues: "ALL_OLD",
          ConditionExpression: "testNumber <> :testNumberVal",
          ExpressionAttributeValues: {
            ":testNumberVal": "abc123"
          }
        };

        await new DynamoDBService().put({testNumber: "abc123"});
        expect(expectedParams).toEqual(params);
      });
    });
  });
});
