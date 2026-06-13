/**
 * Property-based tests for sendMessage (chat.controller.js)
 *
 * Property 5: sendMessage validates all non-empty strings
 *   Validates: Requirements 3.4
 *
 * Property 6: sendMessage rejects blank messages
 *   Validates: Requirements 3.4, 3.5
 */

'use strict';

const fc = require('fast-check');
const AppError = require('../../../shared/AppError');

jest.mock('../chat.service', () => ({
  ask: jest.fn(),
}));

const chatService = require('../chat.service');
const { sendMessage } = require('../chat.controller');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const runHandler = async (body) => {
  const req = { user: { id: 'user123' }, body };
  const res = mockRes();
  const next = jest.fn();
  await sendMessage(req, res, next);
  return { res, next };
};

const nonEmptyMessageArb = fc.string({ minLength: 1, maxLength: 200 })
  .filter((s) => s.trim().length > 0);

const blankMessageArb = fc.oneof(
  fc.constant(''),
  fc.stringMatching(/^\s+$/),
  fc.constant(undefined)
);

// ─── Property 5: non-empty strings pass validation ───────────────────────────

describe('Property 5: sendMessage validates all non-empty strings', () => {
  beforeEach(() => {
    chatService.ask.mockResolvedValue('AI reply');
  });

  it('does not throw 400 and calls chatService.ask for non-empty messages', async () => {
    await fc.assert(
      fc.asyncProperty(nonEmptyMessageArb, async (message) => {
        chatService.ask.mockClear();

        const { res, next } = await runHandler({ message });

        expect(next).not.toHaveBeenCalled();
        expect(res.json).toHaveBeenCalled();
        expect(chatService.ask).toHaveBeenCalledWith('user123', message);
      }),
      { numRuns: 100 }
    );
  });
});

// ─── Property 6: blank messages rejected ─────────────────────────────────────

describe('Property 6: sendMessage rejects blank messages', () => {
  it('responds with HTTP 400 for empty, whitespace-only, or absent message', async () => {
    await fc.assert(
      fc.asyncProperty(blankMessageArb, async (message) => {
        const body = message === undefined ? {} : { message };
        const { next } = await runHandler(body);

        expect(next).toHaveBeenCalledTimes(1);
        const err = next.mock.calls[0][0];
        expect(err).toBeInstanceOf(AppError);
        expect(err.statusCode).toBe(400);
      }),
      { numRuns: 100 }
    );
  });
});
