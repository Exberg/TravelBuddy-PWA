import { describe, expect, test } from 'bun:test';
import { mergePlaceResults } from './usePlaces';
import type { PlaceItem } from '../types';

function place(id: string, category: PlaceItem['category']): PlaceItem {
  return {
    id,
    title: id,
    subtitle: '',
    category,
    rating: 0,
    imageUrl: '',
    iconName: 'location_on',
    pinLabel: id,
    pinIcon: 'location_on',
    lat: 0,
    lng: 0,
  };
}

describe('mergePlaceResults', () => {
  test('concatenates categories in order', () => {
    const sights = [place('s1', 'sights'), place('s2', 'sights')];
    const cafes = [place('c1', 'cafes')];
    const stays = [place('st1', 'stays')];

    const merged = mergePlaceResults([sights, cafes, stays]);

    expect(merged.map((p) => p.id)).toEqual(['s1', 's2', 'c1', 'st1']);
  });

  test('dedupes by id, keeping the first occurrence', () => {
    const sights = [place('dup', 'sights')];
    const cafes = [place('dup', 'cafes'), place('c1', 'cafes')];

    const merged = mergePlaceResults([sights, cafes]);

    expect(merged).toHaveLength(2);
    expect(merged[0].category).toBe('sights');
    expect(merged.map((p) => p.id)).toEqual(['dup', 'c1']);
  });

  test('returns an empty array for empty input', () => {
    expect(mergePlaceResults([])).toEqual([]);
    expect(mergePlaceResults([[], [], []])).toEqual([]);
  });
});
