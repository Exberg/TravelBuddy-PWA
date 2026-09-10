import { defineTool } from "eve/tools";
import { z } from "zod";
import { searchExa } from "../lib/exa";

export default defineTool({
  description:
    "Search the live public web with Exa. Use for current or source-dependent travel facts that Google Maps cannot answer, such as events, festivals, entry rules, transport notices, closures, and visa information. Return source links and do not present search snippets as stronger evidence than they are.",
  inputSchema: z.object({
    query: z.string().trim().min(2).max(500),
    numResults: z.number().int().min(1).max(10).default(8),
    includeDomains: z
      .array(z.string().trim().min(1).max(253))
      .max(10)
      .optional()
      .describe("Only return results from these domains or domain paths."),
    excludeDomains: z
      .array(z.string().trim().min(1).max(253))
      .max(10)
      .optional(),
    startPublishedDate: z
      .iso.datetime({ offset: true })
      .optional()
      .describe("Earliest publication timestamp, in ISO 8601 format."),
    endPublishedDate: z
      .iso.datetime({ offset: true })
      .optional()
      .describe("Latest publication timestamp, in ISO 8601 format."),
  }),
  async execute(input, ctx) {
    return searchExa(input, { signal: ctx.abortSignal });
  },
});
