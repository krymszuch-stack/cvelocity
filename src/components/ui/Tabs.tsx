import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface TabItem<T extends string = string> {
  id: T;
  label: string;
  icon?: LucideIcon;
  badge?: React.ReactNode;
}

interface TabsProps<T extends string> {
  items: TabItem<T>[];
  active: T;
  onChange: (id: T) => void;
  /** `pill` for in-panel switching, `underline` for primary page sections. */
  variant?: 'pill' | 'underline';
  className?: string;
}

export function Tabs<T extends string>({
  items,
  active,
  onChange,
  variant = 'pill',
  className = '',
}: TabsProps<T>) {
  if (variant === 'underline') {
    return (
      <div className={`flex items-center gap-1 border-b border-line overflow-x-auto ${className}`} role="tablist">
        {items.map((item) => {
          const isActive = item.id === active;
          return (
            <button
              key={item.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(item.id)}
              className={`relative flex items-center gap-2 px-4 py-2.5 text-sm font-semibold whitespace-nowrap
                          transition-colors -mb-px border-b-2 ${
                            isActive
                              ? 'text-brand-fg border-brand-500'
                              : 'text-muted border-transparent hover:text-ink'
                          }`}
            >
              {item.icon && <item.icon className="w-4 h-4" />}
              {item.label}
              {item.badge}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-1 p-1 rounded-xl bg-sunken border border-line ${className}`}
      role="tablist"
    >
      {items.map((item) => {
        const isActive = item.id === active;
        return (
          <button
            key={item.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(item.id)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap
                        transition-all duration-150 ${
                          isActive
                            ? 'bg-surface text-ink shadow-sm border border-line'
                            : 'text-muted hover:text-ink border border-transparent'
                        }`}
          >
            {item.icon && <item.icon className="w-3.5 h-3.5" />}
            {item.label}
            {item.badge}
          </button>
        );
      })}
    </div>
  );
}
