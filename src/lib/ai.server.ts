import { createOpenAI } from "@ai-sdk/openai";
import { APICallError, streamText } from "ai";

const MODEL = "openai/gpt-6-astra";
const GATEWAY = "https://ai.gateway.lovable.dev/v1";

export class FriendlyError extends Error {}

/** Streams a Responses call to completion server-side and returns parsed JSON. */
export async function runJson(instructions: string, prompt: string): Promise<unknown> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new FriendlyError("AI is not configured for this app yet.");
  const provider = createOpenAI({
    baseURL: GATEWAY,
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
  });
  let text: string;
  try {
    const result = streamText({
      model: provider.responses(MODEL),
      instructions,
      messages: [{ role: "user", content: prompt }],
      maxRetries: 0,
      providerOptions: {
        openai: {
          forceReasoning: true,
          reasoningEffort: "low",
          reasoningSummary: "auto",
          store: false,
          include: ["reasoning.encrypted_content"],
        },
      },
    });
    text = await result.text;
  } catch (e) {
    const status = APICallError.isInstance(e) ? e.statusCode : undefined;
    console.error("AI call failed", status, e instanceof Error ? e.message : e);
    if (status === 429) throw new FriendlyError("PathForge is handling a lot of requests. Please wait a moment and try again.");
    if (status === 402) throw new FriendlyError("AI credits for this workspace are used up. Add credits to continue generating.");
    if (status === 403) throw new FriendlyError("AI access is currently blocked for this workspace.");
    throw new FriendlyError("Career analysis is temporarily unavailable. Please try again.");
  }
  return extractJson(text);
}

export function extractJson(text: string): unknown {
  const cleaned = text.replace(/```(?:json)?/gi, "");
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end <= start) throw new FriendlyError("The AI returned an unexpected format. Please try again.");
  try {
    return JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    throw new FriendlyError("The AI returned an unexpected format. Please try again.");
  }
}
