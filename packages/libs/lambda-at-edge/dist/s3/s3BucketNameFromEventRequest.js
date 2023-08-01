"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.s3BucketNameFromEventRequest = void 0;
const s3BucketNameFromEventRequest = (request) => {
    var _a;
    const { region, domainName } = ((_a = request.origin) === null || _a === void 0 ? void 0 : _a.s3) || {};
    return !!region && (domainName === null || domainName === void 0 ? void 0 : domainName.includes(region))
        ? domainName === null || domainName === void 0 ? void 0 : domainName.replace(`.s3.${region}.amazonaws.com`, "")
        : domainName === null || domainName === void 0 ? void 0 : domainName.replace(`.s3.amazonaws.com`, "");
};
exports.s3BucketNameFromEventRequest = s3BucketNameFromEventRequest;
