/**
 * This and related code are adapted from https://github.com/vercel/next.js/blob/48acc479f3befb70de800392315831ed7defa4d8/packages/next/next-server/server/image-optimizer.ts
 * The MIT License (MIT)

 Copyright (c) 2020 Vercel, Inc.

 Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
/// <reference types="node" />
/// <reference types="node" />
import { IncomingMessage, ServerResponse } from "http";
import { UrlWithParsedQuery } from "url";
import { ImagesManifest } from "../build/types";
import { PlatformClient } from "../platform";
type ImageOptimizerResponse = {
    finished: boolean;
};
export declare function getMaxAge(str: string | undefined): number;
/**
 * If Basepath set, it needs to be removed from URL
 *
 * Not normalised -> error 403
 * url: '<base-path>/assets/images/logo.svg',
 *
 * Normalised -> 200
 * url: '/assets/images/logo.svg',
 */
export declare function normaliseUri(uri: string, basePath: string): string;
export declare function imageOptimizer(basePath: string, imagesManifest: ImagesManifest | undefined, req: IncomingMessage, res: ServerResponse, parsedUrl: UrlWithParsedQuery, platformClient: PlatformClient): Promise<ImageOptimizerResponse>;
export {};
