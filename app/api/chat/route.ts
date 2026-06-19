import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPT } from "@/components/ChatAssistant/systemPrompt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Modèle : « claude-haiku-4-5 ».
 * Le prompt initial demandait « claude-haiku-3-5 », mais cet identifiant n'est
 * pas un model ID valide et Claude Haiku 3.5 est retiré de l'API. On utilise donc
 * le Haiku courant — l'intention « rapide + économique » est conservée.
 */
const MODEL = "claude-haiku-4-5";
const MAX_TOKENS = 400;

type ChatRole = "user" | "assistant";
type ChatMessage = { role: ChatRole; content: string };

/** Garde-fou de validation du corps de requête. */
function parseMessages(body: unknown): ChatMessage[] | null {
  if (
    typeof body !== "object" ||
    body === null ||
    !("messages" in body) ||
    !Array.isArray((body as { messages: unknown }).messages)
  ) {
    return null;
  }

  const raw = (body as { messages: unknown[] }).messages;
  const messages: ChatMessage[] = [];

  for (const item of raw) {
    if (
      typeof item === "object" &&
      item !== null &&
      "role" in item &&
      "content" in item &&
      (item.role === "user" || item.role === "assistant") &&
      typeof item.content === "string"
    ) {
      messages.push({ role: item.role, content: item.content });
    }
  }

  return messages.length > 0 ? messages : null;
}

export async function POST(request: Request) {
  // Clé absente → l'assistant doit échouer proprement sans casser le simulateur.
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "Assistant non configuré (clé API manquante)." }),
      { status: 503, headers: { "Content-Type": "application/json" } },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Requête invalide." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const messages = parseMessages(body);
  if (!messages) {
    return new Response(
      JSON.stringify({ error: "Aucun message valide fourni." }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const anthropic = new Anthropic({ apiKey });
  const encoder = new TextEncoder();

  const readable = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const stream = anthropic.messages.stream({
          model: MODEL,
          max_tokens: MAX_TOKENS,
          system: SYSTEM_PROMPT,
          messages,
        });

        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
      } catch {
        // L'erreur est renvoyée comme texte : le widget l'affiche sans planter.
        controller.enqueue(
          encoder.encode("Assistant temporairement indisponible."),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}
