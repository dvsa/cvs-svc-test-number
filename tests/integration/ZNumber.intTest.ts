import { ZNumber } from "../../src/models/NumberModel";
import lambdaTester from "lambda-tester";
import { emptyDatabase, populateDatabase } from "../util/dbOperations";
import { generateZNumber } from "../../src/functions/generateZNumber";

describe("POST /ZNumber", () => {
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

  context(
    "when a new ZNumber is requested when only the seed data is present",
    () => {
      it("should respond with HTTP 200 and a next valid ZNumber", () => {
        const nextZNumber: ZNumber = {
          ZNumber: "1000001Z",
          ZNumberLetter: "Z",
          sequenceNumber: 1000001,
          testNumberKey: 5,
        };
        expect.assertions(4);
        return lambda.expectResolve((response: any) => {
          expect(response.headers["Access-Control-Allow-Origin"]).toEqual("*");
          expect(response.headers["Access-Control-Allow-Credentials"]).toEqual(
            true
          );
          expect(response.statusCode).toEqual(200);
          expect(nextZNumber).toEqual(JSON.parse(response.body));
        });
      });
    }
  );
});
