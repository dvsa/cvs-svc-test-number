import {AWSError} from "aws-sdk";
import {TestNumber} from "../models/TestNumber";
import {Service} from "../models/injector/ServiceDecorator";
import {HTTPResponse} from "../utils/HTTPResponse";
import {DynamoDBService} from "./DynamoDBService";

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
    public async createTestNumber(): Promise<TestNumber> {
        return this.getLastTestNumber()
            .then(lastTestNumber => {
                const testNumber: TestNumber = this.createNextTestNumberObject(lastTestNumber)
                return this.dbClient.put(testNumber)
                    .then(() => {
                        return testNumber;
                    })
                    .catch((error: AWSError) => {
                        throw new HTTPResponse(error.statusCode, { error: `${error.code}: ${error.message}
                        At: ${error.hostname} - ${error.region}
                        Request id: ${error.requestId}` });
                    });
            })
    }

    public async getLastTestNumber(): Promise<TestNumber>{
        return this.dbClient.scan()
            .then((data:any) => {
                if(data.Count === 0){
                    return {testNumber: 'W01A000',
                            id: 'W01',
                            certLetter: 'A',
                            sequenceNumber: '000'}
                } else {
                    let testNumbers = data.Items
                    let sortedTestNumbers = testNumbers.sort((testNumber1:TestNumber, testNumber2:TestNumber) => {
                        if(testNumber1.testNumber < testNumber2.testNumber)
                            return 1
                        if(testNumber1.testNumber < testNumber2.testNumber)
                            return 2
                        return 0
                    })
                    return sortedTestNumbers[0]
                }
            })
            .catch((error: AWSError) => {
                throw new HTTPResponse(error.statusCode, { error: `${error.code}: ${error.message}
                    At: ${error.hostname} - ${error.region}
                    Request id: ${error.requestId}` });
            })
    }

    createNextTestNumberObject(testNumberObject: TestNumber) : TestNumber{
        let testNumber = testNumberObject.testNumber

        let cvsIdLetter = testNumber.substring(0,1)
        let cvsIdNumber = testNumber.substring(1,3)
        let certLetter = testNumber.substring(3,4)
        let sequenceNumber = testNumber.substring(4,7)


        if(parseInt(sequenceNumber) === 999){
            sequenceNumber = '001'
            if(certLetter === 'Z'){
                certLetter = 'A'
                if(parseInt(cvsIdNumber) === 99) {
                    cvsIdNumber = '01'
                    cvsIdLetter = String.fromCharCode(cvsIdLetter.charCodeAt(0) + 1)
                } else {
                    cvsIdNumber = (parseInt(cvsIdNumber) + 1).toString().padStart(2,'0')
                }
            } else {
                certLetter = String.fromCharCode(certLetter.charCodeAt(0) + 1)
            }

        } else {
            sequenceNumber = (parseInt(sequenceNumber) + 1).toString().padStart(3,'0')
        }

        let newTestNumber = cvsIdLetter + cvsIdNumber + certLetter + sequenceNumber
        newTestNumber = this.appendCheckSumToTestNumber(newTestNumber)

        let newTestNumberObject: TestNumber = {
            id: cvsIdLetter + cvsIdNumber,
            certLetter: certLetter,
            sequenceNumber: sequenceNumber,
            testNumber: newTestNumber
        }

        return newTestNumberObject
    }

    appendCheckSumToTestNumber(testNumber: string){
        let originalTestNumber = testNumber
        let firstLetterAlphabeticalIndex = (testNumber.charCodeAt(0)-64).toString()
        let secondLetterAlphabeticalIndex = (testNumber.charCodeAt(3)-64).toString()
        testNumber = firstLetterAlphabeticalIndex + testNumber.substring(1,3) + secondLetterAlphabeticalIndex + testNumber.substring(4,7)
        testNumber = testNumber.substring(0,2) + (parseInt(testNumber.charAt(2))*3).toString() + testNumber.substring(3,6) + (parseInt(testNumber.charAt(6))*3).toString() + testNumber.substring(7,testNumber.length)

        let checkSum = 0
        for(let i = 0; i < testNumber.length; i++){
            checkSum = checkSum + parseInt(testNumber.charAt(i))
        }

        let stringCheckSum
        if(checkSum < 10) {
            stringCheckSum = checkSum.toString().padStart(2, '0')
        } else if (checkSum > 99){
            stringCheckSum = (checkSum - 100).toString()
        } else {
            stringCheckSum = checkSum.toString()
        }

        return originalTestNumber + stringCheckSum
    }

}
