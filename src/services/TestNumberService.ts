import { AWSError } from "aws-sdk";
import { TestNumber } from "../models/TestNumber";
import { Service } from "../models/injector/ServiceDecorator";
import { HTTPResponse } from "../utils/HTTPResponse";
import { DynamoDBService } from "./DynamoDBService";
import { Configuration } from "../utils/Configuration";
import { DocumentClient } from "aws-sdk/lib/dynamodb/document_client";

@Service()
export class TestNumberService {
    public readonly dbClient: DynamoDBService;

    /**
     * Constructor for the TestNumberService class
     * @param dynamo
     */
    constructor(dynamo: DynamoDBService) {
        this.dbClient = dynamo;
    }

    /**
     * Creates a new test number in the database.
     * @param activity - the payload containing the activity
     */
    public createTestNumber(): Promise<TestNumber> {
        return this.getLastTestNumber()
            .then((lastTestNumber) => {
                const testNumber: TestNumber = this.createNextTestNumberObject(lastTestNumber);
                return this.dbClient.put(testNumber)
                    .then(() => {
                        this.dbClient.delete({ testNumber: lastTestNumber.testNumber });
                        return testNumber;
                    })
                    .catch((error: AWSError) => {
                        if (error.statusCode === 400 && error.message === "The conditional request failed") {
                            return this.createTestNumber();
                        }
                        console.error(error);
                        throw new HTTPResponse(error.statusCode, {
                            error: `${error.code}: ${error.message}
                        At: ${error.hostname} - ${error.region}
                        Request id: ${error.requestId}`
                        });
                    });
            });
    }

    /**
     * Retrieves the last test number
     */
    public getLastTestNumber(): Promise<TestNumber> {
        return this.dbClient.scan()
            .then((data: any) => {
                if (data.Count === 0) {
                    return Configuration.getInstance().getTestNumberInitialValue();
                } else {
                    return data.Items[0];
                }
            })
            .catch((error: AWSError) => {
                throw new HTTPResponse(error.statusCode, {
                    error: `${error.code}: ${error.message}
                    At: ${error.hostname} - ${error.region}
                    Request id: ${error.requestId}`
                });
            });
    }

    /**
     * Calculates and creates the next test number object based on the last test number
     * @param testNumberObject - last test number
     */
    public createNextTestNumberObject(testNumberObject: TestNumber): TestNumber {
        const testNumber = testNumberObject.testNumber;

        let cvsIdLetter = testNumber.substring(0, 1);
        let cvsIdNumber = testNumber.substring(1, 3);
        let certLetter = testNumber.substring(3, 4);
        let sequenceNumber = testNumber.substring(4, 7);


        if (parseInt(sequenceNumber, 10) === 999) {
            sequenceNumber = "001";
            if (certLetter === "Z") {
                certLetter = "A";
                if (parseInt(cvsIdNumber, 10) === 99) {
                    cvsIdNumber = "01";
                    cvsIdLetter = String.fromCharCode(cvsIdLetter.charCodeAt(0) + 1);
                } else {
                    cvsIdNumber = (parseInt(cvsIdNumber, 10) + 1).toString().padStart(2, "0");
                }
            } else {
                certLetter = String.fromCharCode(certLetter.charCodeAt(0) + 1);
            }

        } else {
            sequenceNumber = (parseInt(sequenceNumber, 10) + 1).toString().padStart(3, "0");
        }

        let newTestNumber = cvsIdLetter + cvsIdNumber + certLetter + sequenceNumber;
        newTestNumber = this.appendCheckSumToTestNumber(newTestNumber);

        const newTestNumberObject: TestNumber = {
            id: cvsIdLetter + cvsIdNumber,
            certLetter,
            sequenceNumber,
            testNumber: newTestNumber
        };

        return newTestNumberObject;
    }

    /**
     * Appends calculated checksum to the test number
     * @param testNumber - the test number
     */
    public appendCheckSumToTestNumber(testNumber: string) {
        const originalTestNumber = testNumber;
        const firstLetterAlphabeticalIndex = (testNumber.charCodeAt(0) - 64).toString();
        const secondLetterAlphabeticalIndex = (testNumber.charCodeAt(3) - 64).toString();
        testNumber = firstLetterAlphabeticalIndex + testNumber.substring(1, 3) + secondLetterAlphabeticalIndex + testNumber.substring(4, 7);
        testNumber = testNumber.substring(0, 2) + (parseInt(testNumber.charAt(2), 10) * 3).toString() + testNumber.substring(3, 6) + (parseInt(testNumber.charAt(6), 10) * 3).toString() + testNumber.substring(7, testNumber.length);

        let checkSum = 0;
        for (let i = 0; i < testNumber.length; i++) {
            checkSum = checkSum + parseInt(testNumber.charAt(i), 10);
        }

        let stringCheckSum;
        if (checkSum < 10) {
            stringCheckSum = checkSum.toString().padStart(2, "0");
        } else if (checkSum > 99) {
            stringCheckSum = (checkSum - 100).toString();
        } else {
            stringCheckSum = checkSum.toString();
        }

        return originalTestNumber + stringCheckSum;
    }

}
