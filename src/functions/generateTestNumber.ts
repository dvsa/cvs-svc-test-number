/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { APIGatewayProxyResult, Context, Handler } from 'aws-lambda';
import { NumberService } from '../services/NumberService';
import { HTTPResponse } from '../utils/HTTPResponse';
import { TestNumber } from '../models/NumberModel';
import { DynamoDBService } from '../services/DynamoDBService';

const generateTestNumber: Handler = async (
  _event: any,
  _context?: Context,
): Promise<APIGatewayProxyResult> => {
  const numberService = new NumberService(new DynamoDBService());

  try {
    const testNumber: TestNumber = await numberService.createTestNumber(
      1,
      null,
    );
    return new HTTPResponse(200, testNumber);
  } catch (error) {
    console.log(error.body);
    return error;
  }
};

export { generateTestNumber };
