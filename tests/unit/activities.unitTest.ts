import {describe} from "mocha";
import {expect} from "chai";
import {Injector} from "../../src/models/injector/Injector";
import {TestNumberService} from "../../src/services/TestNumberService";
import {DynamoDBMockService} from "../models/DynamoDBMockService";
import {TestNumber} from "../../src/models/TestNumber";

describe("TestNumberService", () => {
    const testNumberService: TestNumberService = Injector.resolve<TestNumberService>(TestNumberService, [DynamoDBMockService]);
    describe("createNextTestNumberObject", () => {
        context("corner cases", () => {
            it("should return proper nextTestNumber", () => {

        let lastTestNumber: TestNumber = {
            testNumber: "W01A00108",
            id: "W01",
            certLetter: "A",
            sequenceNumber: "001"
        };
        let expectedNextTestNumber: TestNumber = {
            testNumber: "W01A00209",
            id: "W01",
            certLetter: "A",
            sequenceNumber: "002"
        };
        expect(testNumberService.createNextTestNumberObject(lastTestNumber)).to.eql(expectedNextTestNumber);

        lastTestNumber = {
            testNumber: "W01A99934",
            id: "W01",
            certLetter: "A",
            sequenceNumber: "999"
        };
        expectedNextTestNumber = {
            testNumber: "W01B00109",
            id: "W01",
            certLetter: "B",
            sequenceNumber: "001"
        };
        expect(testNumberService.createNextTestNumberObject(lastTestNumber)).to.eql(expectedNextTestNumber);

        lastTestNumber = {
            testNumber: "W01Z99941",
            id: "W01",
            certLetter: "Z",
            sequenceNumber: "999"
        };
        expectedNextTestNumber = {
            testNumber: "W02A00109",
            id: "W02",
            certLetter: "A",
            sequenceNumber: "001"
        };
        expect(testNumberService.createNextTestNumberObject(lastTestNumber)).to.eql(expectedNextTestNumber);

        lastTestNumber = {
            testNumber: "W99Z99958",
            id: "W99",
            certLetter: "Z",
            sequenceNumber: "999"
        };
        expectedNextTestNumber = {
            testNumber: "X01A00109",
            id: "X01",
            certLetter: "A",
            sequenceNumber: "001"
        };
        expect(testNumberService.createNextTestNumberObject(lastTestNumber)).to.eql(expectedNextTestNumber);
            });
        });

    });
});
