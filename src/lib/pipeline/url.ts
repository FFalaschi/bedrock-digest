const TRACKING_PARAMS = [
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
  'utm_id', 'fbclid', 'gclid', 'gbraid', 'wbraid', 'msclkid',
  'mc_cid', 'mc_eid', 'ref',
];

export function canonicalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    u.hostname = u.hostname.toLowerCase();
    TRACKING_PARAMS.forEach(p => u.searchParams.delete(p));
    u.pathname = u.pathname.replace(/\/$/, '') || '/';
    u.hash = '';
    return u.toString();
  } catch {
    return url.toLowerCase().replace(/\/$/, '');
  }
}
