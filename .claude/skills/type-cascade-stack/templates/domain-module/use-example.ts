// apps/dashboard/src/hooks/example/use-example.ts
//
// Pattern:
//   - queryOptions() factory for typed queries
//   - keys live in <domain>.keys.ts
//   - SDK types imported directly — no DTO mapper

import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  CreateExampleBody,
  ExampleResponse,
} from "@repo/server-sdk/schemas";
import { sdk } from "@/lib/api/client";
import { exampleKeys } from "./example.keys";

export const exampleDetailQuery = (id: string) =>
  queryOptions<ExampleResponse>({
    queryKey: exampleKeys.detail(id),
    queryFn: () => sdk.example.get(id),
  });

export const useCreateExample = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateExampleBody) => sdk.example.create(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: exampleKeys.all }),
  });
};
