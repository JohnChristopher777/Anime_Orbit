import React, { useEffect } from "react";

const SITE_URL = "https://animeorbit.web.app";
const SITE_NAME = "Anime Orbit";
const DEFAULT_IMAGE = `${SITE_URL}/animeorbit.jpg`;

type SchemaNode = Record<string, unknown>;

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface SEOProps {
  title: string;
  description: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: "website" | "article" | "profile" | "video.tv_show" | "video.movie";
  pageType?: "WebPage" | "CollectionPage" | "ItemPage" | "ProfilePage" | "AboutPage" | "SearchResultsPage";
  structuredData?: SchemaNode | SchemaNode[];
  breadcrumbs?: BreadcrumbItem[];
  imageAlt?: string;
  noIndex?: boolean;
}

const absoluteUrl = (value: string, fallback = SITE_URL) => {
  try {
    return new URL(value, `${SITE_URL}/`).href;
  } catch {
    return fallback;
  }
};

const schemaNodes = (value?: SchemaNode | SchemaNode[]) => {
  if (!value) return [];
  const values = Array.isArray(value) ? value : [value];
  return values.flatMap((entry) => {
    if (Array.isArray(entry?.["@graph"])) {
      return (entry["@graph"] as SchemaNode[]).map(({ ["@context"]: _context, ...node }) => node);
    }
    const { ["@context"]: _context, ...node } = entry;
    return [node];
  });
};

export const SEO: React.FC<SEOProps> = ({
  title,
  description,
  keywords = "Anime Orbit, anime database, manga database, anime discovery, anime guide, episode guide, chapter guide, characters, voice actors, franchises, anime reviews",
  image = DEFAULT_IMAGE,
  url = typeof window !== "undefined" ? `${SITE_URL}${window.location.pathname}` : `${SITE_URL}/`,
  type = "website",
  pageType = "WebPage",
  structuredData,
  breadcrumbs,
  imageAlt,
  noIndex = false,
}) => {
  const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
  const canonicalUrl = absoluteUrl(url.split("#")[0], `${SITE_URL}/`);
  const absoluteImage = absoluteUrl(image, DEFAULT_IMAGE);
  const resolvedImageAlt = imageAlt || `${title} on ${SITE_NAME}`;
  const cleanDescription = String(description || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 320);

  useEffect(() => {
    document.title = fullTitle;

    const updateMetaTag = (
      selector: string,
      attrName: "name" | "property",
      attrValue: string,
      content: string,
    ) => {
      let element = document.querySelector(selector) as HTMLMetaElement | null;
      if (!element) {
        element = document.createElement("meta");
        element.setAttribute(attrName, attrValue);
        document.head.appendChild(element);
      }
      element.setAttribute("content", content);
    };

    const robots = noIndex
      ? "noindex, follow, noarchive"
      : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";

    updateMetaTag('meta[name="description"]', "name", "description", cleanDescription);
    updateMetaTag('meta[name="keywords"]', "name", "keywords", keywords);
    updateMetaTag('meta[name="title"]', "name", "title", fullTitle);
    updateMetaTag('meta[name="robots"]', "name", "robots", robots);
    updateMetaTag('meta[name="googlebot"]', "name", "googlebot", robots);
    updateMetaTag('meta[name="author"]', "name", "author", SITE_NAME);
    updateMetaTag('meta[name="application-name"]', "name", "application-name", SITE_NAME);

    updateMetaTag('meta[property="og:title"]', "property", "og:title", fullTitle);
    updateMetaTag('meta[property="og:description"]', "property", "og:description", cleanDescription);
    updateMetaTag('meta[property="og:image"]', "property", "og:image", absoluteImage);
    updateMetaTag('meta[property="og:image:secure_url"]', "property", "og:image:secure_url", absoluteImage);
    updateMetaTag('meta[property="og:image:alt"]', "property", "og:image:alt", resolvedImageAlt);
    updateMetaTag('meta[property="og:url"]', "property", "og:url", canonicalUrl);
    updateMetaTag('meta[property="og:type"]', "property", "og:type", type);
    updateMetaTag('meta[property="og:site_name"]', "property", "og:site_name", SITE_NAME);
    updateMetaTag('meta[property="og:locale"]', "property", "og:locale", "en_US");

    updateMetaTag('meta[name="twitter:title"]', "name", "twitter:title", fullTitle);
    updateMetaTag('meta[name="twitter:description"]', "name", "twitter:description", cleanDescription);
    updateMetaTag('meta[name="twitter:image"]', "name", "twitter:image", absoluteImage);
    updateMetaTag('meta[name="twitter:image:alt"]', "name", "twitter:image:alt", resolvedImageAlt);
    updateMetaTag('meta[name="twitter:url"]', "name", "twitter:url", canonicalUrl);
    updateMetaTag('meta[name="twitter:card"]', "name", "twitter:card", "summary_large_image");

    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonicalLink) {
      canonicalLink = document.createElement("link");
      canonicalLink.rel = "canonical";
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.href = canonicalUrl;

    const suppliedNodes = schemaNodes(structuredData).map((node, index) => ({
      ...(index === 0 && !node["@id"] ? { "@id": `${canonicalUrl}#primary-entity` } : {}),
      ...node,
    }));
    const primaryEntityId = suppliedNodes[0]?.["@id"];
    const resolvedBreadcrumbs = (breadcrumbs?.length
      ? breadcrumbs
      : canonicalUrl !== `${SITE_URL}/`
        ? [
            { name: SITE_NAME, url: `${SITE_URL}/` },
            { name: title.replace(/\s*[|–-].*$/, "").trim() || title, url: canonicalUrl },
          ]
        : []
    ).map((item) => ({ ...item, url: absoluteUrl(item.url) }));

    const graph: SchemaNode[] = [
      {
        "@type": "ImageObject",
        "@id": `${canonicalUrl}#primary-image`,
        url: absoluteImage,
        contentUrl: absoluteImage,
        caption: resolvedImageAlt,
      },
      ...(resolvedBreadcrumbs.length
        ? [{
            "@type": "BreadcrumbList",
            "@id": `${canonicalUrl}#breadcrumb`,
            itemListElement: resolvedBreadcrumbs.map((item, index) => ({
              "@type": "ListItem",
              position: index + 1,
              name: item.name,
              item: item.url,
            })),
          }]
        : []),
      {
        "@type": pageType,
        "@id": `${canonicalUrl}#webpage`,
        url: canonicalUrl,
        name: fullTitle,
        description: cleanDescription,
        inLanguage: "en",
        isPartOf: { "@id": `${SITE_URL}/#website` },
        publisher: { "@id": `${SITE_URL}/#organization` },
        primaryImageOfPage: { "@id": `${canonicalUrl}#primary-image` },
        ...(resolvedBreadcrumbs.length ? { breadcrumb: { "@id": `${canonicalUrl}#breadcrumb` } } : {}),
        ...(primaryEntityId ? { mainEntity: { "@id": primaryEntityId } } : {}),
      },
      ...suppliedNodes,
    ];

    let scriptTag = document.querySelector("#page-structured-data") as HTMLScriptElement | null;
    if (!scriptTag) {
      scriptTag = document.createElement("script");
      scriptTag.id = "page-structured-data";
      scriptTag.type = "application/ld+json";
      document.head.appendChild(scriptTag);
    }
    scriptTag.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@graph": graph,
    }).replace(/</g, "\\u003c");
  }, [
    absoluteImage,
    breadcrumbs,
    canonicalUrl,
    cleanDescription,
    fullTitle,
    keywords,
    noIndex,
    pageType,
    resolvedImageAlt,
    structuredData,
    title,
    type,
  ]);

  return null;
};

export default SEO;
