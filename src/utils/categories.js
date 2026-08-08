export function flattenCategoryTree(tree) {
  const result = [];
  const walk = (nodes, depth) => {
    const sorted = [...(nodes ?? [])].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    sorted.forEach((c) => {
      result.push({ id: c.id, name: c.name, slug: c.slug, depth });
      walk(c.children, depth + 1);
    });
  };
  walk(tree, 0);
  return result;
}
