import {APIGatewayProxyResult} from "aws-lambda";

class HTTPResponse extends Error implements APIGatewayProxyResult {
    public readonly statusCode: number;
    public readonly body: any;
    public readonly headers: any;

    /**
     * Constructor for the HTTPResponse class
     * @param statusCode the HTTP status code
     * @param body - the response body
     * @param headers - optional - the response headers
     */
    constructor(statusCode: number, body: any, headers = {}) {
        super();

        if (headers) {
            this.headers = headers;
            this.headers["Access-Control-Allow-Origin"] = "*";
            this.headers["Access-Control-Allow-Credentials"] = true;
        }

        this.statusCode = statusCode;
        this.body = JSON.stringify(body);
    }
}

export { HTTPResponse };
