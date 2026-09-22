import Link from "next/link";
import { ErrorPage, getCachedPageParams } from "@sitecore-content-sdk/nextjs";
import client from "lib/sitecore-client";
import scConfig from "sitecore.config";
import Layout from "src/Layout";
import Providers from "src/Providers";
import { NextIntlClientProvider } from "next-intl";

export default async function NotFound() {
  const { site, locale } = getCachedPageParams();

  try {
    const page = await client.getErrorPage(ErrorPage.NotFound, {
      site: site || scConfig.defaultSite,
      locale: locale || scConfig.defaultLanguage,
    });

    if (page) {
      // Error pages render the same for every consumer; no detection needed here
      const pageWithConsumer = { ...page, consumer: { mode: "default" as const } };
      return (
        <NextIntlClientProvider>
          <Providers page={pageWithConsumer}>
            <Layout page={pageWithConsumer} />
          </Providers>
        </NextIntlClientProvider>
      );
    }
  } catch (error) {
    console.error("Error fetching 404 page:", error);
  }

  return (
    <div style={{ padding: 10 }}>
      <h1>Page not found</h1>
      <p>This page does not exist.</p>
      <Link href="/">Go to the Home page</Link>
    </div>
  );
}
