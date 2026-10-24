import { describe, expect, it } from "vitest";
import { gridDisk, latLngToCell } from "h3-js";
import { issueCode, verifyCode } from "./handshake";

const SECRET = "test-secret-that-is-long-enough-for-hmac-signing";
const here = latLngToCell(9.9816, 76.2999, 11);
const nextDoor = gridDisk(here, 1).find((c) => c !== here)!;
const farAway = latLngToCell(10.05, 76.2999, 11);

describe("handshake codes", () => {
  it("passes for two people standing together", () => {
    const now = 1_000_000;
    const code = issueCode("alice", here, SECRET, now);
    const r = verifyCode(code, { userId: "bob", cellFine: nextDoor }, SECRET, new Set(), now + 5_000);
    expect(r.ok).toBe(true);
  });

  it("fails when the code is tampered with", () => {
    const code = issueCode("alice", here, SECRET, 0);
    const [body, sig] = code.split(".");
    const tampered = `${body.slice(0, -2)}xx.${sig}`;
    const r = verifyCode(tampered, { userId: "bob", cellFine: here }, SECRET, new Set(), 1000);
    expect(r).toMatchObject({ ok: false, reason: "bad_signature" });
  });

  it("fails when signed with a different secret", () => {
    const code = issueCode("alice", here, "another-secret-entirely-different-value", 0);
    expect(verifyCode(code, { userId: "bob", cellFine: here }, SECRET, new Set(), 1000)).toMatchObject({
      ok: false,
      reason: "bad_signature",
    });
  });

  it("fails after 30 seconds", () => {
    const code = issueCode("alice", here, SECRET, 0);
    expect(verifyCode(code, { userId: "bob", cellFine: here }, SECRET, new Set(), 31_000)).toMatchObject({
      ok: false,
      reason: "expired",
    });
  });

  it("fails when the same code is used twice", () => {
    const used = new Set<string>();
    const code = issueCode("alice", here, SECRET, 0);
    expect(verifyCode(code, { userId: "bob", cellFine: here }, SECRET, used, 1000).ok).toBe(true);
    expect(verifyCode(code, { userId: "carol", cellFine: here }, SECRET, used, 2000)).toMatchObject({
      ok: false,
      reason: "reused",
    });
  });

  it("fails when the phones are far apart", () => {
    const code = issueCode("alice", here, SECRET, 0);
    expect(verifyCode(code, { userId: "bob", cellFine: farAway }, SECRET, new Set(), 1000)).toMatchObject({
      ok: false,
      reason: "too_far",
    });
  });

  it("fails when someone scans their own code", () => {
    const code = issueCode("alice", here, SECRET, 0);
    expect(verifyCode(code, { userId: "alice", cellFine: here }, SECRET, new Set(), 1000)).toMatchObject({
      ok: false,
      reason: "same_person",
    });
  });

  it("fails on garbage input", () => {
    expect(verifyCode("hello", { userId: "bob", cellFine: here }, SECRET, new Set(), 0)).toMatchObject({
      ok: false,
      reason: "bad_format",
    });
  });
});
