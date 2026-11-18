const KEY = 'zuka_saved_posts';

export function getSavedPosts() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (_) {
    return [];
  }
}

export function toggleSavePost(post) {
  const list = getSavedPosts();
  const exists = list.some((p) => String(p.id) === String(post.id));
  const next = exists ? list.filter((p) => String(p.id) !== String(post.id)) : [post, ...list];
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch (_) {}
  return !exists;
}
