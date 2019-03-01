import {describe, Done} from "mocha";
import {expect} from "chai";
import {Injector} from "../../src/models/injector/Injector";
import {TestNumberService} from "../../src/services/TestNumberService";
import {TestNumber} from "../../src/models/TestNumber";
import {Configuration} from "../../src/utils/Configuration";
import supertest from "supertest";
import {DocumentClient} from "aws-sdk/lib/dynamodb/document_client";

const config: any = Configuration.getInstance().getConfig();
const request = supertest(`http://localhost:${config.serverless.port}`);
const testNumberService: TestNumberService = Injector.resolve<TestNumberService>(TestNumberService);

const postedActivity: DocumentClient.Key = {};

describe("POST /test-number", () => {

    context("when a new test-number is requested the very first time(no data in db)", () => {
            it("should respond with HTTP 200 and testNumber W01A001", () => {
                const expectedFirstTestNumber: TestNumber = {
                    testNumber: "W01A00108",
                    id: "W01",
                    certLetter: "A",
                    sequenceNumber: "001"
                };
                return request.post("/test-number")
                .send()
                .expect("access-control-allow-origin", "*")
                .expect("access-control-allow-credentials", "true")
                .expect(200)
                .then((response) => {
                    expect(response.body).to.eql(expectedFirstTestNumber);
                });
            });
    });

    context("when a new test-number is requested when other test-numbers already exists in db", () => {
        it("should respond with HTTP 200 and a next valid test number", () => {
            const expectedFirstTestNumber: TestNumber = {
                testNumber: "W01A00209",
                id: "W01",
                certLetter: "A",
                sequenceNumber: "002"
            };
            return request.post("/test-number")
                .send()
                .expect("access-control-allow-origin", "*")
                .expect("access-control-allow-credentials", "true")
                .expect(200)
                .then((response) => {
                    expect(response.body).to.eql(expectedFirstTestNumber);
                });
        });
    });

});

after((done: Done) => {
        testNumberService.dbClient.batchDelete([{testNumber: "W01A001"}, {testNumber: "W01A002"}])
            .then(() => done());
    });

