/** Normalize GET /projects response (array legacy vs paginated object). */
export function parseProjectsResponse(data) {
  if (Array.isArray(data)) {
    return { projects: data, total: data.length, page: 1, hasMore: false };
  }
  return {
    projects: data?.projects ?? [],
    total: data?.total ?? 0,
    page: data?.page ?? 1,
    hasMore: data?.hasMore ?? false,
  };
}
