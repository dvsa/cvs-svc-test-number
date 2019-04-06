import {describe, Done} from "mocha";
import {expect} from "chai";
import {Injector} from "../../src/models/injector/Injector";
import {TestNumberService} from "../../src/services/TestNumberService";
import {TestNumber} from "../../src/models/TestNumber";
import {generateTestNumber} from "../../src/functions/generateTestNumber";
import lambdaTester from "lambda-tester";

const testNumberService: TestNumberService = Injector.resolve<TestNumberService>(TestNumberService);

describe("POST /test-number", () => {
    const lambda = lambdaTester(generateTestNumber);
    context("when a new test-number is requested the very first time(no data in db)", () => {
        it("should respond with HTTP 200 and testNumber W01A001", () => {
            const expectedFirstTestNumber: TestNumber = {
                testNumber: "W01A00128",
                id: "W01",
                certLetter: "A",
                sequenceNumber: "001"
            };
            return lambda
            .expectResolve((response: any) => {
                expect("access-control-allow-origin", "*");
                expect("access-control-allow-credentials", "true");
                expect(200);
                expect(JSON.parse(response.body)).to.eql(expectedFirstTestNumber);
            });
        });
    });

    context("when a new test-number is requested when other test-numbers already exists in db", () => {
        it("should respond with HTTP 200 and a next valid test number", () => {
            const expectedFirstTestNumber: TestNumber = {
                testNumber: "W01A00229",
                id: "W01",
                certLetter: "A",
                sequenceNumber: "002"
            };
            return lambda
            .expectResolve((response: any) => {
                expect("access-control-allow-origin", "*");
                expect("access-control-allow-credentials", "true");
                expect(200);
                expect(JSON.parse(response.body)).to.eql(expectedFirstTestNumber);
            });
        });
    });

});

after((done: Done) => {
        testNumberService.dbClient.batchDelete([{testNumber: "W01A001"}, {testNumber: "W01A002"}])
            .then(() => done());
    });

