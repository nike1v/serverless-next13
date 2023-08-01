export const notFound = (event) => {
    event.res.statusCode = 404;
    event.res.statusMessage = "Not Found";
    event.res.end("Not Found");
};
