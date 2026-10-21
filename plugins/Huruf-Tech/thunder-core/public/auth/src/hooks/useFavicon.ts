import React from "react";

function setFavicon(href: string) {
  let link = document.querySelector<HTMLLinkElement>("link[rel='icon']");

  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }

  link.removeAttribute("type");
  link.href = href;
}

/** Uses `href` as the favicon, or `fallback` if that image fails to load. */
export function useFavicon(href: string, fallback: string) {
  React.useEffect(() => {
    let cancelled = false;
    const image = new Image();

    image.onload = () => !cancelled && setFavicon(href);
    image.onerror = () => !cancelled && setFavicon(fallback);
    image.src = href;

    return () => {
      cancelled = true;
    };
  }, [href, fallback]);
}
