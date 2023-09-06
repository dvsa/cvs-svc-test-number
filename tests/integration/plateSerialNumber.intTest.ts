/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
import lambdaTester from 'lambda-tester';
import { PlateSerialNumber } from '../../src/models/NumberModel';
import { generatePlateSerialNumber } from '../../src/functions/generatePlateSerialNumber';
import { emptyDatabase, populateDatabase } from '../util/dbOperations';

describe('POST /plateSerialNo', () => {
  const lambda = lambdaTester(generatePlateSerialNumber);

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
    'when a new plate serial number is requested when only the seed data is present',
    () => {
      it('should respond with HTTP 200 and a next valid plateSerialNumber', () => {
        const nextPlateSerialNo: PlateSerialNumber = {
          plateSerialNumber: '1',
          testNumberKey: 4,
        };
        expect.assertions(4);
        return lambda.expectResolve((response: any) => {
          expect(response.headers['Access-Control-Allow-Origin']).toBe('*');
          expect(response.headers['Access-Control-Allow-Credentials']).toBe(
            true,
          );
          expect(response.statusCode).toBe(200);
          expect(nextPlateSerialNo).toEqual(JSON.parse(response.body));
        });
      });
    },
  );
});
