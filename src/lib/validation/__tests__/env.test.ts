import { describe, it, expect } from "vitest";
import { envSchema } from "../env";

describe("Environment Validation", () => {
  it("passes with valid minimum environment variables", () => {
    const validEnv = {
      NEXT_PUBLIC_APP_URL: "https://thejayantdiaries.com",
      NEXT_PUBLIC_SUPABASE_URL: "https://xyzcompany.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.valid-anon-key",
    };

    const result = envSchema.safeParse(validEnv);
    expect(result.success).toBe(true);
  });

  it("fails when NEXT_PUBLIC_SUPABASE_URL is not a valid URL", () => {
    const invalidEnv = {
      NEXT_PUBLIC_SUPABASE_URL: "not-a-url",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "valid-key",
    };

    const result = envSchema.safeParse(invalidEnv);
    expect(result.success).toBe(false);
  });

  it("fails when NEXT_PUBLIC_SUPABASE_ANON_KEY is empty", () => {
    const invalidEnv = {
      NEXT_PUBLIC_SUPABASE_URL: "https://xyzcompany.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "",
    };

    const result = envSchema.safeParse(invalidEnv);
    expect(result.success).toBe(false);
  });
});
