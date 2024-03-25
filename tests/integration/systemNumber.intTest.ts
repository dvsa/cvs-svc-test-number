/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
import lambdaTester from 'lambda-tester';
import { SystemNumber } from '../../src/models/NumberModel';
import { generateSystemNumber } from '../../src/functions/generateSystemNumber';
import { emptyDatabase, populateDatabase } from '../util/dbOperations';

describe('POST /system-number', () => {
  const lambda = lambdaTester(generateSystemNumber);

  beforeAll(async () => {
    jest.restoreAllMocks();
    await emptyDatabase();
  });
  beforeEach(async () => {
    await populateDatabase();
  });
  afterEach(async () => {
    await emptyDatabase();
  });
  afterAll(async () => {
    await populateDatabase();
  });

  context('when a new system number is requested when only the seed data is present', () => {
    it('should respond with HTTP 200 and a next valid system-number', () => {
      const nextSystemNumber: SystemNumber = {
        systemNumber: '4000001',
        testNumberKey: 3,
      };
      expect.assertions(4);
      return lambda.expectResolve((response: any) => {
        expect(response.headers['Access-Control-Allow-Origin']).toBe('*');
        expect(response.headers['Access-Control-Allow-Credentials']).toBe(true);
        expect(response.statusCode).toBe(200);
        expect(nextSystemNumber).toEqual(JSON.parse(response.body));
      });
    });
  });
});
