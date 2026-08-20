type NoticeProps = {
  eyebrow?: string;
  title: string;
  message: string;
};

export function Notice({
  eyebrow = "Tiny Polls",
  title,
  message,
}: NoticeProps) {
  return (
    <main className="centerPage">
      <section className="noticePanel">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{message}</p>
      </section>
    </main>
  );
}
