import { describe, it, expect } from "vitest";
import { tripSchema, placeSchema, daySchema } from "../entities";

describe("Entity Validation Schemas", () => {
  it("validates a valid trip input", () => {
    const validTrip = {
      title: "Ladakh Expedition 2026",
      slug: "ladakh-expedition-2026",
      description: "A 10-day motorcycle expedition through high mountain passes.",
      status: "DRAFT",
      featured: true,
      visibility: "PUBLIC",
    };

    const result = tripSchema.safeParse(validTrip);
    expect(result.success).toBe(true);
  });

  it("rejects invalid slugs with uppercase or special characters", () => {
    const invalidTrip = {
      title: "Ladakh",
      slug: "Ladakh_2026!",
    };

    const result = tripSchema.safeParse(invalidTrip);
    expect(result.success).toBe(false);
  });

  it("validates place coordinates within geographic bounds", () => {
    const validPlace = {
      name: "Pangong Tso",
      slug: "pangong-tso",
      country: "India",
      state: "Ladakh",
      latitude: 33.7595,
      longitude: 78.6674,
    };

    const result = placeSchema.safeParse(validPlace);
    expect(result.success).toBe(true);

    const invalidPlace = {
      name: "Invalid Coordinates",
      slug: "invalid-coords",
      latitude: 120.0, // Exceeds 90
    };
    expect(placeSchema.safeParse(invalidPlace).success).toBe(false);
  });

  it("ensures day numbers are strictly positive integers", () => {
    const validDay = {
      trip_id: "550e8400-e29b-41d4-a716-446655440000",
      day_number: 1,
      title: "Arrival in Leh",
    };
    expect(daySchema.safeParse(validDay).success).toBe(true);

    const invalidDay = {
      trip_id: "550e8400-e29b-41d4-a716-446655440000",
      day_number: 0,
    };
    expect(daySchema.safeParse(invalidDay).success).toBe(false);
  });
});
