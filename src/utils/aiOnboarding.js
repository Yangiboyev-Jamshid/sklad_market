const ONBOARDING_VERSION = "v1";

function normalizeRole(role) {
  return String(role || "").trim().toUpperCase();
}

export function onboardingKey(user) {
  const identity = user?.username || (user?.id != null ? `id-${user.id}` : null);
  if (!identity) return null;
  return `skladx_ai_onboarding_${ONBOARDING_VERSION}:${identity}:${normalizeRole(user?.role) || "USER"}`;
}

export function hasSeenOnboarding(key) {
  if (!key) return true;
  try {
    return window.localStorage.getItem(key) === "seen";
  } catch {
    return false;
  }
}

export function shouldShowAiBanner(user, isLoggedIn) {
  if (!isLoggedIn) return false;
  const key = onboardingKey(user);
  return Boolean(key && !hasSeenOnboarding(key));
}
