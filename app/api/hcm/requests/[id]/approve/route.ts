import { NextResponse } from "next/server";
import { getStore, getRequestStore } from "@/mocks/store";
import { approveRequest } from "@/mocks/hcm-logic";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const result = approveRequest(getStore(), getRequestStore(), id);

  if (result.type === "not_found") {
    return NextResponse.json(
      { code: "NOT_FOUND", message: "Request not found" },
      { status: 404 },
    );
  }
  if (result.type === "already_settled") {
    return NextResponse.json(
      { code: "CONFLICT", message: `Request already ${result.status}` },
      { status: 409 },
    );
  }
  if (result.type === "insufficient_balance") {
    return NextResponse.json(result.error, { status: 422 });
  }

  return NextResponse.json(result.response);
}
