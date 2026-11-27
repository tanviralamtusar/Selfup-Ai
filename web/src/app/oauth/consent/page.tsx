import { Suspense } from 'react';
import { OAuthConsent } from '@/components/mcp/OAuthConsent';

export default function OAuthConsentPage() {
  return <Suspense fallback={<p role="status">Loading authorization request...</p>}><OAuthConsent /></Suspense>;
}
