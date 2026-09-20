import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import PromoInterstitial from "../ui/PromoInterstitial";
import { promoInterstitials } from "../../data/promoInterstitials";
import { isCampaignEligible, recordCampaignShown } from "../../utils/promoInterstitial";

function resolvePageKey(pathname) {
  if (pathname === "/") return "home";
  if (pathname.startsWith("/catalog")) return "catalog";
  if (pathname.startsWith("/companies")) return "companies";
  if (pathname.startsWith("/product/")) return "product";
  if (pathname.startsWith("/profile")) return "profile";
  return null;
}

export default function PromoInterstitialManager() {
  const location = useLocation();
  const [dismissedForPath, setDismissedForPath] = useState(null);

  const pageKey = resolvePageKey(location.pathname);
  const eligible = pageKey && dismissedForPath !== location.pathname
    ? promoInterstitials.find((c) => isCampaignEligible(c, pageKey))
    : null;

  useEffect(() => {
    if (eligible) recordCampaignShown(eligible.id);
  }, [eligible]);

  return <PromoInterstitial campaign={eligible} onClose={() => setDismissedForPath(location.pathname)} />;
}
