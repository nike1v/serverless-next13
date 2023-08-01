import { Header, UnauthorizedRoute } from "../types";
export declare function getUnauthenticatedResponse(authorizationHeaders: Header[] | null, authentication: {
    username: string;
    password: string;
} | undefined): UnauthorizedRoute | undefined;
