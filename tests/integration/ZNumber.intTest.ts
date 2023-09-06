/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
import lambdaTester from 'lambda-tester';
import { ZNumber } from '../../src/models/NumberModel';
import { emptyDatabase, populateDatabase } from '../util/dbOperations';
import { generateZNumber } from '../../src/functions/generateZNumber';

describe('POST /z-number', () => {
  const lambda = lambdaTester(generateZNumber);

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

  context('when a new ZNumber is requested when only the seed data is present', () => {
    it('should respond with HTTP 200 and a next valid ZNumber', () => {
      const nextZNumber: ZNumber = {
        zNumber: '1000001Z',
        zNumberLetter: 'Z',
        sequenceNumber: 1000001,
        testNumberKey: 5,
      };
      expect.assertions(4);
      return lambda.expectResolve((response: any) => {
        expect(response.headers['Access-Control-Allow-Origin']).toBe('*');
        expect(response.headers['Access-Control-Allow-Credentials']).toBe(true);
        expect(response.statusCode).toBe(200);
        expect(nextZNumber).toEqual(JSON.parse(response.body));
      });
    });
  });
});
