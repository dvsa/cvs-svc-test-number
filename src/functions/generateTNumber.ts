import { APIGatewayProxyResult, Context, Handler } from "aws-lambda";
import { NumberService } from "../services/NumberService";
import { HTTPResponse } from "../utils/HTTPResponse";
import { TNumber } from "../models/NumberModel";
import { DynamoDBService } from "../services/DynamoDBService";

const generateTNumber: Handler = async (
  event: any,
  context?: Context
): Promise<APIGatewayProxyResult> => {
  const numberService = new NumberService(new DynamoDBService());

  try {
    const generatedTNumber: TNumber = await numberService.createTNumber(1, null);
    
    return new HTTPResponse(200, generatedTNumber);
  } catch (error) {
    console.log(error.body);
    return error;
  }
};

export { generateTNumber };
