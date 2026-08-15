import React, { useState } from 'react';
import {
  Search,
  Globe,
  FileCode,
  Sparkles,
  RotateCcw,
  Building2,
  MapPin,
  Sliders,
  Radio,
  ExternalLink,
} from 'lucide-react';
import { JobOffer } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Textarea, Select } from '../../components/ui/Field';
import { Toggle } from '../../components/ui/Toggle';
import { Tabs } from '../../components/ui/Tabs';

export type InputMode = 'live' | 'url' | 'manual';

export interface JDInputModesProps {
  onSearchLive: (params: {
    keywords: string;
    location: string;
    remoteOnly: boolean;
    seniority: string;
    portal: string;
  }) => void;
  onMatchManual: (offer: Partial<JobOffer>) => void;
  onMatchUrl: (url: string) => void;
  isSearching?: boolean;
  className?: string;
}

const SAMPLE_MANUAL_JD = `Stanowisko: Senior Full-Stack React / Node.js Developer
Firma: TechScale Dynamics
Lokalizacja: Warszawa / Zdalnie
Widełki: 24 000 - 30 000 PLN netto B2B

O projekcie:
Poszukujemy doświadczonego Inżyniera Oprogramowania do budowy skalowalnych aplikacji webowych w oparciu o React 19, TypeScript oraz rozproszony backend w Node.js i PostgreSQL.

Wymagania kluczowe:
- Minimum 5 lat komercyjnego doświadczenia w programowaniu (React, TypeScript, Node.js)
- Dobra znajomość architektur chmurowych (AWS / GCP) i konteneryzacji Docker
- Doświadczenie w optymalizacji wydajności frontendowej (SSR, LCP, bundle splitting)
- Znajomość wzorców projektowych i pisania testów jednostkowych (Vitest / Jest)`;

export const JDInputModes: React.FC<JDInputModesProps> = ({
  onSearchLive,
  onMatchManual,
  onMatchUrl,
  isSearching = false,
  className = '',
}) => {
  const [activeMode, setActiveMode] = useState<InputMode>('live');

  // Mode 1: Live Filter States
  const [keywords, setKeywords] = useState('React Developer');
  const [location, setLocation] = useState('Warszawa');
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [seniority, setSeniority] = useState('ALL');
  const [portal, setPortal] = useState('ALL');

  // Mode 2: URL State
  const [jobUrl, setJobUrl] = useState('');

  // Mode 3: Manual State
  const [manualTitle, setManualTitle] = useState('Senior Full-Stack Developer');
  const [manualCompany, setManualCompany] = useState('TechScale Dynamics');
  const [manualText, setManualText] = useState(SAMPLE_MANUAL_JD);

  const modeTabs = [
    { id: 'live' as InputMode, label: 'Agregator Live (Wyszukiwarka)', icon: Radio },
    { id: 'url' as InputMode, label: 'Wklej Link do Oferty', icon: Globe },
    { id: 'manual' as InputMode, label: 'Wpisz Ręcznie / Wklej Treść', icon: FileCode },
  ];

  const handleSearchClick = () => {
    onSearchLive({
      keywords,
      location,
      remoteOnly,
      seniority,
      portal,
    });
  };

  const handleResetFilters = () => {
    setKeywords('');
    setLocation('');
    setRemoteOnly(false);
    setSeniority('ALL');
    setPortal('ALL');
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobUrl.trim()) return;
    onMatchUrl(jobUrl.trim());
  };

  const handleManualSubmit = () => {
    if (!manualText.trim()) return;
    onMatchManual({
      id: `manual-${Date.now()}`,
      title: manualTitle.trim() || 'Stanowisko Docelowe',
      company: manualCompany.trim() || 'Firma Rekrutująca',
      description: manualText.trim(),
      requirements: ['React', 'TypeScript', 'Node.js'],
      salary: '22 000 - 28 000 PLN netto B2B',
      location: 'Warszawa / Zdalnie',
      remote: true,
      portal: 'Ręczne',
    });
  };

  return (
    <Card tone="raised" className={`space-y-5 ${className}`}>
      {/* Mode Selector Tabs */}
      <div className="flex justify-center border-b border-line pb-4">
        <Tabs<InputMode>
          items={modeTabs}
          active={activeMode}
          onChange={setActiveMode}
          className="max-w-2xl"
        />
      </div>

      {/* Mode 1: Live Filters */}
      {activeMode === 'live' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Input
              label="Stanowisko / Słowa Kluczowe"
              icon={Search}
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="np. Frontend, Python, DevOps"
              onKeyDown={(e) => e.key === 'Enter' && handleSearchClick()}
            />

            <Input
              label="Lokalizacja"
              icon={MapPin}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="np. Warszawa, Kraków, Zdalnie"
              onKeyDown={(e) => e.key === 'Enter' && handleSearchClick()}
            />

            <Select
              label="Poziom Doświadczenia"
              value={seniority}
              onChange={(e) => setSeniority(e.target.value)}
              options={[
                { value: 'ALL', label: 'Wszystkie poziomy' },
                { value: 'JUNIOR', label: 'Junior (0-2 lata)' },
                { value: 'MID', label: 'Mid Specialist (2-5 lat)' },
                { value: 'SENIOR', label: 'Senior (5+ lat)' },
                { value: 'LEAD', label: 'Lead / Manager' },
              ]}
            />

            <Select
              label="Portal Źródłowy"
              value={portal}
              onChange={(e) => setPortal(e.target.value)}
              options={[
                { value: 'ALL', label: 'Wszystkie portale (Live)' },
                { value: 'JustJoinIT', label: 'JustJoin.it' },
                { value: 'NoFluffJobs', label: 'NoFluffJobs' },
                { value: 'Pracuj.pl', label: 'Pracuj.pl' },
                { value: 'LinkedIn', label: 'LinkedIn Jobs' },
              ]}
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-line/60 pt-3.5">
            <Toggle
              checked={remoteOnly}
              onChange={setRemoteOnly}
              label="Tylko praca w 100% zdalna"
            />

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                icon={RotateCcw}
                onClick={handleResetFilters}
              >
                Wyczyść
              </Button>

              <Button
                type="button"
                variant="primary"
                size="md"
                icon={Search}
                loading={isSearching}
                onClick={handleSearchClick}
              >
                Szukaj Ofert
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Mode 2: URL Ingestion */}
      {activeMode === 'url' && (
        <form onSubmit={handleUrlSubmit} className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <Input
              label="Adres URL Ogłoszenia Rekrutacyjnego"
              icon={Globe}
              type="url"
              value={jobUrl}
              onChange={(e) => setJobUrl(e.target.value)}
              placeholder="https://justjoin.it/offers/... lub https://nofluffjobs.com/job/..."
              containerClassName="flex-1"
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="md"
              icon={Globe}
              className="mb-0.5"
            >
              Pobierz i Dopasuj Ofertę
            </Button>
          </div>

          <p className="text-xs text-muted">
            Wklej bezpośredni link z dowolnego portalu. Nasz serwer pobierze treść ogłoszenia, zidentyfikuje wymagania i wyliczy Twój wskaźnik dopasowania ATS.
          </p>
        </form>
      )}

      {/* Mode 3: Manual Text Input */}
      {activeMode === 'manual' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input
              label="Nazwa Stanowiska"
              value={manualTitle}
              onChange={(e) => setManualTitle(e.target.value)}
              placeholder="np. Senior Frontend Architect"
            />

            <Input
              label="Firma Rekrutująca"
              icon={Building2}
              value={manualCompany}
              onChange={(e) => setManualCompany(e.target.value)}
              placeholder="np. Global FinTech Corp"
            />
          </div>

          <Textarea
            label="Treść Ogłoszenia o Pracę (Job Description)"
            rows={6}
            value={manualText}
            onChange={(e) => setManualText(e.target.value)}
            placeholder="Wklej pełną treść ogłoszenia rekrutacyjnego..."
            className="font-mono text-xs"
          />

          <div className="flex items-center justify-between border-t border-line/60 pt-3.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setManualText(SAMPLE_MANUAL_JD)}
            >
              Wypełnij przykładową ofertą
            </Button>

            <Button
              type="button"
              variant="primary"
              size="md"
              icon={Sparkles}
              onClick={handleManualSubmit}
            >
              Dopasuj CV do Treści
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};
