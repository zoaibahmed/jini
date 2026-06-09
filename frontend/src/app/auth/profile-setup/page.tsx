'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
import { Car, Globe, FileText, ChevronRight } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';

const DRIVER_TYPES = [
  { id: 'TLC', name: 'TLC Driver', desc: 'NYC Taxi & Limousine Commission licensed drivers' },
  { id: 'Uber', name: 'Uber Driver', desc: 'Rideshare drivers operating on the Uber platform' },
  { id: 'Lyft', name: 'Lyft Driver', desc: 'Rideshare drivers operating on the Lyft platform' },
  { id: 'Commercial', name: 'Commercial Driver', desc: 'Cargo, van, shuttle, or other commercial fleets' },
  { id: 'Other', name: 'Other', desc: 'Independent delivery or private livery services' }
];

const LANGUAGES = [
  { code: 'English', label: '🇺🇸 English' },
  { code: 'Spanish', label: '🇪🇸 Spanish' },
  { code: 'Urdu', label: '🇵🇰 Urdu' },
  { code: 'Hindi', label: '🇮🇳 Hindi' },
  { code: 'Bengali', label: '🇧🇩 Bengali' },
  { code: 'Arabic', label: '🇸🇦 Arabic' },
  { code: 'Chinese', label: '🇨🇳 Chinese' },
  { code: 'French', label: '🇫🇷 French' }
];

export default function ProfileSetupPage() {
  const { setupProfile } = useAuth();
  const { toast } = useToast();
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['English']);
  const [documentsUploaded, setDocumentsUploaded] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);

  const toggleLanguage = (lang: string) => {
    if (selectedLanguages.includes(lang)) {
      if (selectedLanguages.length > 1) {
        setSelectedLanguages(selectedLanguages.filter(l => l !== lang));
      } else {
        toast.info('Please select at least one preferred language');
      }
    } else {
      setSelectedLanguages([...selectedLanguages, lang]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedType) {
      toast.error('Please select your primary driver type');
      return;
    }
    setLoading(true);
    try {
      await setupProfile({
        driverType: selectedType,
        languages: selectedLanguages,
        documentsUploaded
      });
    } catch (err) {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-zinc-950 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#2c2c2e_1px,transparent_1px)] [background-size:24px_24px] transition-colors duration-300">
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl space-y-6">
        
        {/* Branding header */}
        <div className="flex justify-center items-center">
          <Logo size="md" variant="auto" />
        </div>

        <Card className="shadow-xl border-slate-200 dark:border-zinc-800">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-12 h-12 bg-[#F5C400]/10 border border-[#F5C400]/25 text-[#D9A300] dark:text-[#F5C400] rounded-2xl flex items-center justify-center mb-3">
              <Car className="w-6 h-6" />
            </div>
            <CardTitle className="text-2xl font-heading font-bold text-[#0F172A] dark:text-slate-100">Complete Your Profile</CardTitle>
            <CardDescription className="text-sm text-slate-500 dark:text-slate-400">
              Customize your dashboard settings to align with your driving affiliations.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Step 1: Driver Type */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  1. What is your primary driver type?
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {DRIVER_TYPES.map((type) => {
                    const isSelected = selectedType === type.id;
                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setSelectedType(type.id)}
                        className={`flex items-start p-3 text-left rounded-xl border transition-all duration-200 focus:outline-none ${
                          isSelected
                            ? 'border-[#F5C400] bg-[#F5C400]/10 dark:bg-[#F5C400]/5 shadow-sm ring-1 ring-[#F5C400]'
                            : 'border-slate-200 dark:border-zinc-800 hover:border-slate-350 dark:hover:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800/40'
                        }`}
                      >
                        <div className={`mt-0.5 mr-3 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                          isSelected ? 'border-[#F5C400] bg-[#F5C400]' : 'border-slate-350 dark:border-zinc-800'
                        }`}>
                          {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-white dark:bg-zinc-950" />}
                        </div>
                        <div>
                          <p className={`text-xs font-bold ${isSelected ? 'text-[#D9A300] dark:text-[#F5C400]' : 'text-[#0F172A] dark:text-slate-200'}`}>
                            {type.name}
                          </p>
                          <p className="text-[10px] text-slate-450 dark:text-slate-400 font-medium leading-relaxed mt-0.5">
                            {type.desc}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Language settings */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Globe className="w-4 h-4 text-slate-450 dark:text-slate-400" />
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    2. Preferred Languages (Select all that apply)
                  </label>
                </div>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGES.map((lang) => {
                    const isSelected = selectedLanguages.includes(lang.code);
                    return (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => toggleLanguage(lang.code)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-150 ${
                          isSelected
                            ? 'bg-[#F5C400] border-[#F5C400] text-[#0B0B0B]'
                            : 'bg-white dark:bg-zinc-900/50 border-slate-200 dark:border-zinc-800 text-slate-650 dark:text-slate-450 hover:border-slate-350 dark:hover:border-zinc-700'
                        }`}
                      >
                        {lang.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 3: Document Vaults Onboarding */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-slate-450 dark:text-slate-400" />
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    3. Document Upload Preferences
                  </label>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-zinc-900/30 border border-slate-200/80 dark:border-zinc-800 rounded-xl space-y-3">
                  <p className="text-[11px] text-slate-500 dark:text-slate-450 leading-relaxed font-medium">
                    JNI Solutions tracks renewals for TLC licenses, vehicle registrations, and commercial insurances. You can opt to upload your files now, or set them up in your dashboard later.
                  </p>
                  
                  <label className="flex items-start space-x-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={documentsUploaded}
                      onChange={(e) => setDocumentsUploaded(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-slate-300 dark:border-zinc-800 text-[#F5C400] focus:ring-[#F5C400]"
                    />
                    <div className="text-left">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                        I want to begin uploading documents right away
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">
                        This flags your dashboard status to prompt the compliance upload flow.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-zinc-850 flex items-center justify-between">
                <span className="text-[11px] text-slate-450 dark:text-slate-500 font-medium">
                  Step 2 of 2: Customizing Experience
                </span>
                <Button
                  type="submit"
                  disabled={loading || !selectedType}
                  className="px-6 py-2.5 flex items-center space-x-2 text-xs font-bold text-[#0B0B0B]"
                >
                  <span>{loading ? 'Saving Profile...' : 'Complete Setup'}</span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>

            </form>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
