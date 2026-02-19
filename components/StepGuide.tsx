
import React from 'react';

const StepGuide: React.FC = () => {
  return (
    <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 text-left">
      <h3 className="text-sm font-bold text-brand-blue mb-6 uppercase tracking-widest">Next Steps</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { step: '01', title: 'Confirmation', desc: 'Check your inbox for a detailed meeting invite and preparation guide.' },
          { step: '02', title: 'Review', desc: 'Our team will review your file and contact you if anything is missing.' },
          { step: '03', title: 'Signing', desc: 'Experience a seamless closing handled by our world-class experts.' }
        ].map((item, i) => (
          <div key={i} className="relative pl-4 border-l border-slate-200">
            <div className="absolute -left-[1px] top-0 h-4 w-[2px] bg-brand-teal"></div>
            <div className="relative z-10">
              <h4 className="text-[10px] font-black text-brand-teal mb-1">{item.step}</h4>
              <h4 className="font-bold text-slate-800 text-xs mb-1 uppercase tracking-wider">{item.title}</h4>
              <p className="text-[10px] text-slate-500 leading-relaxed">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 p-3 bg-white border border-red-50 rounded-lg flex items-start space-x-3">
        <span className="text-red-500 text-sm mt-0.5">⚠️</span>
        <div className="flex-1">
          <p className="text-[9px] text-red-900 font-bold uppercase tracking-wider mb-0.5">Fraud Alert</p>
          <p className="text-[9px] text-slate-500 leading-tight">
            World Class Title will NEVER ask you to wire funds via email. Always verify wire instructions by phone with your dedicated closer before initiating any transfer.
          </p>
        </div>
      </div>
    </div>
  );
};

export default StepGuide;
