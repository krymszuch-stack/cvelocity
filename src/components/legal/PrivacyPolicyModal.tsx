import React from 'react';
import { ShieldCheck, Lock, Database, Trash2, EyeOff } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({
  isOpen,
  onClose,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Polityka Prywatności i Ochrona Danych (RODO)"
      size="lg"
    >
      <div className="space-y-5 text-xs text-ink leading-relaxed">
        <div className="rounded-2xl border border-success-500/30 bg-success-500/5 p-4 flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-success-fg shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-sm text-ink">Zasada Local-First i Zero Nieautoryzowanego Śledzenia</h4>
            <p className="text-muted text-[11px]">
              Twoje dane zawodowe, życiorysy i historia zatrudnienia są przechowywane domyślnie w bezpiecznym magazynie Twojej przeglądarki. Nie sprzedajemy ani nie profilujemy Twoich danych do celów marketingowych.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <h5 className="font-bold text-sm text-ink flex items-center gap-1.5">
              <Database className="h-4 w-4 text-brand-600" />
              1. Administrator Danych
            </h5>
            <p className="text-muted">
              Administratorem danych osobowych przetwarzanych w ramach serwisu CVelocity jest CVelocity Sp. z o.o. Kontakt w sprawach ochrony danych: <strong>prywatnosc@cvelocity.pl</strong>.
            </p>
          </div>

          <div className="space-y-1.5">
            <h5 className="font-bold text-sm text-ink flex items-center gap-1.5">
              <Lock className="h-4 w-4 text-brand-600" />
              2. Zakres i Cel Przetwarzania
            </h5>
            <p className="text-muted">
              Dane podawane w profilu (imię, nazwisko, historia kariery, umiejętności, dane kontaktowe) przetwarzane są wyłącznie w celu tworzenia, edycji, dopasowywania CV pod oferty pracy oraz generowania dokumentów rekrutacyjnych zgodnie z art. 6 ust. 1 lit. b RODO.
            </p>
          </div>

          <div className="space-y-1.5">
            <h5 className="font-bold text-sm text-ink flex items-center gap-1.5">
              <EyeOff className="h-4 w-4 text-brand-600" />
              3. Anonimizacja i AI
            </h5>
            <p className="text-muted">
              Wszelkie zapytania optymalizacyjne przesyłane do modeli analizy semantycznej podlegają automatycznej pseudonimizacji i sanityzacji — dane wrażliwe nie są wykorzystywane do trenowania publicznych modeli.
            </p>
          </div>

          <div className="space-y-1.5">
            <h5 className="font-bold text-sm text-ink flex items-center gap-1.5">
              <Trash2 className="h-4 w-4 text-brand-600" />
              4. Prawo do usunięcia danych (Prawo do bycia zapomnianym)
            </h5>
            <p className="text-muted">
              W każdej chwili możesz całkowicie wyczyścić dane ze swojej przeglądarki w ustawieniach konta lub usunąć konto w chmurze jednym kliknięciem.
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-line/60 flex justify-end">
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            Rozumiem i akceptuję
          </Button>
        </div>
      </div>
    </Modal>
  );
};
