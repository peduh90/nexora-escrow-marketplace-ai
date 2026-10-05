// @ts-nocheck
import { describe, expect, test } from "bun:test";
import {
  findMultiItemListing,
  isSingleItemListing,
  MAX_LISTING_PHOTOS,
} from "./single-item-listing";

/**
 * Part 9 — ONE SELLER SUBMISSION = ONE PRODUCT.
 * The same validator runs in SellerAddProduct (frontend) and createListing
 * (backend), so these cases pin the shared contract.
 */
describe("one listing = one item", () => {
  test("a single product with 5 photos of itself is allowed", () => {
    const images = ["p1", "p2", "p3", "p4", "p5"];
    expect(
      findMultiItemListing({
        title: "HP EliteBook 840 G5",
        description: "Core i5, 16GB RAM, 512GB SSD. Good battery health, original charger.",
        images,
      }),
    ).toBeNull();
    expect(
      isSingleItemListing({
        title: "HP EliteBook 840 G5",
        description: "Core i5, 16GB RAM.",
        images,
      }),
    ).toBe(true);
  });

  test("a second product gets its own listing, never the same submission", () => {
    expect(
      findMultiItemListing({
        title: "Samsung A54",
        description: "128GB, black, as new",
      }),
    ).toBeNull();
  });

  test("rejects an explicitly numbered product list", () => {
    expect(
      findMultiItemListing({
        title: "Product 1 - iPhone 13, Product 2 - Samsung A54, Product 3 - HP Laptop",
        description: "Three devices.",
      }),
    ).toContain("single product");
  });

  test("rejects a numbered catalogue in the title", () => {
    expect(
      findMultiItemListing({
        title: "1. iPhone 13\n2. Samsung A54\n3. Dell Laptop",
        description: "Everything new.",
      }),
    ).toContain("single product");
  });

  test("rejects a numbered catalogue in the description", () => {
    expect(
      findMultiItemListing({
        title: " assorted electronics",
        description: "1. Laptop\n2. TV\n3. Sofa",
      }),
    ).toContain("one product");
  });

  test("rejects a bundle of several distinct items", () => {
    expect(
      findMultiItemListing({
        title: "Home starter pack",
        description: "A bundle of 5 household appliances.",
      }),
    ).toContain("single product");
  });

  test("rejects more photos than a single item's photo set allows", () => {
    const images = Array.from({ length: MAX_LISTING_PHOTOS + 1 }, (_, i) => `photo-${i}`);
    expect(findMultiItemListing({ title: "HP EliteBook 840 G5", description: "Laptop", images })).toContain(
      "photos of the same item",
    );
  });

  test("a legitimate description mentioning accessories is not rejected", () => {
    expect(
      findMultiItemListing({
        title: "HP EliteBook 840 G5",
        description:
          "Comes with the original charger and a sleeve. The sleeve is free — you are buying the laptop only. Works with any USB-C charger.",
      }),
    ).toBeNull();
  });

  test("a quantity-priced single product stays allowed (wholesale tiers are one item)", () => {
    expect(
      findMultiItemListing({
        title: "HP EliteBook 840 G5",
        description: "Bulk pricing available from 5 units — each unit is an identical laptop.",
      }),
    ).toBeNull();
  });
});