import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import { WCT_CONFIG } from "./src/constants/config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("nts.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS NetToSellerEstimate (
    id TEXT PRIMARY KEY,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    addressFull TEXT,
    unit TEXT,
    city TEXT,
    state TEXT,
    zip TEXT,
    county TEXT,
    isOhio INTEGER,
    placeId TEXT,
    lat REAL,
    lng REAL,
    ownerName TEXT,
    ownerMailingAddress TEXT,
    parcelNumber TEXT,
    propertyType TEXT,
    beds INTEGER,
    baths REAL,
    sqft INTEGER,
    taxYear INTEGER,
    annualTaxes REAL,
    homestead INTEGER,
    salePrice REAL,
    closingDate TEXT,
    commissionType TEXT,
    commissionValue REAL,
    commissionAmount REAL,
    sellerCreditsTotal REAL,
    mortgagePayoffs TEXT, -- JSON array
    mortgagePayoffsTotal REAL,
    hoaMonthly REAL,
    hoaTransferFee REAL,
    otherCosts TEXT, -- JSON array
    otherCostsTotal REAL,
    estimatedClosingCostsTotal REAL,
    estimatedTransferTax REAL,
    estimatedTaxProration REAL,
    estimatedNetProceeds REAL,
    inputsJson TEXT,
    calcJson TEXT,
    shareToken TEXT,
    shareCount INTEGER DEFAULT 0
  )
`);

// Helper for OTIRB Rates
function calculateTitlePremium(salePrice: number, policyType: 'standard' | 'homeowner', reissue: boolean) {
  let premium = 0;
  const rates = WCT_CONFIG.otirbRates;
  
  for (let i = 0; i < rates.length; i++) {
    const current = rates[i];
    const next = rates[i + 1];
    const threshold = current.threshold;
    const rate = current.rate;
    
    const tierLimit = next ? next.threshold : Infinity;
    const amountInTier = Math.min(Math.max(0, salePrice - threshold), tierLimit - threshold);
    
    if (amountInTier > 0) {
      premium += (amountInTier / 1000) * rate;
    }
  }
  
  if (policyType === 'homeowner') premium *= 1.15;
  if (reissue) premium *= 0.70;
  
  const min = policyType === 'homeowner' ? WCT_CONFIG.minPremium.homeowner : WCT_CONFIG.minPremium.standard;
  return Math.max(premium, min);
}

async function startServer() {
  const app = express();
  app.use(express.json());
  const PORT = 3000;

  // API Endpoints
  
  // 1. Property Lookup (Placeholder until schema is provided)
  app.post("/api/net-to-seller/property-lookup", async (req, res) => {
    const { placeId, address, lat, lng } = req.body;
    
    // Validate Ohio
    const isOhio = address?.toLowerCase().includes("oh") || address?.toLowerCase().includes("ohio");
    if (!isOhio) {
      return res.status(400).json({ error: "This tool is currently available for Ohio properties only." });
    }

    try {
      // Logic for ATTOM_NTS will go here once schema is provided
      res.json({ 
        success: true, 
        message: "Property lookup initialized. Waiting for ATTOM_NTS schema.",
        data: {
          isOhio: true,
          // Placeholder fields
          ownerName: "",
          parcelNumber: "",
          annualTaxes: 0
        }
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to lookup property details." });
    }
  });

  // 2. Calculate
  app.post("/api/net-to-seller/calculate", (req, res) => {
    const inputs = req.body;
    
    const salePrice = Number(inputs.salePrice) || 0;
    const commissionAmount = inputs.commissionType === 'percent' 
      ? (salePrice * (Number(inputs.commissionValue) / 100)) 
      : (Number(inputs.commissionValue) || 0);
      
    const payoffsTotal = (inputs.mortgagePayoffs || []).reduce((acc: number, p: any) => acc + (Number(p.amount) || 0), 0);
    const creditsTotal = Number(inputs.sellerConcessions || 0) + 
                         Number(inputs.homeWarranty || 0) + 
                         Number(inputs.repairCredits || 0) + 
                         Number(inputs.otherCredits || 0);
    
    const otherCostsTotal = (inputs.otherCosts || []).reduce((acc: number, c: any) => acc + (Number(c.amount) || 0), 0);
    
    // Use config for fees
    const fees = WCT_CONFIG.feeSchedule;
    const estimatedClosingCosts = Object.values(fees).reduce((a, b) => a + b, 0);
    
    // Transfer tax based on county
    const county = inputs.county || 'default';
    const rate = (WCT_CONFIG.transferTaxRates as any)[county] || WCT_CONFIG.transferTaxRates.default;
    const estimatedTransferTax = salePrice * rate;

    // Tax proration
    const annualTaxes = Number(inputs.annualTaxes) || 0;
    const estimatedTaxProration = annualTaxes / 2;

    // Title Premium (OTIRB)
    const estimatedTitlePremium = WCT_CONFIG.settings.includeTitlePremium 
      ? calculateTitlePremium(salePrice, inputs.policyType || 'standard', inputs.reissueCredit === 'yes')
      : 0;

    const netProceeds = salePrice - commissionAmount - payoffsTotal - creditsTotal - 
                        estimatedClosingCosts - estimatedTransferTax - estimatedTaxProration - 
                        estimatedTitlePremium - (Number(inputs.hoaTransferFee) || 0) - otherCostsTotal;

    res.json({
      commissionAmount,
      mortgagePayoffsTotal: payoffsTotal,
      sellerCreditsTotal: creditsTotal,
      otherCostsTotal,
      estimatedClosingCostsTotal: estimatedClosingCosts,
      estimatedTransferTax,
      estimatedTaxProration,
      estimatedTitlePremium,
      estimatedNetProceeds: netProceeds,
      calcJson: JSON.stringify({
        breakdown: {
          salePrice,
          commissionAmount,
          payoffsTotal,
          creditsTotal,
          estimatedClosingCosts,
          estimatedTransferTax,
          estimatedTaxProration,
          estimatedTitlePremium,
          netProceeds
        }
      })
    });
  });

  // 4. Share Estimate
  app.post("/api/net-to-seller/share", (req, res) => {
    const { estimateId, recipientEmail } = req.body;
    const estimate = db.prepare("SELECT * FROM NetToSellerEstimate WHERE id = ?").get(estimateId);
    
    if (!estimate) return res.status(404).json({ error: "Estimate not found" });

    // Increment share count
    db.prepare("UPDATE NetToSellerEstimate SET shareCount = shareCount + 1 WHERE id = ?").run(estimateId);

    // In a real app, we would send an email here.
    console.log(`Emailing estimate ${estimateId} to ${recipientEmail}`);
    
    res.json({ success: true });
  });

  // 3. Create Estimate
  app.post("/api/net-to-seller/create", (req, res) => {
    const data = req.body;
    const id = crypto.randomUUID();
    const shareToken = crypto.randomUUID().split('-')[0];

    const stmt = db.prepare(`
      INSERT INTO NetToSellerEstimate (
        id, addressFull, unit, city, state, zip, county, isOhio, placeId, lat, lng,
        ownerName, ownerMailingAddress, parcelNumber, propertyType, beds, baths, sqft,
        taxYear, annualTaxes, homestead, salePrice, closingDate, commissionType,
        commissionValue, commissionAmount, sellerCreditsTotal, mortgagePayoffs,
        mortgagePayoffsTotal, hoaMonthly, hoaTransferFee, otherCosts, otherCostsTotal,
        estimatedClosingCostsTotal, estimatedTransferTax, estimatedTaxProration,
        estimatedNetProceeds, inputsJson, calcJson, shareToken
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id, data.addressFull, data.unit, data.city, data.state, data.zip, data.county, data.isOhio ? 1 : 0, data.placeId, data.lat, data.lng,
      data.ownerName, data.ownerMailingAddress, data.parcelNumber, data.propertyType, data.beds, data.baths, data.sqft,
      data.taxYear, data.annualTaxes, data.homestead ? 1 : 0, data.salePrice, data.closingDate, data.commissionType,
      data.commissionValue, data.commissionAmount, data.sellerCreditsTotal, JSON.stringify(data.mortgagePayoffs),
      data.mortgagePayoffsTotal, data.hoaMonthly, data.hoaTransferFee, JSON.stringify(data.otherCosts), data.otherCostsTotal,
      data.estimatedClosingCostsTotal, data.estimatedTransferTax, data.estimatedTaxProration,
      data.estimatedNetProceeds, JSON.stringify(data.inputs), JSON.stringify(data.calcJson), shareToken
    );

    res.json({ id, shareToken });
  });

  // 4. Get Estimate (Internal for results page)
  app.get("/api/net-to-seller/estimate/:id", (req, res) => {
    const estimate = db.prepare("SELECT * FROM NetToSellerEstimate WHERE id = ?").get(req.params.id);
    if (!estimate) return res.status(404).json({ error: "Estimate not found" });
    res.json(estimate);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
