import { IncomingMessage, ServerResponse } from "http";
import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
/**
 * This is a compatibility later to replace req/res methods in order to bridge to APIGateway events.
 * @param event
 */
export declare const httpCompat: (event: APIGatewayProxyEventV2) => {
    req: IncomingMessage;
    res: ServerResponse;
    responsePromise: Promise<APIGatewayProxyStructuredResultV2>;
};
