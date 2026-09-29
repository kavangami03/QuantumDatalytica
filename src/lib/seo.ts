export const SITE_URL = "https://www.quantumdatalytica.com";

/** Shared Organization node; other pages reference it by @id. */
export const organizationSchema = {
  "@type": "Organization",
  "@id": `${SITE_URL}/#organization`,
  name: "QuantumDataLytica",
  url: `${SITE_URL}/`,
  logo: `${SITE_URL}/brand/logo.svg`,
  slogan: "Turning business information into meaningful action.",
  description:
    "A unified data platform that brings business information from every branch and team into one place, automates routine reporting, and turns data into clear decisions.",
  email: "info@quantumdatalytica.com",
  telephone: "+1-512-733-3085",
  address: {
    "@type": "PostalAddress",
    streetAddress: "2451 W Grapevine Mills Cir #547",
    addressLocality: "Grapevine",
    addressRegion: "TX",
    postalCode: "76051",
    addressCountry: "US",
  },
};
