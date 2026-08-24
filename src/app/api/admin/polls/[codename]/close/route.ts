import { getAdminSession } from "@/lib/admin-auth";
import { closePoll } from "@/lib/polls";
import { redirectTo } from "@/lib/redirect";

type ClosePollRouteContext = {
  params: Promise<{ codename: string }>;
};

export async function POST(_request: Request, context: ClosePollRouteContext) {
  const session = await getAdminSession();

  if (!session) {
    return redirectTo("/admin/login?next=/admin");
  }

  const { codename } = await context.params;
  await closePoll(codename);

  return redirectTo("/admin");
}
