import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';

export interface Country {
  name: string;
  code: string; // Dial code e.g. "+92"
  iso: string;  // ISO e.g. "PK"
  flag: string;
  length: number; // National digits length
}

const countries: Country[] = [
  { name: 'United States', code: '+1', iso: 'US', flag: '🇺🇸', length: 10 },
  { name: 'United Kingdom', code: '+44', iso: 'GB', flag: '🇬🇧', length: 10 },
  { name: 'Pakistan', code: '+92', iso: 'PK', flag: '🇵🇰', length: 10 },
  { name: 'India', code: '+91', iso: 'IN', flag: '🇮🇳', length: 10 },
  { name: 'Canada', code: '+1', iso: 'CA', flag: '🇨🇦', length: 10 },
  { name: 'Bangladesh', code: '+880', iso: 'BD', flag: '🇧🇩', length: 10 },
  { name: 'Saudi Arabia', code: '+966', iso: 'SA', flag: '🇸🇦', length: 9 },
  { name: 'United Arab Emirates', code: '+971', iso: 'AE', flag: '🇦🇪', length: 9 },
  { name: 'China', code: '+86', iso: 'CN', flag: '🇨🇳', length: 11 },
  { name: 'France', code: '+33', iso: 'FR', flag: '🇫🇷', length: 9 },
  { name: 'Australia', code: '+61', iso: 'AU', flag: '🇦🇺', length: 9 },
  { name: 'Germany', code: '+49', iso: 'DE', flag: '🇩🇪', length: 11 },
  { name: 'Brazil', code: '+55', iso: 'BR', flag: '🇧🇷', length: 11 },
];

interface CountryPhoneInputProps {
  value: string; // Full phone number e.g. "+923001234567"
  onChange: (fullNumber: string, phoneOnly: string) => void;
  className?: string;
  placeholder?: string;
}

export function CountryPhoneInput({ value, onChange, className = '', placeholder }: CountryPhoneInputProps) {
  const [selectedCountry, setSelectedCountry] = useState<Country>(countries[0]);
  const [phoneDigits, setPhoneDigits] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Parse initial value if any
  useEffect(() => {
    if (value) {
      const matched = countries
        .slice()
        .sort((a, b) => b.code.length - a.code.length) 
        .find(c => value.startsWith(c.code));

      if (matched) {
        setSelectedCountry(matched);
        const digits = value.slice(matched.code.length);
        setPhoneDigits(digits.slice(0, matched.length)); 
      } else {
        setPhoneDigits(value);
      }
    }
  }, [value]);

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Invisible keyboard search listener
  useEffect(() => {
    if (!showDropdown) return;

    let timeoutId: NodeJS.Timeout;
    let buffer = '';

    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid firing on Backspace/Escape/Enter
      if (e.key.length !== 1) return;

      buffer += e.key.toLowerCase();
      setSearchQuery(buffer);

      // Clear search buffer after 1.5 seconds of no typing
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        buffer = '';
        setSearchQuery('');
      }, 1500);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timeoutId);
    };
  }, [showDropdown]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = e.target.value.replace(/\D/g, '');
    const truncated = cleaned.slice(0, selectedCountry.length);
    setPhoneDigits(truncated);
    onChange(`${selectedCountry.code}${truncated}`, truncated);
  };

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country);
    setShowDropdown(false);
    setSearchQuery('');
    
    const truncatedDigits = phoneDigits.slice(0, country.length);
    setPhoneDigits(truncatedDigits);
    onChange(`${country.code}${truncatedDigits}`, truncatedDigits);
  };

  const filteredCountries = countries.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.code.includes(searchQuery) ||
    c.iso.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`relative flex items-stretch bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl overflow-visible ${className}`}>
      {/* Dropdown Toggle */}
      <div ref={dropdownRef} className="relative flex items-center">
        <button
          type="button"
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center space-x-1.5 px-3 py-2.5 border-r border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-900 transition-colors text-xs text-foreground font-semibold h-full rounded-l-xl"
        >
          {/* Flag placed behind/after the country dial code */}
          <span className="text-zinc-600 dark:text-zinc-350 font-semibold">{selectedCountry.code}</span>
          <img 
            src={`https://flagcdn.com/w20/${selectedCountry.iso.toLowerCase()}.png`} 
            alt={selectedCountry.name} 
            className="w-4 h-2.5 object-cover rounded-sm shrink-0" 
          />
          <ChevronDown className="w-3 h-3 text-zinc-400" />
        </button>

        {/* Custom Dropdown (No visual search bar, filters by typing characters) */}
        {showDropdown && (
          <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-2xl z-50 overflow-hidden backdrop-blur-xl">
            {searchQuery && (
              <div className="px-3 py-1.5 bg-[#F5C400]/10 border-b border-[#F5C400]/20 text-[10px] text-[#D9A300] font-bold">
                Typing: "{searchQuery}"
              </div>
            )}
            
            {/* List */}
            <div className="max-h-60 overflow-y-auto py-1">
              {filteredCountries.length > 0 ? (
                filteredCountries.map(c => (
                  <button
                    key={`${c.iso}-${c.code}`}
                    type="button"
                    onClick={() => handleCountrySelect(c)}
                    className="flex items-center justify-between w-full px-3 py-2 text-left hover:bg-[#F5C400]/10 dark:hover:bg-[#F5C400]/5 text-xs text-foreground font-medium transition-colors"
                  >
                    <div className="flex items-center space-x-2.5">
                      <img 
                        src={`https://flagcdn.com/w20/${c.iso.toLowerCase()}.png`} 
                        alt={c.name} 
                        className="w-4.5 h-3 object-cover rounded-sm shrink-0" 
                      />
                      <span className="font-semibold">{c.name}</span>
                    </div>
                    <span className="text-[10px] text-zinc-450 font-mono">{c.code}</span>
                  </button>
                ))
              ) : (
                <div className="px-3 py-2 text-center text-[10px] text-zinc-500">No countries match "{searchQuery}"</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main input */}
      <input
        type="tel"
        value={phoneDigits}
        onChange={handlePhoneChange}
        placeholder={placeholder || `Enter ${selectedCountry.length} digits`}
        className="flex-1 bg-transparent border-0 outline-none px-3.5 py-2.5 text-xs text-foreground focus:ring-0"
      />
    </div>
  );
}
