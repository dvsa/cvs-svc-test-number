import {APIGatewayProxyResult, Context, Handler} from "aws-lambda";
import {Injector} from "../models/injector/Injector";
import {TestNumberService} from "../services/TestNumberService";
import {HTTPResponse} from "../utils/HTTPResponse";
import {TestNumber} from "../models/TestNumber";

const generateTestNumber: Handler = async (event: any, context?: Context): Promise<APIGatewayProxyResult> => {
    const testNumberService = Injector.resolve<TestNumberService>(TestNumberService);

    return testNumberService.createTestNumber()
        .then((testNumber : TestNumber) => {
            return new HTTPResponse(200, testNumber);
        })
        .catch((error: HTTPResponse) => {
            console.log(error.body);
            return error;
        });
};

export { generateTestNumber };
