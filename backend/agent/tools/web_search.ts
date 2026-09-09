import { webSearch } from "eve/tools/web_search";

// Eve maps this provider-managed tool to the model provider at runtime:
// Google models use native Google Search grounding, while AI Gateway models
// use Exa. The direct ModelScope/Qwen model does not advertise web search.
export default webSearch({ provider: "exa" });
