/// <reference types="node" />
import { IncomingMessage, ServerResponse } from "http";
import { OriginRequestEvent } from "../types";
import { CloudFrontResultResponse } from "aws-lambda";
export declare function createExternalRewriteResponse(customRewrite: string, req: IncomingMessage, res: ServerResponse, body?: string): Promise<void>;
export declare const externalRewrite: (event: OriginRequestEvent, enableHTTPCompression: boolean | undefined, rewrite: string) => Promise<CloudFrontResultResponse>;
