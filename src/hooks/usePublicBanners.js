import { useState, useEffect } from "react";
import { getHomepageData } from "../api/api";

function normalize(data) {
  return (data?.banners ?? []).map((b) => ({ id: b.id, img: b.imageUrl, href: b.targetUrl }));
}

let cachedBanners = null;
let inflightRequest = null;

export function usePublicBanners() {
  const [banners, setBanners] = useState(cachedBanners ?? []);
  const [loading, setLoading] = useState(cachedBanners === null);

  useEffect(() => {
    if (cachedBanners !== null) {
      setBanners(cachedBanners);
      setLoading(false);
      return;
    }

    let ignore = false;
    inflightRequest = inflightRequest ?? getHomepageData()
      .then(normalize)
      .catch(() => [])
      .then((result) => {
        cachedBanners = result;
        return result;
      })
      .finally(() => { inflightRequest = null; });

    inflightRequest.then((result) => {
      if (!ignore) {
        setBanners(result);
        setLoading(false);
      }
    });

    return () => { ignore = true; };
  }, []);

  return { banners, loading };
}
