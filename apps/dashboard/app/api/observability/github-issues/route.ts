import type { NextRequest } from "next/server";

import { handleGithubIssueAutomationPOST } from "./runtime";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  return handleGithubIssueAutomationPOST(request);
}
