import {APIGatewayProxyResult, Context, Handler} from "aws-lambda";
import {NumberService} from "../services/NumberService";
import {HTTPResponse} from "../utils/HTTPResponse";
import {TrailerId} from "../models/NumberModel";
import {DynamoDBService} from "../services/DynamoDBService";

const generateTrailerId: Handler = async (event: any, context?: Context): Promise<APIGatewayProxyResult> => {
    const numberService = new NumberService(new DynamoDBService());

    return numberService.createTrailerId(1, null)
        .then((trailerId: TrailerId) => {
            return new HTTPResponse(200, trailerId as TrailerId);
        })
        .catch((error: HTTPResponse) => {
            console.log(error.body);
            return error;
        });
};

export {generateTrailerId};
