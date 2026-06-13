/**
 * Property-based tests for profile handlers (auth.controller.js)
 *
 * Property 3: getProfile returns complete profile shape
 *   Validates: Requirements 2.8, 2.12
 *
 * Property 4: updateProfile round-trip
 *   Validates: Requirements 2.9, 2.12
 */

'use strict';

const fc = require('fast-check');
const mongoose = require('mongoose');

jest.mock('../../../models/User', () => ({
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
}));

const User = require('../../../models/User');
const { getProfile, updateProfile } = require('../auth.controller');

const PROFILE_FIELDS = ['id', 'name', 'email', 'phone', 'bio', 'avatar'];

const makeMockUser = (overrides = {}) => {
  const id = overrides._id ?? new mongoose.Types.ObjectId();
  return {
    _id: id,
    name: overrides.name ?? 'Test User',
    email: overrides.email ?? 'test@bigbull.com',
    phone: overrides.phone ?? null,
    bio: overrides.bio ?? null,
    avatar: overrides.avatar ?? null,
  };
};

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const userDocArb = fc.record({
  name: fc.string({ minLength: 1, maxLength: 50 }),
  email: fc.emailAddress(),
  phone: fc.option(fc.string({ maxLength: 20 }), { nil: null }),
  bio: fc.option(fc.string({ maxLength: 200 }), { nil: null }),
  avatar: fc.constant(null),
});

// ─── Property 3: getProfile response shape ───────────────────────────────────

describe('Property 3: getProfile returns complete profile shape', () => {
  it('returns { id, name, email, phone, bio, avatar } for any user document', async () => {
    await fc.assert(
      fc.asyncProperty(userDocArb, async (fields) => {
        const mockUser = makeMockUser(fields);
        User.findById.mockResolvedValue(mockUser);

        const req = { user: { id: mockUser._id.toString() } };
        const res = mockRes();

        await getProfile(req, res);

        expect(res.json).toHaveBeenCalledTimes(1);
        const body = res.json.mock.calls[0][0];
        expect(body.success).toBe(true);

        for (const field of PROFILE_FIELDS) {
          expect(body.data).toHaveProperty(field);
        }

        expect(body.data.id).toEqual(mockUser._id);
        expect(body.data.name).toBe(mockUser.name);
        expect(body.data.email).toBe(mockUser.email);
        expect(body.data.phone).toBe(mockUser.phone);
        expect(body.data.bio).toBe(mockUser.bio);
        expect(body.data.avatar).toBe(mockUser.avatar);
      }),
      { numRuns: 100 }
    );
  });
});

// ─── Property 4: updateProfile round-trip ────────────────────────────────────

const patchArb = fc.record({
  name: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
  phone: fc.option(fc.string({ maxLength: 20 }), { nil: undefined }),
  bio: fc.option(fc.string({ maxLength: 200 }), { nil: undefined }),
}).filter((patch) =>
  patch.name !== undefined || patch.phone !== undefined || patch.bio !== undefined
);

describe('Property 4: updateProfile round-trip', () => {
  it('returns profile with each submitted field matching the patch value', async () => {
    await fc.assert(
      fc.asyncProperty(userDocArb, patchArb, async (baseFields, patch) => {
        const mockUser = makeMockUser(baseFields);
        const updatedUser = { ...mockUser, ...patch };

        User.findByIdAndUpdate.mockResolvedValue(updatedUser);

        const req = { user: { id: mockUser._id.toString() }, body: patch };
        const res = mockRes();

        await updateProfile(req, res);

        expect(res.json).toHaveBeenCalledTimes(1);
        const body = res.json.mock.calls[0][0];
        expect(body.success).toBe(true);

        if (patch.name !== undefined) expect(body.data.name).toBe(patch.name);
        if (patch.phone !== undefined) expect(body.data.phone).toBe(patch.phone);
        if (patch.bio !== undefined) expect(body.data.bio).toBe(patch.bio);
      }),
      { numRuns: 100 }
    );
  });
});
