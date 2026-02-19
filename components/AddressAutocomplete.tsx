
import React, { useEffect, useRef, useState } from 'react';
import { loadGoogleMapsPlaces, getMapsStatus } from '../lib/googleMapsLoader';

export interface StructuredAddress {
  formattedAddress: string;
  street1: string;
  street2: string;
  city: string;
  state: string;
  postalCode: string;
  county: string;
  country: string;
  placeId: string;
  lat: number;
  lng: number;
}

interface Props {
  value: string;
  onValueChange: (value: string) => void;
  onSelect: (address: StructuredAddress) => void;
  disabled?: boolean;
}

const AddressAutocomplete: React.FC<Props> = ({ value, onValueChange, onSelect, disabled }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const acRef = useRef<any>(null);
  const initRef = useRef(false);
  const mountIdRef = useRef(Math.random().toString(36).substring(7));
  
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [localError, setLocalError] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState<boolean>(false);

  // Stable refs for callbacks
  const onSelectRef = useRef(onSelect);
  const onValueChangeRef = useRef(onValueChange);

  useEffect(() => {
    onSelectRef.current = onSelect;
    onValueChangeRef.current = onValueChange;
  }, [onSelect, onValueChange]);

  useEffect(() => {
    console.log(`AddressAutocomplete mounted [${mountIdRef.current}]`);
    
    if (initRef.current) return;
    initRef.current = true;

    const initialize = async () => {
      try {
        await loadGoogleMapsPlaces();
        
        if (!(window as any).google?.maps?.places?.Autocomplete) {
          throw new Error("Places library missing after script load");
        }

        if (!inputRef.current || acRef.current) return;

        acRef.current = new (window as any).google.maps.places.Autocomplete(inputRef.current, {
          types: ['address'],
          componentRestrictions: { country: 'us' },
          fields: ['address_components', 'formatted_address', 'geometry', 'place_id'],
        });

        acRef.current.addListener('place_changed', () => {
          const place = acRef.current?.getPlace();
          if (!place || !place.address_components) return;

          const address: StructuredAddress = {
            formattedAddress: place.formatted_address || '',
            street1: '', street2: '', city: '', state: '', postalCode: '',
            county: '', country: '', placeId: place.place_id || '',
            lat: place.geometry?.location?.lat() || 0,
            lng: place.geometry?.location?.lng() || 0,
          };

          let streetNumber = '', route = '';
          place.address_components.forEach((component: any) => {
            const types = component.types;
            if (types.includes('street_number')) streetNumber = component.long_name;
            if (types.includes('route')) route = component.long_name;
            if (types.includes('subpremise')) address.street2 = component.long_name;
            if (types.includes('locality')) address.city = component.long_name;
            if (types.includes('administrative_area_level_1')) address.state = component.short_name;
            if (types.includes('postal_code')) address.postalCode = component.long_name;
            if (types.includes('administrative_area_level_2')) address.county = component.long_name;
            if (types.includes('country')) address.country = component.short_name;
          });

          address.street1 = `${streetNumber} ${route}`.trim();
          onValueChangeRef.current(address.formattedAddress);
          onSelectRef.current(address);
        });

        setStatus('ready');
      } catch (err: any) {
        console.error("AddressAutocomplete init error:", err);
        setLocalError(err.message || "Failed to initialize Places");
        setStatus('error');
      }
    };

    initialize();

    return () => {
      console.log(`AddressAutocomplete unmounted [${mountIdRef.current}]`);
      if (acRef.current && (window as any).google?.maps?.event) {
        (window as any).google.maps.event.clearInstanceListeners(acRef.current);
      }
    };
  }, []);

  const { mapsStatus, lastError } = getMapsStatus();

  if (status === 'error' || mapsStatus === 'error') {
    return (
      <div className="space-y-2">
        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Property Address *</label>
        <input
          type="text"
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          className="w-full border border-red-200 bg-red-50 rounded-lg p-2.5 text-sm focus:border-brand-blue outline-none transition-colors"
          placeholder="Enter address manually..."
          required
        />
        <div className="flex flex-col space-y-1">
          <p className="text-[9px] text-red-500 font-medium">Autocomplete unavailable. Please enter full address manually.</p>
          <button type="button" onClick={() => setShowDebug(!showDebug)} className="text-[9px] text-slate-400 underline text-left">
            {showDebug ? 'Hide' : 'Show'} diagnostic info
          </button>
        </div>
        {showDebug && (
          <div className="bg-slate-900 text-slate-300 p-3 rounded-lg text-[9px] font-mono border border-slate-700">
            <p><span className="text-slate-500">Mount ID:</span> {mountIdRef.current}</p>
            <p><span className="text-slate-500">Maps Status:</span> {mapsStatus}</p>
            <p className="text-red-400"><span className="text-slate-500">Error:</span> {lastError || localError}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Property Address *</label>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          disabled={disabled || status === 'loading'}
          className={`w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:border-brand-blue outline-none transition-colors ${status === 'loading' ? 'bg-slate-50 cursor-wait' : ''}`}
          placeholder={status === 'loading' ? "Initializing Places..." : "Start typing property address..."}
          required
        />
        {status === 'loading' && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-3 h-3 border-t-2 border-brand-blue rounded-full animate-spin"></div>
          </div>
        )}
      </div>
      <p className="text-[10px] text-slate-400 italic">Start typing and pick a suggestion.</p>
    </div>
  );
};

export default AddressAutocomplete;
