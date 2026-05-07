// apps/dashboard/src/hooks/example/example.keys.ts

export const exampleKeys = {
  all: ["example"] as const,
  detail: (id: string) => ["example", id] as const,
};
