export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type Paginated<T> = {
  data: T[];
  meta: PaginationMeta;
};

/**
 * Build a paginated envelope from a slice of rows and the query parameters
 * used to produce it. `total` is the count BEFORE pagination.
 *
 * NOTE: this lives next to the patients module on purpose. If a second
 * resource needs the same shape, promote this to
 * `apps/api/src/common/pagination/`.
 */
export function paginate<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
): Paginated<T> {
  const safeLimit = limit > 0 ? limit : 1;
  const totalPages = total === 0 ? 0 : Math.ceil(total / safeLimit);
  return {
    data,
    meta: { page, limit, total, totalPages },
  };
}
