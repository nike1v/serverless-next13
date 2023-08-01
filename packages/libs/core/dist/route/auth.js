"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUnauthenticatedResponse = void 0;
function getUnauthenticatedResponse(authorizationHeaders, authentication) {
    var _a;
    if (authentication && authentication.username && authentication.password) {
        const validAuth = "Basic " +
            Buffer.from(authentication.username + ":" + authentication.password).toString("base64");
        if (!authorizationHeaders || ((_a = authorizationHeaders[0]) === null || _a === void 0 ? void 0 : _a.value) !== validAuth) {
            return {
                isUnauthorized: true,
                status: 401,
                statusDescription: "Unauthorized",
                body: "Unauthorized",
                headers: {
                    "www-authenticate": [{ key: "WWW-Authenticate", value: "Basic" }]
                }
            };
        }
    }
}
exports.getUnauthenticatedResponse = getUnauthenticatedResponse;
