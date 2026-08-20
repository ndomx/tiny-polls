import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
import { getPoll, isExpired } from "@/lib/polls";
import { saveSubmission } from "@/lib/submissions";
import { getOrCreateVoterId, voterCookieName } from "@/lib/voter";

type VoteRouteContext = {
  params: Promise<{ codename: string }>;
};

function formValue(form: FormData, key: string) {
  return String(form.get(key) || "").trim();
}

export async function POST(request: Request, context: VoteRouteContext) {
  const { codename } = await context.params;
  const poll = await getPoll(codename);

  if (!poll) {
    return new NextResponse("Poll not found", { status: 404 });
  }

  if (isExpired(poll)) {
    return new NextResponse("Poll is closed", { status: 400 });
  }

  const form = await request.formData();
  const cookieStore = await cookies();
  const requestHeaders = await headers();
  const voterId = getOrCreateVoterId(cookieStore.get(voterCookieName)?.value);
  const result = await saveSubmission(poll, {
    source: formValue(form, "source") || "direct",
    selectedOptionIds: form
      .getAll("options")
      .filter((value): value is string => typeof value === "string"),
    userAgent: requestHeaders.get("user-agent") || "",
    utmCampaign: formValue(form, "utm_campaign"),
    utmMedium: formValue(form, "utm_medium"),
    utmSource: formValue(form, "utm_source"),
    voterId,
    voterName: formValue(form, "voterName"),
  });

  if ("error" in result) {
    return new NextResponse(result.error, { status: 400 });
  }

  const response = NextResponse.redirect(
    new URL(`/polls/${encodeURIComponent(poll.codename)}/results`, request.url),
    { status: 303 },
  );

  response.cookies.set(voterCookieName, voterId, {
    httpOnly: true,
    maxAge: 31536000,
    path: "/",
    sameSite: "lax",
  });

  return response;
}
