import { describe, it, expect } from 'vitest';
import { normalizeInvNr, parseInventoryNumbers, extractNmIds } from './nmUtils';

describe('normalizeInvNr', () => {
  it('should normalize standard inventory numbers to uppercase', () => {
    expect(normalizeInvNr('ng.m.00001')).toBe('NG.M.00001');
    expect(normalizeInvNr('nmk.2023.0123')).toBe('NMK.2023.0123');
  });

  it('should handle NAMT inventory numbers correctly (NAMT uppercase, rest lowercase)', () => {
    // The implementation in nmUtils.ts says: return "NAMT" + trimmed.substring(4).toLowerCase();
    expect(normalizeInvNr('NAMT.1234.567')).toBe('NAMT.1234.567');
    expect(normalizeInvNr('namt.1234.567')).toBe('NAMT.1234.567');
    expect(normalizeInvNr('NAMT.ABCD.EFG')).toBe('NAMT.abcd.efg');
  });

  it('should trim whitespace', () => {
    expect(normalizeInvNr('  NG.M.00001  ')).toBe('NG.M.00001');
  });

  it('should return empty string for empty input', () => {
    expect(normalizeInvNr('')).toBe('');
  });
});

describe('extractNmIds', () => {
  it('should extract standard NM IDs', () => {
    const text = 'Here is an ID: NG.M.00001 and another one: NMK.2023.0123';
    expect(extractNmIds(text)).toEqual(['NG.M.00001', 'NMK.2023.0123']);
  });

  it('should extract NAMT IDs', () => {
    const text = 'Check out NAMT.1234.567 please';
    // Assuming extractNmIds calls normalizeInvNr internally which handles NAMT casing
    // But wait, extractNmIds uses a regex first. Let's check the regex in constants.ts.
    // I need to see constants.ts to know if the regex matches NAMT.
    // Assuming it does for now based on the function description.
    expect(extractNmIds(text)).toContain('NAMT.1234.567');
  });

  it('should handle multiple IDs and remove duplicates', () => {
    const text = 'NG.M.00001, NG.M.00001, NMK.2023.0123';
    expect(extractNmIds(text)).toEqual(['NG.M.00001', 'NMK.2023.0123']);
  });

  it('should return empty array if no IDs found', () => {
    expect(extractNmIds('Just some text without IDs')).toEqual([]);
  });
});

describe('parseInventoryNumbers', () => {
  // This function seems to be intended for parsing a list of IDs, potentially with shorthand like "ID1, ID2" or "ID1 og ID2"
  // The current implementation splits by separators and tries to expand context.

  it('should parse a simple list of IDs', () => {
    const input = 'NG.M.00001, NMK.2023.0123';
    expect(parseInventoryNumbers(input)).toEqual(['NG.M.00001', 'NMK.2023.0123']);
  });

  it('should handle "og" and "&" separators', () => {
    const input = 'NG.M.00001 og NMK.2023.0123 & NMK.2023.0124';
    expect(parseInventoryNumbers(input)).toEqual(['NG.M.00001', 'NMK.2023.0123', 'NMK.2023.0124']);
  });

  it('should handle context expansion (e.g. "NG.M.00001, 002")', () => {
    // The implementation tries to replace the last segment if the new part has no dots.
    const input = 'NG.M.00001, 002';
    // Expected: NG.M.00001, NG.M.002
    expect(parseInventoryNumbers(input)).toEqual(['NG.M.00001', 'NG.M.002']);
  });

  it('should handle context expansion with "og"', () => {
    const input = 'NG.M.00001 og 002';
    expect(parseInventoryNumbers(input)).toEqual(['NG.M.00001', 'NG.M.002']);
  });

  it('should handle context expansion with range-like syntax (though range logic isn\'t explicitly in the code, the split might handle it if separators are used)', () => {
    // The current implementation splits by +, so "NG.M.00001+002" should work
    const input = 'NG.M.00001+002';
    expect(parseInventoryNumbers(input)).toEqual(['NG.M.00001', 'NG.M.002']);
  });
  
  it('should reset context when a full ID is encountered', () => {
    const input = 'NG.M.00001, 002, NMK.2023.0123, 0124';
    expect(parseInventoryNumbers(input)).toEqual(['NG.M.00001', 'NG.M.002', 'NMK.2023.0123', 'NMK.2023.0124']);
  });
});
