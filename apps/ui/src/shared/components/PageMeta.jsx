import { Helmet } from 'react-helmet-async';
import {
  SITE_NAME,
  SITE_URL,
  DEFAULT_SEO_DESCRIPTION,
  DEFAULT_OG_IMAGE,
} from '@/shared/constants/seo';

/**
 * PageMeta — injects per-route <title>, <meta name="description">, and Open Graph tags.
 *
 * @param {string}  title        Page title (appended with " | Big Bull")
 * @param {string}  description  Meta description for this page
 * @param {string}  [path]       Canonical path, e.g. "/explore" (defaults to current path)
 * @param {string}  [image]      OG image URL (defaults to /product-preview.png)
 * @param {boolean} [noIndex]    Pass true for auth-only pages to prevent indexing
 */
export const PageMeta = ({
  title,
  description = DEFAULT_SEO_DESCRIPTION,
  path,
  image = DEFAULT_OG_IMAGE,
  noIndex = false,
}) => {
  const fullTitle = title
    ? `${title} | ${SITE_NAME}`
    : `${SITE_NAME} - Virtual Stock Market Simulator`;
  const canonicalUrl = `${SITE_URL}${path ?? ''}`;
  const absoluteImage = image.startsWith('http') ? image : `${SITE_URL}${image}`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {noIndex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow" />
      )}
      {path && <link rel="canonical" href={canonicalUrl} />}

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={absoluteImage} />
      {path && <meta property="og:url" content={canonicalUrl} />}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />
    </Helmet>
  );
};

export default PageMeta;
