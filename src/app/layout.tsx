import type { Metadata } from "next";
import { getDictionary } from "@/i18n/get-dictionary";
import { defaultLocale } from "@/i18n/locales";
import "./globals.css";

const dictionary = getDictionary(defaultLocale);

export const metadata: Metadata = {
  title: dictionary.metadata.title,
  description: dictionary.metadata.description,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang={defaultLocale}>
      <body>{children}</body>
    </html>
  );
}
