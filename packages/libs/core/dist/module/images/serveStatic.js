import send from "send";
export function getContentType(extWithoutDot) {
    const { mime } = send;
    if ("getType" in mime) {
        // 2.0
        // @ts-ignore
        return mime.getType(extWithoutDot);
    }
    // 1.0
    return mime.lookup(extWithoutDot);
}
export function getExtension(contentType) {
    const { mime } = send;
    if ("getExtension" in mime) {
        // 2.0
        // @ts-ignore
        return mime.getExtension(contentType);
    }
    // 1.0
    return mime.extension(contentType);
}
