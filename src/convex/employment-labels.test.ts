// @ts-nocheck
import { describe, expect, test } from "bun:test";
import { employerDisplayLabel } from "./employment";

/**
 * Part 3 — an employer is not a company.
 * "Posted by Jane" for an individual; never "Company: Jane".
 */
describe("employer display", () => {
  test("individual employer reads as a person, not a company", () => {
    expect(
      employerDisplayLabel({ name: "Jane", employerType: "individual" }),
    ).toBe("Posted by Jane");
  });

  test("individual employer can carry an optional display name", () => {
    expect(
      employerDisplayLabel({
        name: "Jane",
        employerType: "individual",
        employerDisplay: "Household",
      }),
    ).toBe("Posted by Household");
  });

  test("a business employer may show the company name", () => {
    expect(
      employerDisplayLabel({
        name: "Brian",
        employerType: "business",
        companyName: "Wanjiku Holdings",
      }),
    ).toBe("Wanjiku Holdings");
  });

  test("an individual never shows a company name even if one is stored", () => {
    expect(
      employerDisplayLabel({
        name: "Jane",
        employerType: "individual",
        companyName: "Stale Co Ltd",
      }),
    ).toBe("Posted by Jane");
  });

  test("an employer with no type at all still reads as a person", () => {
    expect(employerDisplayLabel({ name: "Jane" })).toBe("Posted by Jane");
  });

  test("falls back to a neutral label when nothing is known", () => {
    expect(employerDisplayLabel({})).toBe("Individual employer");
  });
});