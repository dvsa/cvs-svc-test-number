import {AWSError} from "aws-sdk"; // Only used as a type, so not wrapped by XRay
import {TestNumber, TrailerId} from "../models/NumberModel";
import {HTTPResponse} from "../utils/HTTPResponse";
import {DynamoDBService} from "./DynamoDBService";
import {Configuration} from "../utils/Configuration";
import {NUMBER_KEY, NUMBER_TYPE} from "../assets/Enums";

export class NumberService {
    public readonly dbClient: DynamoDBService;

    /**
     * Constructor for the NumberService class
     * @param dynamo
     */
    constructor(dynamo: DynamoDBService) {
        this.dbClient = dynamo;
    }

    /**
     * Creates a new test number in the database.
     * @param attempt - the current number of attempts for generating a Test Number.
     * @param awsError - AWS error to be passed when the request fails otherwise null.
     */
    public createNumber(attempts: number, awsError: AWSError | null, numberType: NUMBER_TYPE.TRAILER_ID | NUMBER_TYPE.TEST_NUMBER = NUMBER_TYPE.TEST_NUMBER): Promise<TestNumber | TrailerId> {
        if (attempts > Configuration.getInstance().getMaxAttempts()) {
            if (awsError) {
                throw new HTTPResponse(400, {
                    error: `${awsError.code}: ${awsError.message}
            At: ${awsError.hostname} - ${awsError.region}
            Request id: ${awsError.requestId}`
                });
            }
        }
        return this.getLastNumber(numberType)
            .then((lastNumber) => {
                let nextNumber: TestNumber | TrailerId;
                if (numberType === NUMBER_TYPE.TRAILER_ID) {
                    nextNumber = this.createNextTrailerIdObject(lastNumber as TrailerId);
                } else {
                    nextNumber = this.createNextTestNumberObject(lastNumber as TestNumber);
                }
                return this.dbClient.transactWrite(nextNumber, lastNumber, numberType)
                    .then(() => {
                        console.log(`${numberType} Generated successfully`);
                        return nextNumber;
                    })
                    .catch((error: AWSError) => {
                        console.error(error); // limit to 5 attempts
                        if (error.statusCode === 400) {
                            console.error(`Attempt number ${attempts} failed. Retrying up to ${Configuration.getInstance().getMaxAttempts()} attempts.`);
                            return this.createNumber(attempts + 1, error, numberType);
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
     * Retrieves the last test number or trailerId based on the numberType param
     * @param numberType - type of number to be retrieved from the DB - default is testNumber
     */
    public getLastNumber(numberType: NUMBER_TYPE.TRAILER_ID | NUMBER_TYPE.TEST_NUMBER = NUMBER_TYPE.TEST_NUMBER): Promise<TestNumber | TrailerId> {
        return this.dbClient.scan()
            .then((data: any) => {
                if (data.Count === 0) {
                    if (numberType === NUMBER_TYPE.TRAILER_ID) {
                        return Configuration.getInstance().getTrailerIdInitialValue();
                    }
                    return Configuration.getInstance().getTestNumberInitialValue();
                } else {
                    for (const numberObj of data.Items) {
                        if (numberType === NUMBER_TYPE.TEST_NUMBER && numberObj.testNumberKey === NUMBER_KEY.TEST_NUMBER) {
                            return numberObj;
                        } else if (numberType === NUMBER_TYPE.TRAILER_ID && numberObj.testNumberKey === NUMBER_KEY.TRAILER_ID) {
                            return numberObj;
                        }
                    }
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
            testNumber: newTestNumber,
            testNumberKey: 1
        };

        return newTestNumberObject;
    }

    /**
     * Calculates and creates the next trailerId object based on the last trailerId
     * @param trailerIdObject - last trailerId
     */
    public createNextTrailerIdObject(trailerIdObject: TrailerId): TrailerId {
        const newSequenceNumber: number = trailerIdObject.sequenceNumber + 1;
        const newTrailerId = trailerIdObject.trailerLetter + newSequenceNumber;
        const newTrailerIdObject: TrailerId = {
            trailerId: newTrailerId,
            trailerLetter: trailerIdObject.trailerLetter,
            sequenceNumber: newSequenceNumber,
            testNumberKey: 2
        };
        return newTrailerIdObject;
    }

    /**
     * Appends calculated checksum to the test number
     * @param testNumber - the test number
     */
    public appendCheckSumToTestNumber(testNumber: string) {
        const testNumberWithoutLetters = testNumber.replace(/\D/g, "");

        const firstLetterAlphabeticalIndex = (testNumber.charCodeAt(0) - 64);
        const secondLetterAlphabeticalIndex = (testNumber.charCodeAt(3) - 64);

        let checkSum = firstLetterAlphabeticalIndex
            + parseInt(testNumberWithoutLetters.charAt(0), 10)
            + parseInt(testNumberWithoutLetters.charAt(1), 10) * 3
            + secondLetterAlphabeticalIndex
            + parseInt(testNumberWithoutLetters.charAt(2), 10)
            + parseInt(testNumberWithoutLetters.charAt(3), 10) * 3
            + parseInt(testNumberWithoutLetters.charAt(4), 10);


        if (checkSum > 99) {
            checkSum = checkSum % 100;
        }
        return testNumber + checkSum.toString().padStart(2, "0");
    }

}
