/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable implicit-arrow-linebreak */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  APIGatewayProxyResult, Callback, Context, Handler,
} from 'aws-lambda';
import Path from 'path-parser';
import { Configuration, IFunctionEvent } from './utils/Configuration';
import { HTTPResponse } from './utils/HTTPResponse';

const handler: Handler = async (event: any, context: Context, callback: Callback): Promise<APIGatewayProxyResult> => {
  // Request integrity checks
  if (!event) {
    return new HTTPResponse(400, 'AWS event is empty. Check your test event.');
  }

  if (event.body) {
    let payload: any = {};

    try {
      payload = JSON.parse(event.body);
    } catch {
      return new HTTPResponse(400, 'Body is not a valid JSON.');
    }

    Object.assign(event, { body: payload });
  }

  // Finding an appropriate λ matching the request
  const config: Configuration = Configuration.getInstance();
  const functions: IFunctionEvent[] = config.getFunctions();
  const serverlessConfig: any = config.getConfig().serverless;

  const matchingLambdaEvents: IFunctionEvent[] = functions
    .filter(
      (fn) =>
        // Find λ with matching httpMethod
        event.httpMethod === fn.method,
    )
    .filter((fn) => {
      // Find λ with matching path
      const localPath: Path = new Path(fn.path);
      const remotePath: Path = new Path(`${serverlessConfig.basePath}${fn.path}`); // Remote paths also have environment

      return localPath.test(event.path) || remotePath.test(event.path);
    });

  // Exactly one λ should match the above filtering.
  if (matchingLambdaEvents.length === 1) {
    const lambdaEvent: IFunctionEvent = matchingLambdaEvents[0];
    const lambdaFn: Handler = lambdaEvent.function;

    const localPath: Path = new Path(lambdaEvent.path);
    const remotePath: Path = new Path(`${serverlessConfig.basePath}${lambdaEvent.path}`); // Remote paths also have environment

    const lambdaPathParams: any = localPath.test(event.path) || remotePath.test(event.path);

    Object.assign(event, { pathParameters: lambdaPathParams });

    console.log(`HTTP ${event.httpMethod} ${event.path} -> λ ${lambdaEvent.name}`);

    // Explicit conversion because typescript can't figure it out
    return lambdaFn(event, context, callback) as Promise<APIGatewayProxyResult>;
  }

  // If filtering results in less or more λ functions than expected, we return an error.
  console.error(`Error: Route ${event.httpMethod} ${event.path} was not found.
    Dumping event:
    ${JSON.stringify(event)}
    Dumping context:
    ${JSON.stringify(context)}`);

  return new HTTPResponse(400, {
    error: `Route ${event.httpMethod} ${event.path} was not found.`,
  });
};

export { handler };
