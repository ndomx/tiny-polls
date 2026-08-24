import { getAdminSession } from "@/lib/admin-auth";
import { removePoll } from "@/lib/polls";
import { redirectTo } from "@/lib/redirect";

type RemovePollRouteContext = {
  params: Promise<{ codename: string }>;
};

export async function POST(_request: Request, context: RemovePollRouteContext) {
  const session = await getAdminSession();

  if (!session) {
    return redirectTo("/admin/login?next=/admin");
  }

  const { codename } = await context.params;
  await removePoll(codename);

  return redirectTo("/admin");
}
