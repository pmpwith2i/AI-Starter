// Starter cache facade — pass-through no-op.
//
// Replace with @repo/cache + Redis backend (or any cache library) when you
// need real caching. The interface below mirrors the @repo/cache shape so
// callers compile both with this stub and a real backend.

type CacheWrapOptions<TArgs extends readonly unknown[]> = {
  namespace?: string;
  ttlMs?: number;
  keyFn?: (...args: TArgs) => string;
  tags?: readonly string[] | ((...args: TArgs) => readonly string[]);
  singleFlight?: boolean;
  cacheErrors?: boolean;
};

interface Cache {
  wrap<TArgs extends readonly unknown[], TResult>(
    fn: (...args: TArgs) => Promise<TResult>,
    options?: CacheWrapOptions<TArgs>,
  ): (...args: TArgs) => Promise<TResult>;
  invalidateTags(tags: readonly string[]): Promise<void>;
}

export const cache: Cache = {
  wrap: (fn) => fn,
  invalidateTags: async () => {},
};

export const userTag = (userId: string): string => `user:${userId}`;

export const invalidateUserCache = async (userId: string): Promise<void> => {
  await cache.invalidateTags([userTag(userId)]);
};
