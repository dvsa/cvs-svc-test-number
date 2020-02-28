import {APIGatewayProxyResult, Context, Handler} from "aws-lambda";
import {NumberService} from "../services/NumberService";
import {HTTPResponse} from "../utils/HTTPResponse";
import {TestNumber, TrailerId} from "../models/NumberModel";
import {DynamoDBService} from "../services/DynamoDBService";

const generateTestNumber: Handler = async (event: any, context?: Context): Promise<APIGatewayProxyResult> => {
    const numberService = new NumberService(new DynamoDBService());
    return numberService.createNumber(1, null)
        .then((testNumber: TestNumber | TrailerId) => {
            return new HTTPResponse(200, testNumber as TestNumber);
        })
        .catch((error: HTTPResponse) => {
            console.log(error.body);
            return error;
        });
};

export {generateTestNumber};
