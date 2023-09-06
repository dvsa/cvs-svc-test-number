/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { APIGatewayProxyResult } from 'aws-lambda';

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
  constructor(statusCode: number | undefined, body: any, headers = {}) {
    super();

    if (headers) {
      this.headers = headers;
      this.headers['Access-Control-Allow-Origin'] = '*';
      this.headers['Access-Control-Allow-Credentials'] = true;
      this.headers['X-Content-Type-Options'] = 'nosniff';
      this.headers.Vary = 'Origin';
      this.headers['X-XSS-Protection'] = '1; mode=block';
    }

    this.statusCode = statusCode || 500;
    this.body = JSON.stringify(body);
  }
}

export { HTTPResponse };
