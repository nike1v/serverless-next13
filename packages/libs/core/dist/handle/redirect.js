"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redirectByPageProps = exports.redirect = void 0;
const headers_1 = require("./headers");
const redirect = (event, route) => {
    (0, headers_1.setHeadersFromRoute)(event, route);
    event.res.statusCode = route.status;
    event.res.statusMessage = route.statusDescription;
    event.res.end();
};
exports.redirect = redirect;
const redirectByPageProps = (event, route) => {
    var _a, _b, _c, _d, _e;
    event.res.setHeader("cache-control", (_c = (_b = (_a = route.headers) === null || _a === void 0 ? void 0 : _a.cacheControl) === null || _b === void 0 ? void 0 : _b.join(":")) !== null && _c !== void 0 ? _c : "");
    event.res.setHeader("Content-Type", "application/json");
    event.res.statusCode = 200;
    const body = {
        pageProps: {
            __N_REDIRECT: (_e = (_d = route.headers) === null || _d === void 0 ? void 0 : _d.location[0].value) !== null && _e !== void 0 ? _e : "",
            __N_REDIRECT_STATUS: route.status
        },
        __N_SSG: true
    };
    event.res.write(JSON.stringify(body));
    event.res.end();
};
exports.redirectByPageProps = redirectByPageProps;
