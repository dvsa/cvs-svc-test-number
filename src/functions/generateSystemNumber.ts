import {APIGatewayProxyResult, Context, Handler} from "aws-lambda";
import {NumberService} from "../services/NumberService";
import {HTTPResponse} from "../utils/HTTPResponse";
import {SystemNumber} from "../models/NumberModel";
import {DynamoDBService} from "../services/DynamoDBService";

const generateSystemNumber: Handler = async (event: any, context?: Context): Promise<APIGatewayProxyResult> => {
    const numberService = new NumberService(new DynamoDBService());

    return numberService.createSystemNumber(1, null)
        .then((systemNumber: SystemNumber) => {
            return new HTTPResponse(200, systemNumber);
        })
        .catch((error: HTTPResponse) => {
            console.log(error.body);
            return error;
        });
};

export {generateSystemNumber};
