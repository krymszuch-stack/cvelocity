import React, { useState, useRef, useEffect } from 'react';
import { Check, Sparkles } from 'lucide-react';
import { diversifiedSample } from '../lib/autocompleteSuggestions';
import { FieldWrap } from './ui/Field';

interface AutocompleteInputProps {
  value: string;
  onChange: (val: string) => void;
  onSelectSuggestion?: (val: string) => void;
  suggestions: string[];
  placeholder?: string;
  label?: string;
  hint?: string;
  className?: string;
  showQuickPills?: boolean;
  maxPills?: number;
  onKeyDownEnter?: () => void;
}

export const AutocompleteInput: React.FC<AutocompleteInputProps> = ({
  value,
  onChange,
  onSelectSuggestion,
  suggestions,
  placeholder = 'Zacznij pisać…',
  label,
  hint,
  className = '',
  showQuickPills = false,
  maxPills = 6,
  onKeyDownEnter,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const query = value.trim().toLowerCase();
  const filtered = query
    ? suggestions.filter((item) => item.toLowerCase().includes(query) && item.toLowerCase() !== query)
    : diversifiedSample(suggestions, 10);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (item: string) => {
    onChange(item);
    onSelectSuggestion?.(item);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIsOpen(true);
      setHighlightedIndex((prev) => (prev < filtered.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIsOpen(true);
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : filtered.length - 1));
    } else if (e.key === 'Enter') {
      if (isOpen && highlightedIndex >= 0 && filtered[highlightedIndex]) {
        e.preventDefault();
        handleSelect(filtered[highlightedIndex]);
      } else {
        onKeyDownEnter?.();
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  };

  // Sampled across categories so one profession's vocabulary doesn't dominate.
  const quickPills = diversifiedSample(
    suggestions.filter((s) => s.toLowerCase() !== value.toLowerCase()),
    maxPills
  );

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <FieldWrap label={label} hint={hint}>
        <div className="relative">
          <input
            type="text"
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              setIsOpen(true);
              setHighlightedIndex(-1);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            autoComplete="off"
            role="combobox"
            aria-expanded={isOpen}
            aria-autocomplete="list"
            className="w-full h-10 bg-surface text-ink placeholder:text-subtle border border-line rounded-[10px] px-3 text-sm
                       transition-all duration-150 hover:border-line-strong
                       focus:border-brand-500 focus:ring-4 focus:ring-brand-500/12 focus:outline-none"
          />

          {isOpen && filtered.length > 0 && (
            <ul
              role="listbox"
              className="absolute z-50 left-0 right-0 mt-1.5 max-h-56 overflow-y-auto
                         bg-surface border border-line rounded-xl shadow-lg py-1 animate-fade-in"
            >
              {filtered.map((item, idx) => {
                const isHighlighted = idx === highlightedIndex;
                const isSelected = value.toLowerCase() === item.toLowerCase();
                return (
                  <li key={item} role="option" aria-selected={isSelected}>
                    <button
                      type="button"
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setHighlightedIndex(idx)}
                      className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between gap-2 transition-colors ${
                        isHighlighted ? 'bg-brand-soft text-brand-fg font-semibold' : 'text-ink hover:bg-sunken'
                      }`}
                    >
                      <span className="truncate">{item}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-brand-fg shrink-0" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </FieldWrap>

      {showQuickPills && quickPills.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-2.5">
          <span className="text-[10px] font-bold text-subtle uppercase tracking-wide flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-brand-fg shrink-0" />
            Sugestie
          </span>
          {quickPills.map((pill) => (
            <button
              key={pill}
              type="button"
              onClick={() => handleSelect(pill)}
              className="px-2 py-0.5 rounded-md border border-line bg-sunken text-[11px] text-muted
                         hover:border-brand-500/50 hover:bg-brand-soft hover:text-brand-fg transition-colors"
            >
              + {pill}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
