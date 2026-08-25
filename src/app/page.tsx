import { redirect } from "next/navigation";
import { defaultLocale, withLocale } from "@/i18n/locales";

export default function RootPage() {
  redirect(withLocale(defaultLocale, "/"));
}
