import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import type { Message } from "./types";

export const ChatCompletion = async (
  model: string,
  messages: Message[],
  cb: (chunk: string) => void
) => {
  return new Promise<void>(async (resolve, reject) => {
    try {
      const apiKey = process.env.API_KEY!;
      const genAI = new GoogleGenerativeAI(apiKey);
      const aiModel = genAI.getGenerativeModel({ model });

      // Convert your messages into Gemini's "contents" format
      const contents = messages.map((msg) => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }],
      }));

      // Start streaming
      const result = await aiModel.generateContentStream({
        contents,
        systemInstruction: {
          role: "system",
          parts: [
            {
              text: `
You are BlinkAI, an AI assistant that can answer questions and help with tasks.
Be helpful and provide relevant information.
Be respectful and polite in all interactions.
Be engaging and maintain a conversational tone.
Always use LaTeX for mathematical expressions:
- Inline math must be wrapped in single dollar signs: $content$
- Display math must be wrapped in double dollar signs: $$content$$
- Display math should be placed on its own line, with nothing else on that line.
Do not nest math delimiters or mix styles.
Examples:
- Inline: The equation $E = mc^2$ shows mass-energy equivalence.
- Display: 
$$\\frac{d}{dx}\\sin(x) = \\cos(x)$$
`,
            },
          ],
        },
      });

      for await (const chunk of result.stream) {
        const candidate = chunk.candidates?.[0];
        const parts = candidate?.content?.parts;
        if (!parts) continue;
        for (const part of parts) {
          const textPart = (part as any)?.text;
          if (textPart) cb(textPart);
        }
      }

      resolve();
    } catch (error) {
      reject(error);
    }
  });
};
