/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
import lambdaTester from 'lambda-tester';
import { TNumber } from '../../src/models/NumberModel';
import { emptyDatabase, populateDatabase } from '../util/dbOperations';
import { generateTNumber } from '../../src/functions/generateTNumber';

describe('POST /t-number', () => {
  const lambda = lambdaTester(generateTNumber);

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

  context('when a new TNumber is requested when only the seed data is present', () => {
    it('should respond with HTTP 200 and a next valid TNumber', () => {
      const nextTNumber: TNumber = {
        tNumber: '4000001T',
        tNumberLetter: 'T',
        sequenceNumber: 4000001,
        testNumberKey: 6,
      };
      expect.assertions(4);
      return lambda.expectResolve((response: any) => {
        expect(response.headers['Access-Control-Allow-Origin']).toBe('*');
        expect(response.headers['Access-Control-Allow-Credentials']).toBe(true);
        expect(response.statusCode).toBe(200);
        expect(nextTNumber).toEqual(JSON.parse(response.body));
      });
    });
  });
});
