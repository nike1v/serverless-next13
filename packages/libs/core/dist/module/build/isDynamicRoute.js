export const isDynamicRoute = (route) => {
    // Identify /[param]/ in route string
    return /\/\[[^\/]+?](?=\/|$)/.test(route);
};
export const isOptionalCatchAllRoute = (route) => {
    // Identify /[[param]]/ in route string
    return /\/\[\[[^\/]+?]](?=\/|$)/.test(route);
};
