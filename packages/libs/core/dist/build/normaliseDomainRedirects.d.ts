/**
 * Normalise domain redirects by validating they are URLs and getting rid of trailing slash.
 * @param domainRedirects
 */
export declare const normaliseDomainRedirects: (unnormalisedDomainRedirects: {
    [key: string]: string;
}) => {
    [x: string]: string;
};
