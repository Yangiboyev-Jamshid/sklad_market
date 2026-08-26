const KEY_PREFIX = "sklad_banner_chat_threads_";

function storageKey(userId) {
  return `${KEY_PREFIX}${userId ?? "anon"}`;
}

export function getBannerThreads(userId) {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addBannerThread(userId, thread) {
  try {
    const list = getBannerThreads(userId);
    if (list.some((t) => t.thread_id === thread.thread_id)) return list;
    const next = [{ ...thread, created_at: new Date().toISOString() }, ...list];
    localStorage.setItem(storageKey(userId), JSON.stringify(next));
    return next;
  } catch {
    return getBannerThreads(userId);
  }
}
