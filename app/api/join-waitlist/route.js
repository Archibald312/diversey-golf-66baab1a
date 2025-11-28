import { put, get } from "@vercel/blob";

export async function POST(req) {
  try {
    const { email, name } = await req.json();

    if (!email) {
      return new Response(JSON.stringify({ error: "Email required" }), { status: 400, headers: { "Content-Type": "application/json" } });
    }

    // Step 1 — try to get the existing waitlist
    let waitlist = [];

    try {
      const existing = await get("waitlist.json");
      if (existing) {
        const text = await existing.text();
        waitlist = JSON.parse(text || "[]");
      }
    } catch (e) {
      // If file doesn't exist yet, keep empty array
    }

    // Step 2 — add new entry
    waitlist.push({
      name: name || "",
      email,
      joinedAt: new Date().toISOString(),
    });

    // Step 3 — overwrite file
    await put("waitlist.json", JSON.stringify(waitlist, null, 2), {
      access: "public",
      contentType: "application/json",
    });

    return new Response(JSON.stringify({ ok: true }), { status: 201, headers: { "Content-Type": "application/json" } });
  } catch (err) {
    console.error("join-waitlist POST error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}

export async function GET() {
  try {
    let waitlist = [];
    try {
      const existing = await get("waitlist.json");
      if (existing) {
        const text = await existing.text();
        waitlist = JSON.parse(text || "[]");
      }
    } catch (e) {
      // file may not exist yet — return empty list
    }

    return new Response(JSON.stringify({ count: waitlist.length, list: waitlist }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (err) {
    console.error("join-waitlist GET error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}
