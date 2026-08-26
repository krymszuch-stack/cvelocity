import React, { useId, useState } from 'react';

/**
 * Podpowiedź dostępna z klawiatury.
 *
 * Natywny atrybut `title` wyglądał na darmowe rozwiązanie i był pułapką:
 * nie pokazuje się przy nawigacji Tab, znika po ~2 s, nie da się go ostylować,
 * a czytniki ekranu traktują go niekonsekwentnie. Skoro `hint` w `NavItem`
 * jest jedyną informacją „co tu robię", nie może zależeć od atrybutu, który
 * połowa dróg dostępu ignoruje.
 *
 * Dymek pojawia się na `hover` **oraz** `focus-visible`, ma `role="tooltip"`
 * i jest podpięty pod `aria-describedby` dziecka — dzięki temu czytnik odczyta
 * go razem z etykietą przycisku, zamiast zamiast niej.
 */
export interface TooltipProps {
  /** Treść podpowiedzi. Pusta wartość = brak dymka (zwracamy samo dziecko). */
  content?: string;
  /**
   * `right` dla zwiniętego paska bocznego (dymek wychodzi poza kolumnę),
   * `top` dla wszystkiego innego.
   */
  side?: 'right' | 'top';
  children: React.ReactElement<Record<string, any>>;
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  side = 'top',
  children,
  className = '',
}) => {
  const id = useId();
  const [isOpen, setIsOpen] = useState(false);

  if (!content) return children;

  // Pozycja liczona transformacją, nie marginesem: `transition-opacity`
  // nie rusza wtedy layoutu i dymek nie przesuwa sąsiadów w żadnej klatce.
  const position =
    side === 'right'
      ? 'left-full top-1/2 ml-2 -translate-y-1/2'
      : 'bottom-full left-1/2 mb-2 -translate-x-1/2';

  const child = React.cloneElement(children, {
    // `Record<string, any>` w typie propsów: bez tego `cloneElement` nie
    // przyjmuje `aria-describedby` ani handlerów dorzucanych do dowolnego dziecka.
    'aria-describedby': isOpen ? id : undefined,
    onMouseEnter: (event: React.MouseEvent) => {
      children.props.onMouseEnter?.(event);
      setIsOpen(true);
    },
    onMouseLeave: (event: React.MouseEvent) => {
      children.props.onMouseLeave?.(event);
      setIsOpen(false);
    },
    onFocus: (event: React.FocusEvent) => {
      children.props.onFocus?.(event);
      // `:focus-visible` jako selektor CSS nie da się odpytać w JS bez ryzyka
      // wyjątku w starszych silnikach — stąd `matches` w try/catch.
      let isKeyboard: boolean;
      try {
        isKeyboard = (event.target as HTMLElement).matches(':focus-visible');
      } catch {
        isKeyboard = true;
      }
      if (isKeyboard) setIsOpen(true);

    },
    onBlur: (event: React.FocusEvent) => {
      children.props.onBlur?.(event);
      setIsOpen(false);
    },
  });

  return (
    <div className={`relative flex min-w-0 ${className}`}>
      {child}
      <span
        id={id}
        role="tooltip"
        aria-hidden={!isOpen}
        className={`pointer-events-none absolute z-50 max-w-[15rem] whitespace-normal rounded-lg border border-line bg-elevated px-2.5 py-1.5 text-meta font-medium leading-snug text-ink shadow-floating transition-opacity duration-[var(--duration-fast)] ease-out ${position} ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {content}
      </span>
    </div>
  );
};
