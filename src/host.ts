export const DEFAULT_IFRAME_ORIGIN = 'https://embed.q2view.pages.dev';
export const DEFAULT_IFRAME_PATH = '/embed/';
export const IFRAME_ORIGIN_SETTING = 'iframeOrigin';
export const IFRAME_PATH_SETTING = 'iframePath';

let iframeOrigin = DEFAULT_IFRAME_ORIGIN;
let iframePath = DEFAULT_IFRAME_PATH;

export function getIframeOrigin(): string {
  return iframeOrigin;
}

export function getIframePath(): string {
  return iframePath;
}

export function setIframeOrigin(candidate: unknown): void {
  iframeOrigin = normalizeIframeOrigin(candidate);
}

export function setIframePath(candidate: unknown): void {
  iframePath = normalizeIframePath(candidate);
}

function normalizeIframeOrigin(candidate: unknown): string {
  if (typeof candidate !== 'string') {
    return DEFAULT_IFRAME_ORIGIN;
  }

  const value = candidate.trim();
  if (!value) {
    return DEFAULT_IFRAME_ORIGIN;
  }

  try {
    const parsed = new URL(value);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new Error('Unsupported protocol');
    }
    return parsed.origin;
  } catch (error) {
    console.warn(
      `[jupyterlab-rachis] Invalid iframe origin '${value}', using default '${DEFAULT_IFRAME_ORIGIN}'.`,
      error
    );
    return DEFAULT_IFRAME_ORIGIN;
  }
}

function normalizeIframePath(candidate: unknown): string {
  if (typeof candidate !== 'string') {
    return DEFAULT_IFRAME_PATH;
  }

  const value = candidate.trim();
  if (!value) {
    return DEFAULT_IFRAME_PATH;
  }

  const withLeadingSlash = value.startsWith('/') ? value : `/${value}`;
  let normalized = withLeadingSlash.replace(/\/{2,}/g, '/');

  if (normalized !== '/' && !normalized.endsWith('/')) {
    normalized = `${normalized}/`;
  }

  return normalized;
}
