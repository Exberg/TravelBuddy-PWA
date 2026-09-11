import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type { AgentModelOptionsDefinition } from "eve";

const modelscope = createOpenAICompatible({
  name: "modelscope",
  baseURL: "https://api-inference.modelscope.ai/v1",
  apiKey: process.env.MODELSCOPE_API_KEY,
});

export const qwenModel = modelscope("Qwen-Ambassador/Qwen3.8-Max");

export const qwenModelOptions: AgentModelOptionsDefinition = {
  providerOptions: {
    modelscope: { reasoningEffort: "low" },
  },
};

export function selectQwenModel() {
  return {
    model: qwenModel,
    modelContextWindowTokens: 262_144,
    modelOptions: qwenModelOptions,
  };
}
