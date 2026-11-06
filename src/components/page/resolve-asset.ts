const assets = import.meta.glob<string>('/src/assets/**/*', {
  eager: true,
  query: '?url',
  import: 'default',
});

export function resolveAssetUrl(path: string | undefined): string | undefined {
  if (!path) return undefined;
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return assets[normalized];
}
