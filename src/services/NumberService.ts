import {AWSError} from "aws-sdk"; // Only used as a type, so not wrapped by XRay
import {PlateSerialNumber, SystemNumber, TestNumber, TrailerId} from "../models/NumberModel";
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
    private manageAttempts(attempts: number, awsError: AWSError | null) {
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
    private formatAWSError(error: AWSError) {
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
    public async createTestNumber(attempts: number, awsError: AWSError | null): Promise<TestNumber> {
        this.manageAttempts(attempts, awsError);
        try {
            const lastTestNumber: TestNumber = await this.getLastTestNumber();
            const nextTestNumberObject = this.createNextTestNumberObject(lastTestNumber);
            const transactExpression = {
                ConditionExpression: "testNumber = :OldTestNumber",
                ExpressionAttributeValues: {
                    ":OldTestNumber": lastTestNumber.testNumber
                }
            };
            await this.dbClient.transactWrite(nextTestNumberObject, transactExpression);
            console.log(`Test Number Generated successfully`);
            return nextTestNumberObject;
        } catch (error) {
            console.error(error); // limit to 5 attempts
            if (error.statusCode === 400) {
                console.error(`Attempt number ${attempts} for testNumber failed. Retrying up to ${Configuration.getInstance().getMaxAttempts()} attempts.`);
                return this.createTestNumber(attempts + 1, error);
            }
            throw this.formatAWSError(error);
        }
    }

    /**
     * Creates a new trailerId in the database.
     * @param attempt - the current number of attempts for generating a Test Number.
     * @param awsError - AWS error to be passed when the request fails otherwise null.
     */
    public async createTrailerId(attempts: number, awsError: AWSError | null): Promise<TrailerId> {
        this.manageAttempts(attempts, awsError);
        try {
            const lastTrailerId: TrailerId = await this.getLastTrailerId();
            const nextTrailerIdObject = this.createNextTrailerIdObject(lastTrailerId);
            const transactExpression = {
                ConditionExpression: "trailerId = :oldTrailerId",
                ExpressionAttributeValues: {
                    ":oldTrailerId": lastTrailerId.trailerId
                }
            };
            await this.dbClient.transactWrite(nextTrailerIdObject, transactExpression);
            console.log(`TrailerId Generated successfully`);
            return nextTrailerIdObject;
        } catch (error) {
            console.error(error); // limit to 5 attempts
            if (error.statusCode === 400) {
                console.error(`Attempt number ${attempts} for trailerId failed. Retrying up to ${Configuration.getInstance().getMaxAttempts()} attempts.`);
                return this.createTrailerId(attempts + 1, error);
            }
            throw this.formatAWSError(error);
        }
    }

    /**
     * Creates a new system number in the database.
     * @param attempt - the current number of attempts for generating a System Number.
     * @param awsError - AWS error to be passed when the request fails otherwise null.
     */
    public async createSystemNumber(attempts: number, awsError: AWSError | null): Promise<SystemNumber> {
        this.manageAttempts(attempts, awsError);
        try {
            const lastSystemNumber: SystemNumber = await this.getLastSystemNumber();
            const nextSystemNumberObject = this.createNextSystemNumberObject(lastSystemNumber);
            const transactExpression = {
                ConditionExpression: "systemNumber = :oldSystemNumber",
                ExpressionAttributeValues: {
                    ":oldSystemNumber": lastSystemNumber.systemNumber
                }
            };
            await this.dbClient.transactWrite(nextSystemNumberObject, transactExpression);
            console.log(`System Number Generated successfully`);
            return nextSystemNumberObject;
        } catch (error) {
            console.error(error); // limit to 5 attempts
            if (error.statusCode === 400) {
                console.error(`Attempt number ${attempts} for systemNumber failed. Retrying up to ${Configuration.getInstance().getMaxAttempts()} attempts.`);
                return this.createSystemNumber(attempts + 1, error);
            }
            throw this.formatAWSError(error);
        }
    }

    /**
     * Creates a new plate serial number in the database.
     * @param attempt - the current number of attempts for generating a Plate Serial Number.
     * @param awsError - AWS error to be passed when the request fails otherwise null.
     */
    public async createPlateSerialNumber(attempts: number, awsError: AWSError | null): Promise<PlateSerialNumber> {
        this.manageAttempts(attempts, awsError);
        try {
            const lastPlateSerialNumber: PlateSerialNumber = await this.getLastPlateSerialNumber();
            const nextPlateSerialNumberObject = this.createNextPlateSerialNumberObject(lastPlateSerialNumber);
            const transactExpression = {
                ConditionExpression: "plateSerialNumber = :oldPlateSerialNumber",
                ExpressionAttributeValues: {
                    ":oldPlateSerialNumber": lastPlateSerialNumber.plateSerialNumber
                }
            };
            await this.dbClient.transactWrite(nextPlateSerialNumberObject, transactExpression);
            console.log(`Plate Serial Number Generated successfully`);
            return nextPlateSerialNumberObject;
        } catch (error) {
            console.error(error); // limit to 5 attempts
            if (error.statusCode === 400) {
                console.error(`Attempt number ${attempts} for plateSerialNumber failed. Retrying up to ${Configuration.getInstance().getMaxAttempts()} attempts.`);
                return this.createPlateSerialNumber(attempts + 1, error);
            }
            throw this.formatAWSError(error);
        }
    }

    /**
     * Retrieves the last test number
     */
    public async getLastTestNumber(): Promise<TestNumber> {
        try {
            const data: any = await this.dbClient.get({testNumberKey: NUMBER_KEY.TEST_NUMBER});
            if (!data.Item) {
                return Configuration.getInstance().getTestNumberInitialValue();
            }
            return data.Item;
        } catch (error) {
            throw this.formatAWSError(error);
        }
    }

    /**
     * Retrieves the last trailer id
     */
    public async getLastTrailerId(): Promise<TrailerId> {
        try {
            const data: any = await this.dbClient.get({testNumberKey: NUMBER_KEY.TRAILER_ID});
            if (!data.Item) {
                return Configuration.getInstance().getTrailerIdInitialValue();
            }
            return data.Item;
        } catch (error) {
            throw this.formatAWSError(error);
        }
    }

    /**
     * Retrieves the last system number
     */
    public async getLastSystemNumber(): Promise<SystemNumber> {
        try {
            const data: any = await this.dbClient.get({testNumberKey: NUMBER_KEY.SYSTEM_NUMBER});
            if (!data.Item) {
                return Configuration.getInstance().getSystemNumberInitialValue();
            }
            return data.Item;
        } catch (error) {
            throw this.formatAWSError(error);
        }
    }

    /**
     * Retrieves the last plate serial number
     */
    public async getLastPlateSerialNumber(): Promise<PlateSerialNumber> {
        try {
            const data: any = await this.dbClient.get({testNumberKey: NUMBER_KEY.PLATE_SERIAL_NUMBER});
            if (!data.Item) {
                return Configuration.getInstance().getPlateSerialNumberInitialValue();
            }
            return data.Item;
        } catch (error) {
            throw this.formatAWSError(error);
        }
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
            testNumberKey: NUMBER_KEY.TEST_NUMBER
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
            testNumberKey: NUMBER_KEY.TRAILER_ID
        };
        return newTrailerIdObject;
    }

    /**
     * Calculates and creates the next system number object based on the last system number
     * @param systemNumberObject - last systemNumber
     */
    public createNextSystemNumberObject(systemNumberObj: SystemNumber): SystemNumber {
        const newSystemNumber: number = parseInt(systemNumberObj.systemNumber, 10) + 1;
        const newSystemNumberObject: SystemNumber = {
            systemNumber: newSystemNumber.toString(),
            testNumberKey: NUMBER_KEY.SYSTEM_NUMBER
        };
        return newSystemNumberObject;
    }

    /**
     * Calculates and creates the next plate serial number object based on the last plate serial number
     * @param plateSerialNumberObj - last plateSerialNumber
     */
    public createNextPlateSerialNumberObject(plateSerialNumberObj: PlateSerialNumber): PlateSerialNumber {
        const newPlateSerialNumber: number = parseInt(plateSerialNumberObj.plateSerialNumber, 10) + 1;
        const newPlateSerialNumberObject: PlateSerialNumber = {
            plateSerialNumber: newPlateSerialNumber.toString(),
            testNumberKey: NUMBER_KEY.PLATE_SERIAL_NUMBER
        };
        return newPlateSerialNumberObject;
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
