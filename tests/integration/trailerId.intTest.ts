import {TrailerId} from "../../src/models/NumberModel";
import lambdaTester from "lambda-tester";
import {generateTrailerId} from "../../src/functions/generateTrailerId";
import {emptyDatabase, populateDatabase} from "../util/dbOperations";

describe("POST /trailerId", () => {
    const lambda = lambdaTester(generateTrailerId);

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

    context("when a new trailerId is requested when only the seed data is present", () => {
        it("should respond with HTTP 200 and a next valid trailerId", () => {
            const nextTrailerId: TrailerId = {
                trailerId: "C530001",
                trailerLetter: "C",
                sequenceNumber: 530001,
                testNumberKey: 2
            };
            expect(true).toEqual(true);
            return lambda
                .expectResolve((response: any) => {
                    expect(response.headers["Access-Control-Allow-Origin"]).toEqual("*");
                    expect(response.headers["Access-Control-Allow-Credentials"]).toEqual(true);
                    expect(response.statusCode).toEqual(200);
                    expect(nextTrailerId).toEqual(JSON.parse(response.body));
                });
        });
    });
});



