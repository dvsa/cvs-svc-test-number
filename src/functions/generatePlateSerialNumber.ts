import {APIGatewayProxyResult, Context, Handler} from "aws-lambda";
import {NumberService} from "../services/NumberService";
import {HTTPResponse} from "../utils/HTTPResponse";
import {PlateSerialNumber} from "../models/NumberModel";
import {DynamoDBService} from "../services/DynamoDBService";

const generatePlateSerialNumber: Handler = async (event: any, context?: Context): Promise<APIGatewayProxyResult> => {
    const numberService = new NumberService(new DynamoDBService());

    try {
        const plateSerialNumber: PlateSerialNumber = await numberService.createPlateSerialNumber(1, null);
        return new HTTPResponse(200, plateSerialNumber);
    } catch (error) {
        console.log(error.body);
        return error;
    }
};

export {generatePlateSerialNumber};
