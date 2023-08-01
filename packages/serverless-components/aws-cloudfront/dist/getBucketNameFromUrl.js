"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBucketNameFromUrl = void 0;
const getBucketNameFromUrl = (url) => {
    return url.substring(0, url.lastIndexOf(".s3"));
};
exports.getBucketNameFromUrl = getBucketNameFromUrl;
