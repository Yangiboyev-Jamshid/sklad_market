const STORAGE_KEY = "skladx_promo_interstitial_state";

function loadState() {
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveState(state) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {

  }
}

export function isCampaignEligible(campaign, pageKey) {
  if (!campaign?.active) return false;
  if (!campaign.targetPages?.includes(pageKey)) return false;

  const now = Date.now();
  if (campaign.startDate && now < new Date(campaign.startDate).getTime()) return false;
  if (campaign.endDate && now > new Date(campaign.endDate).getTime()) return false;

  const state = loadState()[campaign.id];
  const shows = state?.shows ?? 0;
  if (campaign.maxShowsPerUser && shows >= campaign.maxShowsPerUser) return false;

  const lastShownAt = state?.lastShownAt ?? 0;
  const cooldownMs = (campaign.cooldownHours ?? 24) * 60 * 60 * 1000;
  if (now - lastShownAt < cooldownMs) return false;

  return true;
}

export function recordCampaignShown(campaignId) {
  const all = loadState();
  const current = all[campaignId] ?? { shows: 0, lastShownAt: 0 };
  all[campaignId] = { shows: current.shows + 1, lastShownAt: Date.now() };
  saveState(all);
}
