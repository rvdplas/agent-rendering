import Link from 'next/link';
import { Metadata } from 'next';
import { ErrorPage } from '@sitecore-content-sdk/nextjs';
import client from 'lib/sitecore-client';
import scConfig from 'sitecore.config';
import Layout from 'src/Layout';
import Providers from 'src/Providers';


// Metadata for 404 Not Found page
export const metadata: Metadata = {
  title: 'Page Not Found',
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default async function NotFound() {
  if (scConfig.defaultSite) {
    const page = await client.getErrorPage(ErrorPage.NotFound, {
      site: scConfig.defaultSite,
      locale: scConfig.defaultLanguage,
    });

    if (page) {
      // Error pages render the same for every consumer; no detection needed here
      const pageWithConsumer = { ...page, consumer: { mode: 'default' as const } };
      return (
        <Providers page={pageWithConsumer}>
          <Layout page={pageWithConsumer} />
        </Providers>
      );
    }
  }

  return (
    <div style={{ padding: 10 }}>
      <h1>Page not found</h1>
      <p>This page does not exist.</p>
      <Link href="/">Go to the Home page</Link>
    </div>
  );
}
