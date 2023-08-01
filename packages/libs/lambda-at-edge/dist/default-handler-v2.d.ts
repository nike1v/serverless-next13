import { OriginRequestEvent, OriginResponseEvent } from "./types";
import { CloudFrontResultResponse } from "aws-lambda";
export declare const handler: (event: OriginRequestEvent | OriginResponseEvent) => Promise<CloudFrontResultResponse>;
