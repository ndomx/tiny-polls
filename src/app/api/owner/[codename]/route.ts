import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { getResults } from "@/lib/submissions";

type OwnerRouteContext = {
  params: Promise<{ codename: string }>;
};

export async function GET(_request: Request, context: OwnerRouteContext) {
  const { codename } = await context.params;
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Admin auth required" }, { status: 401 });
  }

  const results = await getResults(codename, true);

  if (!results) {
    return NextResponse.json({ error: "Poll not found" }, { status: 404 });
  }

  return NextResponse.json(results);
}
