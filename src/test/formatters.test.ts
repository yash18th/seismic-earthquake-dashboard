import { describe, it, expect } from 'vitest';
import {
  formatMagnitude,
  formatDepth,
  formatCoordinates,
  formatUtcDateTime,
  getMagnitudeColor,
  getDepthCategory,
} from '../utils/formatters';

describe('Formatters and Visual Color Classifications', () => {
  describe('formatMagnitude', () => {
    it('returns N/A for null, undefined, or NaN', () => {
      expect(formatMagnitude(null)).toBe('N/A');
      expect(formatMagnitude(undefined)).toBe('N/A');
      expect(formatMagnitude(NaN)).toBe('N/A');
    });

    it('formats valid numbers with default or specified precision', () => {
      expect(formatMagnitude(4.56)).toBe('4.6');
      expect(formatMagnitude(4.56, 2)).toBe('4.56');
    });
  });

  describe('formatDepth', () => {
    it('returns N/A for missing depth values', () => {
      expect(formatDepth(null)).toBe('N/A');
      expect(formatDepth(undefined)).toBe('N/A');
    });

    it('formats depth in kilometers with 1 decimal place', () => {
      expect(formatDepth(10.23)).toBe('10.2 km');
      expect(formatDepth(0)).toBe('0.0 km');
    });
  });

  describe('formatCoordinates', () => {
    it('returns N/A when either lat or lon is missing or invalid', () => {
      expect(formatCoordinates(null, 120)).toBe('N/A');
      expect(formatCoordinates(35, undefined)).toBe('N/A');
      expect(formatCoordinates(NaN, 10)).toBe('N/A');
    });

    it('formats coordinates with cardinal directions correctly', () => {
      // 37.7749 N, -122.4194 W
      expect(formatCoordinates(37.7749, -122.4194)).toBe('37.7749° N, 122.4194° W');
      // -15.5 S, 160.2 E
      expect(formatCoordinates(-15.5, 160.2)).toBe('15.5000° S, 160.2000° E');
    });
  });

  describe('formatUtcDateTime', () => {
    it('returns N/A for invalid timestamps', () => {
      expect(formatUtcDateTime(null)).toBe('N/A');
      expect(formatUtcDateTime(0)).toBe('N/A');
      expect(formatUtcDateTime(NaN)).toBe('N/A');
    });

    it('formats valid epoch milliseconds into UTC representation', () => {
      // 1700000000000 = 2023-11-14T22:13:20.000Z
      const formatted = formatUtcDateTime(1700000000000);
      expect(formatted).toContain('2023');
      expect(formatted).toContain('UTC');
    });
  });

  describe('getMagnitudeColor', () => {
    it('returns sky blue for minor magnitudes (< 3.0)', () => {
      const color = getMagnitudeColor(2.4);
      expect(color.hex).toBe('#38bdf8');
      expect(color.label).toContain('Minor');
    });

    it('returns amber for moderate magnitudes (3.0–4.4)', () => {
      const color = getMagnitudeColor(3.7);
      expect(color.hex).toBe('#fbbf24');
      expect(color.label).toContain('Moderate');
    });

    it('returns orange for strong magnitudes (4.5–5.9)', () => {
      const color = getMagnitudeColor(5.2);
      expect(color.hex).toBe('#fb923c');
      expect(color.label).toContain('Strong');
    });

    it('returns rose/red for major magnitudes (>= 6.0)', () => {
      const color = getMagnitudeColor(6.8);
      expect(color.hex).toBe('#f43f5e');
      expect(color.label).toContain('Major');
    });

    it('returns muted slate for null magnitude', () => {
      const color = getMagnitudeColor(null);
      expect(color.hex).toBe('#94a3b8');
      expect(color.label).toBe('Unknown');
    });
  });

  describe('getDepthCategory', () => {
    it('categorizes shallow focus (< 70 km)', () => {
      const cat = getDepthCategory(15);
      expect(cat.label).toContain('Shallow');
    });

    it('categorizes intermediate focus (70–300 km)', () => {
      const cat = getDepthCategory(140);
      expect(cat.label).toContain('Intermediate');
    });

    it('categorizes deep focus (> 300 km)', () => {
      const cat = getDepthCategory(550);
      expect(cat.label).toContain('Deep');
    });
  });
});
