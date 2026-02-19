
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import StepGuide from './components/StepGuide';
import AddressAutocomplete, { StructuredAddress } from './components/AddressAutocomplete';
import DebugEnvPage from './components/DebugEnvPage';
import { Persona, AppointmentType, TimeSlot } from './types';
import { APPOINTMENT_TYPES } from './constants';
import { fetchAvailability, createBooking, calculateNetToSeller } from './services/mockApi';
import { getPublicConfig } from './lib/publicEnv';

/**
 * Root component to manage Google Maps lifecycle exactly once.
 */
const GoogleMapsScript: React.FC = () => {
  useEffect(() => {
    const initMaps = async () => {
      // 1. Check if already loaded to prevent "Already Presented" error
      if ((window as any).google?.maps) {
        console.log("Google Maps already loaded.");
        return;
      }

      try {
        const config = await getPublicConfig();
        const key = config.googleMapsKey;
        
        if (!key || key.length < 10) {
          console.warn("Google Maps API key missing.");
          return;
        }

        const scriptId = "google-maps-js";
        if (!document.getElementById(scriptId)) {
          // Set global auth failure hook before script loads
          (window as any).gm_authFailure = () => {
            console.error("Google Maps Authentication Failure detected.");
            window.dispatchEvent(new CustomEvent('google-maps-auth-filter', { 
              detail: { message: "RefererNotAllowedMapError: Please authorize this URL in Google Cloud Console." } 
            }));
          };

          const script = document.createElement("script");
          script.id = scriptId;
          script.async = true;
          script.defer = true;
          script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=places&v=weekly`;
          document.head.appendChild(script);
        }
      } catch (err) {
        console.error("Maps Init Failure:", err);
      }
    };

    initMaps();
  }, []);

  return null;
};

const App: React.FC = () => {
  const [step, setStep] = useState<'persona' | 'type' | 'calendar' | 'form' | 'success'>('persona');
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const [selectedType, setSelectedType] = useState<AppointmentType | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [googleEventId, setGoogleEventId] = useState<string | null>(null);
  const [pathname, setPathname] = useState(window.location.pathname);

  // Form State
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    notes: '',
    propertyAddress: null as StructuredAddress | null,
    manualPropertyAddress: '',
    closingDate: '',
    agentName: '',
    companyName: ''
  });

  useEffect(() => {
    const handlePopState = () => setPathname(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (step === 'calendar' && selectedType) {
      loadSlots();
    }
  }, [selectedDate, selectedType, step]);

  if (pathname === '/debug/env') {
    const params = new URLSearchParams(window.location.search);
    if (params.get('token') === 'dev') {
      return <DebugEnvPage />;
    }
  }

  const loadSlots = async () => {
    setIsLoading(true);
    const slots = await fetchAvailability(selectedType!.id, selectedDate);
    setAvailableSlots(slots);
    setIsLoading(false);
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPersona === 'Buyer' || selectedPersona === 'Seller') {
      const addr = formData.propertyAddress;
      if (!addr && !formData.manualPropertyAddress) {
        alert('Please enter a property address.');
        return;
      }
    }

    setIsLoading(true);
    const answers = {
      ...formData,
      propertyAddress: formData.propertyAddress || {
        formattedAddress: formData.manualPropertyAddress,
        street1: formData.manualPropertyAddress,
        city: '', state: '', postalCode: '', placeId: 'manual', lat: 0, lng: 0
      }
    };

    const response = await createBooking({
      persona: selectedPersona,
      type: selectedType?.id,
      slot: selectedSlot,
      ...answers
    });
    
    setBookingId(response.id);
    setGoogleEventId(response.googleEventId);
    setIsLoading(false);
    setStep('success');
  };

  const getGoogleCalendarUrl = () => {
    if (!selectedSlot || !selectedType) return '#';
    const start = selectedSlot.start.replace(/[-:]/g, '').split('.')[0] + 'Z';
    const end = selectedSlot.end.replace(/[-:]/g, '').split('.')[0] + 'Z';
    const title = encodeURIComponent(`WCT: ${selectedType.title}`);
    const location = encodeURIComponent(formData.propertyAddress?.formattedAddress || formData.manualPropertyAddress);
    return `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&location=${location}&sf=true&output=xml`;
  };

  const renderPersonaSelection = () => (
    <div className="max-w-4xl mx-auto px-4 py-12 md:py-20 animate-fadeIn">
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-brand-blue mb-3">Secure your closing experience</h1>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(['Buyer', 'Seller', 'Real Estate Agent', 'Lender'] as Persona[]).map((p) => (
          <button key={p} onClick={() => { setSelectedPersona(p); setStep('type'); }} className="group p-6 bg-white border border-slate-200 rounded-xl text-left hover:border-brand-teal transition-all flex justify-between items-center">
            <span className="text-brand-blue text-xl font-bold">{p}</span>
            <span className="text-brand-teal">→</span>
          </button>
        ))}
      </div>
    </div>
  );

  const renderTypeSelection = () => {
    const eligibleTypes = APPOINTMENT_TYPES.filter(t => t.personaEligibility.includes(selectedPersona!));
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 animate-fadeIn">
        <button onClick={() => setStep('persona')} className="mb-6 text-brand-blue text-sm font-semibold flex items-center">← Back</button>
        <h2 className="text-2xl font-bold text-brand-blue mb-6">Choose Appointment Type</h2>
        <div className="space-y-3">
          {eligibleTypes.map((t) => (
            <button key={t.id} onClick={() => { setSelectedType(t); setStep('calendar'); }} className="w-full p-5 bg-white border border-slate-200 rounded-xl text-left hover:border-brand-blue transition-all group">
              <h3 className="text-lg font-bold text-slate-800 group-hover:text-brand-blue">{t.title}</h3>
              <p className="text-slate-500 text-sm">{t.description}</p>
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderCalendar = () => (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4">
          <button onClick={() => setStep('type')} className="mb-4 text-brand-blue text-sm font-semibold flex items-center">← Back</button>
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h2 className="text-xl font-bold text-brand-blue mb-3">{selectedType?.title}</h2>
          </div>
        </div>
        <div className="lg:col-span-8">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold">Available Slots</h3>
              <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="border rounded px-2 py-1 text-sm" />
            </div>
            {isLoading ? <div className="text-center py-20">Loading...</div> : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {availableSlots.map(slot => (
                  <button key={slot.start} onClick={() => { setSelectedSlot(slot); setStep('form'); }} className="py-2 border rounded-lg text-xs font-semibold hover:bg-slate-50">{slot.label}</button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderForm = () => (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xl">
        <button onClick={() => setStep('calendar')} className="mb-4 text-brand-blue text-xs font-bold uppercase">← Back</button>
        <h2 className="text-2xl font-bold text-brand-blue mb-6">Confirmation Details</h2>
        <form onSubmit={handleBooking} className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <input required type="text" placeholder="First Name" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} className="border rounded-lg p-2.5 text-sm" />
          <input required type="text" placeholder="Last Name" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} className="border rounded-lg p-2.5 text-sm" />
          <input required type="email" placeholder="Email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="border rounded-lg p-2.5 text-sm" />
          <input required type="tel" placeholder="Phone" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="border rounded-lg p-2.5 text-sm" />
          
          {(selectedPersona === 'Buyer' || selectedPersona === 'Seller') && (
            <div className="md:col-span-2">
              <AddressAutocomplete 
                value={formData.propertyAddress?.formattedAddress || formData.manualPropertyAddress}
                onValueChange={(val) => setFormData(prev => ({...prev, manualPropertyAddress: val}))}
                onSelect={(address) => {
                  setFormData(prev => ({...prev, propertyAddress: address}));
                  calculateNetToSeller(address.formattedAddress).then(res => {
                    console.log("Net to Seller Result:", res);
                    // In a real app, we'd store this in state and display it
                  });
                }}
              />
            </div>
          )}
          
          <button disabled={isLoading} className="md:col-span-2 bg-brand-blue text-white py-3 rounded-xl font-bold hover:bg-blue-800 disabled:bg-slate-300 transition-all">
            {isLoading ? 'Processing...' : 'Confirm Appointment'}
          </button>
        </form>
      </div>
    </div>
  );

  const renderSuccess = () => (
    <div className="max-w-3xl mx-auto px-4 py-12 text-center animate-fadeIn">
      <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-xl">
        <h2 className="text-2xl font-bold text-brand-blue mb-2">Appointment Secured</h2>
        <p className="text-slate-500 mb-6">Confirmation: {bookingId}</p>
        <a href={getGoogleCalendarUrl()} target="_blank" rel="noopener noreferrer" className="inline-block border border-slate-200 px-6 py-3 rounded-lg font-semibold hover:bg-slate-50">Add to My Calendar</a>
        <div className="mt-10"><StepGuide /></div>
        <button onClick={() => window.location.reload()} className="mt-10 text-brand-blue text-xs font-bold uppercase tracking-widest hover:underline">Schedule Another</button>
      </div>
    </div>
  );

  return (
    <Layout>
      <GoogleMapsScript />
      <div className="text-center py-2 border-b border-slate-100 bg-white">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Hours: Mon-Fri, 8:30 AM - 6:30 PM EST</p>
      </div>
      <div className="transition-all duration-300">
        {step === 'persona' && renderPersonaSelection()}
        {step === 'type' && renderTypeSelection()}
        {step === 'calendar' && renderCalendar()}
        {step === 'form' && renderForm()}
        {step === 'success' && renderSuccess()}
      </div>
    </Layout>
  );
};

export default App;
