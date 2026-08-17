import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { recordUsage, getUsageTotals, resetUsageTotals, estimateCostUsd } from '../usageLedger';

beforeEach(() => {
  resetUsageTotals();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Rejestr zużycia modelu', () => {
  it('sumuje wywołania, tokeny i szacowany koszt', () => {
    recordUsage({ context: 'parse-jd', model: 'gemini-2.5-flash-lite', promptTokens: 1000, outputTokens: 500 });
    recordUsage({ context: 'parse-jd', model: 'gemini-2.5-flash-lite', promptTokens: 2000, outputTokens: 250 });

    const totals = getUsageTotals();

    expect(totals.calls).toBe(2);
    expect(totals.promptTokens).toBe(3000);
    expect(totals.outputTokens).toBe(750);
    expect(totals.totalTokens).toBe(3750);

    // 3000 * 0,10/1M + 750 * 0,40/1M = 0,0003 + 0,0003 = 0,0006 USD
    expect(totals.estimatedCostUsd).toBeCloseTo(0.0006, 8);
    expect(totals.hasUnpricedCalls).toBe(false);
  });

  it('rozbija zużycie po rodzaju operacji', () => {
    recordUsage({ context: 'parse-jd', model: 'gemini-2.5-flash-lite', promptTokens: 100, outputTokens: 100 });
    recordUsage({ context: 'cover-letter', model: 'gemini-2.5-flash-lite', promptTokens: 900, outputTokens: 0 });

    const { byContext } = getUsageTotals();

    expect(byContext['parse-jd'].calls).toBe(1);
    expect(byContext['cover-letter'].totalTokens).toBe(900);
  });

  it('oznacza wywołania modelem spoza cennika zamiast podstawiać cudzą cenę', () => {
    // Podstawienie ceny innego modelu dałoby liczbę wyglądającą wiarygodnie,
    // na której ktoś oparłby decyzję cenową. Lepiej pokazać brak danych.
    recordUsage({ context: 'parse-jd', model: 'model-ktorego-nie-znamy', promptTokens: 5000, outputTokens: 5000 });

    const totals = getUsageTotals();

    expect(totals.hasUnpricedCalls).toBe(true);
    expect(totals.estimatedCostUsd).toBe(0);
    expect(totals.totalTokens).toBe(10000);
  });

  it('nie wpisuje do logu ani promptu, ani odpowiedzi modelu', () => {
    // Prompt to CV użytkownika. Logi serwera nie są miejscem na dane osobowe.
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    recordUsage({ context: 'parse-cv', model: 'gemini-2.5-flash-lite', promptTokens: 10, outputTokens: 5 });

    const line = logSpy.mock.calls[0][0] as string;
    const parsed = JSON.parse(line);

    expect(parsed.type).toBe('ai_usage');
    expect(parsed.promptTokens).toBe(10);
    expect(Object.keys(parsed)).not.toContain('prompt');
    expect(Object.keys(parsed)).not.toContain('contents');
    expect(Object.keys(parsed)).not.toContain('text');
  });

  it('znosi brakujące i niepoprawne liczby zamiast psuć sumę', () => {
    recordUsage({ context: 'parse-jd', model: 'gemini-2.5-flash-lite', promptTokens: NaN, outputTokens: -5 });

    const totals = getUsageTotals();

    expect(totals.totalTokens).toBe(0);
    expect(Number.isNaN(totals.estimatedCostUsd)).toBe(false);
  });

  it('wycenia znane modele wg cennika za milion tokenów', () => {
    expect(estimateCostUsd('gemini-2.5-flash-lite', 1_000_000, 0)).toBeCloseTo(0.1, 8);
    expect(estimateCostUsd('gemini-3.6-flash', 0, 1_000_000)).toBeCloseTo(3.75, 8);
    expect(estimateCostUsd('nieznany', 1_000_000, 1_000_000)).toBeNull();
  });
});
