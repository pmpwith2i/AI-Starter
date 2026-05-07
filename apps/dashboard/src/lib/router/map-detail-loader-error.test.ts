import { describe, it, expect } from "vitest";
import { ApiError } from "@repo/server-sdk";
import { isNotFound } from "@tanstack/react-router";
import { mapDetailLoaderError } from "./map-detail-loader-error";

describe("mapDetailLoaderError", () => {
  it("throws notFound() for ApiError with status 404", () => {
    const err = new ApiError(404, { status: "error", message: "Not found" });
    let caught: unknown;
    try {
      mapDetailLoaderError(err);
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeDefined();
    expect(isNotFound(caught)).toBe(true);
  });

  it("re-throws ApiError with non-404 status verbatim", () => {
    const err = new ApiError(500, { status: "error", message: "Server boom" });
    expect(() => mapDetailLoaderError(err)).toThrow(err);
  });

  it("re-throws ApiError 401 verbatim (handled by auth guard, not here)", () => {
    const err = new ApiError(401, {
      status: "error",
      message: "Unauthorized",
    });
    expect(() => mapDetailLoaderError(err)).toThrow(err);
  });

  it("re-throws non-ApiError errors verbatim", () => {
    const err = new Error("network down");
    expect(() => mapDetailLoaderError(err)).toThrow(err);
  });

  it("re-throws non-Error throwables verbatim", () => {
    expect(() => mapDetailLoaderError("string thrown")).toThrow(
      "string thrown",
    );
  });

  it("never returns a value", () => {
    const err = new Error("anything");
    expect(() => mapDetailLoaderError(err)).toThrow();
    // The fn signature is `(...) => never` — TS would not let us assign
    // its result to a variable. This test asserts runtime behaviour.
  });
});
