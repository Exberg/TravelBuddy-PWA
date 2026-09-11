import { defineChannel, POST } from "eve/channels";
import {
  extractPreferenceKeywords,
  MAX_PREFERENCE_LENGTH,
} from "../lib/preferences";

export function describePreferenceExtractionError(error: unknown) {
  const statusCode =
    typeof error === "object" && error !== null && "statusCode" in error
      ? error.statusCode
      : undefined;
  const message = error instanceof Error ? error.message : String(error);
  if (statusCode === 429 || /quota|rate.?limit|too many requests/i.test(message)) {
    return {
      status: 429,
      message: "Qwen quota exceeded. Try again after the ModelScope quota resets.",
    };
  }
  return { status: 502, message: "Could not extract keywords right now" };
}

export default defineChannel({
  cors: {
    origin: [
      "https://travel-buddy-pwa.vercel.app",
      "http://localhost:3000",
      "http://127.0.0.1:3000",
    ],
    methods: ["POST"],
    allowHeaders: ["content-type"],
  },
  routes: [
    POST("/preferences/extract", async (request) => {
      let body: unknown;
      try {
        body = await request.json();
      } catch {
        return Response.json({ error: "Request body must be valid JSON" }, { status: 400 });
      }

      const text =
        typeof body === "object" && body !== null && "text" in body &&
        typeof body.text === "string"
          ? body.text.trim()
          : "";

      if (!text) {
        return Response.json({ error: "text is required" }, { status: 400 });
      }
      if (text.length > MAX_PREFERENCE_LENGTH) {
        return Response.json(
          { error: `text must be ${MAX_PREFERENCE_LENGTH} characters or fewer` },
          { status: 413 },
        );
      }

      try {
        return Response.json({ keywords: await extractPreferenceKeywords(text) });
      } catch (error) {
        console.error("Preference keyword extraction failed", error);
        const responseError = describePreferenceExtractionError(error);
        return Response.json(
          { error: responseError.message },
          { status: responseError.status },
        );
      }
    }),
  ],
});
