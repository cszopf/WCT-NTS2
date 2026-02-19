
import React, { useEffect, useRef, useState } from 'react';

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

/**
 * Strict Google Maps Autocomplete Component
 * Uses Legacy JS API for reliable input binding.
 */
const AddressAutocomplete: React.FC<Props> = ({ value, onValueChange, onSelect, disabled }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthError = (e: any) => {
      setAuthError(e.detail.message);
    };
    window.addEventListener('google-maps-auth-filter', handleAuthError);
    return () => window.removeEventListener('google-maps-auth-filter', handleAuthError);
  }, []);

  useEffect(() => {
    let checkInterval: any;

    const initAutocomplete = () => {
      if (!inputRef.current) return;
      if (!(window as any).google?.maps?.places?.Autocomplete) return;

      // Prevent double initialization
      if (autocompleteRef.current) return;

      autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
        types: ['address'],
        componentRestrictions: { country: 'us' },
        fields: ['address_components', 'formatted_address', 'geometry', 'place_id'],
      });

      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current?.getPlace();
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
        
        // Update parent state
        onValueChange(address.formattedAddress);
        onSelect(address);
      });

      setIsLoaded(true);
      if (checkInterval) clearInterval(checkInterval);
    };

    // Poll for google availability if not immediately present
    if ((window as any).google?.maps?.places) {
      initAutocomplete();
    } else {
      checkInterval = setInterval(() => {
        if ((window as any).google?.maps?.places) {
          initAutocomplete();
        }
      }, 200);
    }

    return () => {
      if (checkInterval) clearInterval(checkInterval);
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [onSelect, onValueChange]);

  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Property Address *</label>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          disabled={disabled}
          className={`w-full border rounded-lg p-2.5 text-sm outline-none transition-colors ${
            authError 
              ? 'border-red-300 bg-red-50 text-red-900' 
              : 'border-slate-200 focus:border-brand-blue'
          }`}
          placeholder={authError ? "Autocomplete disabled (Auth Error)" : (isLoaded ? "Start typing property address..." : "Loading address service...")}
          required
        />
        {!isLoaded && !authError && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-3 h-3 border-t-2 border-brand-blue rounded-full animate-spin"></div>
          </div>
        )}
      </div>
      {authError ? (
        <div className="mt-2 p-3 bg-red-100 border border-red-200 rounded-lg">
          <p className="text-[11px] text-red-700 font-bold mb-1">Google Maps Error: RefererNotAllowedMapError</p>
          <p className="text-[10px] text-red-600 leading-relaxed">
            Your API key is restricted. Please go to the <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="underline font-bold">Google Cloud Console</a> and add this URL to your "Website restrictions":
          </p>
          <code className="block mt-2 p-1.5 bg-white border border-red-200 rounded text-[10px] font-mono break-all select-all">
            https://ais-dev-zcygmvcm46koxzcpymqz3w-3111827956.us-west2.run.app/*
          </code>
        </div>
      ) : (
        <p className="text-[10px] text-slate-400 italic">Start typing and pick a suggestion.</p>
      )}
    </div>
  );
};

export default AddressAutocomplete;
