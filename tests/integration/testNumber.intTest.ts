/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
import lambdaTester from 'lambda-tester';
import { TestNumber } from '../../src/models/NumberModel';
import { generateTestNumber } from '../../src/functions/generateTestNumber';
import { emptyDatabase, populateDatabase } from '../util/dbOperations';

describe('POST /test-number', () => {
  const lambda = lambdaTester(generateTestNumber);

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

  context(
    'when a new test-number is requested when only the seed data is present',
    () => {
      it('should respond with HTTP 200 and a next valid test number', () => {
        const nextTestNumber: TestNumber = {
          testNumber: 'W01A00128',
          id: 'W01',
          certLetter: 'A',
          sequenceNumber: '001',
          testNumberKey: 1,
        };
        expect.assertions(4);
        return lambda.expectResolve((response: any) => {
          expect(response.headers['Access-Control-Allow-Origin']).toBe('*');
          expect(response.headers['Access-Control-Allow-Credentials']).toBe(
            true,
          );
          expect(response.statusCode).toBe(200);
          expect(nextTestNumber).toEqual(JSON.parse(response.body));
        });
      });
    },
  );
});
