import { redirect } from "next/navigation";
import { AdminPollForm } from "@/components/admin-poll-form";
import { getAdminSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

type NewPollPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getParam(
  searchParams: Awaited<NewPollPageProps["searchParams"]>,
  key: string,
) {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] || "" : value || "";
}

export default async function NewPollPage({ searchParams }: NewPollPageProps) {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login?next=/admin/polls/new");
  }

  const query = await searchParams;

  return (
    <main className="adminPage">
      <section className="adminHero">
        <div>
          <p className="eyebrow">Admin</p>
          <h1>New Poll</h1>
          <p>Create a single-correct-answer multiple-choice poll.</p>
        </div>
      </section>

      <section className="adminPanel">
        <AdminPollForm
          action="/api/admin/polls"
          error={getParam(query, "error")}
          mode="create"
        />
      </section>
    </main>
  );
}
