/**
 * Type stub for @aws-sdk/client-ses
 * The actual package is optional — the SES transport degrades gracefully if not installed.
 * Install with: npm install @aws-sdk/client-ses
 */
declare module "@aws-sdk/client-ses" {
  export class SESClient {
    constructor(config: { region: string });
    send(command: any): Promise<any>;
  }
  export class SendEmailCommand {
    constructor(input: {
      Source: string;
      Destination: { ToAddresses: string[] };
      Message: {
        Subject: { Data: string; Charset: string };
        Body: {
          Html: { Data: string; Charset: string };
          Text: { Data: string; Charset: string };
        };
      };
    });
  }
}
