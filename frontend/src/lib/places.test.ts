import { afterEach, describe, expect, test } from 'bun:test';
import { fetchPlaces, photoUrl } from './places';

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
});

describe('photoUrl', () => {
  test('encodes the photo resource name', () => {
    expect(photoUrl('places/place-abc/photos/photo-1')).toBe(
      '/places/photo/places%2Fplace-abc%2Fphotos%2Fphoto-1',
    );
  });
});

describe('fetchPlaces', () => {
  test('requests the search endpoint with destination and category', async () => {
    let requestedUrl = '';
    global.fetch = (async (input: string | URL | Request) => {
      requestedUrl = input.toString();
      return new Response(
        JSON.stringify({
          places: [
            {
              id: 'place-1',
              title: 'The Blue Mansion',
              subtitle: 'Heritage Core • 4.8',
              category: 'sights',
              rating: 4.8,
              photoName: 'places/place-1/photos/photo-1',
              iconName: 'museum',
              lat: 5.41,
              lng: 100.33,
            },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }) as typeof fetch;

    const places = await fetchPlaces('Penang', 'sights');

    expect(requestedUrl).toContain('/places/search?');
    expect(requestedUrl).toContain('destination=Penang');
    expect(requestedUrl).toContain('category=sights');

    expect(places).toHaveLength(1);
    expect(places[0]).toEqual({
      id: 'place-1',
      title: 'The Blue Mansion',
      subtitle: 'Heritage Core • 4.8',
      category: 'sights',
      rating: 4.8,
      imageUrl: '/places/photo/places%2Fplace-1%2Fphotos%2Fphoto-1',
      iconName: 'museum',
      pinLabel: 'The Blue Mansion',
      pinIcon: 'museum',
      lat: 5.41,
      lng: 100.33,
    });
  });

  test('leaves imageUrl empty when photoName is null', async () => {
    global.fetch = (async () =>
      new Response(
        JSON.stringify({
          places: [
            {
              id: 'place-2',
              title: 'New Cafe',
              subtitle: 'Some Street • New',
              category: 'cafes',
              rating: 0,
              photoName: null,
              iconName: 'local_cafe',
              lat: 1,
              lng: 2,
            },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      )) as typeof fetch;

    const [place] = await fetchPlaces('Penang', 'cafes');
    expect(place.imageUrl).toBe('');
  });

  test('throws when the response is not ok', async () => {
    global.fetch = (async () =>
      new Response('error', { status: 500 })) as typeof fetch;

    await expect(fetchPlaces('Penang', 'stays')).rejects.toThrow();
  });
});
