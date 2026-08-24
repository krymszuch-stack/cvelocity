import React, { useCallback, useState } from 'react';
import { Cloud, HardDrive, ArrowLeft, MailCheck } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Field';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Feedback';
import { useAuth } from '../../context/AuthContext';
import { MasterVault } from '../../types';
import { showToast } from '../../store/useToastStore';
import { checkPassword, passwordStrength, STRENGTH_LABELS } from '../../lib/passwordPolicy';
import { checkLeakedPassword } from '../../lib/leakedPassword';

/**
 * Wejście do aplikacji — dwa tryby, oba prawdziwe.
 *
 * Poprzednia wersja tego pliku zbierała imię i opcjonalny e-mail, i mówiła
 * wprost, że „to nie jest jeszcze konto w chmurze". Było to uczciwe, bo
 * konta faktycznie nie było. Teraz jest, więc modal przestaje być
 * oświadczeniem, a staje się wyborem:
 *
 * - **konto w chmurze** — CV przeżywa wyczyszczenie przeglądarki i wraca na
 *   innym urządzeniu;
 * - **tylko na tym urządzeniu** — dane nie opuszczają przeglądarki.
 *
 * Tryb lokalny zostaje, bo dla części osób to jest powód, żeby w ogóle wpisać
 * tu swoje CV, a nie przeszkoda do usunięcia.
 */

type Widok = 'wybor' | 'logowanie' | 'rejestracja' | 'reset' | 'potwierdz' | 'lokalny';

export interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessVaultLoaded?: (vault: MasterVault) => void;
}

const TYTULY: Record<Widok, string> = {
  wybor: 'Zacznij pracę',
  logowanie: 'Zaloguj się',
  rejestracja: 'Załóż konto',
  reset: 'Odzyskaj dostęp',
  potwierdz: 'Sprawdź skrzynkę',
  lokalny: 'Profil na tym urządzeniu',
};

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccessVaultLoaded }) => {
  const {
    signInLocally,
    signUpCloud,
    signInCloud,
    requestPasswordReset,
    cloudAvailable,
  } = useAuth();

  const [widok, setWidok] = useState<Widok>(cloudAvailable ? 'wybor' : 'lokalny');
  const [email, setEmail] = useState('');
  const [haslo, setHaslo] = useState('');
  const [imie, setImie] = useState('');
  const [blad, setBlad] = useState('');
  const [pracuje, setPracuje] = useState(false);

  const wyczysc = useCallback(() => {
    setBlad('');
    setHaslo('');
  }, []);

  const idzDo = useCallback(
    (cel: Widok) => {
      wyczysc();
      setWidok(cel);
    },
    [wyczysc]
  );

  const zamknij = useCallback(() => {
    setEmail('');
    setHaslo('');
    setImie('');
    setBlad('');
    setWidok(cloudAvailable ? 'wybor' : 'lokalny');
    onClose();
  }, [cloudAvailable, onClose]);

  /* --- profil lokalny --- */

  const zapiszProfilLokalny = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!imie.trim()) return;

      const vault = signInLocally(imie, email);
      onSuccessVaultLoaded?.(vault);
      showToast('Profil zapisany na tym urządzeniu', {
        message: 'Dane nie opuszczają tej przeglądarki.',
        variant: 'success',
      });
      zamknij();
    },
    [imie, email, signInLocally, onSuccessVaultLoaded, zamknij]
  );

  /* --- konto w chmurze --- */

  const zaloguj = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setBlad('');
      setPracuje(true);

      const wynik = await signInCloud(email.trim(), haslo);
      setPracuje(false);

      if (!wynik.ok) {
        setBlad(wynik.message);
        return;
      }

      showToast('Zalogowano', { message: 'Pobieramy Twoje CV z konta.', variant: 'success' });
      zamknij();
    },
    [email, haslo, signInCloud, zamknij]
  );

  const zarejestruj = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setBlad('');

      const polityka = checkPassword(haslo, email);
      if (!polityka.ok) {
        setBlad(polityka.problems.join(' '));
        return;
      }

      setPracuje(true);

      // Hasło z wycieku odrzucamy przed założeniem konta. Przy niedostępnym
      // HIBP przepuszczamy dalej — cudza awaria nie może blokować rejestracji.
      const wyciek = await checkLeakedPassword(haslo);
      if (wyciek.leaked) {
        setPracuje(false);
        setBlad(
          `To hasło pojawiło się w znanych wyciekach danych (${wyciek.count.toLocaleString('pl-PL')} razy). Wybierz inne — atakujący sprawdzają je w pierwszej kolejności.`
        );
        return;
      }

      const wynik = await signUpCloud(email.trim(), haslo, imie.trim() || email.split('@')[0]);
      setPracuje(false);

      if (!wynik.ok) {
        setBlad(wynik.message);
        return;
      }

      if (wynik.needsEmailConfirmation) {
        setWidok('potwierdz');
        return;
      }

      showToast('Konto założone', { variant: 'success' });
      zamknij();
    },
    [email, haslo, imie, signUpCloud, zamknij]
  );

  const resetuj = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setBlad('');
      setPracuje(true);

      await requestPasswordReset(email.trim());
      setPracuje(false);

      // Ten sam komunikat niezależnie od wyniku: inaczej formularz powiedziałby
      // obcemu, czy dany adres ma u nas konto.
      setWidok('potwierdz');
    },
    [email, requestPasswordReset]
  );

  const sila = passwordStrength(haslo);

  return (
    <Modal isOpen={isOpen} onClose={zamknij} title={TYTULY[widok]} size="sm">
      {widok !== 'wybor' && widok !== 'potwierdz' && cloudAvailable && (
        <button
          type="button"
          onClick={() => idzDo('wybor')}
          className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Wróć do wyboru
        </button>
      )}

      {blad && (
        <Alert variant="danger" className="mb-4">
          {blad}
        </Alert>
      )}

      {/* --- wybór trybu --- */}
      {widok === 'wybor' && (
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => idzDo('logowanie')}
            className="flex w-full items-start gap-3 rounded-xl border border-line bg-surface p-4 text-left hover:border-brand-400"
          >
            <Cloud className="mt-0.5 h-5 w-5 shrink-0 text-brand-fg" />
            <span>
              <span className="block text-sm font-bold text-ink">Konto w chmurze</span>
              <span className="mt-0.5 block text-xs text-muted">
                CV przeżyje wyczyszczenie przeglądarki i wróci na innym urządzeniu.
              </span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => idzDo('lokalny')}
            className="flex w-full items-start gap-3 rounded-xl border border-line bg-surface p-4 text-left hover:border-brand-400"
          >
            <HardDrive className="mt-0.5 h-5 w-5 shrink-0 text-muted" />
            <span>
              <span className="block text-sm font-bold text-ink">Tylko na tym urządzeniu</span>
              <span className="mt-0.5 block text-xs text-muted">
                Bez konta i bez hasła. Dane nie opuszczają tej przeglądarki.
              </span>
            </span>
          </button>
        </div>
      )}

      {/* --- logowanie --- */}
      {widok === 'logowanie' && (
        <form onSubmit={zaloguj} className="space-y-4">
          <Input
            label="Adres e-mail"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />
          <Input
            label="Hasło"
            type="password"
            autoComplete="current-password"
            value={haslo}
            onChange={(e) => setHaslo(e.target.value)}
            required
          />
          <Button type="submit" variant="primary" loading={pracuje} className="w-full">
            Zaloguj się
          </Button>

          <div className="flex justify-between text-xs">
            <button type="button" onClick={() => idzDo('rejestracja')} className="font-semibold text-brand-fg">
              Załóż konto
            </button>
            <button type="button" onClick={() => idzDo('reset')} className="text-muted hover:text-ink">
              Nie pamiętam hasła
            </button>
          </div>
        </form>
      )}

      {/* --- rejestracja --- */}
      {widok === 'rejestracja' && (
        <form onSubmit={zarejestruj} className="space-y-4">
          <Input
            label="Jak się do Ciebie zwracać"
            value={imie}
            onChange={(e) => setImie(e.target.value)}
            placeholder="np. Jan"
            autoFocus
          />
          <Input
            label="Adres e-mail"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <div>
            <Input
              label="Hasło"
              type="password"
              autoComplete="new-password"
              value={haslo}
              onChange={(e) => setHaslo(e.target.value)}
              hint="Co najmniej 12 znaków, mała i wielka litera oraz cyfra."
              required
            />
            {haslo && (
              <div className="mt-1.5 flex items-center gap-2">
                <div className="h-1 flex-1 overflow-hidden rounded-full bg-sunken">
                  <div
                    className="h-full rounded-full bg-brand-600 transition-all"
                    style={{ width: `${(sila / 4) * 100}%` }}
                  />
                </div>
                <span className="font-mono text-[10px] text-subtle">{STRENGTH_LABELS[sila]}</span>
              </div>
            )}
          </div>

          <Button type="submit" variant="primary" loading={pracuje} className="w-full">
            Załóż konto
          </Button>

          <p className="text-center text-xs text-muted">
            Masz już konto?{' '}
            <button type="button" onClick={() => idzDo('logowanie')} className="font-semibold text-brand-fg">
              Zaloguj się
            </button>
          </p>
        </form>
      )}

      {/* --- reset hasła --- */}
      {widok === 'reset' && (
        <form onSubmit={resetuj} className="space-y-4">
          <p className="text-sm text-muted">
            Podaj adres, na który zakładałeś konto. Wyślemy link do ustawienia nowego hasła.
          </p>
          <Input
            label="Adres e-mail"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />
          <Button type="submit" variant="primary" loading={pracuje} className="w-full">
            Wyślij link
          </Button>
        </form>
      )}

      {/* --- po rejestracji / po resecie --- */}
      {widok === 'potwierdz' && (
        <div className="space-y-4 text-center">
          <MailCheck className="mx-auto h-10 w-10 text-brand-fg" />
          <p className="text-sm text-ink">
            Jeśli ten adres ma u nas konto, wysłaliśmy na niego wiadomość.
          </p>
          <p className="text-xs text-muted">
            Link działa przez godzinę. Sprawdź też folder ze spamem — wiadomości
            od nowych nadawców czasem tam trafiają.
          </p>
          <Button type="button" variant="secondary" onClick={zamknij} className="w-full">
            Rozumiem
          </Button>
        </div>
      )}

      {/* --- profil lokalny --- */}
      {widok === 'lokalny' && (
        <form onSubmit={zapiszProfilLokalny} className="space-y-4">
          <Input
            label="Jak się do Ciebie zwracać"
            value={imie}
            onChange={(e) => setImie(e.target.value)}
            placeholder="np. Jan Kowalski"
            required
            autoFocus
          />
          <Input
            label="Adres e-mail (opcjonalnie)"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="jan.kowalski@domena.pl"
            hint="Nigdzie go nie wysyłamy — trafia do nagłówka Twojego CV."
          />

          <Alert variant="info">
            Ten profil żyje wyłącznie w tej przeglądarce. Nie ma hasła i nie ma
            synchronizacji — wyczyszczenie danych witryny usunie CV bezpowrotnie.
          </Alert>

          <Button type="submit" variant="primary" className="w-full">
            Zapisz profil
          </Button>
        </form>
      )}
    </Modal>
  );
};
