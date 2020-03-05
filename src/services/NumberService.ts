import {AWSError} from "aws-sdk"; // Only used as a type, so not wrapped by XRay
import {TestNumber, TrailerId} from "../models/NumberModel";
import {HTTPResponse} from "../utils/HTTPResponse";
import {DynamoDBService} from "./DynamoDBService";
import {Configuration} from "../utils/Configuration";
import {NUMBER_KEY} from "../assets/Enums";

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
     * Checks if number of attempts is bigger than the configured number of attempts and throws an error
     * @param attempt - the current number of attempts for generating a Test Number.
     * @param awsError - AWS error to be passed when the request fails otherwise null.
     */
    public manageAttempts(attempts: number, awsError: AWSError | null) {
        if (attempts > Configuration.getInstance().getMaxAttempts()) {
            if (awsError) {
                throw new HTTPResponse(400, {
                    error: `${awsError.code}: ${awsError.message}
            At: ${awsError.hostname} - ${awsError.region}
            Request id: ${awsError.requestId}`
                });
            }
        }
    }

    /**
     * Throws an AWSError
     * @param error - the AWSError
     */
    public formatAWSError(error: AWSError) {
        return new HTTPResponse(error.statusCode, {
            error: `${error.code}: ${error.message}
                        At: ${error.hostname} - ${error.region}
                        Request id: ${error.requestId}`
        });
    }

    /**
     * Creates a new test number in the database.
     * @param attempt - the current number of attempts for generating a Test Number.
     * @param awsError - AWS error to be passed when the request fails otherwise null.
     */
    public createTestNumber(attempts: number, awsError: AWSError | null): Promise<TestNumber> {
        this.manageAttempts(attempts, awsError);
        return this.getLastTestNumber()
            .then((lastTestNumber) => {
                const nextTestNumberObject = this.createNextTestNumberObject(lastTestNumber);
                const transactExpression = {
                    ConditionExpression: "testNumber = :OldTestNumber",
                    ExpressionAttributeValues: {
                        ":OldTestNumber": lastTestNumber.testNumber
                    }
                };
                return this.dbClient.transactWrite(nextTestNumberObject, transactExpression)
                    .then(() => {
                        console.log(`Test Number Generated successfully`);
                        return nextTestNumberObject;
                    })
                    .catch((error: AWSError) => {
                        console.error(error); // limit to 5 attempts
                        if (error.statusCode === 400) {
                            console.error(`Attempt number ${attempts} failed. Retrying up to ${Configuration.getInstance().getMaxAttempts()} attempts.`);
                            return this.createTestNumber(attempts + 1, error);
                        }
                        throw this.formatAWSError(error);
                    });
            });
    }

    /**
     * Creates a new test number in the database.
     * @param attempt - the current number of attempts for generating a Test Number.
     * @param awsError - AWS error to be passed when the request fails otherwise null.
     */
    public createTrailerId(attempts: number, awsError: AWSError | null): Promise<TrailerId> {
        this.manageAttempts(attempts, awsError);
        return this.getLastTrailerId()
            .then((lastTrailerId) => {
                const nextTrailerIdObject = this.createNextTrailerIdObject(lastTrailerId);
                const transactExpression = {
                    ConditionExpression: "trailerId = :oldTrailerId",
                    ExpressionAttributeValues: {
                        ":oldTrailerId": lastTrailerId.trailerId
                    }
                };
                return this.dbClient.transactWrite(nextTrailerIdObject, transactExpression)
                    .then(() => {
                        console.log(`TrailerId Generated successfully`);
                        return nextTrailerIdObject;
                    })
                    .catch((error: AWSError) => {
                        console.error(error); // limit to 5 attempts
                        if (error.statusCode === 400) {
                            console.error(`Attempt number ${attempts} failed. Retrying up to ${Configuration.getInstance().getMaxAttempts()} attempts.`);
                            return this.createTrailerId(attempts + 1, error);
                        }
                        throw this.formatAWSError(error);
                    });
            });
    }

    /**
     * Retrieves the last test number
     */
    public getLastTestNumber(): Promise<TestNumber> {
        return this.dbClient.get({testNumberKey: NUMBER_KEY.TEST_NUMBER})
            .then((data: any) => {
                if (!data.Item) {
                    return Configuration.getInstance().getTestNumberInitialValue();
                }
                return data.Item;
            })
            .catch((error: AWSError) => {
                throw this.formatAWSError(error);
            });
    }

    /**
     * Retrieves the last test number
     */
    public getLastTrailerId(): Promise<TrailerId> {
        return this.dbClient.get({testNumberKey: NUMBER_KEY.TRAILER_ID})
            .then((data: any) => {
                if (!data.Item) {
                    return Configuration.getInstance().getTrailerIdInitialValue();
                }
                return data.Item;
            })
            .catch((error: AWSError) => {
                throw this.formatAWSError(error);
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
