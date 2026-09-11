export interface PreferenceKeyword {
  label: string;
  sentiment: 'wanted' | 'unwanted';
}

export interface ExtractPreferenceKeywordsResponse {
  keywords: PreferenceKeyword[];
}

export async function extractPreferenceKeywords(
  text: string,
): Promise<ExtractPreferenceKeywordsResponse> {
  const configuredHost = import.meta.env.VITE_EVE_URL?.trim();
  const response = await fetch(
    `${configuredHost ?? ''}/preferences/extract`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    },
  );

  const body = (await response.json().catch(() => null)) as
    | { keywords?: unknown; error?: unknown }
    | null;
  if (!response.ok) {
    throw new Error(
      typeof body?.error === 'string'
        ? body.error
        : 'Could not extract keywords right now',
    );
  }

  if (
    !Array.isArray(body?.keywords) ||
    !body.keywords.every(
      (item) =>
        typeof item === 'object' &&
        item !== null &&
        'label' in item &&
        typeof item.label === 'string' &&
        'sentiment' in item &&
        (item.sentiment === 'wanted' || item.sentiment === 'unwanted'),
    )
  ) {
    throw new Error('Keyword extraction returned an invalid response');
  }

  return { keywords: body.keywords };
}
