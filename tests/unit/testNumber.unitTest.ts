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
            testNumber: "W01A00128",
            id: "W01",
            certLetter: "A",
            sequenceNumber: "001"
        };
        let expectedNextTestNumber: TestNumber = {
            testNumber: "W01A00229",
            id: "W01",
            certLetter: "A",
            sequenceNumber: "002"
        };
        expect(testNumberService.createNextTestNumberObject(lastTestNumber)).to.eql(expectedNextTestNumber);

        lastTestNumber = {
            testNumber: "W01A99982",
            id: "W01",
            certLetter: "A",
            sequenceNumber: "999"
        };
        expectedNextTestNumber = {
            testNumber: "W01B00129",
            id: "W01",
            certLetter: "B",
            sequenceNumber: "001"
        };
        expect(testNumberService.createNextTestNumberObject(lastTestNumber)).to.eql(expectedNextTestNumber);

        lastTestNumber = {
            testNumber: "W01Z99907",
            id: "W01",
            certLetter: "Z",
            sequenceNumber: "999"
        };
        expectedNextTestNumber = {
            testNumber: "W02A00131",
            id: "W02",
            certLetter: "A",
            sequenceNumber: "001"
        };
        expect(testNumberService.createNextTestNumberObject(lastTestNumber)).to.eql(expectedNextTestNumber);

        lastTestNumber = {
            testNumber: "W99Z99941",
            id: "W99",
            certLetter: "Z",
            sequenceNumber: "999"
        };
        expectedNextTestNumber = {
            testNumber: "X01A00129",
            id: "X01",
            certLetter: "A",
            sequenceNumber: "001"
        };
        expect(testNumberService.createNextTestNumberObject(lastTestNumber)).to.eql(expectedNextTestNumber);
            });
        });

    });
});
