import React from 'react';
import { User, Mail, Phone, MapPin, Linkedin, Github, Globe, Briefcase } from 'lucide-react';
import { PersonalInfo } from '../../types';
import { Card } from '../../components/ui/Card';
import { Input, Textarea, Select } from '../../components/ui/Field';
import { Combobox } from '../../components/ui/Combobox';
import type { SuggestFn } from '../../hooks/useFieldSuggestions';

export interface PersonalSectionProps {
  data: PersonalInfo;
  onChange: (updated: PersonalInfo) => void;
  /**
   * Podpowiedzi do pól tekstowych. Opcjonalne, bo ta sekcja bywa renderowana
   * bez dostępu do całego vaultu — wtedy `Combobox` dostaje pustą listę
   * i zachowuje się dokładnie jak zwykły `Input`.
   */
  suggest?: SuggestFn;
  className?: string;
}

export const PersonalSection: React.FC<PersonalSectionProps> = ({
  data,
  onChange,
  suggest,
  className = '',
}) => {
  const handleChange = (field: keyof PersonalInfo, value: string) => {
    onChange({
      ...data,
      [field]: value,
    });
  };

  const isEmailValid = !data.email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email);

  return (
    <Card tone="raised" className={`space-y-6 ${className}`}>
      <div>
        <h3 className="text-base font-bold text-ink">Dane Osobowe i Kontaktowe</h3>
        <p className="text-xs text-muted">
          Informacje widoczne w nagłówku każdego wygenerowanego dokumentu CV.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        {/* Full Name */}
        <Input
          label="Imię i Nazwisko"
          icon={User}
          value={data.fullName}
          onChange={(e) => handleChange('fullName', e.target.value)}
          placeholder="np. Jan Kowalski"
          required
        />

        {/* Professional Title */}
        <Combobox
          label="Tytuł Zawodowy"
          icon={Briefcase}
          value={data.title}
          onChange={(value) => handleChange('title', value)}
          suggestions={suggest?.('jobTitle', data.title) ?? []}
          placeholder="np. Senior Frontend Architect"
          required
        />

        {/* Location */}
        <Combobox
          label="Miasto / Lokalizacja"
          icon={MapPin}
          value={data.location}
          onChange={(value) => handleChange('location', value)}
          suggestions={suggest?.('location', data.location) ?? []}
          placeholder="np. Warszawa, Polska"
        />

        {/* Email with validation */}
        <Input
          label="Adres E-mail"
          icon={Mail}
          type="email"
          value={data.email}
          onChange={(e) => handleChange('email', e.target.value)}
          placeholder="jan.kowalski@example.com"
          error={!isEmailValid ? 'Niepoprawny format adresu e-mail' : undefined}
          required
        />

        {/* Phone */}
        <Input
          label="Numer Telefonu"
          icon={Phone}
          type="tel"
          value={data.phone}
          onChange={(e) => handleChange('phone', e.target.value)}
          placeholder="+48 600 000 000"
        />

        {/* LinkedIn */}
        <Input
          label="Profil LinkedIn"
          icon={Linkedin}
          value={data.linkedin || ''}
          onChange={(e) => handleChange('linkedin', e.target.value)}
          placeholder="linkedin.com/in/jankowalski"
        />

        {/* GitHub */}
        <Input
          label="Profil GitHub"
          icon={Github}
          value={data.github || ''}
          onChange={(e) => handleChange('github', e.target.value)}
          placeholder="github.com/jankowalski"
        />

        {/* Portfolio / Website */}
        <Input
          label="Strona / Portfolio"
          icon={Globe}
          value={data.website || ''}
          onChange={(e) => handleChange('website', e.target.value)}
          placeholder="jankowalski.dev"
        />
      </div>

      {/* Summary */}
      <Textarea
        label="Podsumowanie Profilu Zawodowego"
        rows={4}
        value={data.summary}
        onChange={(e) => handleChange('summary', e.target.value)}
        placeholder="Doświadczony inżynier oprogramowania z ponad 6-letnim stażem w budowie systemów chmurowych..."
        hint="Podsumowanie powinno zawierać Twoje 3 najmocniejsze atuty i kluczowe technologie"
      />
    </Card>
  );
};
