import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { removePoll } from "@/lib/polls";

type RemovePollRouteContext = {
  params: Promise<{ codename: string }>;
};

export async function POST(request: Request, context: RemovePollRouteContext) {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.redirect(
      new URL("/admin/login?next=/admin", request.url),
      {
        status: 303,
      },
    );
  }

  const { codename } = await context.params;
  await removePoll(codename);

  return NextResponse.redirect(new URL("/admin", request.url), { status: 303 });
}
