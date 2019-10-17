import AWS from "aws-sdk";
import {DynamoDBService} from "../../src/services/DynamoDBService";

describe("DynamoDBService", () =>  {
  let branch: string | undefined = "";
  beforeAll(() => {
    branch = process.env.BRANCH;
    process.env.BRANCH = "local";
  });
  afterAll(() => {
    process.env.BRANCH = branch;
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
      it("returns expected data", async () => {
        AWS.DynamoDB.DocumentClient.prototype.put = jest.fn().mockImplementation(() => {
          return {
            promise: () => Promise.resolve("Success")
          };
        });

        const output = await new DynamoDBService().put({testNumber: "abc123"});
        expect(output).toEqual("Success");
      });

      it("constructs correct query", async () => {
        let params = {};
        AWS.DynamoDB.DocumentClient.prototype.put = jest.fn().mockImplementation((args: any) => {
          params = args;
          return {
            promise: () => Promise.resolve("Good")
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
        expect.assertions(1);
        await new DynamoDBService().put({testNumber: "abc123"});
        expect(params).toEqual(expectedParams);
      });
    });
    context("on failing request", () => {
      it("returns error on failed query", async () => {
        const myError = new Error("It broke");
        AWS.DynamoDB.DocumentClient.prototype.put = jest.fn().mockImplementation((args: any) => {
          return {
            promise: () => Promise.reject(myError)
          };
        });
        expect.assertions(1);
        try {
          await new DynamoDBService().put({key: "abc123"});
        } catch (e) {
          expect(e.message).toEqual("It broke");
        }
      });
    });
  });

  context("delete", () => {
    context("on successful query", () => {
      it("returns expected data", async () => {
        AWS.DynamoDB.DocumentClient.prototype.delete = jest.fn().mockImplementation(() => {
          return {
            promise: () => Promise.resolve("Success")
          };
        });

        const output = await new DynamoDBService().delete({key: "abc123"});
        expect(output).toEqual("Success");
      });

      it("constructs correct query", async () => {
        let params = {};
        AWS.DynamoDB.DocumentClient.prototype.delete = jest.fn().mockImplementation((args: any) => {
          params = args;
          return {
            promise: () => Promise.resolve("Good")
          };
        });
        const expectedParams = {
          TableName: "cvs-local-test-number",
          Key: {testNumber: "abc123"},
          ReturnValues: "ALL_OLD",
        };
        expect.assertions(1);
        await new DynamoDBService().delete({testNumber: "abc123"});
        expect(params).toEqual(expectedParams);
      });
    });
    context("on failing request", () => {
      it("returns error on failed query", async () => {
        const myError = new Error("It broke");
        AWS.DynamoDB.DocumentClient.prototype.delete = jest.fn().mockImplementation((args: any) => {
          return {
            promise: () => Promise.reject(myError)
          };
        });
        expect.assertions(1);
        try {
          await new DynamoDBService().delete({key: "abc123"});
        } catch (e) {
          expect(e.message).toEqual("It broke");
        }
      });
    });
  });

  context("batchGet", () => {
    it("returns data on Successful Query", async () => {
      const getMock = jest.fn().mockImplementation(() => {
        return {
          promise: () => Promise.resolve("Success")
        };
      });
      AWS.DynamoDB.DocumentClient.prototype.batchGet = getMock;

      const output = await new DynamoDBService().batchGet([{key: "abc123"}]);
      expect(output).toEqual(["Success"]);
      expect(getMock.mock.calls).toHaveLength(1);
    });

    it("Constructs correct query (1 key only)", async () => {
      let params = {};
      AWS.DynamoDB.DocumentClient.prototype.batchGet = jest.fn().mockImplementation((args: any) => {
        params = args;
        return {
          promise: () => Promise.resolve("Good")
        };
      });
      const expectedParams = {
        RequestItems: {
          "cvs-local-test-number": {
            Keys: [{
              key: "abc123"
            }]
          }
        }
      };
      expect.assertions(1);
      await new DynamoDBService().batchGet([{key: "abc123"}]);
      expect(params).toEqual(expectedParams);
    });

    it("Constructs correct query (multiple keys, <100)", async () => {
      let params = {};
      const batchGetMock = jest.fn().mockImplementation((args: any) => {
        params = args;
        return {
          promise: () => Promise.resolve("Good")
        };
      });
      AWS.DynamoDB.DocumentClient.prototype.batchGet = batchGetMock;
      const expectedParams = {
        RequestItems: {
          "cvs-local-test-number": {
            Keys: [{key: "abc123"}, {key: "abc234"}, {key: "abc345"}]
          }
        }
      };
      expect.assertions(2);
      await new DynamoDBService().batchGet([{key: "abc123"}, {key: "abc234"}, {key: "abc345"}]);
      expect(params).toEqual(expectedParams);
      // Calls DB only once
      expect(batchGetMock.mock.calls).toHaveLength(1);
    });
    it("Batches large requests to keep within AWS  limits (<= 25 requests at a time)", async () => {
      const batchGetMock = jest.fn().mockImplementation((args: any) => {
        return {
          promise: () => Promise.resolve("Good")
        };
      });
      AWS.DynamoDB.DocumentClient.prototype.batchGet = batchGetMock;
      const params: any = [];
      // 110 queries should get put into 2 batches, of 100 and 10
      for (let i =  0; i < 110; i++) {
        params.push({key: "abc123"});
      }
      expect.assertions(2);
      const result = await new DynamoDBService().batchGet(params);
      expect(result).toEqual(["Good", "Good"]);
      // Calls DB only once
      expect(batchGetMock.mock.calls).toHaveLength(2);
    });

    it("returns error on failed query", async () => {
      const myError = new Error("It broke");
      AWS.DynamoDB.DocumentClient.prototype.batchGet = jest.fn().mockImplementation((args: any) => {
        return {
          promise: () => Promise.reject(myError)
        };
      });
      expect.assertions(1);
      try {
        await new DynamoDBService().batchGet([{key: "abc123"}]);
      } catch (e) {
        expect(e.message).toEqual("It broke");
      }
    });
  }) ;

  context("batchWrite", () => {
    it("returns data on Successful Query", async () => {
      const getMock = jest.fn().mockImplementation(() => {
        return {
          promise: () => Promise.resolve("Success")
        };
      });
      AWS.DynamoDB.DocumentClient.prototype.batchWrite = getMock;

      const output = await new DynamoDBService().batchPut([{testNumber: "abc123"}]);
      expect(output).toEqual(["Success"]);
      expect(getMock.mock.calls).toHaveLength(1);
    });

    it("Constructs correct query (1 key only)", async () => {
      let params = {};
      AWS.DynamoDB.DocumentClient.prototype.batchWrite = jest.fn().mockImplementation((args: any) => {
        params = args;
        return {
          promise: () => Promise.resolve("Good")
        };
      });
      const expectedParams = {
        RequestItems: {
          "cvs-local-test-number": [
            {
              PutRequest: {
                Item: {
                  testNumber: "abc123"
                }
              }
            }
          ]
        }
      };
      expect.assertions(1);
      await new DynamoDBService().batchPut([{testNumber: "abc123"}]);
      expect(params).toEqual(expectedParams);
    });

    it("Constructs correct query (multiple keys, <25)", async () => {
      let params = {};
      const batchGetMock = jest.fn().mockImplementation((args: any) => {
        params = args;
        return {
          promise: () => Promise.resolve("Good")
        };
      });
      AWS.DynamoDB.DocumentClient.prototype.batchWrite = batchGetMock;
      const expectedParams = {
        RequestItems: {
          "cvs-local-test-number": [
            {
              PutRequest: {
                Item: {
                  testNumber: "abc123"
                }
              }
            },
            {
              PutRequest: {
                Item: {
                  testNumber: "abc234"
                }
              }
            }
          ]
        }
      };
      expect.assertions(2);
      await new DynamoDBService().batchPut([{testNumber: "abc123"}, {testNumber: "abc234"}]);
      expect(params).toEqual(expectedParams);
      // Calls DB only once
      expect(batchGetMock.mock.calls).toHaveLength(1);
    });
    it("Batches large requests to keep within AWS  limits (<= 25 requests at a time)", async () => {
      const batchGetMock = jest.fn().mockImplementation((args: any) => {
        return {
          promise: () => Promise.resolve("Good")
        };
      });
      AWS.DynamoDB.DocumentClient.prototype.batchWrite = batchGetMock;
      const params: any = [];
      // 110 queries should get put into 2 batches, of 100 and 10
      for (let i =  0; i < 55; i++) {
        params.push({testNumber: "abc123"});
      }
      expect.assertions(2);
      const result = await new DynamoDBService().batchPut(params);
      expect(result).toEqual(["Good", "Good", "Good"]);
      // Calls DB only once
      expect(batchGetMock.mock.calls).toHaveLength(3);
    });

    it("returns error on failed query", async () => {
      const myError = new Error("It broke");
      AWS.DynamoDB.DocumentClient.prototype.batchWrite = jest.fn().mockImplementation((args: any) => {
        return {
          promise: () => Promise.reject(myError)
        };
      });
      expect.assertions(1);
      try {
        await new DynamoDBService().batchPut([{testNumber: "abc123"}]);
      } catch (e) {
        expect(e.message).toEqual("It broke");
      }
    });
  }) ;

  context("batchDelete", () => {
    it("returns data on Successful Query", async () => {
      const getMock = jest.fn().mockImplementation(() => {
        return {
          promise: () => Promise.resolve("Success")
        };
      });
      AWS.DynamoDB.DocumentClient.prototype.batchWrite = getMock;

      const output = await new DynamoDBService().batchDelete([{testNumber: "abc123"}]);
      expect(output).toEqual(["Success"]);
      expect(getMock.mock.calls).toHaveLength(1);
    });

    it("Constructs correct query (1 key only)", async () => {
      let params = {};
      AWS.DynamoDB.DocumentClient.prototype.batchWrite = jest.fn().mockImplementation((args: any) => {
        params = args;
        return {
          promise: () => Promise.resolve("Good")
        };
      });
      const expectedParams = {
        RequestItems: {
          "cvs-local-test-number": [
            {
              DeleteRequest: {
                Key: {
                  testNumber: "abc123"
                }
              }
            }
          ]
        }
      };
      expect.assertions(1);
      await new DynamoDBService().batchDelete([{testNumber: "abc123"}]);
      expect(params).toEqual(expectedParams);
    });

    it("Constructs correct query (multiple keys, <25)", async () => {
      let params = {};
      const batchGetMock = jest.fn().mockImplementation((args: any) => {
        params = args;
        return {
          promise: () => Promise.resolve("Good")
        };
      });
      AWS.DynamoDB.DocumentClient.prototype.batchWrite = batchGetMock;
      const expectedParams = {
        RequestItems: {
          "cvs-local-test-number": [
            {
              DeleteRequest: {
                Key: {
                  testNumber: "abc123"
                }
              }
            },
            {
              DeleteRequest: {
                Key: {
                  testNumber: "abc234"
                }
              }
            }
          ]
        }
      };
      expect.assertions(2);
      await new DynamoDBService().batchDelete([{testNumber: "abc123"}, {testNumber: "abc234"}]);
      expect(params).toEqual(expectedParams);
      // Calls DB only once
      expect(batchGetMock.mock.calls).toHaveLength(1);
    });
    it("Batches large requests to keep within AWS  limits (<= 25 requests at a time)", async () => {
      const batchGetMock = jest.fn().mockImplementation((args: any) => {
        return {
          promise: () => Promise.resolve("Good")
        };
      });
      AWS.DynamoDB.DocumentClient.prototype.batchWrite = batchGetMock;
      const params: any = [];
      // 110 queries should get put into 2 batches, of 100 and 10
      for (let i =  0; i < 55; i++) {
        params.push({testNumber: "abc123"});
      }
      expect.assertions(2);
      const result = await new DynamoDBService().batchDelete(params);
      expect(result).toEqual(["Good", "Good", "Good"]);
      // Calls DB only once
      expect(batchGetMock.mock.calls).toHaveLength(3);
    });

    it("returns error on failed query", async () => {
      const myError = new Error("It broke");
      AWS.DynamoDB.DocumentClient.prototype.batchWrite = jest.fn().mockImplementation((args: any) => {
        return {
          promise: () => Promise.reject(myError)
        };
      });
      expect.assertions(1);
      try {
        await new DynamoDBService().batchDelete([{testNumber: "abc123"}]);
      } catch (e) {
        expect(e.message).toEqual("It broke");
      }
    });
  }) ;

});
