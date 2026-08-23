import { redirect } from "next/navigation";
import { AdminPollForm } from "@/components/admin-poll-form";
import { Notice } from "@/components/notice";
import { getAdminSession } from "@/lib/admin-auth";
import { getPoll } from "@/lib/polls";

export const dynamic = "force-dynamic";

type EditPollPageProps = {
  params: Promise<{ codename: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getParam(
  searchParams: Awaited<EditPollPageProps["searchParams"]>,
  key: string,
) {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] || "" : value || "";
}

export default async function EditPollPage({
  params,
  searchParams,
}: EditPollPageProps) {
  const { codename } = await params;
  const session = await getAdminSession();

  if (!session) {
    redirect(
      `/admin/login?next=${encodeURIComponent(
        `/admin/polls/${encodeURIComponent(codename)}/edit`,
      )}`,
    );
  }

  const poll = await getPoll(codename);

  if (!poll) {
    return (
      <Notice
        eyebrow="Admin"
        title="Poll not found"
        message="This poll cannot be edited because it does not exist."
      />
    );
  }

  const query = await searchParams;

  return (
    <main className="adminPage">
      <section className="adminHero">
        <div>
          <p className="eyebrow">Admin</p>
          <h1>Edit Poll</h1>
          <p>{poll.name}</p>
        </div>
      </section>

      <section className="adminPanel">
        <AdminPollForm
          action={`/api/admin/polls/${encodeURIComponent(poll.codename)}/update`}
          error={getParam(query, "error")}
          mode="edit"
          poll={poll}
        />
      </section>
    </main>
  );
}
