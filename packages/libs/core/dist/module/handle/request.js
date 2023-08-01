export const toRequest = (event) => {
    var _a;
    const [uri, querystring] = ((_a = event.req.url) !== null && _a !== void 0 ? _a : "").split("?");
    const headers = {};
    for (const [key, value] of Object.entries(event.req.headers)) {
        if (value && Array.isArray(value)) {
            headers[key.toLowerCase()] = value.map((value) => ({ key, value }));
        }
        else if (value) {
            headers[key.toLowerCase()] = [{ key, value }];
        }
    }
    return {
        headers,
        querystring,
        uri
    };
};
