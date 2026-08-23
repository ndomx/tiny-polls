import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { createPoll } from "@/lib/polls";

function redirectWithError(request: Request, error: string) {
  const url = new URL("/admin/polls/new", request.url);
  url.searchParams.set("error", error);
  return NextResponse.redirect(url, { status: 303 });
}

export async function POST(request: Request) {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.redirect(
      new URL("/admin/login?next=/admin/polls/new", request.url),
      {
        status: 303,
      },
    );
  }

  const result = await createPoll(await request.formData());

  if ("error" in result) {
    return redirectWithError(request, result.error);
  }

  return NextResponse.redirect(new URL("/admin", request.url), { status: 303 });
}
