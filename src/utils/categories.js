export function flattenCategoryTree(tree) {
  const result = [];
  const sorted = [...(tree ?? [])].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  sorted.forEach((c) => {
    result.push({ id: c.id, name: c.name, slug: c.slug, depth: 0 });
    const children = [...(c.children ?? [])].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    children.forEach((s) => {
      result.push({ id: s.id, name: s.name, slug: s.slug, depth: 1 });
    });
  });
  return result;
}
