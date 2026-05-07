import { describe, it, expect } from "vitest";
import { maskEmail } from "./mask-email";

describe("maskEmail", () => {
  it("masks a standard email", () => {
    expect(maskEmail("federico@gmail.com")).toBe("f******o@gmail.com");
  });

  it("masks a 2-char local part", () => {
    expect(maskEmail("ab@gmail.com")).toBe("a*@gmail.com");
  });

  it("keeps 1-char local part as-is", () => {
    expect(maskEmail("a@gmail.com")).toBe("a*@gmail.com");
  });

  it("handles a 3-char local part", () => {
    expect(maskEmail("abc@test.it")).toBe("a*c@test.it");
  });

  it("returns original if no @ sign", () => {
    expect(maskEmail("noemail")).toBe("noemail");
  });
});
