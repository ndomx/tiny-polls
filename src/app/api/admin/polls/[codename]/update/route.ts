import { getAdminSession } from "@/lib/admin-auth";
import { updatePoll } from "@/lib/polls";
import { redirectTo } from "@/lib/redirect";

type UpdatePollRouteContext = {
  params: Promise<{ codename: string }>;
};

function editPath(codename: string) {
  return `/admin/polls/${encodeURIComponent(codename)}/edit`;
}

function redirectWithError(codename: string, error: string) {
  const params = new URLSearchParams({ error });
  return redirectTo(`${editPath(codename)}?${params.toString()}`);
}

export async function POST(request: Request, context: UpdatePollRouteContext) {
  const { codename } = await context.params;
  const session = await getAdminSession();

  if (!session) {
    return redirectTo(
      `/admin/login?next=${encodeURIComponent(editPath(codename))}`,
    );
  }

  const result = await updatePoll(codename, await request.formData());

  if ("error" in result) {
    return redirectWithError(codename, result.error);
  }

  return redirectTo("/admin");
}
