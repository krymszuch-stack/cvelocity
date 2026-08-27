import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  Play,
  Pause,
  Sparkles,
  CheckCircle2,
  Radio,
  Send,
  Zap,
  ListMusic,
  Activity,
  Search,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AudioManifestItem,
  createRecruiterSession,
  evaluateRecruiterCandidateAnswer,
  evaluateRecruiterVadSignal,
  RECRUITER_AUDIO_MANIFEST,
  RecruiterDecisionResult,
  RecruiterSessionState,
  resolveAudioFilePath,
} from '../../lib/recruiterAudio';
import { Button } from '../../components/ui/Button';
import { Chip } from '../../components/ui/Chip';

export interface RecruiterVoiceLabModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RecruiterVoiceLabModal: React.FC<RecruiterVoiceLabModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'INTERACTIVE' | 'SOUNDBOARD'>('INTERACTIVE');

  // Stan sesji wywiadu
  const [session, _setSession] = useState<RecruiterSessionState>(() => createRecruiterSession());

  // Stan nagrywania & VAD
  const [isRecording, setIsRecording] = useState(false);
  const [speechDurationSec, setSpeechDurationSec] = useState(0);
  const [audioLevelRms, setAudioLevelRms] = useState(0);
  const [transcriptText, setTranscriptText] = useState('');
  const [_isListeningSpeechApi, setIsListeningSpeechApi] = useState(false);

  // Ostatnie wtrącenie ACK w trakcie mowy
  const [activeAckPrompt, setActiveAckPrompt] = useState<string | null>(null);

  // Ostatnia decyzja routera
  const [lastDecision, setLastDecision] = useState<RecruiterDecisionResult | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [currentlyPlayingItem, setCurrentlyPlayingItem] = useState<AudioManifestItem | null>(null);

  // Stan Soundboardu 180 nagrań
  const [soundboardCategory, setSoundboardCategory] = useState<string>('ALL');
  const [soundboardSearch, setSoundboardSearch] = useState<string>('');

  // Referencje Audio & Web APIs
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const speechTimerRef = useRef<NodeJS.Timeout | null>(null);
  const speechRecognitionRef = useRef<any>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  // Zwalnianie zasobów
  const cleanupAudio = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (speechTimerRef.current) clearInterval(speechTimerRef.current);
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch (_err) {
        // Ignoruj błędy przy zamykaniu nierozpoczętej instancji
      }
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setIsRecording(false);
    setIsListeningSpeechApi(false);
    setAudioLevelRms(0);
  }, []);

  useEffect(() => {
    return () => {
      cleanupAudio();
      if (audioElementRef.current) {
        audioElementRef.current.pause();
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [cleanupAudio]);

  // Bezpieczne odtwarzanie pliku dźwiękowego z fallbackiem do SpeechSynthesis (głos lektora)
  const playAudioItem = useCallback((item: AudioManifestItem, volume = 1.0, onEnded?: () => void) => {
    setCurrentlyPlayingItem(item);
    setIsPlayingAudio(true);

    const audioUrl = resolveAudioFilePath(item);

    if (!audioElementRef.current) {
      audioElementRef.current = new Audio();
    }
    const audio = audioElementRef.current;
    audio.volume = Math.max(0.1, Math.min(1.0, volume));
    audio.src = audioUrl;

    const handleSuccess = () => {
      setIsPlayingAudio(false);
      setCurrentlyPlayingItem(null);
      onEnded?.();
    };

    audio.onended = handleSuccess;

    audio.onerror = () => {
      // Fallback: jeśli plik .mp3 nie jest jeszcze na serwerze webowym, użyj syntezy mowy w przeglądarce
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(item.transcript);
        utterance.lang = 'pl-PL';
        utterance.volume = volume;
        utterance.rate = 1.05;
        utterance.onend = handleSuccess;
        utterance.onerror = handleSuccess;
        window.speechSynthesis.speak(utterance);
      } else {
        handleSuccess();
      }
    };

    audio.play().catch(() => {
      // Jeśli przeglądarka zablokowała autoplay lub plik nie istnieje, uruchom syntezę
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(item.transcript);
        utterance.lang = 'pl-PL';
        utterance.volume = volume;
        utterance.onend = handleSuccess;
        window.speechSynthesis.speak(utterance);
      } else {
        handleSuccess();
      }
    });
  }, []);

  // Rozpoczęcie dyktowania i nasłuchu VAD
  const handleStartRecording = async () => {
    cleanupAudio();
    setActiveAckPrompt(null);
    setSpeechDurationSec(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      // Inicjalizacja Web Audio API dla analizy poziomu RMS (VAD)
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioCtx;
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const checkAudioLevel = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / bufferLength;
        const normalized = Math.min(1.0, avg / 128);
        setAudioLevelRms(normalized);

        // Jeśli poziom dźwięku jest powyżej progu szumu tła (mowa)
        if (normalized > 0.08) {
          setSpeechDurationSec((prev) => {
            const next = prev + 0.05;

            // Sprawdź czy VAD router powinien uruchomić wtrącenie ACK w tle (> 2.0s)
            const vadCheck = evaluateRecruiterVadSignal(session, {
              isSpeaking: true,
              speechDurationSec: next,
              silenceDurationSec: 0,
              audioRmsLevel: normalized,
            });

            if (vadCheck.shouldPlayAck && vadCheck.ackAudio && !activeAckPrompt) {
              setActiveAckPrompt(vadCheck.ackAudio.transcript);
              playAudioItem(vadCheck.ackAudio, vadCheck.audioVolume, () => {
                setTimeout(() => setActiveAckPrompt(null), 1200);
              });
            }

            return next;
          });
        }

        animFrameRef.current = requestAnimationFrame(checkAudioLevel);
      };

      animFrameRef.current = requestAnimationFrame(checkAudioLevel);

      // Inicjalizacja Web Speech API (transkrypcja lokalna w czasie rzeczywistym)
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = 'pl-PL';
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event: any) => {
          let text = '';
          for (let i = 0; i < event.results.length; i++) {
            text += event.results[i][0].transcript + ' ';
          }
          setTranscriptText(text.trim());
        };

        recognition.onerror = () => {
          setIsListeningSpeechApi(false);
        };

        recognition.onend = () => {
          setIsListeningSpeechApi(false);
        };

        recognition.start();
        speechRecognitionRef.current = recognition;
        setIsListeningSpeechApi(true);
      }

      setIsRecording(true);
    } catch (err) {
      console.warn('Nie udało się uzyskać dostępu do mikrofonu:', err);
    }
  };

  // Zatrzymanie nagrywania i natychmiastowa ewaluacja przez Deterministyczny Router VAD
  const handleStopAndEvaluate = () => {
    const finalTranscript = transcriptText.trim();
    const duration = speechDurationSec;

    cleanupAudio();

    // 0-Tokenowa ewaluacja deterministycznego routera
    const result = evaluateRecruiterCandidateAnswer(session, {
      transcript: finalTranscript,
      durationSec: duration,
      vad: {
        isSpeaking: false,
        speechDurationSec: duration,
        silenceDurationSec: 1.3,
        audioRmsLevel: audioLevelRms,
      },
    });

    setLastDecision(result);

    // Odtwórz pierwsze audio reakcji/przejścia/błędu
    playAudioItem(result.selectedAudio, result.audioVolume, () => {
      // Jeśli jest drugie powiązane audio (np. następne pytanie), odtwórz je po 500ms
      if (result.secondaryAudio) {
        setTimeout(() => {
          playAudioItem(result.secondaryAudio!, 1.0);
        }, 500);
      }
    });
  };

  if (!isOpen) return null;

  const currentAgendaQuestion = session.agendaQuestions[session.currentQuestionIndex];
  const allManifestItems = RECRUITER_AUDIO_MANIFEST.items;

  const filteredSoundboardItems = allManifestItems.filter((item) => {
    if (soundboardCategory !== 'ALL' && item.category !== soundboardCategory) {
      return false;
    }
    if (soundboardSearch.trim().length > 0) {
      const q = soundboardSearch.toLowerCase();
      return (
        item.transcript.toLowerCase().includes(q) ||
        item.intent.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="voice-lab-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-6"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl"
      >
        {/* NAGŁÓWEK */}
        <div className="flex items-center justify-between border-b border-line px-5 py-4 bg-sunken/40">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/20 text-accent ring-1 ring-accent/30">
              <Radio className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="voice-lab-title" className="text-base font-bold text-ink">
                  Laboratorium Głosu & Deterministyczny Router VAD
                </h2>
                <Chip variant="neutral" size="sm">
                  180 nagrań • 0 tokenów
                </Chip>
              </div>
              <p className="text-xs text-subtle">
                Interaktywny symulator pytań, aktywnego słuchania (ACK) i automatycznego kierowania wywiadem
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-line bg-sunken p-1">
              <button
                type="button"
                onClick={() => setActiveTab('INTERACTIVE')}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold transition-all ${
                  activeTab === 'INTERACTIVE'
                    ? 'bg-surface text-accent shadow-sm'
                    : 'text-subtle hover:text-ink'
                }`}
              >
                <Activity className="h-3.5 w-3.5" />
                Interaktywny Wywiad
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('SOUNDBOARD')}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold transition-all ${
                  activeTab === 'SOUNDBOARD'
                    ? 'bg-surface text-accent shadow-sm'
                    : 'text-subtle hover:text-ink'
                }`}
              >
                <ListMusic className="h-3.5 w-3.5" />
                Soundboard (180 plików)
              </button>
            </div>

            <Button variant="ghost" size="sm" onClick={onClose} aria-label="Zamknij laboratorium">
              ✕
            </Button>
          </div>
        </div>

        {/* ZAWARTOŚĆ */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {activeTab === 'INTERACTIVE' ? (
            <div className="space-y-5">
              {/* KARTA BIEŻĄCEGO PYTANIA */}
              <div className="rounded-xl border border-line/80 bg-sunken/60 p-4 space-y-2 relative overflow-hidden">
                <div className="flex items-center justify-between text-xs text-subtle">
                  <span className="flex items-center gap-1.5 font-semibold text-accent">
                    <Zap className="h-3.5 w-3.5" /> Pytanie {session.currentQuestionIndex + 1} z{' '}
                    {session.agendaQuestions.length} ({currentAgendaQuestion?.category || 'QUEST'})
                  </span>
                  <span className="font-mono text-[11px]">
                    ID: {currentAgendaQuestion?.id || 'END'}
                  </span>
                </div>

                <p className="text-sm font-semibold text-ink leading-relaxed">
                  {currentAgendaQuestion
                    ? currentAgendaQuestion.transcript
                    : 'Wszystkie pytania z agendy zostały zrealizowane! Gratulacje.'}
                </p>

                {currentAgendaQuestion && (
                  <div className="flex items-center justify-between pt-2">
                    <p className="text-[11px] text-subtle italic">
                      🎯 Cel pytania: {currentAgendaQuestion.intent}
                    </p>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => playAudioItem(currentAgendaQuestion)}
                      className="gap-1 text-xs"
                    >
                      <Volume2 className="h-3.5 w-3.5" />
                      Odsłuchaj pytanie
                    </Button>
                  </div>
                )}
              </div>

              {/* PANEL DYKTOWANIA I MIKROFONU */}
              <div className="rounded-2xl border border-line bg-surface p-5 space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-subtle">
                      Twoja odpowiedź kandydata
                    </h3>
                    {isRecording && (
                      <span className="flex items-center gap-1 rounded-full bg-error/20 px-2 py-0.5 text-[10px] font-bold text-error animate-pulse">
                        <span className="h-1.5 w-1.5 rounded-full bg-error" /> NAGRYWANIE & VAD
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs font-mono text-subtle">
                    <span>Słów: {transcriptText.trim().split(/\s+/).filter(Boolean).length}</span>
                    <span>Czas: {speechDurationSec.toFixed(1)}s</span>
                  </div>
                </div>

                {/* Pole tekstowe z podglądem na żywo */}
                <div className="relative">
                  <textarea
                    value={transcriptText}
                    onChange={(e) => setTranscriptText(e.target.value)}
                    placeholder={
                      isRecording
                        ? 'Mów do mikrofonu... Twój głos jest transkrybowany w czasie rzeczywistym...'
                        : 'Wpisz treść odpowiedzi lub naciśnij mikrofon poniżej, aby podyktować głosem...'
                    }
                    rows={3}
                    className="w-full rounded-xl border border-line bg-sunken/40 p-3.5 text-sm text-ink placeholder:text-subtle/50 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  />

                  {/* Wskaźnik wtrącenia ACK w locie */}
                  <AnimatePresence>
                    {activeAckPrompt && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute right-3 top-3 flex items-center gap-1.5 rounded-lg border border-accent/40 bg-accent/10 px-2.5 py-1 text-xs font-bold text-accent shadow-sm"
                      >
                        <Sparkles className="h-3.5 w-3.5 animate-spin" />
                        Rekruter w tle: „{activeAckPrompt}”
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Pasek natężenia dźwięku VAD */}
                {isRecording && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-mono text-subtle">
                      <span>Wykrywanie głosu VAD (RMS):</span>
                      <span>{Math.round(audioLevelRms * 100)}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-sunken">
                      <motion.div
                        className={`h-full transition-all duration-75 ${
                          audioLevelRms > 0.08 ? 'bg-emerald-500' : 'bg-slate-600'
                        }`}
                        style={{ width: `${Math.min(100, audioLevelRms * 150)}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Przyciski akcji */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-2">
                    {!isRecording ? (
                      <Button
                        variant="primary"
                        onClick={handleStartRecording}
                        className="gap-2 bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20"
                      >
                        <Mic className="h-4 w-4" />
                        Naciśnij i mów (Mikrofon)
                      </Button>
                    ) : (
                      <Button
                        variant="primary"
                        onClick={handleStopAndEvaluate}
                        className="gap-2 bg-error hover:bg-error/90 text-white animate-pulse"
                      >
                        <MicOff className="h-4 w-4" />
                        Zatrzymaj i oceń routerem
                      </Button>
                    )}

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setTranscriptText('');
                        setSpeechDurationSec(0);
                      }}
                      disabled={isRecording || transcriptText.length === 0}
                    >
                      Wyczyść
                    </Button>
                  </div>

                  {!isRecording && (
                    <Button
                      variant="primary"
                      onClick={handleStopAndEvaluate}
                      disabled={transcriptText.trim().length === 0}
                      className="gap-2"
                    >
                      <Send className="h-4 w-4" />
                      Prześlij odpowiedź do routera VAD
                    </Button>
                  )}
                </div>
              </div>

              {/* WYNIK DECYZJI DETERMINISTYCZNEGO ROUTERA */}
              <AnimatePresence>
                {lastDecision && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 15 }}
                    className="rounded-2xl border border-line bg-surface p-5 space-y-4 shadow-md"
                  >
                    <div className="flex items-center justify-between border-b border-line pb-3">
                      <div className="flex items-center gap-2">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                            lastDecision.decision === 'PROCEED_NEXT'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : lastDecision.decision === 'DRILL_DEEPER'
                              ? 'bg-amber-500/20 text-amber-400'
                              : 'bg-indigo-500/20 text-indigo-400'
                          }`}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-ink">
                            Decyzja Routera: {lastDecision.decision}
                          </h4>
                          <p className="text-xs text-subtle">{lastDecision.reason}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Chip variant="neutral" size="sm">
                          {lastDecision.metrics.wordCount} słów
                        </Chip>
                        <Chip variant="neutral" size="sm">
                          {lastDecision.metrics.durationSec.toFixed(1)}s
                        </Chip>
                      </div>
                    </div>

                    {/* Nagranie wybrane przez Router */}
                    <div className="rounded-xl border border-line/60 bg-sunken/50 p-3.5 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-accent">
                          🎧 Wybrane nagranie audio: {lastDecision.selectedAudio.id} (
                          {lastDecision.selectedAudio.category})
                        </span>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => playAudioItem(lastDecision.selectedAudio)}
                          className="gap-1 h-7 text-xs"
                        >
                          <Play className="h-3 w-3" />
                          Odtwórz ponownie
                        </Button>
                      </div>
                      <p className="text-xs font-semibold text-ink italic">
                        „{lastDecision.selectedAudio.transcript}”
                      </p>
                    </div>

                    {/* Opcjonalne drugie nagranie (nowe pytanie) */}
                    {lastDecision.secondaryAudio && (
                      <div className="rounded-xl border border-accent/30 bg-accent/5 p-3.5 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-accent">
                            ▶️ Następne pytanie w kolejce: {lastDecision.secondaryAudio.id}
                          </span>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => playAudioItem(lastDecision.secondaryAudio!)}
                            className="gap-1 h-7 text-xs"
                          >
                            <Play className="h-3 w-3" />
                            Odtwórz
                          </Button>
                        </div>
                        <p className="text-xs text-ink font-semibold">
                          „{lastDecision.secondaryAudio.transcript}”
                        </p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            /* SOUNDBOARD 180 NAGRAŃ */
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-subtle" />
                  <input
                    type="text"
                    value={soundboardSearch}
                    onChange={(e) => setSoundboardSearch(e.target.value)}
                    placeholder="Szukaj w 180 nagraniach..."
                    className="w-full rounded-xl border border-line bg-sunken pl-9 pr-3 py-2 text-xs text-ink placeholder:text-subtle focus:border-accent focus:outline-none"
                  />
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {[
                    { key: 'ALL', label: 'Wszystkie (180)' },
                    { key: 'QUEST_BEHAVIORAL', label: 'Behawioralne (10)' },
                    { key: 'QUEST_TECHNICAL', label: 'Techniczne (10)' },
                    { key: 'QUEST_SPECIALIST', label: 'Fizyczne/Trade (8)' },
                    { key: 'FILLER_ACK', label: 'Wtrącenia ACK (25)' },
                    { key: 'DRILL_STAR', label: 'Drążenie STAR (10)' },
                    { key: 'FLOW_ERROR', label: 'Błędy (10)' },
                    { key: 'FLOW_CLOSING', label: 'Koniec (10)' },
                  ].map((cat) => (
                    <button
                      key={cat.key}
                      type="button"
                      onClick={() => setSoundboardCategory(cat.key)}
                      className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all ${
                        soundboardCategory === cat.key
                          ? 'bg-accent text-white shadow-sm'
                          : 'bg-sunken text-subtle hover:text-ink'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Siatka nagrań */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[55vh] overflow-y-auto pr-1">
                {filteredSoundboardItems.map((item) => {
                  const isCurrent = currentlyPlayingItem?.id === item.id;
                  return (
                    <div
                      key={item.id}
                      className={`flex items-start justify-between gap-3 rounded-xl border p-3 transition-all ${
                        isCurrent
                          ? 'border-accent bg-accent/10 shadow-md ring-1 ring-accent/30'
                          : 'border-line/70 bg-sunken/40 hover:border-line hover:bg-sunken/70'
                      }`}
                    >
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[10px] font-bold text-accent">
                            {item.id}
                          </span>
                          <Chip variant="neutral" size="sm">
                            {item.category}
                          </Chip>
                        </div>
                        <p className="text-xs font-semibold text-ink line-clamp-2">
                          „{item.transcript}”
                        </p>
                        <p className="text-[10px] text-subtle line-clamp-1 italic">
                          {item.intent}
                        </p>
                      </div>

                      <Button
                        variant={isCurrent ? 'primary' : 'secondary'}
                        size="sm"
                        onClick={() => playAudioItem(item)}
                        className="h-8 w-8 shrink-0 p-0 rounded-lg"
                        aria-label={`Odtwórz ${item.id}`}
                      >
                        {isCurrent && isPlayingAudio ? (
                          <Pause className="h-3.5 w-3.5" />
                        ) : (
                          <Play className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* STOPKA */}
        <div className="flex items-center justify-between border-t border-line bg-sunken/30 px-5 py-3 text-xs text-subtle">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span>Router VAD aktywny • 0 zapytań LLM • Pełna ochrona prywatności</span>
          </div>

          <Button variant="secondary" size="sm" onClick={onClose}>
            Zamknij
          </Button>
        </div>
      </motion.div>
    </div>
  );
};
