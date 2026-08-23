import React, { useState } from 'react';
import {
  Star,
  Sparkles,
  Mail,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  Save,
  MessageSquare,
} from 'lucide-react';
import {
  InterviewLoopSession,
  PostCallDebrief,
  MasterVault,
} from '../../types';
import {
  generateFollowUpEmail,
  saveInterviewSession,
} from '../../lib/interviewLoopEngine';
import { Button } from '../ui/Button';
import { Chip } from '../ui/Chip';
import { showToast } from '../../store/useToastStore';

export interface PostCallDebriefViewProps {
  session: InterviewLoopSession;
  vault: MasterVault;
  onUpdateSession: (updated: InterviewLoopSession) => void;
  onClose: () => void;
}

export const PostCallDebriefView: React.FC<PostCallDebriefViewProps> = ({
  session,
  vault,
  onUpdateSession,
  onClose,
}) => {
  const candidateName = vault.personalInfo?.fullName || 'Kandydat';

  const [rating, setRating] = useState<1 | 2 | 3 | 4 | 5>(
    session.postCallDebrief?.overallRating || 4
  );
  const [whatWentWell, setWhatWentWell] = useState(
    session.postCallDebrief?.whatWentWell || 'dyskusja o architekturze systemu i planach rozwoju'
  );
  const [topicsToClarify, setTopicsToClarify] = useState(
    session.postCallDebrief?.topicsToClarifyInFollowUp || ''
  );
  const [salaryNotes, setSalaryNotes] = useState(
    session.postCallDebrief?.salaryTimelineNotes || ''
  );

  const [generatedEmail, setGeneratedEmail] = useState<string>(() => {
    return (
      session.postCallDebrief?.generatedFollowUpEmail ||
      generateFollowUpEmail(session, candidateName, {
        whatWentWell,
        topicsToClarifyInFollowUp: topicsToClarify,
      })
    );
  });

  const [copied, setCopied] = useState(false);

  const handleRegenerateEmail = () => {
    const email = generateFollowUpEmail(session, candidateName, {
      whatWentWell,
      topicsToClarifyInFollowUp: topicsToClarify,
    });
    setGeneratedEmail(email);
  };

  const handleSaveDebrief = () => {
    const debrief: PostCallDebrief = {
      overallRating: rating,
      whatWentWell,
      trickyQuestions: [],
      topicsToClarifyInFollowUp: topicsToClarify,
      salaryTimelineNotes: salaryNotes,
      generatedFollowUpEmail: generatedEmail,
      completedAt: new Date().toISOString(),
    };

    const updatedSession: InterviewLoopSession = {
      ...session,
      status: 'COMPLETED',
      postCallDebrief: debrief,
      updatedAt: new Date().toISOString(),
    };

    saveInterviewSession(updatedSession);
    onUpdateSession(updatedSession);

    showToast('Zapisano debrief rozmowy', {
      message: `Sesja dla ${session.companyName} została pomyślnie zarchiwizowana.`,
      variant: 'success',
    });
    onClose();
  };

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(generatedEmail);
      setCopied(true);
      showToast('Skopiowano treść maila do schowka', {
        message: `Gotowy Follow-Up Email do ${session.companyName}`,
        variant: 'success',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="space-y-5">
      {/* 1. Samoocena i Subiektywne Wrażenie */}
      <div className="rounded-2xl border border-line bg-surface p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="font-mono text-xs font-bold text-ink uppercase tracking-wider block">
            Ogólna Ocena Przebiegu Spotkania:
          </span>
          <span className="text-[11px] text-muted">
            Jak oceniasz chemię z zespołem i poziom swoich odpowiedzi?
          </span>
        </div>

        <div className="flex items-center gap-1.5 bg-elevated p-1.5 rounded-xl border border-line">
          {([1, 2, 3, 4, 5] as const).map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className="p-1 text-muted hover:text-amber-500 transition-colors"
            >
              <Star
                className={`h-5 w-5 ${
                  star <= rating ? 'fill-amber-500 text-amber-500' : 'text-muted/40'
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      {/* 2. Pytania debriefowe */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        <div className="rounded-2xl border border-line bg-elevated p-4 space-y-2">
          <label className="font-mono text-xs font-bold text-ink uppercase tracking-wider block">
            Co poszło najlepiej? (Kluczowy sukces)
          </label>
          <input
            type="text"
            value={whatWentWell}
            onChange={(e) => setWhatWentWell(e.target.value)}
            placeholder="np. szczegółowe wyjaśnienie wdrożenia kolejki zdarzeń..."
            className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-xs font-mono text-ink placeholder:text-muted focus:border-brand-500 focus:outline-none"
          />
        </div>

        <div className="rounded-2xl border border-line bg-elevated p-4 space-y-2">
          <label className="font-mono text-xs font-bold text-ink uppercase tracking-wider block">
            Temat do doprecyzowania w Follow-up:
          </label>
          <input
            type="text"
            value={topicsToClarify}
            onChange={(e) => setTopicsToClarify(e.target.value)}
            placeholder="np. doświadczenie z konfiguracją klastra Kafka..."
            className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-xs font-mono text-ink placeholder:text-muted focus:border-brand-500 focus:outline-none"
          />
        </div>
      </div>

      {/* 3. Generator Follow-up Email */}
      <div className="rounded-2xl border border-line bg-elevated p-4 space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-brand-600" />
            <span className="font-mono text-xs font-bold text-ink uppercase tracking-wider">
              Wygenerowany Follow-Up Email (Podziękowanie):
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={Sparkles}
              onClick={handleRegenerateEmail}
            >
              Przebuduj
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              icon={copied ? Check : Copy}
              onClick={handleCopyEmail}
            >
              {copied ? 'Skopiowano!' : 'Kopiuj Mail'}
            </Button>
          </div>
        </div>

        <textarea
          rows={8}
          value={generatedEmail}
          onChange={(e) => setGeneratedEmail(e.target.value)}
          className="w-full rounded-xl border border-line bg-surface p-3.5 font-sans text-xs text-ink leading-relaxed shadow-inner placeholder:text-muted focus:border-brand-500 focus:outline-none resize-y"
        />
      </div>

      {/* Przycisk Zapisz Debrief */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button
          type="button"
          variant="primary"
          size="md"
          icon={Save}
          onClick={handleSaveDebrief}
        >
          Zapisz i Zakończ Sesję 💾
        </Button>
      </div>
    </div>
  );
};
