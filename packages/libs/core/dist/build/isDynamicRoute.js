"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isOptionalCatchAllRoute = exports.isDynamicRoute = void 0;
const isDynamicRoute = (route) => {
    // Identify /[param]/ in route string
    return /\/\[[^\/]+?](?=\/|$)/.test(route);
};
exports.isDynamicRoute = isDynamicRoute;
const isOptionalCatchAllRoute = (route) => {
    // Identify /[[param]]/ in route string
    return /\/\[\[[^\/]+?]](?=\/|$)/.test(route);
};
exports.isOptionalCatchAllRoute = isOptionalCatchAllRoute;
