import {TestNumberService} from "../../src/services/TestNumberService";
import {TestNumber} from "../../src/models/TestNumber";
import {generateTestNumber} from "../../src/functions/generateTestNumber";
import lambdaTester from "lambda-tester";
import {DynamoDBService} from "../../src/services/DynamoDBService";

describe("POST /test-number", () => {
    const testNumberService: TestNumberService = new TestNumberService(new DynamoDBService());
    const lambda = lambdaTester(generateTestNumber);
    const expectedFirstTestNumber: TestNumber = {
        testNumber: "W01A00128",
        id: "W01",
        certLetter: "A",
        sequenceNumber: "001",
        testNumberKey: 1
    };

    beforeAll(async () => {
        // Reset the Database
         await testNumberService.dbClient.batchDelete([{testNumberKey: 1}]);
         await testNumberService.dbClient.put(expectedFirstTestNumber);
    });

    context("when a new test-number is requested when only the seed data is present", () => {
        it("should respond with HTTP 200 and a next valid test number", () => {
            const nextTestNumber: TestNumber = {
                testNumber: "W01A00229",
                id: "W01",
                certLetter: "A",
                sequenceNumber: "002",
                testNumberKey: 1
            };
            return lambda
            .expectResolve((response: any) => {
                expect(response.headers["Access-Control-Allow-Origin"]).toEqual("*");
                expect(response.headers["Access-Control-Allow-Credentials"]).toEqual(true);
                expect(response.statusCode).toEqual(200);
                expect(nextTestNumber).toEqual(JSON.parse(response.body));
            });
        });
    });

    afterAll((done) => {
        testNumberService.dbClient.delete([{testNumberKey: 1}])
          .then(() => done());
    });
});



