export function compareVersions(a: string, b: string) {
  const parse = (value: string) =>
    value
      .split('.')
      .map((part) => parseInt(part.replace(/\D.*$/, ''), 10) || 0);

  const left = parse(a);
  const right = parse(b);
  const length = Math.max(left.length, right.length);

  for (let i = 0; i < length; i += 1) {
    const l = left[i] || 0;
    const r = right[i] || 0;
    if (l > r) return 1;
    if (l < r) return -1;
  }
  return 0;
}

export function isVersionBelow(current?: string | null, minimum?: string | null) {
  if (!current || !minimum) return false;
  return compareVersions(current, minimum) < 0;
}
