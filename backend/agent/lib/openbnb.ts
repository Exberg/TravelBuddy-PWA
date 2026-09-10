// Adapted from OpenBNB's MIT-licensed mcp-server-airbnb v0.3.0.
// Source: https://github.com/openbnb-org/mcp-server-airbnb

import * as cheerio from "cheerio";
import robotsParser from "robots-parser";

const BASE_URL = "https://www.airbnb.com";
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const GEOCODER_USER_AGENT =
  "TravelBuddy-OpenBNB/0.1 (+https://github.com/openbnb-org/mcp-server-airbnb)";

const PROPERTY_TYPE_IDS = {
  entire_home: "1",
  private_room: "2",
  shared_room: "3",
  hotel_room: "4",
} as const;

export type AirbnbPropertyType = keyof typeof PROPERTY_TYPE_IDS;

export interface AirbnbGuestInput {
  checkin?: string;
  checkout?: string;
  adults?: number;
  children?: number;
  infants?: number;
  pets?: number;
}

export interface AirbnbSearchInput extends AirbnbGuestInput {
  location: string;
  placeId?: string;
  minPrice?: number;
  maxPrice?: number;
  cursor?: string;
  propertyType?: AirbnbPropertyType;
}

export interface AirbnbListingDetailsInput extends AirbnbGuestInput {
  id: string;
}

interface ToolFailure {
  success: false;
  url: string;
  error: {
    code: string;
    message: string;
    details?: string;
  };
}

export type AirbnbSearchResult =
  | {
      success: true;
      searchUrl: string;
      searchResults: unknown[];
      paginationInfo: unknown;
    }
  | ToolFailure;

export type AirbnbListingDetailsResult =
  | {
      success: true;
      listingUrl: string;
      details: unknown[];
    }
  | ToolFailure;

type UnknownRecord = Record<string, any>;

let robotsTxt: string | null | undefined;

function abortSignal(signal: AbortSignal | undefined, timeoutMs: number) {
  const timeout = AbortSignal.timeout(timeoutMs);
  return signal ? AbortSignal.any([signal, timeout]) : timeout;
}

async function fetchText(
  url: string,
  signal: AbortSignal | undefined,
  timeoutMs: number,
  headers: Record<string, string>,
): Promise<string> {
  const response = await fetch(url, {
    headers,
    signal: abortSignal(signal, timeoutMs),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return response.text();
}

async function getRobotsTxt(signal?: AbortSignal): Promise<string | null> {
  if (robotsTxt !== undefined) return robotsTxt;

  try {
    robotsTxt = await fetchText(`${BASE_URL}/robots.txt`, signal, 10_000, {
      "User-Agent": USER_AGENT,
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    // This matches OpenBNB's fail-open behavior when Airbnb's robots file cannot
    // be reached. Individual page requests can still fail normally.
    robotsTxt = null;
  }

  return robotsTxt;
}

async function pathIsAllowed(path: string, signal?: AbortSignal) {
  const content = await getRobotsTxt(signal);
  if (!content) return true;

  return robotsParser(`${BASE_URL}/robots.txt`, content).isAllowed(
    path,
    USER_AGENT,
  );
}

function cleanObject(value: UnknownRecord): void {
  for (const key of Object.keys(value)) {
    if (value[key] == null || key === "__typename") {
      delete value[key];
    } else if (typeof value[key] === "object") {
      cleanObject(value[key]);
    }
  }
}

function pickBySchema(value: any, schema: UnknownRecord): any {
  if (typeof value !== "object" || value === null) return value;
  if (Array.isArray(value)) {
    return value.map((item) => pickBySchema(item, schema));
  }

  const result: UnknownRecord = {};
  for (const key of Object.keys(schema)) {
    if (!Object.prototype.hasOwnProperty.call(value, key)) continue;
    const rule = schema[key];
    result[key] =
      rule === true ? value[key] : pickBySchema(value[key], rule);
  }
  return result;
}

function flattenArraysInObject(value: any, inArray = false): any {
  if (Array.isArray(value)) {
    return value
      .map((item) => flattenArraysInObject(item, true))
      .join(", ");
  }

  if (typeof value === "object" && value !== null) {
    if (inArray) {
      return Object.values(value)
        .map((item) => flattenArraysInObject(item, true))
        .join(": ");
    }

    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        flattenArraysInObject(item),
      ]),
    );
  }

  return value;
}

function diagnoseJsonPath(data: any, path: string[]): string {
  let current = data;
  for (const key of path) {
    if (current === null || typeof current !== "object") {
      return `Path broken at '${key}': parent is ${current === null ? "null" : typeof current}`;
    }
    if (!(key in current)) {
      return `Key '${key}' not found. Available keys: [${Object.keys(current)
        .slice(0, 10)
        .join(", ")}]`;
    }
    current = current[key];
  }
  return "Path valid";
}

function deferredState(html: string): any {
  const $ = cheerio.load(html);
  const content = $("#data-deferred-state-0").first().text();
  if (!content) {
    throw new Error(
      "Could not find Airbnb's deferred state; its page structure may have changed.",
    );
  }
  return JSON.parse(content);
}

const photonTypePriority: Record<string, number> = {
  country: 1,
  state: 2,
  county: 3,
  city: 4,
  district: 5,
  locality: 6,
  street: 7,
  house: 8,
  other: 9,
};

function pickBestPhotonFeature(features: any[]): any | null {
  if (features.length === 0) return null;
  return features.reduce((best, feature) => {
    const bestPriority =
      photonTypePriority[best.properties?.type] ?? photonTypePriority.other;
    const featurePriority =
      photonTypePriority[feature.properties?.type] ?? photonTypePriority.other;
    return featurePriority < bestPriority ? feature : best;
  });
}

async function geocodeLocation(location: string, signal?: AbortSignal) {
  let extent: number[] | null = null;

  try {
    const text = await fetchText(
      `https://photon.komoot.io/api/?q=${encodeURIComponent(location)}&limit=5`,
      signal,
      5_000,
      { Accept: "application/json", "User-Agent": GEOCODER_USER_AGENT },
    );
    const feature = pickBestPhotonFeature(JSON.parse(text)?.features ?? []);
    if (feature?.properties?.extent?.length === 4) {
      extent = feature.properties.extent;
    }
  } catch (error) {
    if (signal?.aborted) throw error;
  }

  if (!extent) {
    try {
      const text = await fetchText(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1`,
        signal,
        5_000,
        { Accept: "application/json", "User-Agent": GEOCODER_USER_AGENT },
      );
      const boundingBox = JSON.parse(text)?.[0]?.boundingbox;
      if (boundingBox?.length === 4) {
        extent = [
          Number.parseFloat(boundingBox[2]),
          Number.parseFloat(boundingBox[1]),
          Number.parseFloat(boundingBox[3]),
          Number.parseFloat(boundingBox[0]),
        ];
      }
    } catch (error) {
      if (signal?.aborted) throw error;
    }
  }

  if (!extent || extent.some((coordinate) => !Number.isFinite(coordinate))) {
    return null;
  }

  const [swLng, neLat, neLng, swLat] = extent;
  const latPadding = Math.max((neLat - swLat) * 0.25, 0.1);
  const lngPadding = Math.max((neLng - swLng) * 0.25, 0.1);
  const clamp = (value: number, min: number, max: number) =>
    Math.min(Math.max(value, min), max);

  return {
    sw_lat: clamp(swLat - latPadding, -90, 90).toFixed(7),
    ne_lat: clamp(neLat + latPadding, -90, 90).toFixed(7),
    sw_lng: clamp(swLng - lngPadding, -180, 180).toFixed(7),
    ne_lng: clamp(neLng + lngPadding, -180, 180).toFixed(7),
  };
}

function addGuests(url: URL, input: AirbnbGuestInput): void {
  const adults = input.adults ?? 1;
  const children = input.children ?? 0;
  if (adults + children <= 0) return;

  url.searchParams.set("adults", String(adults));
  url.searchParams.set("children", String(children));
  url.searchParams.set("infants", String(input.infants ?? 0));
  url.searchParams.set("pets", String(input.pets ?? 0));
}

export async function buildAirbnbSearchUrl(
  input: AirbnbSearchInput,
  signal?: AbortSignal,
): Promise<URL> {
  const slug = input.location
    .trim()
    .replace(/,\s*/g, "--")
    .replace(/\s+/g, "-");
  const url = new URL(`${BASE_URL}/s/${encodeURIComponent(slug)}/homes`);

  if (input.placeId) {
    url.searchParams.set("place_id", input.placeId);
  } else {
    const coordinates = await geocodeLocation(input.location, signal);
    if (coordinates) {
      for (const [key, value] of Object.entries(coordinates)) {
        url.searchParams.set(key, value);
      }
    }
  }

  if (input.checkin) url.searchParams.set("checkin", input.checkin);
  if (input.checkout) url.searchParams.set("checkout", input.checkout);
  if (input.minPrice !== undefined) {
    url.searchParams.set("price_min", String(input.minPrice));
  }
  if (input.maxPrice !== undefined) {
    url.searchParams.set("price_max", String(input.maxPrice));
  }
  if (input.propertyType) {
    url.searchParams.set(
      "l2_property_type_ids[]",
      PROPERTY_TYPE_IDS[input.propertyType],
    );
  }
  if (input.cursor) url.searchParams.set("cursor", input.cursor);
  addGuests(url, input);
  return url;
}

export function buildAirbnbListingUrl(input: AirbnbListingDetailsInput): URL {
  const url = new URL(`${BASE_URL}/rooms/${encodeURIComponent(input.id)}`);
  if (input.checkin) url.searchParams.set("check_in", input.checkin);
  if (input.checkout) url.searchParams.set("check_out", input.checkout);
  addGuests(url, input);
  return url;
}

const searchResultSchema: UnknownRecord = {
  demandStayListing: { id: true, description: true, location: true },
  badges: { text: true },
  structuredContent: {
    mapCategoryInfo: { body: true },
    mapSecondaryLine: { body: true },
    primaryLine: { body: true },
    secondaryLine: { body: true },
  },
  avgRatingA11yLabel: true,
  listingParamOverrides: true,
  structuredDisplayPrice: {
    primaryLine: { accessibilityLabel: true },
    secondaryLine: { accessibilityLabel: true },
    explanationData: {
      title: true,
      priceDetails: { items: { description: true, priceString: true } },
    },
  },
};

export function parseAirbnbSearchHtml(html: string) {
  const clientData = deferredState(html);
  const path = [
    "niobeClientData",
    "0",
    "1",
    "data",
    "presentation",
    "staysSearch",
    "results",
  ];

  try {
    const results =
      clientData.niobeClientData[0][1].data.presentation.staysSearch.results;
    cleanObject(results);
    return {
      searchResults: results.searchResults.map((raw: any) => {
        const result = flattenArraysInObject(
          pickBySchema(raw, searchResultSchema),
        );
        const encodedId = result.demandStayListing?.id;
        const decodedId = Buffer.from(encodedId, "base64").toString("utf8");
        const id = decodedId.split(":")[1];
        if (!id) throw new Error("Airbnb returned an invalid listing id.");
        return { id, url: `${BASE_URL}/rooms/${id}`, ...result };
      }),
      paginationInfo: results.paginationInfo ?? null,
    };
  } catch (error) {
    const details = error instanceof Error ? error.message : String(error);
    throw new Error(`${details} (${diagnoseJsonPath(clientData, path)})`);
  }
}

const sectionSchema: UnknownRecord = {
  LOCATION_DEFAULT: { lat: true, lng: true, subtitle: true, title: true },
  POLICIES_DEFAULT: {
    title: true,
    houseRulesSections: { title: true, items: { title: true } },
  },
  HIGHLIGHTS_DEFAULT: { highlights: { title: true } },
  DESCRIPTION_DEFAULT: { htmlDescription: { htmlText: true } },
  AMENITIES_DEFAULT: {
    title: true,
    seeAllAmenitiesGroups: { title: true, amenities: { title: true } },
  },
};

function findPdpPresentation(clientData: any): any | null {
  const entries = clientData?.niobeClientData;
  if (!Array.isArray(entries)) return null;
  for (const entry of entries) {
    const presentation = entry?.[1]?.data?.node?.pdpPresentation;
    if (presentation && typeof presentation === "object") return presentation;
  }
  return null;
}

function extractAmenities(presentation: any): any | null {
  const groups = presentation?.amenities?.seeAllAmenitiesGroups;
  if (!Array.isArray(groups) || groups.length === 0) return null;

  const mapped = groups
    .map((group: any) => {
      const items = Array.isArray(group?.amenities) ? group.amenities : [];
      const mixed =
        items.some((item: any) => item?.available === false) &&
        items.some((item: any) => item?.available !== false);
      const amenities = items
        .map((item: any) => {
          if (!item?.title) return null;
          const subtitle =
            typeof item.subtitle === "string"
              ? item.subtitle
              : item.subtitle?.text;
          const label = subtitle
            ? `${item.title} (${subtitle})`
            : item.title;
          return mixed && item.available === false
            ? `${label} — unavailable`
            : label;
        })
        .filter(Boolean);
      return amenities.length ? { title: group?.title, amenities } : null;
    })
    .filter(Boolean);

  if (mapped.length === 0) return null;
  return {
    ...(presentation.amenities?.title
      ? { title: presentation.amenities.title }
      : {}),
    seeAllAmenitiesGroups: mapped,
  };
}

function keyAmenityGroups(section: any): any {
  if (section === null || typeof section !== "object" || Array.isArray(section)) {
    return section;
  }
  if (!Array.isArray(section.seeAllAmenitiesGroups)) return section;

  const keyed: Record<string, any[]> = {};
  for (const group of section.seeAllAmenitiesGroups) {
    if (!Array.isArray(group?.amenities) || group.amenities.length === 0) continue;
    const key = group.title || "Other";
    keyed[key] = [...(keyed[key] ?? []), ...group.amenities];
  }
  return { ...section, seeAllAmenitiesGroups: keyed };
}

function extractHighlights(presentation: any): any | null {
  const highlights = presentation?.highlights;
  if (!Array.isArray(highlights) || highlights.length === 0) return null;
  const mapped = highlights
    .map((highlight: any) => {
      if (!highlight?.title) return null;
      const subtitle =
        typeof highlight.subtitle === "string"
          ? highlight.subtitle
          : highlight.subtitle?.text;
      return subtitle
        ? `${highlight.title}: ${subtitle}`
        : highlight.title;
    })
    .filter(Boolean);
  return mapped.length ? { highlights: mapped } : null;
}

export function parseAirbnbListingHtml(html: string): unknown[] {
  const clientData = deferredState(html);
  const path = [
    "niobeClientData",
    "0",
    "1",
    "data",
    "presentation",
    "stayProductDetailPage",
    "sections",
    "sections",
  ];

  try {
    const sections =
      clientData.niobeClientData[0][1].data.presentation.stayProductDetailPage
        .sections.sections;
    sections.forEach((section: UnknownRecord) => cleanObject(section));

    let extracted = sections
      .filter((section: any) =>
        Object.prototype.hasOwnProperty.call(sectionSchema, section.sectionId),
      )
      .map((section: any) => ({
        id: section.sectionId,
        ...flattenArraysInObject(
          keyAmenityGroups(
            pickBySchema(section.section, sectionSchema[section.sectionId]),
          ),
        ),
      }));

    const presentation = findPdpPresentation(clientData);
    if (presentation) {
      const recovered: Record<string, { value: any; contentKey: string }> = {
        AMENITIES_DEFAULT: {
          value: extractAmenities(presentation),
          contentKey: "seeAllAmenitiesGroups",
        },
        HIGHLIGHTS_DEFAULT: {
          value: extractHighlights(presentation),
          contentKey: "highlights",
        },
      };

      extracted = extracted.map((section: any) => {
        const replacement = recovered[section.id];
        return replacement?.value && !section[replacement.contentKey]
          ? {
              ...section,
              ...flattenArraysInObject(keyAmenityGroups(replacement.value)),
            }
          : section;
      });

      for (const [id, replacement] of Object.entries(recovered)) {
        if (
          replacement.value &&
          !extracted.some((section: any) => section.id === id)
        ) {
          extracted.push({
            id,
            ...flattenArraysInObject(keyAmenityGroups(replacement.value)),
          });
        }
      }
    }

    return extracted;
  } catch (error) {
    const details = error instanceof Error ? error.message : String(error);
    throw new Error(`${details} (${diagnoseJsonPath(clientData, path)})`);
  }
}

function failure(
  code: string,
  message: string,
  url: string,
  details?: string,
): ToolFailure {
  return {
    success: false,
    url,
    error: { code, message, ...(details ? { details } : {}) },
  };
}

export async function searchAirbnb(
  input: AirbnbSearchInput,
  signal?: AbortSignal,
): Promise<AirbnbSearchResult> {
  const url = await buildAirbnbSearchUrl(input, signal);
  const urlString = url.toString();

  try {
    if (
      !(await pathIsAllowed(`${url.pathname}${url.search}`, signal))
    ) {
      return failure(
        "robots_txt_disallowed",
        "Airbnb's robots.txt disallows this search path for the OpenBNB user agent.",
        urlString,
      );
    }

    const html = await fetchText(urlString, signal, 30_000, {
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      "Cache-Control": "no-cache",
      "User-Agent": USER_AGENT,
    });
    const parsed = parseAirbnbSearchHtml(html);
    return { success: true, searchUrl: urlString, ...parsed };
  } catch (error) {
    if (signal?.aborted) throw error;
    return failure(
      "airbnb_search_failed",
      "Unable to search Airbnb right now.",
      urlString,
      error instanceof Error ? error.message : String(error),
    );
  }
}

export async function getAirbnbListingDetails(
  input: AirbnbListingDetailsInput,
  signal?: AbortSignal,
): Promise<AirbnbListingDetailsResult> {
  const url = buildAirbnbListingUrl(input);
  const urlString = url.toString();

  try {
    if (
      !(await pathIsAllowed(`${url.pathname}${url.search}`, signal))
    ) {
      return failure(
        "robots_txt_disallowed",
        "Airbnb's robots.txt disallows this listing path for the OpenBNB user agent.",
        urlString,
      );
    }

    const html = await fetchText(urlString, signal, 30_000, {
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      "Cache-Control": "no-cache",
      "User-Agent": USER_AGENT,
    });
    return {
      success: true,
      listingUrl: urlString,
      details: parseAirbnbListingHtml(html),
    };
  } catch (error) {
    if (signal?.aborted) throw error;
    return failure(
      "airbnb_listing_details_failed",
      "Unable to fetch Airbnb listing details right now.",
      urlString,
      error instanceof Error ? error.message : String(error),
    );
  }
}
