import {APIGatewayProxyResult, Context, Handler} from "aws-lambda";
import {NumberService} from "../services/NumberService";
import {HTTPResponse} from "../utils/HTTPResponse";
import {TestNumber, TrailerId} from "../models/NumberModel";
import {DynamoDBService} from "../services/DynamoDBService";
import {NUMBER_TYPE} from "../assets/Enums";

const generateTrailerId: Handler = async (event: any, context?: Context): Promise<APIGatewayProxyResult> => {
    const numberService = new NumberService(new DynamoDBService());

    return numberService.createNumber(1, null, NUMBER_TYPE.TRAILER_ID)
        .then((trailerId: TrailerId | TestNumber) => {
            return new HTTPResponse(200, trailerId as TrailerId);
        })
        .catch((error: HTTPResponse) => {
            console.log(error.body);
            return error;
        });
};

export {generateTrailerId};
