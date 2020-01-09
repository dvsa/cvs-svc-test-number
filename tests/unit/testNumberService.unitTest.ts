import {TestNumberService} from "../../src/services/TestNumberService";
import { TestNumber } from "../../src/models/TestNumber";
import {DynamoDBService} from "../../src/services/DynamoDBService";
import {HTTPResponse} from "../../src/utils/HTTPResponse";
jest.mock("../../src/services/DynamoDBService");

describe("TestNumberService", () => {
    const testNumberService = new TestNumberService(new DynamoDBService());
    beforeEach(() => {
        jest.restoreAllMocks();
        jest.resetModules();
    });
    describe("createNextTestNumberObject", () => {
        context("corner cases", () => {
            it("should return proper nextTestNumber", () => {
                let lastTestNumber: TestNumber = {
                    testNumber: "W01A00128",
                    id: "W01",
                    certLetter: "A",
                    sequenceNumber: "001",
                    testNumberKey: 1
                };
                let expectedNextTestNumber: TestNumber = {
                    testNumber: "W01A00229",
                    id: "W01",
                    certLetter: "A",
                    sequenceNumber: "002",
                    testNumberKey: 1
                };
                expect(testNumberService.createNextTestNumberObject(lastTestNumber)).toEqual(expectedNextTestNumber);

                lastTestNumber = {
                    testNumber: "W01A99982",
                    id: "W01",
                    certLetter: "A",
                    sequenceNumber: "999",
                    testNumberKey: 1
                };
                expectedNextTestNumber = {
                    testNumber: "W01B00129",
                    id: "W01",
                    certLetter: "B",
                    sequenceNumber: "001",
                    testNumberKey: 1
                };
                expect(testNumberService.createNextTestNumberObject(lastTestNumber)).toEqual(expectedNextTestNumber);

                lastTestNumber = {
                    testNumber: "W01Z99907",
                    id: "W01",
                    certLetter: "Z",
                    sequenceNumber: "999",
                    testNumberKey: 1
                };
                expectedNextTestNumber = {
                    testNumber: "W02A00131",
                    id: "W02",
                    certLetter: "A",
                    sequenceNumber: "001",
                    testNumberKey: 1
                };
                expect(testNumberService.createNextTestNumberObject(lastTestNumber)).toEqual(expectedNextTestNumber);

                lastTestNumber = {
                    testNumber: "W99Z99941",
                    id: "W99",
                    certLetter: "Z",
                    sequenceNumber: "999",
                    testNumberKey: 1
                };
                expectedNextTestNumber = {
                    testNumber: "X01A00129",
                    id: "X01",
                    certLetter: "A",
                    sequenceNumber: "001",
                    testNumberKey: 1
                };
                expect(testNumberService.createNextTestNumberObject(lastTestNumber)).toEqual(expectedNextTestNumber);
            });

            it("Should have correct CheckSum numbers (10 < checksum < 100)", () => {
                const lastTestNumber: TestNumber = {
                    testNumber: "X99Q91998",
                    id: "X99",
                    certLetter: "Q",
                    sequenceNumber: "919",
                    testNumberKey: 1
                };
                const newTestNumber = testNumberService.createNextTestNumberObject(lastTestNumber);
                // next number should be X99Q920 = [24 + 9 + 27 + 17 + 9 + 6 + 0] = 92;
                expect("92").toEqual(newTestNumber.testNumber.substring(7, 9));
            });

            it("Should have correct CheckSum numbers (checksum > 100)", () => {
                const lastTestNumber = {
                    testNumber: "W99Z99841",
                    id: "W99",
                    certLetter: "Z",
                    sequenceNumber: "998",
                    testNumberKey: 1
                };
                const newTestNumber = testNumberService.createNextTestNumberObject(lastTestNumber);
                // next number should be W99Z999 = [23 + 9 + 27 + 26 + 27 + 9 + 9] = 130 => 30;
                expect("30").toEqual(newTestNumber.testNumber.substring(7, 9));
            });

            it("Should have correct CheckSum numbers (checksum < 10)", () => {
                const lastTestNumber = {
                    testNumber: "A00A00002",
                    id: "A00",
                    certLetter: "A",
                    sequenceNumber: "000",
                    testNumberKey: 1
                };
                const newTestNumber = testNumberService.createNextTestNumberObject(lastTestNumber);
                // next number should be A00A001 = [1 + 0 + 0 + 1 + 0 + 0 + 1] = 3 => 03;
                expect("03").toEqual(newTestNumber.testNumber.substring(7, 9));
            });
        });
    });

    describe("getLastTestNumber",  () => {
        beforeEach(() => {
            jest.resetAllMocks();
        });
        it("returns expected value on successful DBService query", async ()  => {
            const aTestNumber = {
                testNumber: "A00A00002",
                id: "A00",
                certLetter: "A",
                sequenceNumber: "000",
                testNumberKey: 1
            };
            DynamoDBService.prototype.scan = jest.fn().mockResolvedValue({Items: [aTestNumber], Count: 1});
            const service = new TestNumberService(new DynamoDBService());
            const output = await service.getLastTestNumber();
            expect(aTestNumber).toEqual(output);
        });
        it("returns default value on empty DB return", async ()  => {
            const defaultTestNumber = {
                testNumber: "W01A000",
                id: "W01",
                certLetter: "A",
                sequenceNumber: "000",
                testNumberKey: 1
            };
            DynamoDBService.prototype.scan = jest.fn().mockResolvedValue({Items: [], Count: 0});
            const service = new TestNumberService(new DynamoDBService());
            const output = await service.getLastTestNumber();
            expect(defaultTestNumber).toEqual(output);
        });
        it("throws expected errors if DBService request fails", async ()  => {
            const error = new Error("I broke");
            // @ts-ignore
            error.statusCode = 418;

            DynamoDBService.prototype.scan = jest.fn().mockRejectedValue(error);
            const service = new TestNumberService(new DynamoDBService());
            try {
                await service.getLastTestNumber();
            } catch (e) {
                expect(e).toBeInstanceOf(HTTPResponse);
                expect(e.statusCode).toEqual(418);
            }
        });
    });

    describe("createTestNumber", () => {
        context("happy path", () => {
            it("returns next test number based on current number in DB", async () => {
                const lastTestNumber: TestNumber = {
                    testNumber: "W01A00128",
                    id: "W01",
                    certLetter: "A",
                    sequenceNumber: "001",
                    testNumberKey: 1
                };
                const expectedNextTestNumber: TestNumber = {
                    testNumber: "W01A00229",
                    id: "W01",
                    certLetter: "A",
                    sequenceNumber: "002",
                    testNumberKey: 1
                };
                DynamoDBService.prototype.scan = jest.fn().mockResolvedValue({Items: [lastTestNumber], Count: 1});
                DynamoDBService.prototype.put = jest.fn().mockResolvedValue("");
                const delSpy = jest.fn().mockResolvedValue("");
                DynamoDBService.prototype.delete = delSpy;
                const service = new TestNumberService(new DynamoDBService());
                const output = await service.createTestNumber();
                expect(expectedNextTestNumber).toEqual(output);
            });

            it("Calls DB services with correct  params", async () => {
                const lastTestNumber: TestNumber = {
                    testNumber: "W01A00128",
                    id: "W01",
                    certLetter: "A",
                    sequenceNumber: "001",
                    testNumberKey: 1
                };
                const expectedNextTestNumber: TestNumber = {
                    testNumber: "W01A00229",
                    id: "W01",
                    certLetter: "A",
                    sequenceNumber: "002",
                    testNumberKey: 1
                };
                DynamoDBService.prototype.scan = jest.fn().mockResolvedValue({Items: [lastTestNumber], Count: 1});
                const putSpy = jest.fn().mockResolvedValue("");
                DynamoDBService.prototype.put = putSpy;
                const delSpy = jest.fn().mockResolvedValue("");
                DynamoDBService.prototype.delete = delSpy;
                const service = new TestNumberService(new DynamoDBService());
                await service.createTestNumber();
                expect(putSpy.mock. calls[0][0]).toEqual(expectedNextTestNumber);
                // expect(delSpy.mock.calls[0][0]).toEqual({ testNumber: "W01A00128" });
            });
        });
        context("when DBClient.put throws a 400 \"The conditional request failed\" error", () => {
            it("tries again", async () => {
                const lastTestNumber: TestNumber = {
                    testNumber: "W01A00128",
                    id: "W01",
                    certLetter: "A",
                    sequenceNumber: "001",
                    testNumberKey: 1
                };
                const expectedNextTestNumber: TestNumber = {
                    testNumber: "W01A00229",
                    id: "W01",
                    certLetter: "A",
                    sequenceNumber: "002",
                    testNumberKey: 1
                };

                const error400 = new Error("The conditional request failed");
                // @ts-ignore;
                error400.statusCode = 400;

                DynamoDBService.prototype.scan = jest.fn().mockResolvedValue({Items: [lastTestNumber], Count: 1});
                const putSpy = jest.fn().mockRejectedValueOnce(error400).mockResolvedValueOnce("");
                DynamoDBService.prototype.put = putSpy;
                const delSpy = jest.fn().mockResolvedValue("");
                DynamoDBService.prototype.delete = delSpy;

                const service = new TestNumberService(new DynamoDBService());
                await service.createTestNumber();
                expect(putSpy.mock.calls.length).toEqual(2);
            });
        });

        context("when DBClient.put throws any other error", () => {
            it("throws an HTTPResponse error", async () => {
                const lastTestNumber: TestNumber = {
                    testNumber: "W01A00128",
                    id: "W01",
                    certLetter: "A",
                    sequenceNumber: "001",
                    testNumberKey: 1
                };

                const error = new Error("Oh no!");
                // @ts-ignore
                error.statusCode = 418;

                DynamoDBService.prototype.scan = jest.fn().mockResolvedValue({Items: [lastTestNumber], Count: 1});
                const putSpy = jest.fn().mockRejectedValueOnce(error);
                DynamoDBService.prototype.put = putSpy;
                const delSpy = jest.fn().mockResolvedValue("");
                DynamoDBService.prototype.delete = delSpy;

                const service = new TestNumberService(new DynamoDBService());
                try {
                    await service.createTestNumber();
                } catch (e) {
                    expect(e).toBeInstanceOf(HTTPResponse);
                    expect(e.statusCode).toEqual(418);
                }
            });
        });
    });
});
