import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
import { getLocale, withLocale } from "@/i18n/locales";
import { getPoll, isExpired } from "@/lib/polls";
import { redirectTo } from "@/lib/redirect";
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
  const form = await request.formData();
  const locale = getLocale(form.get("locale"));
  const poll = await getPoll(codename);

  if (!poll) {
    return new NextResponse("pollNotFound", { status: 404 });
  }

  if (isExpired(poll)) {
    return new NextResponse("pollClosed", { status: 400 });
  }

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

  if ("errorCode" in result) {
    return new NextResponse(result.errorCode, { status: 400 });
  }

  const response = redirectTo(
    withLocale(locale, `/polls/${encodeURIComponent(poll.codename)}/results`),
  );

  response.cookies.set(voterCookieName, voterId, {
    httpOnly: true,
    maxAge: 31536000,
    path: "/",
    sameSite: "lax",
  });

  return response;
}
