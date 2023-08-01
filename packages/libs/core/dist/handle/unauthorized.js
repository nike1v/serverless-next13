"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unauthorized = void 0;
const headers_1 = require("./headers");
const unauthorized = (event, route) => {
    (0, headers_1.setHeadersFromRoute)(event, route);
    event.res.statusCode = route.status;
    event.res.statusMessage = route.statusDescription;
    event.res.end();
};
exports.unauthorized = unauthorized;
