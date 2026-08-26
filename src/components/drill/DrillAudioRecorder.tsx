import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Play, Square, AlertCircle, Volume2 } from 'lucide-react';
import { Button } from '../ui/Button';

export interface DrillAudioRecorderProps {
  onRecordingComplete?: (audioBlob: Blob, durationSec: number) => void;
  isRecordingActive?: boolean;
  className?: string;
}

export const DrillAudioRecorder: React.FC<DrillAudioRecorderProps> = ({
  onRecordingComplete,
  isRecordingActive = false,
  className = '',
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [recordedDuration, setRecordedDuration] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Zwalnianie zasobów przy odmontowaniu
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startRecording = async () => {
    setPermissionError(null);
    setAudioUrl(null);
    audioChunksRef.current = [];
    setRecordedDuration(0);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Twoja przeglądarka nie obsługuje bezpośredniego nagrywania dźwięku.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        if (onRecordingComplete) {
          onRecordingComplete(audioBlob, recordedDuration);
        }
        // Zatrzymaj strumienie mikrofonu
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
      };

      mediaRecorder.start();
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setRecordedDuration((prev) => prev + 1);
      }, 1000);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Brak dostępu do mikrofonu.';
      setPermissionError(errorMsg);
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  return (
    <div className={`rounded-xl border border-line bg-surface p-4 space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={`flex h-7 w-7 items-center justify-center rounded-lg ${
              isRecording ? 'bg-error text-white animate-pulse' : 'bg-sunken text-muted'
            }`}
          >
            {isRecording ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
          </div>
          <div>
            <span className="text-xs font-bold text-ink block">
              {isRecording ? 'Trwa nagrywanie odpowiedzi...' : 'Nagrywanie Audio (Opcjonalne)'}
            </span>
            <span className="text-[10px] font-mono text-muted">
              {isRecording ? `Czas nagrania: ${recordedDuration}s` : 'Możesz nagrać głos do odsłuchu próbnego'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isRecording ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              icon={Mic}
              onClick={startRecording}
            >
              Nagraj głos
            </Button>
          ) : (
            <Button
              type="button"
              variant="danger"
              size="sm"
              icon={Square}
              onClick={stopRecording}
            >
              Zatrzymaj
            </Button>
          )}
        </div>
      </div>

      {permissionError && (
        <div className="flex items-center gap-2 rounded-lg border border-warning/30 bg-warning-soft/30 p-2 text-xs text-warning-fg">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{permissionError} (Przełącz się na tryb tekstowy, żeby wpisać odpowiedź).</span>
        </div>
      )}

      {audioUrl && !isRecording && (
        <div className="flex items-center gap-3 rounded-lg border border-line bg-sunken p-2">
          <Volume2 className="h-4 w-4 text-brand-600 shrink-0" />
          <audio controls src={audioUrl} className="h-7 w-full" />
        </div>
      )}
    </div>
  );
};
