import { expect } from "chai";
import { default as sinonUnwrapped } from "sinon";
import { default as proxyquire } from "proxyquire";
const sinon = sinonUnwrapped.createSandbox();
const stub = sinon.stub();
const handler = proxyquire("../../src/handler", { "lambda-warmer": stub });

describe("test-results handler", () => {
    context("receives a warming event", () => {
        it("returns 'warmed'", async () => {
            // Next step checks for body, and returns 400 if not present.
            stub.returns(true);
            const event = { warmer: true };
            const res = await handler.handler(event);
            expect(res.body).to.equal(JSON.stringify("warmed"));
        });
    });

    context("receives a non-warming event", () => {
        it("carries on past the warmer check", async () => {
            // Next step checks for body, and returns 400 if not present.
            stub.returns(false);
            const event = {body: "fail"};
            const res = await handler.handler(event);
            expect(res.statusCode).to.equal(400);
        });
    });
});
