// Manus LLM — deprecated. Stub to prevent TS errors.

export type Role = "system" | "user" | "assistant" | "tool" | "function";

export type TextContent = { type: "text"; text: string };
export type ImageContent = { type: "image_url"; image_url: { url: string } };
export type Content = string | (TextContent | ImageContent)[];

export type Message = {
  role: Role;
  content: Content;
  name?: string;
};

export async function chat(_messages: Message[]): Promise<string> {
  throw new Error("LLM service is not available (Manus dependency removed)");
}

export async function streamChat(
  _messages: Message[],
  _onChunk: (chunk: string) => void
): Promise<string> {
  throw new Error("LLM service is not available (Manus dependency removed)");
}
