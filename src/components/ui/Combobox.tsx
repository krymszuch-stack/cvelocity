import React, { useCallback, useId, useMemo, useRef, useState } from 'react';
import { Input, InputProps } from './Field';
import { FormSuggestion } from '../../lib/formSuggestions';
import {
  ComboboxKey,
  moveActiveOption,
  NO_ACTIVE_OPTION,
  shouldPickOnEnter,
} from '../../lib/comboboxNavigation';

/**
 * Pole tekstowe z listą podpowiedzi.
 *
 * Osobny komponent, a nie prop w `Input`: combobox potrzebuje stanu otwarcia,
 * indeksu aktywnej pozycji, listboxa i obsługi klawiatury, a za opcjonalny prop
 * płaciłby każdy zwykły `Input` w aplikacji. Wewnątrz renderuje jednak ten sam
 * `Input`, więc etykieta, ikona, błąd i style pozostają jednym źródłem prawdy
 * (reguła 3) i `Field.tsx` nie wymaga ani jednej zmiany.
 *
 * Bez natywnego `<datalist>`: nie da się w nim pokazać, skąd pochodzi
 * podpowiedź, nie da się go ostylować tokenami motywu, a część przeglądarek
 * uzupełnia w nim pole sama — czyli łamie zasadę, na której stoi cała funkcja.
 *
 * **Nic nie wpisuje się samo.** Wartość zmienia się wyłącznie wtedy, gdy
 * użytkownik pisze albo świadomie wybiera pozycję. Lista otwiera się
 * z `activeIndex === NO_ACTIVE_OPTION`, więc `Enter` zaraz po wpisaniu własnej
 * treści zatwierdza tę treść, a nie pierwszą podpowiedź.
 */

export interface ComboboxProps extends Omit<InputProps, 'value' | 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  suggestions: FormSuggestion[];
  /** Wywoływane wyłącznie z akcji użytkownika — nigdy z samego renderu. */
  onPick?: (suggestion: FormSuggestion) => void;
}

const NAVIGATION_KEYS: ReadonlySet<string> = new Set([
  'ArrowDown',
  'ArrowUp',
  'Home',
  'End',
  'Escape',
]);

export const Combobox: React.FC<ComboboxProps> = ({
  value,
  onChange,
  suggestions,
  onPick,
  onKeyDown: onKeyDownFromCaller,
  // Klasa układu należy do zewnętrznego opakowania, nie do samego pola:
  // to opakowanie jest dzieckiem flexa albo gridu wywołującego, więc bez tego
  // `flex-1` trafiałoby o jeden poziom za głęboko i pole przestawało rosnąć.
  containerClassName = '',
  ...inputProps
}) => {
  const listId = useId();
  const [isOpen, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(NO_ACTIVE_OPTION);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const visible = useMemo(() => (isOpen ? suggestions : []), [isOpen, suggestions]);

  const pick = useCallback(
    (suggestion: FormSuggestion) => {
      onChange(suggestion.value);
      onPick?.(suggestion);
      setOpen(false);
      setActiveIndex(NO_ACTIVE_OPTION);
    },
    [onChange, onPick]
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        if (shouldPickOnEnter(activeIndex, visible.length)) {
          // Dopiero tu przejmujemy Enter. Bez aktywnej pozycji zdarzenie leci
          // do obsługi wywołującego, więc pola chipowe („wpisz i naciśnij
          // Enter") działają dokładnie jak przedtem.
          event.preventDefault();
          pick(visible[activeIndex]);
          return;
        }
        onKeyDownFromCaller?.(event);
        return;
      }

      if (event.key === 'Tab') {
        setOpen(false);
        setActiveIndex(NO_ACTIVE_OPTION);
        onKeyDownFromCaller?.(event);
        return;
      }

      if (!NAVIGATION_KEYS.has(event.key)) {
        onKeyDownFromCaller?.(event);
        return;
      }

      if (event.key === 'Escape') {
        // Escape zamyka listę, zostawiając wpisany tekst nietknięty.
        setOpen(false);
        setActiveIndex(NO_ACTIVE_OPTION);
        return;
      }

      if (suggestions.length === 0) return;

      event.preventDefault();
      setOpen(true);
      setActiveIndex((current) => moveActiveOption(current, suggestions.length, event.key as ComboboxKey));
    },
    [activeIndex, onKeyDownFromCaller, pick, suggestions.length, visible]
  );

  const activeId = activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined;

  return (
    <div className={`relative ${containerClassName}`}>
      <Input
        {...inputProps}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          setOpen(true);
          // Każda zmiana treści unieważnia zaznaczenie: lista jest już inna,
          // a stary indeks wskazywałby na przypadkową pozycję.
          setActiveIndex(NO_ACTIVE_OPTION);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          // Krótka zwłoka, żeby kliknięcie w pozycję zdążyło się obsłużyć.
          blurTimer.current = setTimeout(() => setOpen(false), 120);
        }}
        onKeyDown={handleKeyDown}
        autoComplete="off"
        role="combobox"
        aria-expanded={visible.length > 0}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={activeId}
      />

      {visible.length > 0 && (
        <>
          <ul
            id={listId}
            role="listbox"
            className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-line bg-surface p-1 shadow-raised"
          >
            {visible.map((suggestion, index) => (
              <li
                key={`${suggestion.source}:${suggestion.value}`}
                id={`${listId}-${index}`}
                role="option"
                aria-selected={index === activeIndex}
                // `onMouseDown`, nie `onClick`: blur pola zamknąłby listę,
                // zanim kliknięcie zdążyłoby się zarejestrować.
                onMouseDown={(event) => {
                  event.preventDefault();
                  if (blurTimer.current) clearTimeout(blurTimer.current);
                  pick(suggestion);
                }}
                onMouseEnter={() => setActiveIndex(index)}
                className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg px-2.5 py-1.5 text-sm ${
                  index === activeIndex ? 'bg-brand-50 text-ink' : 'text-muted'
                }`}
              >
                <span className="truncate">{suggestion.value}</span>
                <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-subtle">
                  {suggestion.reason}
                </span>
              </li>
            ))}
          </ul>

          {/*
            Czytnik ekranu nie dostaje sygnału o odświeżeniu listy z samej
            zmiany DOM-u — bez tego komunikatu użytkownik klawiatury nie wie,
            że pojawiły się podpowiedzi.
          */}
          <span aria-live="polite" className="sr-only">
            {`Liczba podpowiedzi: ${visible.length}`}
          </span>
        </>
      )}
    </div>
  );
};
