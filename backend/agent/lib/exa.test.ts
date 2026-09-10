import { describe, expect, test } from "bun:test";
import { searchExa } from "./exa";

describe("searchExa", () => {
  test("calls Exa directly and returns a compact result shape", async () => {
    let request: RequestInit | undefined;
    const result = await searchExa(
      {
        query: "George Town photography festival",
        numResults: 3,
        includeDomains: ["example.com"],
      },
      {
        apiKey: "test-key",
        fetch: async (_url, init) => {
          request = init;
          return Response.json({
            requestId: "request-1",
            searchTime: 123.4,
            results: [
              {
                id: "result-1",
                title: "Photo festival",
                url: "https://example.com/festival",
                publishedDate: "2026-09-01T00:00:00.000Z",
                author: "Example",
                highlights: ["The festival opens in September."],
                image: "https://example.com/image.jpg",
                text: "intentionally omitted from the tool result",
              },
            ],
          });
        },
      },
    );

    expect(result).toEqual({
      success: true,
      query: "George Town photography festival",
      requestId: "request-1",
      searchTimeMs: 123.4,
      results: [
        {
          id: "result-1",
          title: "Photo festival",
          url: "https://example.com/festival",
          publishedDate: "2026-09-01T00:00:00.000Z",
          author: "Example",
          highlights: ["The festival opens in September."],
          image: "https://example.com/image.jpg",
        },
      ],
    });
    expect(request?.headers).toEqual({
      "Content-Type": "application/json",
      "x-api-key": "test-key",
    });
    expect(JSON.parse(String(request?.body))).toMatchObject({
      query: "George Town photography festival",
      numResults: 3,
      includeDomains: ["example.com"],
      contents: { highlights: true },
      moderation: true,
    });
  });

  test("reports a missing direct API key without making a request", async () => {
    const result = await searchExa(
      { query: "Penang events" },
      {
        apiKey: "",
        fetch: async () => {
          throw new Error("fetch should not run");
        },
      },
    );

    expect(result).toMatchObject({
      success: false,
      results: [],
      error: { code: "exa_api_key_missing" },
    });
  });

  test("preserves Exa's actionable HTTP error message", async () => {
    const result = await searchExa(
      { query: "Penang events" },
      {
        apiKey: "bad-key",
        fetch: async () =>
          Response.json(
            { error: "Invalid API key", tag: "INVALID_API_KEY" },
            { status: 401 },
          ),
      },
    );

    expect(result).toMatchObject({
      success: false,
      results: [],
      error: {
        code: "exa_http_401",
        message: "Invalid API key",
        status: 401,
      },
    });
  });
});
