import { describe, expect, it } from "vitest";
import {
  assets,
  buildAsset,
  calculateRiskScore,
  getAssetById,
  getRecommendedAction,
  getRiskLevel,
  validateAssetInput,
} from "./assets";

const expectedAssets = [
  ["T-101", 22, "Low"],
  ["T-102", 87, "Critical"],
  ["T-103", 31, "Low"],
  ["T-104", 100, "Critical"],
  ["T-105", 22, "Low"],
  ["T-106", 51, "High"],
  ["T-107", 62, "High"],
  ["T-108", 22, "Low"],
  ["T-109", 36, "Medium"],
  ["T-110", 100, "Critical"],
  ["T-111", 22, "Low"],
  ["T-112", 57, "High"],
  ["T-113", 26, "Low"],
  ["T-114", 87, "Critical"],
  ["T-115", 22, "Low"],
] as const;

describe("GridGuard complete asset dataset", () => {
  it("contains exactly the 15 expected assets", () => {
    expect(assets).toHaveLength(15);
    expect(assets.map((asset) => asset.id)).toEqual(expectedAssets.map(([id]) => id));
  });

  it.each(expectedAssets)("checks %s risk score and level", (assetId, expectedScore, expectedLevel) => {
    const asset = getAssetById(assetId);

    expect(asset).toBeDefined();
    expect(asset?.riskScore).toBe(expectedScore);
    expect(asset?.riskLevel).toBe(expectedLevel);
    expect(asset?.riskScore).toBe(calculateRiskScore(asset!));
    expect(asset?.riskLevel).toBe(getRiskLevel(asset!.riskScore));
    expect(asset?.recommendedAction).toBe(getRecommendedAction(asset!.riskLevel));
  });

  it("has complete sensor and operating data for every asset", () => {
    for (const asset of assets) {
      expect(asset.id).toMatch(/^T-\d{3}$/);
      expect(asset.location.length).toBeGreaterThan(0);
      expect(asset.temperature).toBeGreaterThan(0);
      expect(asset.vibration).toBeGreaterThanOrEqual(0);
      expect(["Good", "Average", "Poor"]).toContain(asset.oilQuality);
      expect(asset.ageYears).toBeGreaterThanOrEqual(0);
      expect(["Low", "Medium", "High"]).toContain(asset.weatherRisk);
      expect(asset.previousFaults).toBeGreaterThanOrEqual(0);
      expect(asset.recommendedAction.length).toBeGreaterThan(0);
    }
  });

  it("classifies every risk threshold correctly", () => {
    expect(getRiskLevel(22)).toBe("Low");
    expect(getRiskLevel(34)).toBe("Low");
    expect(getRiskLevel(35)).toBe("Medium");
    expect(getRiskLevel(49)).toBe("Medium");
    expect(getRiskLevel(50)).toBe("High");
    expect(getRiskLevel(74)).toBe("High");
    expect(getRiskLevel(75)).toBe("Critical");
  });

  it("rejects invalid temperature values", () => {
    const baseAsset = {
      id: "TEST-TEMP",
      location: "Test substation",
      temperature: 60,
      vibration: 2,
      oilQuality: "Good" as const,
      ageYears: 5,
      weatherRisk: "Low" as const,
      previousFaults: 0,
    };

    expect(validateAssetInput({ ...baseAsset, temperature: Number.NaN })).toContain("Temperature must be a finite number");
    expect(validateAssetInput({ ...baseAsset, temperature: 250 })).toContain("Temperature must be between -50°C and 200°C");
    expect(() => buildAsset({ ...baseAsset, temperature: Number.POSITIVE_INFINITY })).toThrow("Temperature must be a finite number");
  });

  it("rejects missing sensor data instead of calculating a misleading risk", () => {
    const incompleteAsset = {
      id: "TEST-MISSING",
      location: "Test substation",
      temperature: undefined,
      vibration: 2,
      oilQuality: "Good" as const,
      ageYears: 5,
      weatherRisk: "Low" as const,
      previousFaults: 0,
    };

    const errors = validateAssetInput(incompleteAsset);
    expect(errors).toContain("Temperature must be a finite number");
    expect(() => buildAsset(incompleteAsset as never)).toThrow("Temperature must be a finite number");
  });

  it("rejects negative vibration, age, and fault counts", () => {
    const baseAsset = {
      id: "TEST-NEGATIVE",
      location: "Test substation",
      temperature: 60,
      vibration: 2,
      oilQuality: "Good" as const,
      ageYears: 5,
      weatherRisk: "Low" as const,
      previousFaults: 0,
    };

    expect(validateAssetInput({ ...baseAsset, vibration: -1 })).toContain("Vibration cannot be negative");
    expect(validateAssetInput({ ...baseAsset, ageYears: -1 })).toContain("Asset age cannot be negative");
    expect(validateAssetInput({ ...baseAsset, previousFaults: -1 })).toContain("Previous fault count cannot be negative");
  });

  it("returns undefined for an unknown asset ID", () => {
    expect(getAssetById("T-999")).toBeUndefined();
  });
});
