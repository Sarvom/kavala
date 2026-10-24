import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

// The Vercel project for this repo was imported while the repo held only the
// organisers' template docs, so Vercel guessed "Other" and served `public/`
// as a static site: every page answered 404. vercel.json now pins the
// framework so the dashboard guess can't break the deployment again.
const config = JSON.parse(readFileSync(path.join(process.cwd(), "vercel.json"), "utf8"));

describe("vercel.json", () => {
  it("pins the Next.js framework and its build output", () => {
    expect(config.framework).toBe("nextjs");
    expect(config.outputDirectory).toBe(".next");
    expect(config.buildCommand).toBe("npm run build");
  });

  it("keeps the nightly neighbourhood rebalance at most once a day (Hobby plan limit)", () => {
    expect(config.crons).toEqual([{ path: "/api/hoods/rebalance", schedule: "0 21 * * *" }]);
  });
});
