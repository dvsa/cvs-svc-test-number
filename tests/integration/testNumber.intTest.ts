import {Injector} from "../../src/models/injector/Injector";
import {TestNumberService} from "../../src/services/TestNumberService";
import {TestNumber} from "../../src/models/TestNumber";
import {generateTestNumber} from "../../src/functions/generateTestNumber";
import lambdaTester from "lambda-tester";

describe("POST /test-number", () => {
    const testNumberService: TestNumberService = Injector.resolve<TestNumberService>(TestNumberService);
    const lambda = lambdaTester(generateTestNumber);
    beforeAll(async () => {
        // Reset the Database
        const latestNumber: TestNumber = await testNumberService.getLastTestNumber();
        await testNumberService.dbClient.batchDelete([{testNumber: latestNumber.testNumber}]);
    });

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
                expect(response.headers["Access-Control-Allow-Origin"]).toEqual("*");
                expect(response.headers["Access-Control-Allow-Credentials"]).toEqual(true);
                expect(response.statusCode).toEqual(200);
                expect(expectedFirstTestNumber).toEqual(JSON.parse(response.body));
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
                expect(response.headers["Access-Control-Allow-Origin"]).toEqual("*");
                expect(response.headers["Access-Control-Allow-Credentials"]).toEqual(true);
                expect(response.statusCode).toEqual(200);
                expect(expectedFirstTestNumber).toEqual(JSON.parse(response.body));
            });
        });
    });

    afterAll((done) => {
        testNumberService.dbClient.batchDelete([{testNumber: "W01A001"}, {testNumber: "W01A002"}])
          .then(() => done());
    });
});



