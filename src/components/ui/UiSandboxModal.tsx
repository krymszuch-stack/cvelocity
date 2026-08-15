import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Info,
  Sliders,
  Database,
  Search,
  FileText,
  User,
  Plus,
} from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Card } from './Card';
import { Tabs } from './Tabs';
import { Input, Textarea, Select } from './Field';
import { Toggle } from './Toggle';
import { ProgressBar } from './ProgressBar';
import { StatusBadge } from './StatusBadge';
import { Chip } from './Chip';
import { StatTile } from './StatTile';
import { EmptyState } from './EmptyState';
import { Alert } from './Feedback';
import { PageHeader } from './PageHeader';

interface UiSandboxModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SandboxSection = 'buttons' | 'cards' | 'forms' | 'feedback' | 'metrics';

export const UiSandboxModal: React.FC<UiSandboxModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeSection, setActiveSection] = useState<SandboxSection>('buttons');
  const [toggleVal, setToggleVal] = useState(true);
  const [selectVal, setSelectVal] = useState('react');
  const [inputVal, setInputVal] = useState('Jan Kowalski');
  const [tabStyle, setTabStyle] = useState<'pill' | 'underline'>('pill');
  const [activeInnerTab, setActiveInnerTab] = useState('tab1');

  const sections = [
    { id: 'buttons' as SandboxSection, label: 'Przyciski & Chipy', icon: Sparkles },
    { id: 'cards' as SandboxSection, label: 'Karty & Układ', icon: Database },
    { id: 'forms' as SandboxSection, label: 'Pola Formularza', icon: Sliders },
    { id: 'feedback' as SandboxSection, label: 'Komunikaty & Stany', icon: AlertTriangle },
    { id: 'metrics' as SandboxSection, label: 'Metryki & Paski', icon: Zap },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="UI Core Library Sandbox (Storybook-Style)"
      size="xl"
    >
      <div className="space-y-6">
        <PageHeader
          title="Komponenty Bazowe CVELOCITY"
          description="Zestaw tokenizowanych komponentów z pełną dostępnością WCAG AA, animacjami sprężystymi i zerem klas zabronionych."
          badge="Design System"
        />

        {/* Section Selector */}
        <Tabs<SandboxSection>
          items={sections}
          active={activeSection}
          onChange={(id) => setActiveSection(id as SandboxSection)}
        />

        {/* Section 1: Buttons & Chips */}
        {activeSection === 'buttons' && (
          <div className="space-y-6">
            <Card tone="raised">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted mb-4">
                Warianty Przycisku Button
              </h4>
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="primary" size="md" icon={Sparkles}>
                  Primary Action
                </Button>
                <Button variant="secondary" size="md" icon={FileText}>
                  Secondary
                </Button>
                <Button variant="outline" size="md">
                  Outline
                </Button>
                <Button variant="ghost" size="md">
                  Ghost
                </Button>
                <Button variant="danger" size="md">
                  Danger
                </Button>
                <Button variant="primary" size="md" loading>
                  Loading State
                </Button>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-line/60 pt-4">
                <Button variant="primary" size="sm">
                  Small (sm)
                </Button>
                <Button variant="primary" size="md">
                  Medium (md)
                </Button>
                <Button variant="primary" size="lg">
                  Large (lg)
                </Button>
              </div>
            </Card>

            <Card tone="raised">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted mb-4">
                Warianty Chipów & Badge'y
              </h4>
              <div className="flex flex-wrap items-center gap-2">
                <Chip variant="brand">Brand Chip</Chip>
                <Chip variant="success">Success</Chip>
                <Chip variant="warning">Warning</Chip>
                <Chip variant="danger">Danger</Chip>
                <Chip variant="neutral">Neutral</Chip>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-line/60 pt-4">
                <StatusBadge variant="brand">Wysłana</StatusBadge>
                <StatusBadge variant="warning">Rozmowa</StatusBadge>
                <StatusBadge variant="success">Oferta</StatusBadge>
                <StatusBadge variant="danger">Odrzucona</StatusBadge>
                <StatusBadge variant="neutral">Wstrzymana</StatusBadge>
              </div>
            </Card>
          </div>
        )}

        {/* Section 2: Cards & Layout */}
        {activeSection === 'cards' && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card tone="flat">
              <span className="font-mono text-xs font-bold text-ink">Tone: Flat</span>
              <p className="mt-2 text-xs text-muted">
                Dyskretne tło bg-surface z obramowaniem border-line.
              </p>
            </Card>

            <Card tone="raised">
              <span className="font-mono text-xs font-bold text-ink">Tone: Raised</span>
              <p className="mt-2 text-xs text-muted">
                Uniesiona karta bg-elevated z cieniem shadow-raised i hoverem.
              </p>
            </Card>

            <Card tone="sunken">
              <span className="font-mono text-xs font-bold text-ink">Tone: Sunken</span>
              <p className="mt-2 text-xs text-muted">
                Zagłębiona karta bg-sunken dla grupowania treści pomocniczych.
              </p>
            </Card>
          </div>
        )}

        {/* Section 3: Form Fields */}
        {activeSection === 'forms' && (
          <Card tone="raised" className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Imię i Nazwisko"
                icon={User}
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="Wpisz imię..."
                hint="Widoczne w nagłówku Twojego CV"
              />

              <Select
                label="Główna Technologia"
                value={selectVal}
                onChange={(e) => setSelectVal(e.target.value)}
                options={[
                  { value: 'react', label: 'React 19 / TypeScript' },
                  { value: 'node', label: 'Node.js / Express' },
                  { value: 'cloud', label: 'Cloud Architecture AWS/GCP' },
                ]}
              />
            </div>

            <Textarea
              label="Podsumowanie Zawodowe"
              rows={3}
              placeholder="Opisz swoje kluczowe kompetencje i doświadczenie..."
              hint="Optymalna długość to 3-4 zdania"
            />

            <div className="border-t border-line/60 pt-4">
              <Toggle
                checked={toggleVal}
                onChange={setToggleVal}
                label="Automatyczna synchronizacja z chmurą"
                description="Zapisuj zmiany w profilu kandydata w czasie rzeczywistym"
              />
            </div>
          </Card>
        )}

        {/* Section 4: Feedback & States */}
        {activeSection === 'feedback' && (
          <div className="space-y-4">
            <Alert variant="success" title="Sukces">
              Dokument CV został pomyślnie zoptymalizowany pod kątem parsera ATS.
            </Alert>
            <Alert variant="warning" title="Ostrzeżenie">
              Wykryto brakujące uprawnienie formalne wymagane w ogłoszeniu.
            </Alert>
            <Alert variant="danger" title="Błąd krytyczny">
              Krytyczny błąd połączenia z serwerem. Sprawdź łącze internetowe.
            </Alert>
            <Alert variant="info" title="Wskazówka">
              Użyj formuły STAR, aby wzmocnić opisy projektów w doświadczeniu.
            </Alert>

            <EmptyState
              icon={Search}
              title="Brak zapisanych aplikacji"
              description="Dodaj swoje pierwsze stanowisko z poziomu Agregatora Ofert, aby śledzić etapy rekrutacji."
              action={
                <Button variant="primary" size="sm" icon={Plus}>
                  Znajdź Oferty
                </Button>
              }
            />
          </div>
        )}

        {/* Section 5: Metrics & Progress */}
        {activeSection === 'metrics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <StatTile
                label="Wynik Zgodności ATS"
                value="94.5%"
                icon={Sparkles}
                trend={{ value: '+12%', isPositive: true }}
                subtext="Wyższy niż 88% kandydatów"
              />
              <StatTile
                label="Zaoszczędzone Tokeny"
                value="142 800"
                icon={Zap}
                subtext="0-Token Slot Filling"
              />
              <StatTile
                label="Aktywne Aplikacje"
                value="8"
                icon={Send}
                subtext="2 zaproszenia na rozmowę"
              />
            </div>

            <Card tone="raised" className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted">
                Paski Postępu ProgressBar
              </h4>
              <ProgressBar value={85} max={100} showLabel barColor="bg-brand-600" />
              <ProgressBar value={40} max={100} showLabel barColor="bg-warning" />
              <ProgressBar value={95} max={100} showLabel barColor="bg-success" />
            </Card>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <Button variant="secondary" size="md" onClick={onClose}>
            Zamknij Sandbox
          </Button>
        </div>
      </div>
    </Modal>
  );
};
