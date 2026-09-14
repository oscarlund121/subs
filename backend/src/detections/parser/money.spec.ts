import { describe, expect, it } from 'vitest';
import { findAmounts, parseAmount, pickChargeAmount } from './money.js';

describe('parseAmount', () => {
  it.each([
    ['12.99', 12.99],
    ['129,00', 129],
    ['1.234,56', 1234.56],
    ['1,234.56', 1234.56],
    ['1,234', 1234],
    ['1.234', 1234],
    ['99', 99],
  ])('parses %s', (input, expected) => {
    expect(parseAmount(input)).toBe(expected);
  });
});

describe('findAmounts', () => {
  it('reads symbols before and after the number', () => {
    expect(findAmounts('$9.99 and 129,00 kr and €4,50')).toEqual([
      { amount: 9.99, currency: 'USD', index: 0 },
      { amount: 129, currency: 'DKK', index: 10 },
      { amount: 4.5, currency: 'EUR', index: 24 },
    ]);
  });

  it('reads bare kr as DKK unless another krone is named', () => {
    expect(findAmounts('99,00 kr')[0].currency).toBe('DKK');
    expect(findAmounts('Total 99,00 kr (SEK)')[0].currency).toBe('SEK');
  });

  it('ignores plain numbers with no currency', () => {
    expect(findAmounts('Order 12345 contains 3 items')).toEqual([]);
  });
});

describe('pickChargeAmount', () => {
  it('prefers the amount next to a total label', () => {
    const text = 'Plan from $4.99 per month\nUpgrade for $99.00\nTotal charged: $14.99';
    expect(pickChargeAmount(text)?.amount).toBe(14.99);
  });

  it('falls back to the first amount', () => {
    expect(pickChargeAmount('129,00 kr per month. Or 1290,00 kr yearly.')?.amount).toBe(129);
  });

  it('returns null when there is no money', () => {
    expect(pickChargeAmount('no prices here')).toBeNull();
  });
});
