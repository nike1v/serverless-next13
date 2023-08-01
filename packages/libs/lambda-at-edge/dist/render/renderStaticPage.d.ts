import { Route, RoutesManifest } from "@sls-next/core";
import { CloudFrontRequest, CloudFrontResultResponse } from "aws-lambda";
import { OriginRequestDefaultHandlerManifest } from "../types";
import { IncomingMessage, ServerResponse } from "http";
export declare const renderStaticPage: ({ route, request, req, res, responsePromise, manifest, routesManifest, bucketName, s3Key, s3Uri, basePath }: {
    route: Route;
    request: CloudFrontRequest;
    req: IncomingMessage;
    res: ServerResponse;
    responsePromise: Promise<CloudFrontResultResponse>;
    manifest: OriginRequestDefaultHandlerManifest;
    routesManifest: RoutesManifest;
    bucketName: string;
    s3Key: string;
    s3Uri: string;
    basePath: string;
}) => Promise<CloudFrontResultResponse>;
