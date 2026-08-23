import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { updatePoll } from "@/lib/polls";

type UpdatePollRouteContext = {
  params: Promise<{ codename: string }>;
};

function editPath(codename: string) {
  return `/admin/polls/${encodeURIComponent(codename)}/edit`;
}

function redirectWithError(request: Request, codename: string, error: string) {
  const url = new URL(editPath(codename), request.url);
  url.searchParams.set("error", error);
  return NextResponse.redirect(url, { status: 303 });
}

export async function POST(request: Request, context: UpdatePollRouteContext) {
  const { codename } = await context.params;
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.redirect(
      new URL(
        `/admin/login?next=${encodeURIComponent(editPath(codename))}`,
        request.url,
      ),
      {
        status: 303,
      },
    );
  }

  const result = await updatePoll(codename, await request.formData());

  if ("error" in result) {
    return redirectWithError(request, codename, result.error);
  }

  return NextResponse.redirect(new URL("/admin", request.url), { status: 303 });
}
