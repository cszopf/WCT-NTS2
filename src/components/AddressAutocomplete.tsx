// @ts-nocheck
import React, { useEffect, useRef, useState } from 'react';

interface AddressAutocompleteProps {
  onAddressSelect: (address: any) => void;
  label: string;
  error?: string;
}

export const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({ onAddressSelect, label, error }) => {
  const autocompleteElementRef = useRef<HTMLElement>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      console.warn("Google Maps API Key missing");
      return;
    }

    const loadScript = () => {
      if (document.getElementById('google-maps-script')) {
        setScriptLoaded(true);
        return;
      }

      const script = document.createElement('script');
      script.id = 'google-maps-script'; // Add an ID to the script
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.onload = () => setScriptLoaded(true);
      document.head.appendChild(script);
    };

    loadScript();
  }, []);

  useEffect(() => {
    if (scriptLoaded && autocompleteElementRef.current) {
      const autocompleteElement = autocompleteElementRef.current;
      autocompleteElement.addEventListener('placechange', (event: any) => {
        const place = event.detail.place;
        if (place) {
          onAddressSelect(place);
        }
      });
    }
  }, [scriptLoaded, onAddressSelect]);

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-[#A2B2C8] uppercase tracking-[1.5px] font-montserrat">
        {label}
      </label>
      <gmp-place-autocomplete
        ref={autocompleteElementRef}
        class={`w-full px-4 py-3 rounded-xl border ${error ? 'border-red-500' : 'border-[#A2B2C8]/30'} focus:outline-none focus:border-[#004EA8] bg-white text-[#004EA8]`}
        placeholder="Start typing property address..."
        web-component-mode="true"
        type-restrictions="address"
        country-restrictions="us"
      ></gmp-place-autocomplete>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
};
