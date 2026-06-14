/**
 * Property-based and unit tests for all DTO transformer functions.
 *
 * Runner: Jest (--experimental-vm-modules for ESM)
 * Library: fast-check
 */

import fc from 'fast-check';
import { toAuthUserDTO } from '../../features/auth/dto/auth.dto.js';
import { toUserProfileDTO } from '../../features/user/dto/user.dto.js';
import {
  toAssetDTO,
  toAssetListDTO,
  toSearchResultDTO,
  toQuoteDTO,
  toTickerDTO,
} from '../../features/market/dto/market.dto.js';
import {
  toHoldingDTO,
  toHoldingListDTO,
  toSummaryDTO,
} from '../../features/portfolio/dto/portfolio.dto.js';
import { toWalletDTO } from '../../features/wallet/dto/wallet.dto.js';
import {
  toTransactionDTO,
  toTransactionHistoryDTO,
  toOrderResultDTO,
} from '../../features/transaction/dto/transaction.dto.js';
import { toChatReplyDTO } from '../../features/chat/dto/chat.dto.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const isFiniteNumber = (v) => typeof v === 'number' && isFinite(v);
const isNullableStr = (v) => v === null || typeof v === 'string';

// ---------------------------------------------------------------------------
// 1. toAuthUserDTO
// ---------------------------------------------------------------------------

describe('toAuthUserDTO', () => {
  it('never throws for any arbitrary input', () => {
    fc.assert(
      fc.property(fc.anything(), (raw) => {
        expect(() => toAuthUserDTO(raw)).not.toThrow();
      })
    );
  });

  it('always returns all fields with correct types', () => {
    fc.assert(
      fc.property(fc.anything(), (raw) => {
        const dto = toAuthUserDTO(raw);
        expect(typeof dto.id).toBe('string');
        expect(typeof dto.name).toBe('string');
        expect(typeof dto.email).toBe('string');
        expect(typeof dto.role).toBe('string');
      })
    );
  });

  it('is idempotent', () => {
    fc.assert(
      fc.property(fc.anything(), (raw) => {
        expect(toAuthUserDTO(toAuthUserDTO(raw))).toEqual(toAuthUserDTO(raw));
      })
    );
  });

  it('toAuthUserDTO(null) returns all empty strings', () => {
    expect(toAuthUserDTO(null)).toEqual({ id: '', name: '', email: '', role: '' });
  });

  it('toAuthUserDTO({ name: 42 }) coerces name to ""', () => {
    expect(toAuthUserDTO({ name: 42 }).name).toBe('');
  });
});

// ---------------------------------------------------------------------------
// 2. toUserProfileDTO
// ---------------------------------------------------------------------------

describe('toUserProfileDTO', () => {
  it('never throws for any arbitrary input', () => {
    fc.assert(
      fc.property(fc.anything(), (raw) => {
        expect(() => toUserProfileDTO(raw)).not.toThrow();
      })
    );
  });

  it('always returns all fields with correct types', () => {
    fc.assert(
      fc.property(fc.anything(), (raw) => {
        const dto = toUserProfileDTO(raw);
        expect(typeof dto.id).toBe('string');
        expect(typeof dto.name).toBe('string');
        expect(typeof dto.email).toBe('string');
        expect(typeof dto.phone).toBe('string');
        expect(typeof dto.bio).toBe('string');
        expect(isNullableStr(dto.avatar)).toBe(true);
      })
    );
  });
});

// ---------------------------------------------------------------------------
// 3. toAssetDTO
// ---------------------------------------------------------------------------

describe('toAssetDTO', () => {
  it('never throws for any arbitrary input', () => {
    fc.assert(
      fc.property(fc.anything(), (raw) => {
        expect(() => toAssetDTO(raw)).not.toThrow();
      })
    );
  });

  it('always returns all fields with correct types', () => {
    fc.assert(
      fc.property(fc.anything(), (raw) => {
        const dto = toAssetDTO(raw);
        expect(typeof dto.id).toBe('string');
        expect(typeof dto.ticker).toBe('string');
        expect(typeof dto.name).toBe('string');
        expect(typeof dto.assetType).toBe('string');
        expect(isNullableStr(dto.exchange)).toBe(true);
        expect(isNullableStr(dto.sector)).toBe(true);
        expect(isFiniteNumber(dto.basePrice)).toBe(true);
        expect(isFiniteNumber(dto.currentPrice)).toBe(true);
        expect(typeof dto.currency).toBe('string');
      })
    );
  });

  it('is idempotent', () => {
    fc.assert(
      fc.property(fc.anything(), (raw) => {
        expect(toAssetDTO(toAssetDTO(raw))).toEqual(toAssetDTO(raw));
      })
    );
  });

  it('toAssetDTO({}) returns correct defaults', () => {
    const dto = toAssetDTO({});
    expect(dto.id).toBe('');
    expect(dto.ticker).toBe('');
    expect(dto.exchange).toBeNull();
    expect(dto.sector).toBeNull();
    expect(dto.basePrice).toBe(0);
    expect(dto.currency).toBe('INR');
  });

  it('toAssetDTO({ currentPrice: NaN }) → currentPrice: 0', () => {
    expect(toAssetDTO({ currentPrice: NaN }).currentPrice).toBe(0);
  });

  it('toAssetDTO({ currentPrice: Infinity }) → currentPrice: 0', () => {
    expect(toAssetDTO({ currentPrice: Infinity }).currentPrice).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// 4. toAssetListDTO
// ---------------------------------------------------------------------------

describe('toAssetListDTO', () => {
  it('never throws for any arbitrary input', () => {
    fc.assert(
      fc.property(fc.anything(), (raw) => {
        expect(() => toAssetListDTO(raw)).not.toThrow();
      })
    );
  });

  it('always returns an array', () => {
    fc.assert(
      fc.property(fc.anything(), (raw) => {
        expect(Array.isArray(toAssetListDTO(raw))).toBe(true);
      })
    );
  });
});

// ---------------------------------------------------------------------------
// 5. toHoldingDTO
// ---------------------------------------------------------------------------

describe('toHoldingDTO', () => {
  it('never throws for any arbitrary input', () => {
    fc.assert(
      fc.property(fc.anything(), (raw) => {
        expect(() => toHoldingDTO(raw)).not.toThrow();
      })
    );
  });

  it('always returns all fields with correct types', () => {
    fc.assert(
      fc.property(fc.anything(), (raw) => {
        const dto = toHoldingDTO(raw);
        expect(typeof dto.assetId).toBe('string');
        expect(typeof dto.ticker).toBe('string');
        expect(typeof dto.name).toBe('string');
        expect(typeof dto.assetType).toBe('string');
        expect(isNullableStr(dto.exchange)).toBe(true);
        expect(isNullableStr(dto.sector)).toBe(true);
        expect(isFiniteNumber(dto.netQuantity)).toBe(true);
        expect(isFiniteNumber(dto.avgCostBasis)).toBe(true);
        expect(isFiniteNumber(dto.currentPrice)).toBe(true);
        expect(isFiniteNumber(dto.currentValue)).toBe(true);
        expect(isFiniteNumber(dto.totalInvested)).toBe(true);
        expect(isFiniteNumber(dto.unrealisedPnL)).toBe(true);
        expect(isFiniteNumber(dto.unrealisedPnLPercent)).toBe(true);
        expect(isFiniteNumber(dto.portfolioWeight)).toBe(true);
      })
    );
  });

  it('is idempotent', () => {
    fc.assert(
      fc.property(fc.anything(), (raw) => {
        expect(toHoldingDTO(toHoldingDTO(raw))).toEqual(toHoldingDTO(raw));
      })
    );
  });
});

// ---------------------------------------------------------------------------
// 6. toHoldingListDTO
// ---------------------------------------------------------------------------

describe('toHoldingListDTO', () => {
  it('never throws for any arbitrary input', () => {
    fc.assert(
      fc.property(fc.anything(), (raw) => {
        expect(() => toHoldingListDTO(raw)).not.toThrow();
      })
    );
  });

  it('toHoldingListDTO(null) → []', () => {
    expect(toHoldingListDTO(null)).toEqual([]);
  });

  it('toHoldingListDTO("not an array") → []', () => {
    expect(toHoldingListDTO('not an array')).toEqual([]);
  });

  it('toHoldingListDTO([{}]) → single Holding_DTO with all defaults', () => {
    const result = toHoldingListDTO([{}]);
    expect(result).toHaveLength(1);
    const dto = result[0];
    expect(typeof dto.assetId).toBe('string');
    expect(typeof dto.ticker).toBe('string');
    expect(isFiniteNumber(dto.netQuantity)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 7. toSummaryDTO
// ---------------------------------------------------------------------------

describe('toSummaryDTO', () => {
  it('never throws for any arbitrary input', () => {
    fc.assert(
      fc.property(fc.anything(), (raw) => {
        expect(() => toSummaryDTO(raw)).not.toThrow();
      })
    );
  });

  it('always returns all fields with correct types', () => {
    fc.assert(
      fc.property(fc.anything(), (raw) => {
        const dto = toSummaryDTO(raw);
        expect(isFiniteNumber(dto.totalInvested)).toBe(true);
        expect(isFiniteNumber(dto.currentValue)).toBe(true);
        expect(isFiniteNumber(dto.totalPnL)).toBe(true);
        expect(isFiniteNumber(dto.totalPnLPercent)).toBe(true);
        expect(isFiniteNumber(dto.holdingCount)).toBe(true);
        expect(isFiniteNumber(dto.cashBalance)).toBe(true);
        expect(typeof dto.currency).toBe('string');
      })
    );
  });
});

// ---------------------------------------------------------------------------
// 8. toWalletDTO
// ---------------------------------------------------------------------------

describe('toWalletDTO', () => {
  it('never throws for any arbitrary input', () => {
    fc.assert(
      fc.property(fc.anything(), (raw) => {
        expect(() => toWalletDTO(raw)).not.toThrow();
      })
    );
  });

  it('always returns correct types', () => {
    fc.assert(
      fc.property(fc.anything(), (raw) => {
        const dto = toWalletDTO(raw);
        expect(isFiniteNumber(dto.balance)).toBe(true);
        expect(typeof dto.currency).toBe('string');
      })
    );
  });

  it('toWalletDTO({ balance: Infinity }) → { balance: 0, currency: "INR" }', () => {
    expect(toWalletDTO({ balance: Infinity })).toEqual({ balance: 0, currency: 'INR' });
  });
});

// ---------------------------------------------------------------------------
// 9. toTransactionDTO
// ---------------------------------------------------------------------------

describe('toTransactionDTO', () => {
  it('never throws for any arbitrary input', () => {
    fc.assert(
      fc.property(fc.anything(), (raw) => {
        expect(() => toTransactionDTO(raw)).not.toThrow();
      })
    );
  });

  it('always returns all fields with correct types', () => {
    fc.assert(
      fc.property(fc.anything(), (raw) => {
        const dto = toTransactionDTO(raw);
        expect(typeof dto.id).toBe('string');
        expect(typeof dto.assetId).toBe('string');
        expect(typeof dto.transactionType).toBe('string');
        expect(isFiniteNumber(dto.quantity)).toBe(true);
        expect(isFiniteNumber(dto.pricePerUnit)).toBe(true);
        expect(isFiniteNumber(dto.fees)).toBe(true);
        expect(typeof dto.notes).toBe('string');
        expect(typeof dto.executedAt).toBe('string');
      })
    );
  });

  it('handles Date objects for executedAt', () => {
    const d = new Date('2024-01-15T10:00:00.000Z');
    const dto = toTransactionDTO({ executedAt: d });
    expect(dto.executedAt).toBe('2024-01-15T10:00:00.000Z');
  });

  it('handles ISO string for executedAt', () => {
    const dto = toTransactionDTO({ executedAt: '2024-01-15T10:00:00.000Z' });
    expect(dto.executedAt).toBe('2024-01-15T10:00:00.000Z');
  });

  it('handles missing executedAt → ""', () => {
    expect(toTransactionDTO({}).executedAt).toBe('');
  });
});

// ---------------------------------------------------------------------------
// 10. toTransactionHistoryDTO
// ---------------------------------------------------------------------------

describe('toTransactionHistoryDTO', () => {
  it('never throws for any arbitrary input', () => {
    fc.assert(
      fc.property(fc.anything(), (raw) => {
        expect(() => toTransactionHistoryDTO(raw)).not.toThrow();
      })
    );
  });

  it('always returns transactions array and pagination object', () => {
    fc.assert(
      fc.property(fc.anything(), (raw) => {
        const dto = toTransactionHistoryDTO(raw);
        expect(Array.isArray(dto.transactions)).toBe(true);
        expect(isFiniteNumber(dto.pagination.total)).toBe(true);
        expect(isFiniteNumber(dto.pagination.page)).toBe(true);
        expect(isFiniteNumber(dto.pagination.limit)).toBe(true);
        expect(isFiniteNumber(dto.pagination.totalPages)).toBe(true);
      })
    );
  });

  it('toTransactionHistoryDTO(null) returns correct defaults', () => {
    expect(toTransactionHistoryDTO(null)).toEqual({
      transactions: [],
      pagination: { total: 0, page: 1, limit: 20, totalPages: 0 },
    });
  });
});

// ---------------------------------------------------------------------------
// 11. toOrderResultDTO
// ---------------------------------------------------------------------------

describe('toOrderResultDTO', () => {
  it('never throws for any arbitrary input', () => {
    fc.assert(
      fc.property(fc.anything(), (raw) => {
        expect(() => toOrderResultDTO(raw)).not.toThrow();
      })
    );
  });

  it('toOrderResultDTO({ transaction: null }) → fully-defaulted transaction', () => {
    const dto = toOrderResultDTO({ transaction: null });
    expect(typeof dto.transaction.id).toBe('string');
    expect(isFiniteNumber(dto.transaction.quantity)).toBe(true);
    expect(typeof dto.transaction.executedAt).toBe('string');
  });
});

// ---------------------------------------------------------------------------
// 12. toQuoteDTO
// ---------------------------------------------------------------------------

describe('toQuoteDTO', () => {
  it('never throws for any arbitrary input', () => {
    fc.assert(
      fc.property(fc.anything(), (raw) => {
        expect(() => toQuoteDTO(raw)).not.toThrow();
      })
    );
  });

  it('always returns all fields with correct types', () => {
    fc.assert(
      fc.property(fc.anything(), (raw) => {
        const dto = toQuoteDTO(raw);
        expect(typeof dto.ticker).toBe('string');
        expect(typeof dto.name).toBe('string');
        expect(typeof dto.assetType).toBe('string');
        expect(isFiniteNumber(dto.price)).toBe(true);
        expect(typeof dto.priceLabel).toBe('string');
        expect(typeof dto.currency).toBe('string');
        expect(isFiniteNumber(dto.change)).toBe(true);
        expect(typeof dto.changePercent).toBe('string');
        expect(isNullableStr(dto.sector)).toBe(true);
      })
    );
  });
});

// ---------------------------------------------------------------------------
// 13. toTickerDTO
// ---------------------------------------------------------------------------

describe('toTickerDTO', () => {
  it('never throws for any arbitrary input', () => {
    fc.assert(
      fc.property(fc.anything(), (raw) => {
        expect(() => toTickerDTO(raw)).not.toThrow();
      })
    );
  });

  it('always returns an array with correct item types', () => {
    fc.assert(
      fc.property(fc.array(fc.anything()), (raw) => {
        const items = toTickerDTO(raw);
        expect(Array.isArray(items)).toBe(true);
        items.forEach((item) => {
          expect(typeof item.symbol).toBe('string');
          expect(typeof item.name).toBe('string');
          expect(isFiniteNumber(item.price)).toBe(true);
          expect(typeof item.currency).toBe('string');
          expect(isFiniteNumber(item.change)).toBe(true);
          expect(typeof item.changePercent).toBe('string');
          expect(typeof item.up).toBe('boolean');
        });
      })
    );
  });

  it('toTickerDTO([{}]) returns correct defaults', () => {
    expect(toTickerDTO([{}])).toEqual([
      {
        symbol: '',
        name: '',
        price: 0,
        currency: 'INR',
        change: 0,
        changePercent: '0.00%',
        up: false,
      },
    ]);
  });
});

// ---------------------------------------------------------------------------
// 14. toSearchResultDTO
// ---------------------------------------------------------------------------

describe('toSearchResultDTO', () => {
  it('never throws for any arbitrary input', () => {
    fc.assert(
      fc.property(fc.anything(), (raw) => {
        expect(() => toSearchResultDTO(raw)).not.toThrow();
      })
    );
  });

  it('always returns string query and array fields', () => {
    fc.assert(
      fc.property(fc.anything(), (raw) => {
        const dto = toSearchResultDTO(raw);
        expect(typeof dto.query).toBe('string');
        expect(Array.isArray(dto.stocks)).toBe(true);
        expect(Array.isArray(dto.mutuals)).toBe(true);
        expect(Array.isArray(dto.results)).toBe(true);
      })
    );
  });

  it('stock items have type "stock", symbol, and no schemeCode', () => {
    const dto = toSearchResultDTO({
      stocks: [
        { _id: '1', ticker: 'RELIANCE', name: 'Reliance Industries Ltd', assetType: 'STOCK' },
      ],
      mutuals: [],
    });
    expect(dto.stocks).toHaveLength(1);
    expect(dto.stocks[0].type).toBe('stock');
    expect(dto.stocks[0].symbol).toBe('RELIANCE');
    expect(dto.stocks[0].schemeCode).toBe('');
    expect(dto.stocks[0].name).toBe('Reliance Industries Ltd');
  });

  it('mutual items have type "mutual", schemeCode, and no symbol', () => {
    const dto = toSearchResultDTO({
      stocks: [],
      mutuals: [
        { _id: '2', ticker: '120503', name: 'Axis Bluechip Fund', assetType: 'MUTUAL_FUND' },
      ],
    });
    expect(dto.mutuals).toHaveLength(1);
    expect(dto.mutuals[0].type).toBe('mutual');
    expect(dto.mutuals[0].schemeCode).toBe('120503');
    expect(dto.mutuals[0].symbol).toBe('');
  });
});

// ---------------------------------------------------------------------------
// 15. toChatReplyDTO
// ---------------------------------------------------------------------------

describe('toChatReplyDTO', () => {
  it('never throws for any arbitrary input', () => {
    fc.assert(
      fc.property(fc.anything(), (raw) => {
        expect(() => toChatReplyDTO(raw)).not.toThrow();
      })
    );
  });

  it('always returns reply as string', () => {
    fc.assert(
      fc.property(fc.anything(), (raw) => {
        const dto = toChatReplyDTO(raw);
        expect(typeof dto.reply).toBe('string');
      })
    );
  });

  it('toChatReplyDTO({ reply: null }) → { reply: "" }', () => {
    expect(toChatReplyDTO({ reply: null })).toEqual({ reply: '' });
  });
});
