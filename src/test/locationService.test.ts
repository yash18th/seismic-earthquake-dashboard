import { describe, it, expect } from 'vitest';
import {
  resolveLocationLocally,
  searchLocationSuggestions,
  normalizeQuery,
} from '../services/locationService';

describe('Location Service — Country, City & Region Resolution', () => {
  describe('Country and Region Aliases Resolution', () => {
    it('resolves UK across common aliases, abbreviations, and spellings', () => {
      const queries = ['UK', 'uk', 'United Kingdom', 'great britain', 'england', 'scotland', 'wales', 'GB'];
      for (const q of queries) {
        const resolved = resolveLocationLocally(q);
        expect(resolved, `Failed to resolve query "${q}"`).not.toBeNull();
        expect(resolved?.id).toBe('GB');
        expect(resolved?.name).toBe('United Kingdom');
        expect(resolved?.bounds.minlatitude).toBeCloseTo(49.8);
      }
    });

    it('resolves USA across aliases (US, America, United States)', () => {
      const queries = ['USA', 'usa', 'US', 'us', 'United States', 'united states of america', 'america'];
      for (const q of queries) {
        const resolved = resolveLocationLocally(q);
        expect(resolved, `Failed to resolve query "${q}"`).not.toBeNull();
        expect(resolved?.id).toBe('US');
        expect(resolved?.name).toBe('United States');
      }
    });

    it('resolves Indonesia across common aliases and regions', () => {
      const queries = ['Indonesia', 'ID', 'idn', 'indo', 'sumatra', 'java', 'bali'];
      for (const q of queries) {
        const resolved = resolveLocationLocally(q);
        expect(resolved, `Failed to resolve query "${q}"`).not.toBeNull();
        expect(resolved?.id).toBe('ID');
        expect(resolved?.name).toBe('Indonesia');
      }
    });

    it('resolves India across common aliases', () => {
      const queries = ['India', 'india', 'IN', 'ind', 'bharat'];
      for (const q of queries) {
        const resolved = resolveLocationLocally(q);
        expect(resolved, `Failed to resolve query "${q}"`).not.toBeNull();
        expect(resolved?.id).toBe('IN');
        expect(resolved?.name).toBe('India');
      }
    });

    it('resolves Japan across common aliases', () => {
      const queries = ['Japan', 'japan', 'JP', 'jpn', 'nippon', 'hokkaido'];
      for (const q of queries) {
        const resolved = resolveLocationLocally(q);
        expect(resolved, `Failed to resolve query "${q}"`).not.toBeNull();
        expect(resolved?.id).toBe('JP');
        expect(resolved?.name).toBe('Japan');
      }
    });

    it('resolves key seismic states and cities (California, Tokyo, Jakarta, Nepal, Turkey)', () => {
      expect(resolveLocationLocally('California')?.id).toBe('US-CA');
      expect(resolveLocationLocally('Tokyo')?.id).toBe('JP-TKY');
      expect(resolveLocationLocally('Jakarta')?.id).toBe('ID-JKT');
      expect(resolveLocationLocally('Nepal')?.id).toBe('NP');
      expect(resolveLocationLocally('Turkey')?.id).toBe('TR');
      expect(resolveLocationLocally('Türkiye')?.id).toBe('TR');
    });

    it('returns null for unrecognized or non-geographic queries', () => {
      expect(resolveLocationLocally('')).toBeNull();
      expect(resolveLocationLocally('   ')).toBeNull();
      expect(resolveLocationLocally('xyz987invalid')).toBeNull();
      expect(resolveLocationLocally('shallow earthquake fault line')).toBeNull();
      expect(resolveLocationLocally('Atlantis')).toBeNull();
    });
  });

  describe('Location Autocomplete Suggestions', () => {
    it('returns suggestions for partial country and city names', () => {
      const unitedResults = searchLocationSuggestions('Uni');
      expect(unitedResults.length).toBeGreaterThan(0);
      expect(unitedResults.some((r) => r.name === 'United Kingdom')).toBe(true);
      expect(unitedResults.some((r) => r.name === 'United States')).toBe(true);

      const indoResults = searchLocationSuggestions('indo');
      expect(indoResults.length).toBeGreaterThan(0);
      expect(indoResults[0].name).toBe('Indonesia');

      const japResults = searchLocationSuggestions('jap');
      expect(japResults.length).toBeGreaterThan(0);
      expect(japResults[0].name).toBe('Japan');

      const calResults = searchLocationSuggestions('calif');
      expect(calResults.length).toBeGreaterThan(0);
      expect(calResults[0].name).toBe('California, USA');
    });

    it('handles query normalization cleanly', () => {
      expect(normalizeQuery('  U.S.A.  ')).toBe('usa');
      expect(normalizeQuery('United-Kingdom!')).toBe('unitedkingdom');
      expect(normalizeQuery('New   Zealand')).toBe('new zealand');
    });
  });
});
