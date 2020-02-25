import numbers from "../resources/test-number.json";
import * as _ from "lodash";
import {DynamoDBService} from "../../src/services/DynamoDBService";

export const populateDatabase = async () => {
    const mockBuffer = _.cloneDeep(numbers);
    const dynamoDbService = new DynamoDBService();
    const batches = [];
    while (mockBuffer.length > 0) {
        batches.push(mockBuffer.splice(0, 25));
    }

    for (const batch of batches) {
        await dynamoDbService.batchPut(batch);
    }
};

export const emptyDatabase = async () => {
    const dynamoDbService = new DynamoDBService();
    const batches = _.cloneDeep(numbers).map((numberObj) => [{testNumberKey: numberObj.testNumberKey}]);
    for (const batch of batches) {
        await dynamoDbService.batchDelete(batch);
    }
};
