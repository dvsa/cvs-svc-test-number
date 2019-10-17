import { generateTestNumber } from "../../src/functions/generateTestNumber";
import { TestNumberService } from "../../src/services/TestNumberService";
import mockContext from "aws-lambda-mock-context";
import {HTTPResponse} from "../../src/utils/HTTPResponse";

describe("generate Test Number Function", () => {
  const ctx = mockContext();
  it("should invoke testNumberService", async () => {
    const mock = jest.fn().mockResolvedValue("Something");
    TestNumberService.prototype.createTestNumber = mock;

    await generateTestNumber({}, ctx, () => { return; });
    expect(mock.mock.calls).toHaveLength(1);
  });

  it("should return a 200 response on success", async () => {
    TestNumberService.prototype.createTestNumber = jest.fn().mockResolvedValue("Something");

    const output = await generateTestNumber({}, ctx, () => { return; });
    expect(output).toBeInstanceOf(HTTPResponse);
    expect(output.statusCode).toEqual(200);
    expect(output.body).toEqual(JSON.stringify("Something"));
  });

  it("should RETURN error on failure", async () => {
    const myError = new Error("Oh no!");
    TestNumberService.prototype.createTestNumber = jest.fn().mockImplementation(() => Promise.reject(myError));

    expect.assertions(2);
    const output = await generateTestNumber({}, ctx, () => { return; });
    expect(output).toBeInstanceOf(Error);
    expect(output.message).toEqual("Oh no!");
  });
});
