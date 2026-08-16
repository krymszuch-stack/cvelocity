import React, { useState } from 'react';
import { Mail, User, ArrowRight, MonitorSmartphone } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Field';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { showToast } from '../../store/useToastStore';
import { MasterVault } from '../../types';

/**
 * Zakładanie profilu lokalnego.
 *
 * Poprzednia wersja tego ekranu udawała pełny system logowania i nie sprawdzała
 * niczego: dowolny e-mail z dowolnym hasłem przechodził dalej, dowolne sześć
 * znaków „potwierdzało" 2FA, a przycisk „Kontynuuj przez Google" wstawiał po
 * 800 ms zaszytego w kodzie użytkownika `google-user-1`. Ekran 2FA twierdził
 * dodatkowo „Wysłaliśmy kod weryfikacyjny na adres…", choć nic nigdzie nie szło.
 *
 * Bezpieczeństwo, którego nie ma, nie powinno mieć interfejsu, który udaje, że
 * jest — użytkownik podejmuje wtedy decyzje na podstawie fałszywej przesłanki.
 * Do czasu wejścia Supabase Auth ekran robi dokładnie to, co potrafi: zakłada
 * profil w tej przeglądarce i mówi o tym wprost.
 */
export interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessVaultLoaded?: (loadedVault: MasterVault) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccessVaultLoaded }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const { signInLocally } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const vault = signInLocally(name, email);
    onSuccessVaultLoaded?.(vault);

    showToast('Profil zapisany na tym urządzeniu', {
      message: 'Twoje dane zostają w tej przeglądarce. Konto w chmurze pojawi się w kolejnej wersji.',
      variant: 'success',
    });

    setName('');
    setEmail('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Utwórz profil na tym urządzeniu" size="sm">
      <div className="space-y-5">
        <div className="flex gap-3 rounded-2xl border border-line bg-sunken p-3.5">
          <MonitorSmartphone className="mt-0.5 h-4 w-4 shrink-0 text-brand-fg" aria-hidden="true" />
          <div className="space-y-1.5 text-xs leading-relaxed text-muted">
            <p className="font-semibold text-ink">To nie jest jeszcze konto w chmurze.</p>
            <p>
              Profil i Twoje CV zapisujemy wyłącznie w tej przeglądarce — nie ma hasła, nie ma
              serwera, nie ma synchronizacji między urządzeniami. Wyczyszczenie danych przeglądarki
              usuwa też profil.
            </p>
            <p>
              Dane opuszczają urządzenie tylko wtedy, gdy sam poprosisz o analizę AI. Ocena ATS
              i parsowanie CV liczą się lokalnie.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Jak się do Ciebie zwracać"
            icon={User}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jan Kowalski"
            autoFocus
            required
          />

          <Input
            label="Adres e-mail (opcjonalnie)"
            icon={Mail}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="jan.kowalski@domena.pl"
            autoComplete="email"
            hint="Podpowiadamy go później przy generowaniu CV. Nigdzie go nie wysyłamy."
          />

          <Button
            type="submit"
            variant="primary"
            size="md"
            className="w-full"
            icon={ArrowRight}
            disabled={!name.trim()}
          >
            Zapisz profil
          </Button>
        </form>
      </div>
    </Modal>
  );
};
