"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.s3StorePage = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const s3StorePage = async (options) => {
    const s3 = new client_s3_1.S3Client({
        region: options.region,
        maxAttempts: 3
    });
    const s3BasePath = options.basePath
        ? `${options.basePath.replace(/^\//, "")}/`
        : "";
    const baseKey = options.uri
        .replace(/^\/$/, "index")
        .replace(/^\//, "")
        .replace(/\.(json|html)$/, "")
        .replace(/^_next\/data\/[^\/]*\//, "");
    const jsonKey = `_next/data/${options.buildId}/${baseKey}.json`;
    const htmlKey = `static-pages/${options.buildId}/${baseKey}.html`;
    const cacheControl = options.revalidate
        ? undefined
        : "public, max-age=0, s-maxage=2678400, must-revalidate";
    const expires = options.revalidate
        ? new Date(new Date().getTime() + 1000 * options.revalidate)
        : undefined;
    const s3JsonParams = {
        Bucket: options.bucketName,
        Key: `${s3BasePath}${jsonKey}`,
        Body: JSON.stringify(options.pageData),
        ContentType: "application/json",
        CacheControl: cacheControl,
        Expires: expires
    };
    const s3HtmlParams = {
        Bucket: options.bucketName,
        Key: `${s3BasePath}${htmlKey}`,
        Body: options.html,
        ContentType: "text/html",
        CacheControl: cacheControl,
        Expires: expires
    };
    await Promise.all([
        s3.send(new client_s3_1.PutObjectCommand(s3JsonParams)),
        s3.send(new client_s3_1.PutObjectCommand(s3HtmlParams))
    ]);
    return {
        cacheControl,
        expires
    };
};
exports.s3StorePage = s3StorePage;
