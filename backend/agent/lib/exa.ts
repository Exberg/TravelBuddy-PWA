const EXA_SEARCH_URL = "https://api.exa.ai/search";

export interface ExaSearchInput {
  query: string;
  numResults?: number;
  includeDomains?: string[];
  excludeDomains?: string[];
  startPublishedDate?: string;
  endPublishedDate?: string;
}

export interface ExaSearchResult {
  id: string | null;
  title: string | null;
  url: string;
  publishedDate: string | null;
  author: string | null;
  highlights: string[];
  image: string | null;
}

export type ExaSearchResponse =
  | {
      success: true;
      query: string;
      results: ExaSearchResult[];
      requestId: string | null;
      searchTimeMs: number | null;
    }
  | {
      success: false;
      query: string;
      results: [];
      error: { code: string; message: string; status?: number };
    };

type FetchImplementation = typeof fetch;

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function optionalString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function mapResult(value: unknown): ExaSearchResult | null {
  const record = asRecord(value);
  const url = optionalString(record?.url);
  if (!record || !url) return null;

  return {
    id: optionalString(record.id),
    title: optionalString(record.title),
    url,
    publishedDate: optionalString(record.publishedDate),
    author: optionalString(record.author),
    highlights: Array.isArray(record.highlights)
      ? record.highlights.filter(
          (highlight): highlight is string => typeof highlight === "string",
        )
      : [],
    image: optionalString(record.image),
  };
}

function providerError(payload: unknown, status: number): string {
  const record = asRecord(payload);
  return (
    optionalString(record?.error) ??
    optionalString(record?.message) ??
    `Exa returned HTTP ${status}.`
  );
}

export async function searchExa(
  input: ExaSearchInput,
  options: {
    apiKey?: string;
    signal?: AbortSignal;
    fetch?: FetchImplementation;
  } = {},
): Promise<ExaSearchResponse> {
  const apiKey = options.apiKey ?? process.env.EXA_API_KEY;
  if (!apiKey) {
    return {
      success: false,
      query: input.query,
      results: [],
      error: {
        code: "exa_api_key_missing",
        message: "EXA_API_KEY is not configured.",
      },
    };
  }

  const fetchImplementation = options.fetch ?? fetch;
  const timeout = AbortSignal.timeout(20_000);
  const signal = options.signal
    ? AbortSignal.any([options.signal, timeout])
    : timeout;

  try {
    const response = await fetchImplementation(EXA_SEARCH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        query: input.query,
        numResults: input.numResults ?? 8,
        type: "auto",
        moderation: true,
        contents: { highlights: true },
        ...(input.includeDomains?.length
          ? { includeDomains: input.includeDomains }
          : {}),
        ...(input.excludeDomains?.length
          ? { excludeDomains: input.excludeDomains }
          : {}),
        ...(input.startPublishedDate
          ? { startPublishedDate: input.startPublishedDate }
          : {}),
        ...(input.endPublishedDate
          ? { endPublishedDate: input.endPublishedDate }
          : {}),
      }),
      signal,
    });
    const payload: unknown = await response.json();

    if (!response.ok) {
      return {
        success: false,
        query: input.query,
        results: [],
        error: {
          code: `exa_http_${response.status}`,
          message: providerError(payload, response.status),
          status: response.status,
        },
      };
    }

    const record = asRecord(payload);
    if (!record || !Array.isArray(record.results)) {
      return {
        success: false,
        query: input.query,
        results: [],
        error: {
          code: "invalid_exa_response",
          message: "Exa returned a response without a results array.",
        },
      };
    }

    return {
      success: true,
      query: input.query,
      results: record.results.map(mapResult).filter((result) => result !== null),
      requestId: optionalString(record.requestId),
      searchTimeMs:
        typeof record.searchTime === "number" && Number.isFinite(record.searchTime)
          ? record.searchTime
          : null,
    };
  } catch (error) {
    if (options.signal?.aborted) throw error;
    return {
      success: false,
      query: input.query,
      results: [],
      error: {
        code: "exa_request_failed",
        message:
          error instanceof Error ? error.message : "Unable to reach Exa.",
      },
    };
  }
}
