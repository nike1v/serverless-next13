"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFound = void 0;
const notFound = (event) => {
    event.res.statusCode = 404;
    event.res.statusMessage = "Not Found";
    event.res.end("Not Found");
};
exports.notFound = notFound;
