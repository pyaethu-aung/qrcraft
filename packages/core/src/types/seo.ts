/**
 * Contract for the SoftwareApplication JSON-LD object.
 * Based on Schema.org and Google Search requirements.
 */
export interface SoftwareApplicationJSONLD {
    "@context": "https://schema.org";
    "@type": "SoftwareApplication";
    name: string;
    description: string;
    applicationCategory: string;
    operatingSystem: string;
    url: string;
    image: string;
    featureList: string;
    offers: {
        "@type": "Offer";
        price: string;
        priceCurrency: string;
    };
}
