import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  WCTCard, 
  WCTButton, 
  WCTSummaryRow, 
  WCTAlert 
} from '../components/WCTComponents';
import { motion } from 'motion/react';
import { Share2, Mail, Edit2, CheckCircle2 } from 'lucide-react';

export default function Results() {
  const { estimateId } = useParams();
  const [estimate, setEstimate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchEstimate = async () => {
      try {
        const res = await fetch(`/api/net-to-seller/estimate/${estimateId}`);
        if (!res.ok) throw new Error("Estimate not found");
        const data = await res.json();
        setEstimate(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchEstimate();
  }, [estimateId]);

  const handleCopyLink = () => {
    const url = `${window.location.origin}/net-to-seller/results/${estimateId}?t=${estimate.shareToken}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="animate-pulse text-[#004EA8] font-montserrat uppercase tracking-widest">Loading Estimate...</div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-white p-6">
      <WCTCard className="max-w-md w-full text-center">
        <h2 className="text-red-500 mb-4">Error</h2>
        <p className="text-[#A2B2C8] mb-6">{error}</p>
        <Link to="/net-to-seller">
          <WCTButton fullWidth>Back to Calculator</WCTButton>
        </Link>
      </WCTCard>
    </div>
  );

  const calc = JSON.parse(estimate.calcJson || '{}').breakdown || {};

  return (
    <div className="min-h-screen bg-wct-slate/5 py-12 px-6 flex items-center justify-center">
      <div className="max-w-3xl w-full relative">
        {/* Close Button (Mock for pop-up feel) */}
        <Link to="/net-to-seller" className="absolute -top-12 right-0 text-wct-slate hover:text-wct-blue transition-colors p-2">
          <span className="text-xs uppercase tracking-widest font-bold">Close</span>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-8 text-center">
            <h1 className="text-3xl md:text-4xl text-[#004EA8] mb-2">Estimated Net Proceeds</h1>
            <p className="text-[#A2B2C8] font-subheader">{estimate.addressFull}</p>
          </div>

          <WCTCard className="mb-8 overflow-hidden shadow-2xl shadow-wct-blue/5">
            <div className="bg-[#004EA8]/5 -mx-8 -mt-8 p-8 text-center border-b border-[#A2B2C8]/10 mb-8">
              <span className="text-[#A2B2C8] uppercase text-sm tracking-widest mb-2 block font-bold">Estimated Net</span>
              <div className="text-5xl md:text-6xl font-bold text-[#004EA8] font-nunito">
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(estimate.estimatedNetProceeds)}
              </div>
            </div>

            <div className="space-y-1">
              <WCTSummaryRow label="Sale Price" value={estimate.salePrice} />
              <WCTSummaryRow label="Real Estate Commission" value={-estimate.commissionAmount} />
              <WCTSummaryRow label="Mortgage Payoffs" value={-estimate.mortgagePayoffsTotal} />
              <WCTSummaryRow label="Seller Credits" value={-estimate.sellerCreditsTotal} />
              <WCTSummaryRow label="Closing Costs" value={-estimate.estimatedClosingCostsTotal} />
              <WCTSummaryRow label="Title Insurance Premium (OTIRB)" value={-estimate.estimatedTitlePremium} />
              <WCTSummaryRow label="Transfer Tax" value={-estimate.estimatedTransferTax} />
              <WCTSummaryRow label="Tax Proration" value={-estimate.estimatedTaxProration} />
              {estimate.hoaTransferFee > 0 && <WCTSummaryRow label="HOA Transfer Fee" value={-estimate.hoaTransferFee} />}
              {estimate.otherCostsTotal > 0 && <WCTSummaryRow label="Other Costs" value={-estimate.otherCostsTotal} />}
              <WCTSummaryRow label="Net Proceeds" value={estimate.estimatedNetProceeds} isTotal />
            </div>
          </WCTCard>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
            <WCTButton variant="outline" onClick={() => window.history.back()} className="md:col-span-1">
              <Edit2 className="w-4 h-4" /> Edit
            </WCTButton>
            <WCTButton variant="secondary" onClick={handleCopyLink} className="md:col-span-1">
              {copied ? <CheckCircle2 className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy Link'}
            </WCTButton>
            <WCTButton className="md:col-span-1">
              <Mail className="w-4 h-4" /> Email Results
            </WCTButton>
          </div>

          <div className="space-y-6">
            <WCTAlert type="info">
              <p className="leading-relaxed">
                <strong>Disclaimer:</strong> Estimates are for illustration only and may vary based on contract terms, prorations, lender requirements, county charges, and underwriting requirements. Final amounts will be confirmed by your World Class Title escrow officer.
              </p>
            </WCTAlert>
            <p className="text-[10px] text-wct-slate text-center italic uppercase tracking-wider font-bold">
              All estimates and assumptions must be consistent with Westcor underwriting guidelines and Ohio rate rules where applicable.
            </p>
          </div>
        </motion.div>
        
        <div className="mt-8 text-center">
          <p className="text-[10px] text-wct-slate uppercase tracking-[2px] font-bold">Powered by World Class Title</p>
        </div>
      </div>
    </div>
  );
}
