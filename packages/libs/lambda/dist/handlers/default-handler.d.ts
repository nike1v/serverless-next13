import { APIGatewayProxyEventV2, SQSEvent, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
/**
 * Lambda handler that wraps the platform-agnostic default handler.
 * @param event
 */
export declare const handleRequest: (event: APIGatewayProxyEventV2) => Promise<APIGatewayProxyStructuredResultV2>;
/**
 * Lambda handler that wraps the platform-agnostic regeneration handler.
 * @param event
 */
export declare const handleRegeneration: (event: SQSEvent) => Promise<void>;
/**
 * Entry point for Lambda handling - either a request event or SQS event (for regeneration).
 * @param event
 */
export declare const handler: (event: SQSEvent | APIGatewayProxyEventV2) => Promise<void | APIGatewayProxyStructuredResultV2>;
