export const WCT_CONFIG = {
  feeSchedule: {
    baseClosingFee: 850,
    titleSearchFee: 250,
    courierFee: 50,
    wireFee: 40,
  },
  settings: {
    includeTitlePremium: true, // Enabled as requested for OTIRB integration
    includeHOAProration: false,
  },
  // Ohio OTIRB Rate Schedule (PR-1)
  otirbRates: [
    { threshold: 0, rate: 5.80 },
    { threshold: 250000, rate: 4.10 },
    { threshold: 500000, rate: 3.20 },
    { threshold: 1000000, rate: 3.10 },
    { threshold: 5000000, rate: 2.90 },
    { threshold: 10000000, rate: 2.60 }
  ],
  minPremium: {
    standard: 225,
    homeowner: 250
  },
  // Transfer tax rates by county
  transferTaxRates: {
    default: 0.004, // $4 per $1000
    'Cuyahoga': 0.004,
    'Franklin': 0.003,
    'Hamilton': 0.004,
  }
};
