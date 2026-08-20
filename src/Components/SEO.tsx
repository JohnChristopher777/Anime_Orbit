import React, { useEffect } from "react";

interface SEOProps {
  title: string;
  description: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: "website" | "article" | "video.tv_show" | "video.movie";
  structuredData?: Record<string, any>;
}

export const SEO: React.FC<SEOProps> = ({
  title,
  description,
  keywords = "Anime Orbit, anime database, anime guide, anime compass, popular anime, top airing anime, upcoming anime, anime episode guide, character gallery, anime reviews",
  image = "https://animeorbit.web.app/animeorbit.jpg",
  url = typeof window !== "undefined" ? window.location.href : "https://animeorbit.web.app/",
  type = "website",
  structuredData,
}) => {
  const fullTitle = title.includes("Anime Orbit") ? title : `${title} | Anime Orbit`;

  useEffect(() => {
    // 1. Update Document Title
    document.title = fullTitle;

    // Helper function to update or create meta tags
    const updateMetaTag = (selector: string, attrName: string, attrVal: string, content: string) => {
      let element = document.querySelector(selector) as HTMLMetaElement | null;
      if (!element) {
        element = document.createElement("meta");
        element.setAttribute(attrName, attrVal);
        document.head.appendChild(element);
      }
      element.setAttribute("content", content);
    };

    // 2. Primary Meta Tags
    updateMetaTag('meta[name="description"]', 'name', 'description', description);
    updateMetaTag('meta[name="keywords"]', 'name', 'keywords', keywords);
    updateMetaTag('meta[name="title"]', 'name', 'title', fullTitle);

    // 3. Open Graph Tags
    updateMetaTag('meta[property="og:title"]', 'property', 'og:title', fullTitle);
    updateMetaTag('meta[property="og:description"]', 'property', 'og:description', description);
    updateMetaTag('meta[property="og:image"]', 'property', 'og:image', image);
    updateMetaTag('meta[property="og:url"]', 'property', 'og:url', url);
    updateMetaTag('meta[property="og:type"]', 'property', 'og:type', type);

    // 4. Twitter Card Tags
    updateMetaTag('meta[name="twitter:title"]', 'name', 'twitter:title', fullTitle);
    updateMetaTag('meta[name="twitter:description"]', 'name', 'twitter:description', description);
    updateMetaTag('meta[name="twitter:image"]', 'name', 'twitter:image', image);

    // 5. Canonical Link
    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonicalLink) {
      canonicalLink = document.createElement("link");
      canonicalLink.setAttribute("rel", "canonical");
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute("href", url);

    // 6. Schema.org JSON-LD Structured Data
    let scriptTag = document.querySelector("#schema-structured-data") as HTMLScriptElement | null;
    if (!scriptTag) {
      scriptTag = document.createElement("script");
      scriptTag.id = "schema-structured-data";
      scriptTag.type = "application/ld+json";
      document.head.appendChild(scriptTag);
    }

    const defaultSchema = {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: fullTitle,
      description: description,
      url: url,
      publisher: {
        "@type": "Organization",
        name: "Anime Orbit",
        logo: {
          "@type": "ImageObject",
          url: "https://animeorbit.web.app/animeorbit.jpg",
        },
      },
    };

    scriptTag.text = JSON.stringify(structuredData || defaultSchema);
  }, [fullTitle, description, keywords, image, url, type, structuredData]);

  return null;
};

export default SEO;
