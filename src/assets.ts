export type RiskLevel = "Critical" | "High" | "Medium" | "Low";

export type AssetInput = {
  id: string;
  location: string;
  temperature: number;
  vibration: number;
  oilQuality: "Good" | "Average" | "Poor";
  ageYears: number;
  weatherRisk: "Low" | "Medium" | "High";
  previousFaults: number;
};

export type Asset = AssetInput & {
  riskScore: number;
  riskLevel: RiskLevel;
  recommendedAction: string;
};

export function calculateRiskScore(asset: AssetInput): number {
  const temperaturePoints = asset.temperature >= 90 ? 25 : asset.temperature >= 80 ? 15 : 5;
  const vibrationPoints = asset.vibration >= 7 ? 20 : asset.vibration >= 5 ? 12 : 5;
  const oilPoints = asset.oilQuality === "Poor" ? 20 : asset.oilQuality === "Average" ? 10 : 5;
  const agePoints = asset.ageYears >= 20 ? 15 : asset.ageYears >= 15 ? 10 : 5;
  const weatherPoints = asset.weatherRisk === "High" ? 10 : asset.weatherRisk === "Medium" ? 6 : 2;
  const faultPoints = asset.previousFaults >= 3 ? 10 : asset.previousFaults >= 1 ? 5 : 0;

  return temperaturePoints + vibrationPoints + oilPoints + agePoints + weatherPoints + faultPoints;
}

export function getRiskLevel(score: number): RiskLevel {
  if (score >= 75) return "Critical";
  if (score >= 50) return "High";
  if (score >= 35) return "Medium";
  return "Low";
}

export function getRecommendedAction(riskLevel: RiskLevel): string {
  if (riskLevel === "Critical") {
    return "Inspect within 6 hours and pre-position a maintenance crew";
  }
  if (riskLevel === "High") {
    return "Inspect within 24 hours and schedule preventive maintenance";
  }
  if (riskLevel === "Medium") {
    return "Monitor daily and schedule routine inspection";
  }
  return "Continue normal monitoring";
}

export function buildAsset(asset: AssetInput): Asset {
  const riskScore = calculateRiskScore(asset);
  const riskLevel = getRiskLevel(riskScore);

  return {
    ...asset,
    riskScore,
    riskLevel,
    recommendedAction: getRecommendedAction(riskLevel),
  };
}

const assetInputs: AssetInput[] = [
  { id: "T-101", location: "North Substation", temperature: 62, vibration: 2.1, oilQuality: "Good", ageYears: 5, weatherRisk: "Low", previousFaults: 0 },
  { id: "T-102", location: "East Substation", temperature: 91, vibration: 6.8, oilQuality: "Poor", ageYears: 18, weatherRisk: "High", previousFaults: 3 },
  { id: "T-103", location: "West Substation", temperature: 74, vibration: 3.2, oilQuality: "Good", ageYears: 12, weatherRisk: "Medium", previousFaults: 1 },
  { id: "T-104", location: "Central Substation", temperature: 96, vibration: 8.1, oilQuality: "Poor", ageYears: 22, weatherRisk: "High", previousFaults: 4 },
  { id: "T-105", location: "South Substation", temperature: 58, vibration: 1.8, oilQuality: "Good", ageYears: 3, weatherRisk: "Low", previousFaults: 0 },
  { id: "T-106", location: "Airport Substation", temperature: 82, vibration: 4.9, oilQuality: "Average", ageYears: 15, weatherRisk: "Medium", previousFaults: 2 },
  { id: "T-107", location: "Industrial Substation", temperature: 88, vibration: 5.7, oilQuality: "Average", ageYears: 17, weatherRisk: "High", previousFaults: 2 },
  { id: "T-108", location: "City Center Substation", temperature: 67, vibration: 2.5, oilQuality: "Good", ageYears: 7, weatherRisk: "Low", previousFaults: 0 },
  { id: "T-109", location: "Rural Substation", temperature: 79, vibration: 4.1, oilQuality: "Average", ageYears: 11, weatherRisk: "Medium", previousFaults: 1 },
  { id: "T-110", location: "Harbor Substation", temperature: 93, vibration: 7.4, oilQuality: "Poor", ageYears: 20, weatherRisk: "High", previousFaults: 3 },
  { id: "T-111", location: "University Substation", temperature: 64, vibration: 2.0, oilQuality: "Good", ageYears: 4, weatherRisk: "Low", previousFaults: 0 },
  { id: "T-112", location: "Factory Substation", temperature: 86, vibration: 5.2, oilQuality: "Average", ageYears: 14, weatherRisk: "High", previousFaults: 2 },
  { id: "T-113", location: "Mountain Substation", temperature: 72, vibration: 3.0, oilQuality: "Good", ageYears: 9, weatherRisk: "Medium", previousFaults: 0 },
  { id: "T-114", location: "Valley Substation", temperature: 90, vibration: 6.2, oilQuality: "Poor", ageYears: 19, weatherRisk: "High", previousFaults: 3 },
  { id: "T-115", location: "Metro Substation", temperature: 69, vibration: 2.7, oilQuality: "Good", ageYears: 6, weatherRisk: "Low", previousFaults: 0 },
];

export const assets: Asset[] = assetInputs.map(buildAsset);

export function getAllAssets(): Asset[] {
  return assets;
}

export function getAssetById(id: string): Asset | undefined {
  return assets.find((asset) => asset.id === id);
}
