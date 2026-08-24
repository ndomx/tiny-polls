import { getAdminSession } from "@/lib/admin-auth";
import { createPoll } from "@/lib/polls";
import { redirectTo } from "@/lib/redirect";

function redirectWithError(error: string) {
  const params = new URLSearchParams({ error });
  return redirectTo(`/admin/polls/new?${params.toString()}`);
}

export async function POST(request: Request) {
  const session = await getAdminSession();

  if (!session) {
    return redirectTo("/admin/login?next=/admin/polls/new");
  }

  const result = await createPoll(await request.formData());

  if ("error" in result) {
    return redirectWithError(result.error);
  }

  return redirectTo("/admin");
}
