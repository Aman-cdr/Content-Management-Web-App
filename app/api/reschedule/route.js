// Mock reschedule API
// Accepts a new date/time and returns confirmation

import { checkAuth } from "@/lib/api-middleware";

export async function POST(request) {
  // ── Auth guard ──
  const authError = await checkAuth(request);
  if (authError) return authError;

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return Response.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const { date, time, contentId } = body;

  if (!date) {
    return Response.json(
      { success: false, error: "Date is required" },
      { status: 400 }
    );
  }

  await new Promise((r) => setTimeout(r, 500));

  return Response.json({
    success: true,
    message: `Content rescheduled to ${date}${time ? ` at ${time}` : ""}`,
    scheduledAt: new Date(`${date}T${time || "16:00"}:00Z`).toISOString(),
    contentId: contentId || "default",
  });
}
