import { TNumber } from "../../src/models/NumberModel";
import lambdaTester from "lambda-tester";
import { emptyDatabase, populateDatabase } from "../util/dbOperations";
import { generateTNumber } from "../../src/functions/generateTNumber";

describe("POST /t-number", () => {
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

  context(
    "when a new TNumber is requested when only the seed data is present",
    () => {
      it("should respond with HTTP 200 and a next valid TNumber", () => {
        const nextTNumber: TNumber = {
          tNumber: "020001T",
          tNumberLetter: "T",
          sequenceNumber: 20001,
          testNumberKey: 6,
        };
        expect.assertions(4);
        return lambda.expectResolve((response: any) => {
          expect(response.headers["Access-Control-Allow-Origin"]).toEqual("*");
          expect(response.headers["Access-Control-Allow-Credentials"]).toEqual(
            true
          );
          expect(response.statusCode).toEqual(200);
          expect(nextTNumber).toEqual(JSON.parse(response.body));
        });
      });
    }
  );
});
