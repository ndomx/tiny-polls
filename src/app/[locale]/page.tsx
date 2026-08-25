import { notFound } from "next/navigation";
import { getDictionary } from "@/i18n/get-dictionary";
import { isLocale } from "@/i18n/locales";

type HomeProps = {
  params: Promise<{ locale: string }>;
};

export default async function Home({ params }: HomeProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const dictionary = getDictionary(locale);

  return (
    <main className="centerPage">
      <section className="noticePanel">
        <p className="eyebrow">{dictionary.common.appName}</p>
        <h1>{dictionary.home.title}</h1>
        <p>{dictionary.home.description}</p>
      </section>
    </main>
  );
}
