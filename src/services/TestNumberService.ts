import { AWSError } from "aws-sdk"; // Only used as a type, so not wrapped by XRay
import { TestNumber } from "../models/TestNumber";
import { HTTPResponse } from "../utils/HTTPResponse";
import { DynamoDBService } from "./DynamoDBService";
import { Configuration } from "../utils/Configuration";

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
                        return this.dbClient.delete({ testNumber: lastTestNumber.testNumber })
                            .then(() => {
                                return testNumber;
                            });
                    })
                    .catch((error: AWSError) => {
                        console.error(error);
                        if (error.statusCode === 400 && error.message === "The conditional request failed") {
                            return this.createTestNumber();
                        }
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
        const testNumberWithoutLetters = testNumber.replace(/\D/g, "");

        const firstLetterAlphabeticalIndex = (testNumber.charCodeAt(0) - 64);
        const secondLetterAlphabeticalIndex = (testNumber.charCodeAt(3) - 64);

        const checkSum = firstLetterAlphabeticalIndex
            + parseInt(testNumberWithoutLetters.charAt(0), 10)
            + parseInt(testNumberWithoutLetters.charAt(1), 10) * 3
            + secondLetterAlphabeticalIndex
            + parseInt(testNumberWithoutLetters.charAt(2), 10)
            + parseInt(testNumberWithoutLetters.charAt(3), 10) * 3
            + parseInt(testNumberWithoutLetters.charAt(4), 10);

        let stringCheckSum;
        if (checkSum < 10) {
            stringCheckSum = checkSum.toString().padStart(2, "0");
        } else if (checkSum > 99) {
            stringCheckSum = (checkSum - 100).toString();
        } else {
            stringCheckSum = checkSum.toString();
        }

        return testNumber + stringCheckSum;
    }

}
