import type { Metadata } from "next";
import { getDictionary } from "@/i18n/get-dictionary";
import { defaultLocale } from "@/i18n/locales";
import { getSiteUrl } from "@/lib/site-url";
import "./globals.css";

const dictionary = getDictionary(defaultLocale);

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: dictionary.metadata.title,
  description: dictionary.metadata.description,
  openGraph: {
    title: dictionary.metadata.title,
    description: dictionary.metadata.description,
    images: [
      {
        url: "/share-preview.jpeg",
        width: 1200,
        height: 630,
        alt: dictionary.metadata.title,
      },
    ],
    siteName: dictionary.common.appName,
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang={defaultLocale}>
      <body>{children}</body>
    </html>
  );
}
