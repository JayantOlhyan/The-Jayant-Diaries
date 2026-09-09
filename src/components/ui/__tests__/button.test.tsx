import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import * as React from "react";
import { Button } from "../button";

describe("Button UI Component", () => {
  it("renders with children text", () => {
    render(<Button>Explore Journeys</Button>);
    expect(screen.getByRole("button", { name: "Explore Journeys" })).toBeDefined();
  });

  it("applies disabled state when disabled prop is provided", () => {
    render(<Button disabled>Disabled Action</Button>);
    const button = screen.getByRole("button", { name: "Disabled Action" }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });

  it("disables button and displays spinner when isLoading is true", () => {
    render(<Button isLoading>Saving</Button>);
    const button = screen.getByRole("button", { name: "Saving" }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });
});
