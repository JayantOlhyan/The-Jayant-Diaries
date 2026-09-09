import { z } from "zod";

export const envSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  DATABASE_URL: z.string().min(1).optional(),
  NEXT_PUBLIC_MAP_PROVIDER_KEY: z.string().optional(),
  NEXT_PUBLIC_ANALYTICS_KEY: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Validates environment variables and provides helpful error messages.
 */
export function getValidatedEnv(env: Record<string, string | undefined> = process.env): Env {
  const result = envSchema.safeParse(env);
  if (!result.success) {
    const issues = result.error.issues.map((i) => ` - ${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(`Environment validation error:\n${issues}`);
  }
  return result.data;
}
