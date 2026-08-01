import React, { useState, useRef, useEffect } from 'react';
import { Search, Check, Sparkles } from 'lucide-react';

interface AutocompleteInputProps {
  value: string;
  onChange: (val: string) => void;
  onSelectSuggestion?: (val: string) => void;
  suggestions: string[];
  placeholder?: string;
  label?: string;
  className?: string;
  listId?: string;
  showQuickPills?: boolean;
  maxPills?: number;
  onKeyDownEnter?: () => void;
  darkTheme?: boolean;
}

export const AutocompleteInput: React.FC<AutocompleteInputProps> = ({
  value,
  onChange,
  onSelectSuggestion,
  suggestions,
  placeholder = 'Zacznij pisać...',
  label,
  className = '',
  showQuickPills = false,
  maxPills = 6,
  onKeyDownEnter,
  darkTheme = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Filter suggestions based on query
  const query = value.trim().toLowerCase();
  const filtered = query
    ? suggestions.filter((item) => item.toLowerCase().includes(query) && item.toLowerCase() !== query)
    : suggestions.slice(0, 10);

  // Close dropdown on outside click
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
    if (onSelectSuggestion) {
      onSelectSuggestion(item);
    }
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
      } else if (onKeyDownEnter) {
        onKeyDownEnter();
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  };

  // Quick pills to show under input (items not currently equal to exact value)
  const quickPills = suggestions
    .filter((s) => s.toLowerCase() !== value.toLowerCase())
    .slice(0, maxPills);

  return (
    <div ref={wrapperRef} className={`relative space-y-1.5 ${className}`}>
      {label && (
        <label className={`block text-xs font-semibold ${darkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
          {label}
        </label>
      )}

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
          className={`w-full border rounded-lg px-3 py-2 text-xs transition-colors focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
            darkTheme
              ? 'bg-slate-950 border-slate-700 text-white placeholder-slate-500 focus:border-indigo-500'
              : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:border-indigo-500'
          }`}
        />

        {/* Custom Enhanced Dropdown Menu - Single unified suggestion list */}
        {isOpen && filtered.length > 0 && (
          <div className="absolute z-50 left-0 right-0 mt-1 max-h-52 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-xl py-1 divide-y divide-slate-100">
            {filtered.map((item, idx) => {
              const isHighlighted = idx === highlightedIndex;
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors ${
                    isHighlighted ? 'bg-indigo-50 text-indigo-900 font-medium' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="truncate">{item}</span>
                  {value.toLowerCase() === item.toLowerCase() && (
                    <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0 ml-1" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Clickable Suggestion Chips / Pills */}
      {showQuickPills && quickPills.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className={`text-[10px] font-semibold flex items-center space-x-1 ${darkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
            <Sparkles className="w-3 h-3 text-indigo-400 inline shrink-0" />
            <span>Szybkie sugestie:</span>
          </span>
          {quickPills.map((pill) => (
            <button
              key={pill}
              type="button"
              onClick={() => handleSelect(pill)}
              className={`px-2 py-0.5 rounded border text-[10px] transition-colors ${
                darkTheme
                  ? 'bg-slate-800 border-slate-700 hover:bg-indigo-900/40 hover:text-indigo-300 hover:border-indigo-500 text-slate-300'
                  : 'bg-slate-100 border-slate-200 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 text-slate-600'
              }`}
            >
              + {pill}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
