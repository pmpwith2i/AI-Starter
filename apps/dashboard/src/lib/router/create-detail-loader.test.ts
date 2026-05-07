import { describe, it, expect, vi } from "vitest";
import { ApiError } from "@repo/server-sdk";
import { isNotFound } from "@tanstack/react-router";
import { QueryClient } from "@tanstack/react-query";
import { createDetailLoader } from "./create-detail-loader";

interface FakeCourse {
  id: string;
  title: string;
}

const buildCourseQueryOptions = (id: string) => ({
  queryKey: ["courses", "detail", id],
  queryFn: async (): Promise<FakeCourse> => ({ id, title: `Corso ${id}` }),
});

const buildLoaderArgs = (
  courseId: string,
  ensureSpy?: (
    options: ReturnType<typeof buildCourseQueryOptions>,
  ) => Promise<FakeCourse>,
) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  if (ensureSpy) {
    queryClient.ensureQueryData = vi.fn(ensureSpy) as never;
  }
  return {
    context: { queryClient },
    params: { courseId },
  };
};

describe("createDetailLoader", () => {
  it("calls ensureQueryData with the queryOptions for the resource id", async () => {
    const ensureSpy = vi.fn<(opts: unknown) => Promise<FakeCourse>>(
      async () => ({ id: "abc", title: "Mock" }),
    );
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    queryClient.ensureQueryData = ensureSpy as never;

    const loader = createDetailLoader<{ courseId: string }, FakeCourse>({
      paramKey: "courseId",
      queryOptions: buildCourseQueryOptions,
      buildCrumbs: (course) => [{ label: course.title }],
    });

    await loader({ context: { queryClient }, params: { courseId: "abc" } });

    expect(ensureSpy).toHaveBeenCalledOnce();
    const calledWith = ensureSpy.mock.calls[0]?.[0] as ReturnType<
      typeof buildCourseQueryOptions
    >;
    expect(calledWith.queryKey).toEqual(["courses", "detail", "abc"]);
  });

  it("returns the breadcrumbs built from the loaded data", async () => {
    const loader = createDetailLoader<{ courseId: string }, FakeCourse>({
      paramKey: "courseId",
      queryOptions: buildCourseQueryOptions,
      buildCrumbs: (course) => [
        { label: "Corsi", link: { to: "/app/courses" } },
        { label: course.title },
      ],
    });

    const result = await loader(buildLoaderArgs("xyz"));
    expect(result).toEqual({
      crumbs: [
        { label: "Corsi", link: { to: "/app/courses" } },
        { label: "Corso xyz" },
      ],
    });
  });

  it("populates the React Query cache so useQuery sees data immediately", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    const loader = createDetailLoader<{ courseId: string }, FakeCourse>({
      paramKey: "courseId",
      queryOptions: buildCourseQueryOptions,
      buildCrumbs: () => [],
    });

    await loader({ context: { queryClient }, params: { courseId: "abc" } });

    const cached = queryClient.getQueryData<FakeCourse>([
      "courses",
      "detail",
      "abc",
    ]);
    expect(cached).toEqual({ id: "abc", title: "Corso abc" });
  });

  it("throws notFound() when the underlying query throws ApiError 404", async () => {
    const loader = createDetailLoader<{ courseId: string }, FakeCourse>({
      paramKey: "courseId",
      queryOptions: () => ({
        queryKey: ["courses", "detail", "missing"],
        queryFn: async () => {
          throw new ApiError(404, {
            status: "error",
            message: "Not found",
          });
        },
      }),
      buildCrumbs: () => [],
    });

    let caught: unknown;
    try {
      await loader(buildLoaderArgs("missing"));
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeDefined();
    expect(isNotFound(caught)).toBe(true);
  });

  it("re-throws non-404 errors so the errorComponent picks them up", async () => {
    const boom = new ApiError(500, { status: "error", message: "Boom" });
    const loader = createDetailLoader<{ courseId: string }, FakeCourse>({
      paramKey: "courseId",
      queryOptions: () => ({
        queryKey: ["courses", "detail", "broken"],
        queryFn: async () => {
          throw boom;
        },
      }),
      buildCrumbs: () => [],
    });

    await expect(() => loader(buildLoaderArgs("broken"))).rejects.toThrow(boom);
  });

  it("uses the configured paramKey to read the resource id", async () => {
    const ensureSpy = vi.fn<(opts: unknown) => Promise<FakeCourse>>(
      async () => ({ id: "p-1", title: "Pro" }),
    );
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    queryClient.ensureQueryData = ensureSpy as never;

    const loader = createDetailLoader<{ professionalId: string }, FakeCourse>({
      paramKey: "professionalId",
      queryOptions: (id) => ({
        queryKey: ["pros", "detail", id],
        queryFn: async () => ({ id, title: `Pro ${id}` }),
      }),
      buildCrumbs: () => [],
    });

    await loader({
      context: { queryClient },
      params: { professionalId: "p-1" },
    });

    expect(ensureSpy).toHaveBeenCalledOnce();
    const calledWith = ensureSpy.mock.calls[0]?.[0] as { queryKey: unknown[] };
    expect(calledWith.queryKey).toEqual(["pros", "detail", "p-1"]);
  });
});
