import { generateSystemNumber } from "../../src/functions/generateSystemNumber";
import { NumberService } from "../../src/services/NumberService";
import mockContext from "aws-lambda-mock-context";
import {HTTPResponse} from "../../src/utils/HTTPResponse";

describe("generate SystemNumber Function", () => {
    it("should invoke NumberService", async () => {
        let ctx: any = mockContext();

        const mock = jest.fn().mockResolvedValue("Something");
        NumberService.prototype.createSystemNumber = mock;

        await generateSystemNumber({}, ctx, () => { return; });
        expect(mock.mock.calls).toHaveLength(1);
        ctx.succeed("done");
        ctx = null;
    });

    it("should return a 200 response on success", async () => {
        let ctx: any = mockContext();

        NumberService.prototype.createSystemNumber = jest.fn().mockResolvedValue("Something");

        const output = await generateSystemNumber({}, ctx, () => { return; });
        expect(output).toBeInstanceOf(HTTPResponse);
        expect(output.statusCode).toEqual(200);
        expect(output.body).toEqual(JSON.stringify("Something"));
        ctx.succeed("done");
        ctx = null;
    });

    it("should RETURN error on failure", async () => {
        let ctx: any = mockContext();

        const myError = new Error("Oh no!");
        NumberService.prototype.createSystemNumber = jest.fn().mockImplementation(() => Promise.reject(myError));

        expect.assertions(2);
        const output = await generateSystemNumber({}, ctx, () => { return; });
        expect(output).toBeInstanceOf(Error);
        expect(output.message).toEqual("Oh no!");
        ctx.succeed("done");
        ctx = null;
    });
});
