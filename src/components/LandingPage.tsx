import React, { useState } from 'react';
import { ArrowRight, Code2, Lightbulb, Link2, Newspaper, Sparkles, UserRound } from 'lucide-react';
import { Card, CardHeader, PageHeader } from './ui/Card';
import { Button } from './ui/Button';
import { QUICK_TIPS, BLOG_POSTS } from '../data/careerAdvice';

interface LandingPageProps {
  onEnterApp: () => void;
}

/**
 * Public landing page: a left panel of quick career-advice tips and a main
 * mikroblog feed. Content is rendered in full in the DOM at all times — expanding
 * a post only lifts a CSS line-clamp, it never mounts/unmounts the body — so the
 * text is present for anything reading the page, not hidden behind a client-side
 * fetch or a click.
 */
export const LandingPage: React.FC<LandingPageProps> = ({ onEnterApp }) => {
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden relative">
        <div aria-hidden className="absolute -top-24 -right-16 w-72 h-72 rounded-full bg-brand-500/10 blur-3xl pointer-events-none" />
        <div className="relative p-6 sm:p-8 space-y-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-subtle">SkillVault</p>
          <h1 className="text-3xl font-black tracking-tight text-ink">
            Dopasuj CV do oferty, popraw ocenę ATS, aplikuj świadomie.
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-muted">
            Bezpłatne narzędzie do zarządzania CV, symulacji systemów ATS i dopasowywania ofert pracy — plus praktyczne
            porady zawodowe poniżej, bez rejestracji.
          </p>
          <Button size="md" iconRight={ArrowRight} onClick={onEnterApp}>
            Przejdź do narzędzia
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 items-start">
        {/* Left panel: quick tips */}
        <div className="space-y-3 lg:sticky lg:top-6">
          <PageHeader icon={Lightbulb} title="Szybkie porady" description="Krótkie odpowiedzi na częste pytania o CV." />
          <div className="space-y-2">
            {QUICK_TIPS.map((tip) => (
              <Card key={tip.id} className="p-3.5 space-y-1.5">
                <h3 className="text-xs font-bold text-ink leading-snug">{tip.question}</h3>
                <p className="text-xs leading-relaxed text-muted">{tip.answer}</p>
              </Card>
            ))}
          </div>

          <Card className="p-3.5 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-ink">
              <UserRound className="w-3.5 h-3.5 text-brand-fg shrink-0" />
              <span>O twórcy</span>
            </div>
            <p className="text-xs leading-relaxed text-muted">
              SkillVault stworzył{' '}
              <a href="https://oathcry.com" target="_blank" rel="noreferrer" className="font-semibold text-brand-fg hover:underline">
                Adrian Koziński
              </a>{' '}
              — wsparcie techniczne, automatyzacja i AI. Więcej projektów na{' '}
              <a href="https://oathcry.com" target="_blank" rel="noreferrer" className="font-semibold text-brand-fg hover:underline">
                oathcry.com
              </a>.
            </p>
            <div className="flex items-center gap-3 pt-1">
              <a href="https://github.com/krymszuch-stack" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-brand-fg">
                <Code2 className="w-3.5 h-3.5" />
                GitHub
              </a>
              <a href="https://www.linkedin.com/in/adrian-kozi%C5%84ski-6847162a6/" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-brand-fg">
                <Link2 className="w-3.5 h-3.5" />
                LinkedIn
              </a>
            </div>
          </Card>
        </div>

        {/* Main: mikroblog feed */}
        <div className="space-y-4">
          <PageHeader icon={Newspaper} title="Blog o szukaniu pracy" description="Dłuższe wpisy o CV, ATS i rekrutacji." />
          {BLOG_POSTS.map((post) => {
            const isExpanded = expandedPostId === post.id;
            return (
              <Card key={post.id} className="overflow-hidden">
                <CardHeader
                  icon={Sparkles}
                  title={post.title}
                  subtitle={new Date(post.publishedAt).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })}
                  accent="brand"
                />
                <div className="px-5 pb-5 space-y-3">
                  <p className="text-sm text-muted italic">{post.excerpt}</p>
                  {/* Full body stays mounted in the DOM at all times — collapsing only
                      hides it visually (sr-only), it never unmounts the text, so the
                      full article is present for anything reading the page. */}
                  <div className={isExpanded ? 'space-y-3 text-sm leading-relaxed text-ink' : 'sr-only'}>
                    {post.body.map((paragraph, idx) => (
                      <p key={idx}>{paragraph}</p>
                    ))}
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <div className="flex flex-wrap gap-1.5">
                      {post.tags.map((tag) => (
                        <span key={tag} className="px-2 py-0.5 rounded-full bg-sunken border border-line text-[10px] font-semibold text-subtle">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={() => setExpandedPostId(isExpanded ? null : post.id)}
                    >
                      {isExpanded ? 'Zwiń' : 'Czytaj dalej'}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};
