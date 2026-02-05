import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  noIndex?: boolean;
}

const SITE_NAME = 'PayPing';
const DEFAULT_TITLE = 'PayPing — Stop forgetting follow-ups. Stop losing money.';
const DEFAULT_DESCRIPTION = 'PayPing helps businesses track follow-ups and payment reminders so no client slips through. See who to message today and stay organized.';
const DEFAULT_OG_DESCRIPTION = 'PayPing shows you exactly who to follow up with and what to say, so you never lose money from missed reminders.';
const DEFAULT_TWITTER_TITLE = 'PayPing — Client Follow-Ups Made Simple';
const DEFAULT_TWITTER_DESCRIPTION = 'Never forget a follow-up or payment again. PayPing keeps your business organized.';
const THEME_COLOR = 'hsl(230, 75%, 45%)'; // Primary color from design system
const OG_IMAGE = '/og-image.png';

export function SEO({
  title,
  description = DEFAULT_DESCRIPTION,
  ogTitle,
  ogDescription = DEFAULT_OG_DESCRIPTION,
  ogImage = OG_IMAGE,
  twitterTitle,
  twitterDescription = DEFAULT_TWITTER_DESCRIPTION,
  noIndex = false,
}: SEOProps) {
  const fullTitle = title ? `${title} — ${SITE_NAME}` : DEFAULT_TITLE;
  const finalOgTitle = ogTitle || fullTitle;
  const finalTwitterTitle = twitterTitle || DEFAULT_TWITTER_TITLE;
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content="follow-up reminders, payment reminders, client follow-up tool, small business productivity, PayPing" />
      <meta name="robots" content={noIndex ? 'noindex, nofollow' : 'index, follow'} />
      <meta name="theme-color" content={THEME_COLOR} />

      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={finalOgTitle} />
      <meta property="og:description" content={ogDescription} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:url" content={currentUrl} />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={finalTwitterTitle} />
      <meta name="twitter:description" content={twitterDescription} />
      <meta name="twitter:image" content={ogImage} />
    </Helmet>
  );
}
