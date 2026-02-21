import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  WCTCard, 
  WCTButton, 
  WCTInput, 
  WCTSelect, 
  WCTStepIndicator, 
  WCTAlert 
} from '../components/WCTComponents';
import { AddressAutocomplete } from '../components/AddressAutocomplete';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, ChevronRight, ChevronLeft, Calculator } from 'lucide-react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

export default function NetToSeller() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0); // 0: Start, 1: Property, 2: Sale, 3: Payoffs, 4: Agent, 5: Other
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lookupWarning, setLookupWarning] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    addressFull: '',
    unit: '',
    city: '',
    state: '',
    zip: '',
    county: '',
    placeId: '',
    lat: null,
    lng: null,
    isOhio: false,
    ownerName: '',
    parcelNumber: '',
    annualTaxes: '',
    policyType: 'standard',
    reissueCredit: 'no',
    salePrice: '',
    closingDate: new Date(),
    sellerConcessions: '0',
    homeWarranty: '0',
    repairCredits: '0',
    otherCredits: '0',
    hasMortgage: 'no',
    mortgagePayoffs: [{ id: 1, lender: '', amount: '' }],
    payingCommission: 'yes',
    commissionType: 'percent',
    commissionValue: '6',
    hoaMonthly: '0',
    hoaTransferFee: '0',
    otherCosts: [] as { id: number; label: string; amount: string }[]
  });

  const handleAddressSelect = async (place: any) => {
    const components = place.address_components;
    const addressData: any = {
      addressFull: place.formatted_address,
      placeId: place.place_id,
      lat: place.geometry.location.lat(),
      lng: place.geometry.location.lng(),
    };

    components.forEach((c: any) => {
      if (c.types.includes('locality')) addressData.city = c.long_name;
      if (c.types.includes('administrative_area_level_1')) addressData.state = c.short_name;
      if (c.types.includes('postal_code')) addressData.zip = c.long_name;
      if (c.types.includes('administrative_area_level_2')) addressData.county = c.long_name;
    });

    const isOhio = addressData.state === 'OH';
    setFormData(prev => ({ ...prev, ...addressData, isOhio }));

    if (!isOhio) {
      setError("This tool is currently available for Ohio properties only. Please enter an Ohio address.");
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/net-to-seller/property-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addressData)
      });
      const result = await res.json();
      if (result.success) {
        setFormData(prev => ({
          ...prev,
          ownerName: result.data.ownerName || '',
          parcelNumber: result.data.parcelNumber || '',
          annualTaxes: result.data.annualTaxes?.toString() || '',
        }));
        setLookupWarning(null);
      } else {
        setLookupWarning("We could not auto load county records for this address. You can still continue by entering details manually.");
      }
      // Auto-advance to next step as requested
      nextStep();
    } catch (err) {
      setLookupWarning("We could not auto load county records for this address. You can still continue by entering details manually.");
      // Auto-advance even on error so they can enter manually on next screen if needed? 
      // Actually, step 1 shows the details. If I move to step 2, they miss the details.
      // But user said "move to next screen".
      nextStep();
    } finally {
      setLoading(false);
    }
  };

  const handleCalculate = async () => {
    setLoading(true);
    try {
      const calcRes = await fetch('/api/net-to-seller/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const calcData = await calcRes.json();

      const createRes = await fetch('/api/net-to-seller/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, ...calcData, inputs: formData })
      });
      const { id } = await createRes.json();
      navigate(`/net-to-seller/results/${id}`);
    } catch (err) {
      setError("Calculation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
            <h1 className="text-4xl md:text-5xl text-[#004EA8] mb-4">Net to Seller Calculator</h1>
            <p className="text-xl text-[#A2B2C8] mb-12 font-subheader">Estimate your net proceeds in under 60 seconds</p>
            <WCTButton onClick={nextStep} className="mx-auto px-12 py-5 text-lg">Start estimate</WCTButton>
          </motion.div>
        );

      case 1:
        return (
          <div className="space-y-8">
            <AddressAutocomplete label="Property Address" onAddressSelect={handleAddressSelect} error={error || undefined} />
            
            {formData.addressFull && formData.isOhio && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-6 pt-6 border-t border-[#A2B2C8]/10">
                <h3 className="text-[#004EA8] text-sm font-bold">Property Details</h3>
                {lookupWarning && <WCTAlert type="warning">{lookupWarning}</WCTAlert>}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <WCTInput label="Owner Name" value={formData.ownerName} onChange={e => setFormData({...formData, ownerName: e.target.value})} />
                  <WCTInput label="Parcel Number" value={formData.parcelNumber} onChange={e => setFormData({...formData, parcelNumber: e.target.value})} />
                  <WCTInput label="Annual Taxes" type="number" value={formData.annualTaxes} onChange={e => setFormData({...formData, annualTaxes: e.target.value})} />
                </div>
              </motion.div>
            )}
            
            <div className="flex justify-end pt-8">
              <WCTButton onClick={nextStep} disabled={!formData.isOhio || loading}>
                Next <ChevronRight className="w-4 h-4" />
              </WCTButton>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <WCTInput label="Sale Price" type="number" value={formData.salePrice} onChange={e => setFormData({...formData, salePrice: e.target.value})} required />
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-[#A2B2C8] uppercase tracking-[1.5px] font-montserrat">Estimated Closing Date</label>
                <DatePicker 
                  selected={formData.closingDate} 
                  onChange={(date: Date | null) => setFormData({...formData, closingDate: date || new Date()})}
                  className="w-full px-4 py-3 rounded-xl border border-[#A2B2C8]/30 focus:outline-none focus:border-[#004EA8] bg-white text-[#004EA8]"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <WCTSelect 
                label="Policy Type" 
                value={formData.policyType} 
                onChange={e => setFormData({...formData, policyType: e.target.value})}
                options={[{value: 'standard', label: 'Standard Owner Policy'}, {value: 'homeowner', label: 'Homeowner Policy (+15%)'}]}
              />
              <WCTSelect 
                label="Reissue Credit (Policy within 10 years?)" 
                value={formData.reissueCredit} 
                onChange={e => setFormData({...formData, reissueCredit: e.target.value})}
                options={[{value: 'no', label: 'No'}, {value: 'yes', label: 'Yes (30% Discount)'}]}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <WCTInput label="Seller Concessions" type="number" value={formData.sellerConcessions} onChange={e => setFormData({...formData, sellerConcessions: e.target.value})} />
              <WCTInput label="Home Warranty" type="number" value={formData.homeWarranty} onChange={e => setFormData({...formData, homeWarranty: e.target.value})} />
              <WCTInput label="Repair Credits" type="number" value={formData.repairCredits} onChange={e => setFormData({...formData, repairCredits: e.target.value})} />
              <WCTInput label="Other Credits" type="number" value={formData.otherCredits} onChange={e => setFormData({...formData, otherCredits: e.target.value})} />
            </div>
            <div className="flex justify-between pt-8">
              <WCTButton variant="outline" onClick={prevStep}><ChevronLeft className="w-4 h-4" /> Back</WCTButton>
              <WCTButton onClick={nextStep} disabled={!formData.salePrice}>Next <ChevronRight className="w-4 h-4" /></WCTButton>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-8">
            <WCTSelect 
              label="Do you have a mortgage to pay off?" 
              value={formData.hasMortgage} 
              onChange={e => setFormData({...formData, hasMortgage: e.target.value})}
              options={[{value: 'no', label: 'No'}, {value: 'yes', label: 'Yes'}]}
            />
            {formData.hasMortgage === 'yes' && (
              <div className="space-y-4">
                {formData.mortgagePayoffs.map((p, i) => (
                  <div key={p.id} className="flex gap-4 items-end">
                    <WCTInput label="Lender Name" className="flex-1" value={p.lender} onChange={e => {
                      const newPayoffs = [...formData.mortgagePayoffs];
                      newPayoffs[i].lender = e.target.value;
                      setFormData({...formData, mortgagePayoffs: newPayoffs});
                    }} />
                    <WCTInput label="Payoff Amount" type="number" className="flex-1" value={p.amount} onChange={e => {
                      const newPayoffs = [...formData.mortgagePayoffs];
                      newPayoffs[i].amount = e.target.value;
                      setFormData({...formData, mortgagePayoffs: newPayoffs});
                    }} />
                    {formData.mortgagePayoffs.length > 1 && (
                      <button onClick={() => setFormData({...formData, mortgagePayoffs: formData.mortgagePayoffs.filter(x => x.id !== p.id)})} className="p-3 text-red-500 hover:bg-red-50 rounded-xl mb-1">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
                <WCTButton variant="outline" onClick={() => setFormData({...formData, mortgagePayoffs: [...formData.mortgagePayoffs, { id: Date.now(), lender: '', amount: '' }]})} className="w-full">
                  <Plus className="w-4 h-4" /> Add another payoff
                </WCTButton>
              </div>
            )}
            <div className="flex justify-between pt-8">
              <WCTButton variant="outline" onClick={prevStep}><ChevronLeft className="w-4 h-4" /> Back</WCTButton>
              <WCTButton onClick={nextStep}>Next <ChevronRight className="w-4 h-4" /></WCTButton>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-8">
            <WCTSelect 
              label="Are you paying real estate commission?" 
              value={formData.payingCommission} 
              onChange={e => setFormData({...formData, payingCommission: e.target.value})}
              options={[{value: 'yes', label: 'Yes'}, {value: 'no', label: 'No'}]}
            />
            {formData.payingCommission === 'yes' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <WCTSelect 
                  label="Commission Type" 
                  value={formData.commissionType} 
                  onChange={e => setFormData({...formData, commissionType: e.target.value})}
                  options={[{value: 'percent', label: 'Percent of Sale Price'}, {value: 'flat', label: 'Flat Amount'}]}
                />
                <WCTInput 
                  label={formData.commissionType === 'percent' ? "Total Percent (%)" : "Total Amount ($)"} 
                  type="number" 
                  value={formData.commissionValue} 
                  onChange={e => setFormData({...formData, commissionValue: e.target.value})} 
                />
              </div>
            )}
            <div className="flex justify-between pt-8">
              <WCTButton variant="outline" onClick={prevStep}><ChevronLeft className="w-4 h-4" /> Back</WCTButton>
              <WCTButton onClick={nextStep}>Next <ChevronRight className="w-4 h-4" /></WCTButton>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <WCTInput label="HOA Monthly Dues" type="number" value={formData.hoaMonthly} onChange={e => setFormData({...formData, hoaMonthly: e.target.value})} />
              <WCTInput label="HOA Transfer Fee" type="number" value={formData.hoaTransferFee} onChange={e => setFormData({...formData, hoaTransferFee: e.target.value})} />
            </div>
            <div className="space-y-4">
              <h3 className="text-[#004EA8] text-sm font-bold">Other Seller Costs</h3>
              {formData.otherCosts.map((c, i) => (
                <div key={c.id} className="flex gap-4 items-end">
                  <WCTInput label="Label" className="flex-1" value={c.label} onChange={e => {
                    const newCosts = [...formData.otherCosts];
                    newCosts[i].label = e.target.value;
                    setFormData({...formData, otherCosts: newCosts});
                  }} />
                  <WCTInput label="Amount" type="number" className="flex-1" value={c.amount} onChange={e => {
                    const newCosts = [...formData.otherCosts];
                    newCosts[i].amount = e.target.value;
                    setFormData({...formData, otherCosts: newCosts});
                  }} />
                  <button onClick={() => setFormData({...formData, otherCosts: formData.otherCosts.filter(x => x.id !== c.id)})} className="p-3 text-red-500 hover:bg-red-50 rounded-xl mb-1">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
              <WCTButton variant="outline" onClick={() => setFormData({...formData, otherCosts: [...formData.otherCosts, { id: Date.now(), label: '', amount: '' }]})} className="w-full">
                <Plus className="w-4 h-4" /> Add other cost
              </WCTButton>
            </div>
            <div className="flex justify-between pt-8">
              <WCTButton variant="outline" onClick={prevStep}><ChevronLeft className="w-4 h-4" /> Back</WCTButton>
              <WCTButton onClick={handleCalculate} disabled={loading}>
                {loading ? 'Calculating...' : 'Calculate estimate'} <Calculator className="w-4 h-4 ml-2" />
              </WCTButton>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-wct-slate/5 py-12 px-6 flex items-center justify-center">
      <div className="max-w-2xl w-full relative">
        {/* Close Button (Mock for pop-up feel) */}
        <button className="absolute -top-12 right-0 text-wct-slate hover:text-wct-blue transition-colors p-2">
          <span className="text-xs uppercase tracking-widest font-bold">Close</span>
        </button>

        {step > 0 && <WCTStepIndicator currentStep={step} totalSteps={5} />}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {step === 0 ? renderStep() : (
              <WCTCard className="shadow-2xl shadow-wct-blue/5">
                {renderStep()}
              </WCTCard>
            )}
          </motion.div>
        </AnimatePresence>
        
        <div className="mt-8 text-center">
          <p className="text-[10px] text-wct-slate uppercase tracking-[2px] font-bold">Powered by World Class Title</p>
        </div>
      </div>
    </div>
  );
}
