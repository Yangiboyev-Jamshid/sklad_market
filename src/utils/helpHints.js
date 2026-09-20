const HINT_SEEN_PREFIX = "skladx_help_hint_seen:";

export function hasSeenHint(id) {
  if (!id) return true;
  try {
    return window.localStorage.getItem(HINT_SEEN_PREFIX + id) === "1";
  } catch {
    return true;
  }
}

export function markHintSeen(id) {
  if (!id) return;
  try {
    window.localStorage.setItem(HINT_SEEN_PREFIX + id, "1");
  } catch {

  }
}
