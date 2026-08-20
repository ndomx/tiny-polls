import { NextResponse } from "next/server";
import { getResults } from "@/lib/submissions";

type ResultsRouteContext = {
  params: Promise<{ codename: string }>;
};

export async function GET(_request: Request, context: ResultsRouteContext) {
  const { codename } = await context.params;
  const results = await getResults(codename);

  if (!results) {
    return NextResponse.json({ error: "Poll not found" }, { status: 404 });
  }

  return NextResponse.json(results);
}
