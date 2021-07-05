import {NumberService} from "../../src/services/NumberService";
import {PlateSerialNumber, SystemNumber, TestNumber, TrailerId} from "../../src/models/NumberModel";
import {DynamoDBService} from "../../src/services/DynamoDBService";
import {HTTPResponse} from "../../src/utils/HTTPResponse";

jest.mock("../../src/services/DynamoDBService");

describe("NumberService", () => {
    const numberService = new NumberService(new DynamoDBService());
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
                expect(numberService.createNextTestNumberObject(lastTestNumber)).toEqual(expectedNextTestNumber);

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
                expect(numberService.createNextTestNumberObject(lastTestNumber)).toEqual(expectedNextTestNumber);

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
                expect(numberService.createNextTestNumberObject(lastTestNumber)).toEqual(expectedNextTestNumber);

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
                expect(numberService.createNextTestNumberObject(lastTestNumber)).toEqual(expectedNextTestNumber);
            });

            it("Should have correct CheckSum numbers (10 < checksum < 100)", () => {
                const lastTestNumber: TestNumber = {
                    testNumber: "X99Q91998",
                    id: "X99",
                    certLetter: "Q",
                    sequenceNumber: "919",
                    testNumberKey: 1
                };
                const newTestNumber = numberService.createNextTestNumberObject(lastTestNumber);
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
                const newTestNumber = numberService.createNextTestNumberObject(lastTestNumber);
                // next number should be W99Z999 = [23 + 9 + 27 + 26 + 27 + 9 + 9] = 130 => 30;
                expect("30").toEqual(newTestNumber.testNumber.substring(7, 9));
            });

            it("Should have correct CheckSum numbers (next checksum = 103)", () => {
                const lastTestNumber = {
                    testNumber: "W23Y89800",
                    id: "W23",
                    certLetter: "Y",
                    sequenceNumber: "898",
                    testNumberKey: 1
                };
                const newTestNumber = numberService.createNextTestNumberObject(lastTestNumber);
                // next number should be W23Y899 = [23 + 2 + 9 + 25 + 8 + 27 + 9] = 103 => 03;
                expect(newTestNumber.testNumber.substring(7, 9)).toEqual("03");
            });

            it("Should have correct CheckSum numbers (next checksum = 100)", () => {
                const lastTestNumber = {
                    testNumber: "W22Y89800",
                    id: "W22",
                    certLetter: "Y",
                    sequenceNumber: "898",
                    testNumberKey: 1
                };

                const newTestNumber = numberService.createNextTestNumberObject(lastTestNumber);
                // next number should be W22Y899 = [23 + 2 + 6 + 25 + 8 + 27 + 9] = 100 => 00;
                expect(newTestNumber.testNumber.substring(7, 9)).toEqual("00");
            });

            it("Should have correct CheckSum numbers (checksum < 10)", () => {
                const lastTestNumber = {
                    testNumber: "A00A00002",
                    id: "A00",
                    certLetter: "A",
                    sequenceNumber: "000",
                    testNumberKey: 1
                };
                const newTestNumber = numberService.createNextTestNumberObject(lastTestNumber);
                // next number should be A00A001 = [1 + 0 + 0 + 1 + 0 + 0 + 1] = 3 => 03;
                expect("03").toEqual(newTestNumber.testNumber.substring(7, 9));
            });
        });
    });

    describe("createNextTrailerIdObject", () => {
        context("when trying to create a new trailerId", () => {
            it("should return proper nextTrailerId", () => {
                let lastTrailerId: TrailerId = {
                    trailerId: "C530001",
                    trailerLetter: "C",
                    sequenceNumber: 530001,
                    testNumberKey: 2
                };
                let expectedNextTrailerId: TrailerId = {
                    trailerId: "C530002",
                    trailerLetter: "C",
                    sequenceNumber: 530002,
                    testNumberKey: 2
                };
                expect(numberService.createNextTrailerIdObject(lastTrailerId)).toEqual(expectedNextTrailerId);

                lastTrailerId = {
                    trailerId: "C530004",
                    trailerLetter: "C",
                    sequenceNumber: 530004,
                    testNumberKey: 2
                };
                expectedNextTrailerId = {
                    trailerId: "C530005",
                    trailerLetter: "C",
                    sequenceNumber: 530005,
                    testNumberKey: 2
                };
                expect(numberService.createNextTrailerIdObject(lastTrailerId)).toEqual(expectedNextTrailerId);

                lastTrailerId = {
                    trailerId: "C530456",
                    trailerLetter: "C",
                    sequenceNumber: 530456,
                    testNumberKey: 2
                };
                expectedNextTrailerId = {
                    trailerId: "C530457",
                    trailerLetter: "C",
                    sequenceNumber: 530457,
                    testNumberKey: 2
                };
                expect(numberService.createNextTrailerIdObject(lastTrailerId)).toEqual(expectedNextTrailerId);

                lastTrailerId = {
                    trailerId: "C123456",
                    trailerLetter: "C",
                    sequenceNumber: 123456,
                    testNumberKey: 2
                };
                expectedNextTrailerId = {
                    trailerId: "C123457",
                    trailerLetter: "C",
                    sequenceNumber: 123457,
                    testNumberKey: 2
                };
                expect(numberService.createNextTrailerIdObject(lastTrailerId)).toEqual(expectedNextTrailerId);
            });
        });
    });

    describe("createNextSystemNumberObject", () => {
        context("when trying to create a new system number", () => {
            it("should return proper nextSystemNumber", () => {
                let lastSystemNumber: SystemNumber = {
                    systemNumber: "10000001",
                    testNumberKey: 3
                };
                let expectedNextSystemNumber: SystemNumber = {
                    systemNumber: "10000002",
                    testNumberKey: 3
                };
                expect(numberService.createNextSystemNumberObject(lastSystemNumber)).toEqual(expectedNextSystemNumber);

                lastSystemNumber = {
                    systemNumber: "10000003",
                    testNumberKey: 3
                };
                expectedNextSystemNumber = {
                    systemNumber: "10000004",
                    testNumberKey: 3
                };
                expect(numberService.createNextSystemNumberObject(lastSystemNumber)).toEqual(expectedNextSystemNumber);

                lastSystemNumber = {
                    systemNumber: "10023454",
                    testNumberKey: 3
                };
                expectedNextSystemNumber = {
                    systemNumber: "10023455",
                    testNumberKey: 3
                };
                expect(numberService.createNextSystemNumberObject(lastSystemNumber)).toEqual(expectedNextSystemNumber);

                lastSystemNumber = {
                    systemNumber: "24823497",
                    testNumberKey: 3
                };
                expectedNextSystemNumber = {
                    systemNumber: "24823498",
                    testNumberKey: 3
                };
                expect(numberService.createNextSystemNumberObject(lastSystemNumber)).toEqual(expectedNextSystemNumber);
            });
        });
    });

    describe("createNextPlateSerialNumberObject", () => {
        context("when trying to create a new plate serial number", () => {
            it("should return proper nextPlateSerialNumber", () => {
                let lastPlateSerialNumber: PlateSerialNumber = {
                    plateSerialNumber: "1",
                    testNumberKey: 4
                };
                let expectedNextPlateSerialNumber: PlateSerialNumber = {
                    plateSerialNumber: "2",
                    testNumberKey: 4
                };
                expect(numberService.createNextPlateSerialNumberObject(lastPlateSerialNumber)).toEqual(expectedNextPlateSerialNumber);

                lastPlateSerialNumber = {
                    plateSerialNumber: "3",
                    testNumberKey: 4
                };
                expectedNextPlateSerialNumber = {
                    plateSerialNumber: "4",
                    testNumberKey: 4
                };
                expect(numberService.createNextPlateSerialNumberObject(lastPlateSerialNumber)).toEqual(expectedNextPlateSerialNumber);

                lastPlateSerialNumber = {
                    plateSerialNumber: "10023454",
                    testNumberKey: 4
                };
                expectedNextPlateSerialNumber = {
                    plateSerialNumber: "10023455",
                    testNumberKey: 4
                };
                expect(numberService.createNextPlateSerialNumberObject(lastPlateSerialNumber)).toEqual(expectedNextPlateSerialNumber);

                lastPlateSerialNumber = {
                    plateSerialNumber: "24823497",
                    testNumberKey: 4
                };
                expectedNextPlateSerialNumber = {
                    plateSerialNumber: "24823498",
                    testNumberKey: 4
                };
                expect(numberService.createNextPlateSerialNumberObject(lastPlateSerialNumber)).toEqual(expectedNextPlateSerialNumber);
            });
        });
    });

    describe("getLastTestNumber", () => {
        beforeEach(() => {
            jest.resetAllMocks();
        });
        it("returns expected value on successful DBService query", async () => {
            const aTestNumber = {
                testNumber: "A00A00002",
                id: "A00",
                certLetter: "A",
                sequenceNumber: "000",
                testNumberKey: 1
            };
            DynamoDBService.prototype.get = jest.fn().mockResolvedValue({Item: aTestNumber});
            const service = new NumberService(new DynamoDBService());
            const output = await service.getLastTestNumber();
            expect(aTestNumber).toEqual(output);
        });
        it("returns default value on empty DB return", async () => {
            const defaultTestNumber = {
                testNumber: "W01A000",
                id: "W01",
                certLetter: "A",
                sequenceNumber: "000"
            };
            DynamoDBService.prototype.get = jest.fn().mockResolvedValue({Item: null});
            const service = new NumberService(new DynamoDBService());
            const output = await service.getLastTestNumber();
            expect(defaultTestNumber).toEqual(output);
        });
        it("throws expected errors if DBService request fails", async () => {
            const error = new Error("I broke");
            // @ts-ignore
            error.statusCode = 418;

            DynamoDBService.prototype.get = jest.fn().mockRejectedValue(error);
            const service = new NumberService(new DynamoDBService());
            try {
                await service.getLastTestNumber();
            } catch (e) {
                expect(e).toBeInstanceOf(HTTPResponse);
                expect(e.statusCode).toEqual(418);
            }
        });
    });

    describe("getLastTrailerId", () => {
        beforeEach(() => {
            jest.resetAllMocks();
        });
        it("returns expected value on successful DBService query", async () => {
            const trailerIdObj = {
                trailerId: "C530000",
                trailerLetter: "C",
                sequenceNumber: 530000,
                testNumberKey: 2
            };
            DynamoDBService.prototype.get = jest.fn().mockResolvedValue({Item: trailerIdObj});
            const service = new NumberService(new DynamoDBService());
            const output = await service.getLastTrailerId();
            expect(trailerIdObj).toEqual(output);
        });
        it("returns default value on empty DB return", async () => {
            const defaultTrailerId = {
                trailerId: "C530000",
                trailerLetter: "C",
                sequenceNumber: 530000
            };
            DynamoDBService.prototype.get = jest.fn().mockResolvedValue({Item: null});
            const service = new NumberService(new DynamoDBService());
            const output = await service.getLastTrailerId();
            expect(defaultTrailerId).toEqual(output);
        });
        it("throws expected errors if DBService request fails", async () => {
            const error = new Error("I broke");
            // @ts-ignore
            error.statusCode = 418;

            DynamoDBService.prototype.get = jest.fn().mockRejectedValue(error);
            const service = new NumberService(new DynamoDBService());
            try {
                await service.getLastTrailerId();
            } catch (e) {
                expect(e).toBeInstanceOf(HTTPResponse);
                expect(e.statusCode).toEqual(418);
            }
        });
    });

    describe("getLastSystemNumber", () => {
        beforeEach(() => {
            jest.resetAllMocks();
        });
        it("returns expected value on successful DBService query", async () => {
            const systemNumberObj = {
                systemNumber: "10000005",
                testNumberKey: 3
            };
            DynamoDBService.prototype.get = jest.fn().mockResolvedValue({Item: systemNumberObj});
            const service = new NumberService(new DynamoDBService());
            const output = await service.getLastSystemNumber();
            expect(systemNumberObj).toEqual(output);
        });
        it("returns default value on empty DB return", async () => {
            const defaultSystemNumber = {
                systemNumber: "10000000"
            };
            DynamoDBService.prototype.get = jest.fn().mockResolvedValue({Item: null});
            const service = new NumberService(new DynamoDBService());
            const output = await service.getLastSystemNumber();
            expect(defaultSystemNumber).toEqual(output);
        });
        it("throws expected errors if DBService request fails", async () => {
            const error = new Error("I broke");
            // @ts-ignore
            error.statusCode = 418;

            DynamoDBService.prototype.get = jest.fn().mockRejectedValue(error);
            const service = new NumberService(new DynamoDBService());
            try {
                await service.getLastSystemNumber();
            } catch (e) {
                expect(e).toBeInstanceOf(HTTPResponse);
                expect(e.statusCode).toEqual(418);
            }
        });
    });

    describe("getLastPlateSerialNumber", () => {
        beforeEach(() => {
            jest.resetAllMocks();
        });
        it("returns expected value on successful DBService query", async () => {
            const plateSerialNumberObj: PlateSerialNumber = {
                plateSerialNumber: "12",
                testNumberKey: 4
            };
            DynamoDBService.prototype.get = jest.fn().mockResolvedValue({Item: plateSerialNumberObj});
            const service = new NumberService(new DynamoDBService());
            const output = await service.getLastPlateSerialNumber();
            expect(plateSerialNumberObj).toEqual(output);
        });
        it("returns default value on empty DB return", async () => {
            const defaultPlateSerialNumber = {
                plateSerialNumber: "0"
            };
            DynamoDBService.prototype.get = jest.fn().mockResolvedValue({Item: null});
            const service = new NumberService(new DynamoDBService());
            const output = await service.getLastPlateSerialNumber();
            expect(defaultPlateSerialNumber).toEqual(output);
        });
        it("throws expected errors if DBService request fails", async () => {
            const error = new Error("I broke");
            // @ts-ignore
            error.statusCode = 418;

            DynamoDBService.prototype.get = jest.fn().mockRejectedValue(error);
            const service = new NumberService(new DynamoDBService());
            try {
                await service.getLastPlateSerialNumber();
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
                DynamoDBService.prototype.get = jest.fn().mockResolvedValue({Item: lastTestNumber});
                DynamoDBService.prototype.transactWrite = jest.fn().mockResolvedValue("");
                const service = new NumberService(new DynamoDBService());
                const output = await service.createTestNumber(1, null);
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
                DynamoDBService.prototype.get = jest.fn().mockResolvedValue({Item: lastTestNumber});
                const putSpy = jest.fn().mockResolvedValue("");
                DynamoDBService.prototype.transactWrite = putSpy;
                const service = new NumberService(new DynamoDBService());
                await service.createTestNumber(1, null);
                expect(putSpy.mock.calls[0][0]).toEqual(expectedNextTestNumber);
            });
        });
        context("when DBClient.put throws a 400 \"Transaction cancelled, please refer cancellation reasons for specific reasons [ConditionalCheckFailed]\" error", () => {
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

                const error400 = new Error("Transaction cancelled, please refer cancellation reasons for specific reasons [ConditionalCheckFailed]");
                // @ts-ignore;
                error400.statusCode = 400;

                DynamoDBService.prototype.get = jest.fn().mockResolvedValue({Item: lastTestNumber});
                const putSpy = jest.fn().mockRejectedValueOnce(error400).mockResolvedValueOnce("");
                DynamoDBService.prototype.transactWrite = putSpy;

                const service = new NumberService(new DynamoDBService());
                await service.createTestNumber(0, null);
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

                DynamoDBService.prototype.get = jest.fn().mockResolvedValue({Item: lastTestNumber});
                const transactSpy = jest.fn().mockRejectedValueOnce(error);
                DynamoDBService.prototype.transactWrite = transactSpy;

                const service = new NumberService(new DynamoDBService());
                try {
                    await service.createTestNumber(1, null);
                } catch (e) {
                    expect(e).toBeInstanceOf(HTTPResponse);
                    expect(e.statusCode).toEqual(418);
                }
            });
        });

        context("when the function retried more than 5 times", () => {
            it("throws an HTTPResponse error", async () => {
                const awsError: any = {
                    code: "400",
                    message: "Attempted more than 5 times",
                    hostname: "someHostname",
                    region: "eu-east1",
                    requestId: "123454"
                };
                const service = new NumberService(new DynamoDBService());
                try {
                    await service.createTestNumber(6, awsError);
                } catch (e) {
                    expect(e).toBeInstanceOf(HTTPResponse);
                    expect(e.statusCode).toEqual(400);
                }
            });
        });
    });

    describe("createTrailerId", () => {
        context("happy path", () => {
            it("returns next trailerId based on current number in DB", async () => {
                const lastTrailerId: TrailerId = {
                    trailerId: "C530000",
                    trailerLetter: "C",
                    sequenceNumber: 530000,
                    testNumberKey: 2
                };
                const expectedNextTrailerId: TrailerId = {
                    trailerId: "C530001",
                    trailerLetter: "C",
                    sequenceNumber: 530001,
                    testNumberKey: 2
                };
                DynamoDBService.prototype.get = jest.fn().mockResolvedValue({Item: lastTrailerId});
                DynamoDBService.prototype.transactWrite = jest.fn().mockResolvedValue("");
                const service = new NumberService(new DynamoDBService());
                const output = await service.createTrailerId(1, null);
                expect(expectedNextTrailerId).toEqual(output);
            });

            it("Calls DB services with correct params", async () => {
                const lastTrailerId: TrailerId = {
                    trailerId: "C530001",
                    trailerLetter: "C",
                    sequenceNumber: 530001,
                    testNumberKey: 2
                };
                const expectedNextTrailerId: TrailerId = {
                    trailerId: "C530002",
                    trailerLetter: "C",
                    sequenceNumber: 530002,
                    testNumberKey: 2
                };
                DynamoDBService.prototype.get = jest.fn().mockResolvedValue({Item: lastTrailerId});
                const putSpy = jest.fn().mockResolvedValue("");
                DynamoDBService.prototype.transactWrite = putSpy;
                const service = new NumberService(new DynamoDBService());
                await service.createTrailerId(1, null);
                expect(putSpy.mock.calls[0][0]).toEqual(expectedNextTrailerId);
            });
        });
        context("when DBClient.put throws a 400 \"Transaction cancelled, please refer cancellation reasons for specific reasons [ConditionalCheckFailed]\" error", () => {
            it("tries again", async () => {
                const lastTrailerId: TrailerId = {
                    trailerId: "C530001",
                    trailerLetter: "C",
                    sequenceNumber: 530001,
                    testNumberKey: 2
                };

                const error400 = new Error("Transaction cancelled, please refer cancellation reasons for specific reasons [ConditionalCheckFailed]");
                // @ts-ignore;
                error400.statusCode = 400;

                DynamoDBService.prototype.get = jest.fn().mockResolvedValue({Item: lastTrailerId});
                const putSpy = jest.fn().mockRejectedValueOnce(error400).mockResolvedValueOnce("");
                DynamoDBService.prototype.transactWrite = putSpy;

                const service = new NumberService(new DynamoDBService());
                await service.createTrailerId(0, null);
                expect(putSpy.mock.calls.length).toEqual(2);
            });
        });

        context("when DBClient.put throws any other error", () => {
            it("throws an HTTPResponse error", async () => {
                const lastTrailerId: TrailerId = {
                    trailerId: "C530001",
                    trailerLetter: "C",
                    sequenceNumber: 530001,
                    testNumberKey: 2
                };

                const error = new Error("Oh no!");
                // @ts-ignore
                error.statusCode = 418;

                DynamoDBService.prototype.get = jest.fn().mockResolvedValue({Item: lastTrailerId});
                const transactSpy = jest.fn().mockRejectedValueOnce(error);
                DynamoDBService.prototype.transactWrite = transactSpy;

                const service = new NumberService(new DynamoDBService());
                try {
                    await service.createTrailerId(1, null);
                } catch (e) {
                    expect(e).toBeInstanceOf(HTTPResponse);
                    expect(e.statusCode).toEqual(418);
                }
            });
        });

        context("when the function retried more than 5 times", () => {
            it("throws an HTTPResponse error", async () => {
                const awsError: any = {
                    code: "400",
                    message: "Attempted more than 5 times",
                    hostname: "someHostname",
                    region: "eu-east1",
                    requestId: "123454"
                };
                const service = new NumberService(new DynamoDBService());
                try {
                    await service.createTrailerId(6, awsError);
                } catch (e) {
                    expect(e).toBeInstanceOf(HTTPResponse);
                    expect(e.statusCode).toEqual(400);
                }
            });
        });
    });

    describe("createSystemNumber", () => {
        context("happy path", () => {
            it("returns next systemNumber based on current number in DB", async () => {
                const lastSystemNumber: SystemNumber = {
                    systemNumber: "10000000",
                    testNumberKey: 3
                };
                const expectedNextSystemNumber: SystemNumber = {
                    systemNumber: "10000001",
                    testNumberKey: 3
                };
                DynamoDBService.prototype.get = jest.fn().mockResolvedValue({Item: lastSystemNumber});
                DynamoDBService.prototype.transactWrite = jest.fn().mockResolvedValue("");
                const service = new NumberService(new DynamoDBService());
                const output = await service.createSystemNumber(1, null);
                expect(expectedNextSystemNumber).toEqual(output);
            });

            it("Calls DB services with correct params", async () => {
                const lastSystemNumber: SystemNumber = {
                    systemNumber: "10000023",
                    testNumberKey: 3
                };
                const expectedNextSystemNumber: SystemNumber = {
                    systemNumber: "10000024",
                    testNumberKey: 3
                };
                DynamoDBService.prototype.get = jest.fn().mockResolvedValue({Item: lastSystemNumber});
                const putSpy = jest.fn().mockResolvedValue("");
                DynamoDBService.prototype.transactWrite = putSpy;
                const service = new NumberService(new DynamoDBService());
                await service.createSystemNumber(1, null);
                expect(putSpy.mock.calls[0][0]).toEqual(expectedNextSystemNumber);
            });
        });
        context("when DBClient.put throws a 400 \"Transaction cancelled, please refer cancellation reasons for specific reasons [ConditionalCheckFailed]\" error", () => {
            it("tries again", async () => {
                const lastSystemNumber: SystemNumber = {
                    systemNumber: "10000023",
                    testNumberKey: 3
                };

                const error400 = new Error("Transaction cancelled, please refer cancellation reasons for specific reasons [ConditionalCheckFailed]");
                // @ts-ignore;
                error400.statusCode = 400;

                DynamoDBService.prototype.get = jest.fn().mockResolvedValue({Item: lastSystemNumber});
                const putSpy = jest.fn().mockRejectedValueOnce(error400).mockResolvedValueOnce("");
                DynamoDBService.prototype.transactWrite = putSpy;

                const service = new NumberService(new DynamoDBService());
                await service.createSystemNumber(0, null);
                expect(putSpy.mock.calls.length).toEqual(2);
            });
        });

        context("when DBClient.put throws any other error", () => {
            it("throws an HTTPResponse error", async () => {
                const lastSystemNumber: SystemNumber = {
                    systemNumber: "10000023",
                    testNumberKey: 3
                };

                const error = new Error("Oh no!");
                // @ts-ignore
                error.statusCode = 418;

                DynamoDBService.prototype.get = jest.fn().mockResolvedValue({Item: lastSystemNumber});
                const transactSpy = jest.fn().mockRejectedValueOnce(error);
                DynamoDBService.prototype.transactWrite = transactSpy;

                const service = new NumberService(new DynamoDBService());
                try {
                    await service.createSystemNumber(1, null);
                } catch (e) {
                    expect(e).toBeInstanceOf(HTTPResponse);
                    expect(e.statusCode).toEqual(418);
                }
            });
        });

        context("when the function retried more than 5 times", () => {
            it("throws an HTTPResponse error", async () => {
                const awsError: any = {
                    code: "400",
                    message: "Attempted more than 5 times",
                    hostname: "someHostname",
                    region: "eu-east1",
                    requestId: "123454"
                };
                const service = new NumberService(new DynamoDBService());
                try {
                    await service.createSystemNumber(6, awsError);
                } catch (e) {
                    expect(e).toBeInstanceOf(HTTPResponse);
                    expect(e.statusCode).toEqual(400);
                }
            });
        });
    });

    describe("createPlateSerialNumber", () => {
        context("happy path", () => {
            it("returns next plateSerialNumber based on current number in DB", async () => {
                const lastPlateSerialNumber: PlateSerialNumber = {
                    plateSerialNumber: "1",
                    testNumberKey: 4
                };
                const expectedNextPlateSerialNumber: PlateSerialNumber = {
                    plateSerialNumber: "2",
                    testNumberKey: 4
                };
                DynamoDBService.prototype.get = jest.fn().mockResolvedValue({Item: lastPlateSerialNumber});
                DynamoDBService.prototype.transactWrite = jest.fn().mockResolvedValue("");
                const service = new NumberService(new DynamoDBService());
                const output = await service.createPlateSerialNumber(1, null);
                expect(expectedNextPlateSerialNumber).toEqual(output);
            });

            it("Calls DB services with correct params", async () => {
                const lastPlateSerialNumber: PlateSerialNumber = {
                    plateSerialNumber: "23",
                    testNumberKey: 4
                };
                const expectedNextPlateSerialNumber: PlateSerialNumber = {
                    plateSerialNumber: "24",
                    testNumberKey: 4
                };
                DynamoDBService.prototype.get = jest.fn().mockResolvedValue({Item: lastPlateSerialNumber});
                const putSpy = jest.fn().mockResolvedValue("");
                DynamoDBService.prototype.transactWrite = putSpy;
                const service = new NumberService(new DynamoDBService());
                await service.createPlateSerialNumber(1, null);
                expect(putSpy.mock.calls[0][0]).toEqual(expectedNextPlateSerialNumber);
            });
        });
        context("when DBClient.put throws a 400 \"Transaction cancelled, please refer cancellation reasons for specific reasons [ConditionalCheckFailed]\" error", () => {
            it("tries again", async () => {
                const lastPlateSerialNumber: PlateSerialNumber = {
                    plateSerialNumber: "23",
                    testNumberKey: 4
                };

                const error400 = new Error("Transaction cancelled, please refer cancellation reasons for specific reasons [ConditionalCheckFailed]");
                // @ts-ignore;
                error400.statusCode = 400;

                DynamoDBService.prototype.get = jest.fn().mockResolvedValue({Item: lastPlateSerialNumber});
                const putSpy = jest.fn().mockRejectedValueOnce(error400).mockResolvedValueOnce("");
                DynamoDBService.prototype.transactWrite = putSpy;

                const service = new NumberService(new DynamoDBService());
                await service.createPlateSerialNumber(0, null);
                expect(putSpy.mock.calls.length).toEqual(2);
            });
        });

        context("when DBClient.put throws any other error", () => {
            it("throws an HTTPResponse error", async () => {
                const lastPlateSerialNumber: PlateSerialNumber = {
                    plateSerialNumber: "23",
                    testNumberKey: 4
                };

                const error = new Error("Oh no!");
                // @ts-ignore
                error.statusCode = 418;

                DynamoDBService.prototype.get = jest.fn().mockResolvedValue({Item: lastPlateSerialNumber});
                const transactSpy = jest.fn().mockRejectedValueOnce(error);
                DynamoDBService.prototype.transactWrite = transactSpy;

                const service = new NumberService(new DynamoDBService());
                try {
                    await service.createPlateSerialNumber(1, null);
                } catch (e) {
                    expect(e).toBeInstanceOf(HTTPResponse);
                    expect(e.statusCode).toEqual(418);
                }
            });
        });

        context("when the function retried more than 5 times", () => {
            it("throws an HTTPResponse error", async () => {
                const awsError: any = {
                    code: "400",
                    message: "Attempted more than 5 times",
                    hostname: "someHostname",
                    region: "eu-east1",
                    requestId: "123454"
                };
                const service = new NumberService(new DynamoDBService());
                try {
                    await service.createPlateSerialNumber(6, awsError);
                } catch (e) {
                    expect(e).toBeInstanceOf(HTTPResponse);
                    expect(e.statusCode).toEqual(400);
                }
            });
        });
    });
});
