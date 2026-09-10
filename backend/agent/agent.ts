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
  defaultTools: false,
  reasoning: "low",
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
            modelOptions: geminiModelOptions,
          };
        }

        return {
          model: modelscope("Qwen-Ambassador/Qwen3.8-Max"),
          modelContextWindowTokens: 262_144,
          modelOptions: qwenModelOptions,
        };
      },
    },
  }),
});
