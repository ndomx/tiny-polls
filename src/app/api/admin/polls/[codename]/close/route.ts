import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { closePoll } from "@/lib/polls";

type ClosePollRouteContext = {
  params: Promise<{ codename: string }>;
};

export async function POST(request: Request, context: ClosePollRouteContext) {
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
  await closePoll(codename);

  return NextResponse.redirect(new URL("/admin", request.url), { status: 303 });
}
