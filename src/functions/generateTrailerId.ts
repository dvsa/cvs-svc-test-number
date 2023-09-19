/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { APIGatewayProxyResult, Context, Handler } from 'aws-lambda';
import { NumberService } from '../services/NumberService';
import { HTTPResponse } from '../utils/HTTPResponse';
import { TrailerId } from '../models/NumberModel';
import { DynamoDBService } from '../services/DynamoDBService';

const generateTrailerId: Handler = async (_event: any, _context?: Context): Promise<APIGatewayProxyResult> => {
  const numberService = new NumberService(new DynamoDBService());

  try {
    const trailerId: TrailerId = await numberService.createTrailerId(1, null);
    return new HTTPResponse(200, trailerId);
  } catch (error) {
    console.log((error as APIGatewayProxyResult).body);
    return error as APIGatewayProxyResult;
  }
};

export { generateTrailerId };
