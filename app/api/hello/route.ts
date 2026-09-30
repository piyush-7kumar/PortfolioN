import { contact, person } from "@/content/site";

/*
 * The endpoint from the Contact section's Source layer. It forwards messages
 * to CONTACT_WEBHOOK_URL (Slack, Discord, Zapier and similar all accept a
 * JSON POST). Until that is set it says so instead of pretending to deliver.
 */

export function GET() {
  return Response.json({
    usage: "POST JSON with name, building and replyTo.",
    example: { name: "Your name", building: "What you're building", replyTo: "you@example.com" },
    or: `mailto:${person.email}`,
  });
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "Send a JSON body." }, { status: 400 });
  }

  const field = (key: string, max: number) =>
    typeof body[key] === "string" ? (body[key] as string).trim().slice(0, max) : "";
  const message = { name: field("name", 120), building: field("building", 4000), replyTo: field("replyTo", 200) };
  if (!message.building || !message.replyTo) {
    return Response.json({ ok: false, error: "Include what you're building and how to reach you." }, { status: 422 });
  }

  const webhook = process.env.CONTACT_WEBHOOK_URL;
  if (!webhook) {
    return Response.json(
      { ok: false, error: `This endpoint isn't connected yet. Email ${person.email} instead.` },
      { status: 503 },
    );
  }

  const sent = await fetch(webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: `New message from ${message.name || "someone"} (${message.replyTo}):\n${message.building}`,
      ...message,
    }),
  }).catch(() => null);

  if (!sent?.ok) {
    return Response.json({ ok: false, error: `Couldn't deliver that. Email ${person.email} instead.` }, { status: 502 });
  }
  return Response.json({ ok: true, reply: `within ${contact.replyWithin}`, from: person.email });
}
