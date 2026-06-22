/**
 * Pagination Utilities
 *
 * Standardised helpers for paginated list endpoints.
 * All listing APIs use POST with a JSON body containing filters and pagination.
 *
 * Request body shape (validated by listQuerySchema):
 *   {
 *     pagination: { page: 1, limit: 20 },
 *     filters: { ... },             // endpoint-specific filters
 *     search: "",                    // global text search term
 *     sort: { field: "createdAt", order: "desc" }
 *   }
 *
 * Response shape (via sendPaginatedSuccess):
 *   {
 *     success: true,
 *     message: "...",
 *     data: {
 *       items: [...],
 *       pagination: { page, limit, total, totalPages, hasNextPage, hasPrevPage }
 *     },
 *     error: null,
 *     timestamp: "..."
 *   }
 */
const { z } = require('zod');

/**
 * Base Zod schema for paginated list requests.
 * Extend this per-endpoint by merging with additional filter fields.
 */
const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(5),
});

const sortSchema = z
  .object({
    field: z.string().min(1),
    order: z.enum(['asc', 'desc']).default('desc'),
  })
  .optional();

const baseListQuerySchema = z.object({
  pagination: paginationSchema.default({ page: 1, limit: 5 }),
  search: z.string().optional().default(''),
  sort: sortSchema,
});

/**
 * Builds a standardised pagination metadata object.
 *
 * @param {number} total - Total matching documents
 * @param {number} page  - Current page (1-based)
 * @param {number} limit - Items per page
 * @returns {object}
 */
const buildPaginationMeta = (total, page, limit) => {
  const totalPages = Math.ceil(total / limit) || 1;
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};

/**
 * Sends a standardised paginated success response.
 *
 * @param {import('express').Response} res
 * @param {Array} items     - The page of results
 * @param {number} total    - Total matching documents
 * @param {number} page     - Current page
 * @param {number} limit    - Page size
 * @param {string} [message]
 */
const sendPaginatedSuccess = (res, items, total, page, limit, message = 'Success') => {
  res.status(200).json({
    success: true,
    message,
    data: {
      items,
      pagination: buildPaginationMeta(total, page, limit),
    },
    error: null,
    timestamp: new Date().toISOString(),
  });
};

module.exports = {
  paginationSchema,
  sortSchema,
  baseListQuerySchema,
  buildPaginationMeta,
  sendPaginatedSuccess,
};
