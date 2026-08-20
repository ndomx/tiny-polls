import { NextResponse } from "next/server";
import { appConfig } from "@/lib/pocketbase";
import { getResults } from "@/lib/submissions";

type OwnerRouteContext = {
  params: Promise<{ codename: string }>;
};

export async function GET(request: Request, context: OwnerRouteContext) {
  const { codename } = await context.params;
  const url = new URL(request.url);

  if (url.searchParams.get("key") !== appConfig().ownerKey) {
    return NextResponse.json({ error: "Owner key required" }, { status: 401 });
  }

  const results = await getResults(codename, true);

  if (!results) {
    return NextResponse.json({ error: "Poll not found" }, { status: 404 });
  }

  return NextResponse.json(results);
}
