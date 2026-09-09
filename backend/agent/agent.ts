import { google } from "@ai-sdk/google";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import {
  defineAgent,
  defineDynamic,
  type AgentModelOptionsDefinition,
} from "eve";
import {
  GEMINI_MODEL_ALIAS,
  resolveRequestedModel,
} from "./model-selection";
import {
  hydrateItineraryState,
  resolveClientItinerarySnapshot,
} from "./lib/itinerary";

const modelscope = createOpenAICompatible({
  name: "modelscope",
  baseURL: "https://api-inference.modelscope.ai/v1",
  apiKey: process.env.MODELSCOPE_API_KEY,
});

const geminiModelOptions: AgentModelOptionsDefinition = {
  providerOptions: {
    google: {
      thinkingConfig: { thinkingLevel: "low" },
    },
  },
};

const qwenModelOptions: AgentModelOptionsDefinition = {
  providerOptions: {
    modelscope: { reasoningEffort: "low" },
  },
};

export default defineAgent({
  model: defineDynamic({
    events: {
      "step.started": (_event, ctx) => {
        const itinerarySnapshot = resolveClientItinerarySnapshot(ctx.messages);
        if (itinerarySnapshot) hydrateItineraryState(itinerarySnapshot);

        const selectedModel = resolveRequestedModel(ctx.messages);

        if (selectedModel === GEMINI_MODEL_ALIAS) {
          return {
            model: google("gemini-3.8-flash"),
            modelContextWindowTokens: 1_048_576,
            // Gemini 3.8 defaults to medium thinking. The failed local trace
            // spent most of its 838 output tokens outside the short visible
            // answer, then the provider terminated mid-sentence with OTHER.
            // Low is the model's minimum supported level and is a better fit
            // for latency-sensitive mobile travel chat.
            modelOptions: geminiModelOptions,
          };
        }

        return {
          model: modelscope("Qwen-Ambassador/Qwen3.8-Max"),
          modelContextWindowTokens: 262_144,
          // Qwen3.8-Max defaults to xhigh reasoning. That work is streamed as
          // internal Eve reasoning (and intentionally hidden from travelers),
          // which made the app appear idle for roughly 45-50 seconds before
          // the first visible answer. Low keeps reasoning enabled for tool use
          // while substantially reducing that startup delay.
          modelOptions: qwenModelOptions,
        };
      },
    },
  }),
});
