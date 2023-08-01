import { setHeadersFromRoute } from "./headers";
export const unauthorized = (event, route) => {
    setHeadersFromRoute(event, route);
    event.res.statusCode = route.status;
    event.res.statusMessage = route.statusDescription;
    event.res.end();
};
