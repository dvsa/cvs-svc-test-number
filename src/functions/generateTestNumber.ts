import {APIGatewayProxyResult, Context, Handler} from "aws-lambda";
import {NumberService} from "../services/NumberService";
import {HTTPResponse} from "../utils/HTTPResponse";
import {TestNumber} from "../models/NumberModel";
import {DynamoDBService} from "../services/DynamoDBService";

const generateTestNumber: Handler = async (event: any, context?: Context): Promise<APIGatewayProxyResult> => {
    const numberService = new NumberService(new DynamoDBService());
    return numberService.createTestNumber(1, null)
        .then((testNumber: TestNumber) => {
            return new HTTPResponse(200, testNumber as TestNumber);
        })
        .catch((error: HTTPResponse) => {
            console.log(error.body);
            return error;
        });
};

export {generateTestNumber};
