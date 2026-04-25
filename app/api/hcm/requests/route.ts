import { NextResponse } from "next/server";
import { getRequestStore } from "@/mocks/store";
import { getRequests } from "@/mocks/hcm-logic";

export async function GET() {
  return NextResponse.json({ requests: getRequests(getRequestStore()) });
}
