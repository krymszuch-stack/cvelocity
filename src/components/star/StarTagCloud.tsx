import React from 'react';
import { Tag, X, Layers } from 'lucide-react';
import { STARStory } from '../../types';

export interface StarTagCloudProps {
  stories: STARStory[];
  activeTags: string[];
  onToggleTag: (tag: string) => void;
  onClearTags?: () => void;
  className?: string;
}

export const StarTagCloud: React.FC<StarTagCloudProps> = ({
  stories,
  activeTags,
  onToggleTag,
  onClearTags,
  className = '',
}) => {
  // Wylicz częstość wystąpień tagów we wszystkich historiach
  const tagStats = React.useMemo(() => {
    const counts = new Map<string, number>();
    stories.forEach((story) => {
      story.tags.forEach((tag) => {
        counts.set(tag, (counts.get(tag) || 0) + 1);
      });
    });

    return Array.from(counts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);
  }, [stories]);

  if (tagStats.length === 0) return null;

  return (
    <div className={`rounded-2xl border border-line bg-elevated p-4 shadow-raised space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-brand-600" />
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-ink font-mono">
            Chmura Tagów Kompetencyjnych ({tagStats.length})
          </h4>
        </div>

        {activeTags.length > 0 && onClearTags && (
          <button
            type="button"
            onClick={onClearTags}
            className="flex items-center gap-1 text-[11px] font-semibold text-muted hover:text-ink transition-colors"
          >
            <X className="h-3 w-3" />
            <span>Wyczyść filtry ({activeTags.length})</span>
          </button>
        )}
      </div>

      {/* Tagi w chmurze */}
      <div className="flex flex-wrap gap-1.5">
        {tagStats.map(({ tag, count }) => {
          const isActive = activeTags.some((t) => t.toLowerCase() === tag.toLowerCase());

          return (
            <button
              key={tag}
              type="button"
              onClick={() => onToggleTag(tag)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-mono font-medium transition-all ${
                isActive
                  ? 'border border-brand-600 bg-brand-600 text-on-brand shadow-xs scale-105'
                  : 'border border-line bg-surface text-muted hover:border-line-strong hover:text-ink'
              }`}
              title={`Kliknij, aby przefiltrować i załadować do Slotu 3 HUD: ${tag}`}
            >
              <span>{tag}</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                  isActive ? 'bg-white/20 text-on-brand' : 'bg-sunken text-muted'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
