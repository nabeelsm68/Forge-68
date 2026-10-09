"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  VoiceEngineStatus,
  fetchVoiceStatus,
  synthesizeVoiceSpeech,
  transcribeVoiceAudio,
} from "@/lib/api";
import { useTranslation } from "@/lib/i18n";

interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyQuery: (queryText: string, autoRun?: boolean) => void;
  currentResponseText?: string;
}

export function VoiceAssistantModal({
  isOpen,
  onClose,
  onApplyQuery,
  currentResponseText,
}: VoiceAssistantModalProps) {
  const { language, t } = useTranslation();
  const [engineStatus, setEngineStatus] = useState<VoiceEngineStatus | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [transcribedText, setTranscribedText] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [volumeLevel, setVolumeLevel] = useState<number>(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const stopListening = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    setIsListening(false);
  };

  const stopSpeaking = () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    setIsSpeaking(false);
  };

  // Fetch status on open
  useEffect(() => {
    if (!isOpen) return;

    fetchVoiceStatus()
      .then((res) => {
        setEngineStatus(res);
        if (!res.stt_available) {
          setStatusMessage("Local voice engine not installed. Sovereign zero-cloud policy active.");
        } else {
          setStatusMessage(`Local STT active: ${res.stt_engine} (${language.toUpperCase()})`);
        }
      })
      .catch(() => {
        setEngineStatus({
          stt_available: false,
          tts_available: false,
          stt_engine: "none",
          tts_engine: "none",
          supported_languages: ["en", "hi", "kn"],
          installed_models: {},
          sovereign_guarantee: "100% on-premise sovereign audio pipeline.",
          setup_instructions: {
            vosk: "pip install vosk && download vosk model into data/models/voice/",
            piper: "pip install piper-tts",
          },
        });
      });

    return () => {
      stopListening();
      stopSpeaking();
    };
  }, [isOpen, language]);

  const startListening = async () => {
    setErrorMessage(null);
    setTranscribedText("");
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mediaRecorder;

      // Audio analysis for real-time waveform level
      try {
        const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        audioContextRef.current = audioCtx;
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        analyserRef.current = analyser;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const updateMeter = () => {
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          setVolumeLevel(Math.min(100, Math.round((avg / 128) * 100)));
          animFrameRef.current = requestAnimationFrame(updateMeter);
        };
        updateMeter();
      } catch {
        // AudioContext meter fallback
      }

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        if (audioContextRef.current) {
          try {
            audioContextRef.current.close();
          } catch {
            // ignore
          }
        }
        stream.getTracks().forEach((track) => track.stop());
        setVolumeLevel(0);

        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        if (audioBlob.size < 100) {
          setIsTranscribing(false);
          setIsListening(false);
          return;
        }

        setIsTranscribing(true);
        try {
          const result = await transcribeVoiceAudio(audioBlob, language);
          if (result.status === "SUCCESS" && result.text) {
            setTranscribedText(result.text);
            setStatusMessage(`Transcribed locally (${result.engine}) with ${(result.confidence * 100).toFixed(0)}% confidence.`);
          } else if (result.status === "ENGINE_UNAVAILABLE") {
            setErrorMessage(result.error_message || "Local STT engine (Vosk or whisper.cpp) is not installed.");
          } else {
            setErrorMessage(result.error_message || "Could not transcribe audio locally.");
          }
        } catch (err: unknown) {
          setErrorMessage(err instanceof Error ? err.message : String(err));
        } finally {
          setIsTranscribing(false);
          setIsListening(false);
        }
      };

      mediaRecorder.start();
      setIsListening(true);
      setStatusMessage("Listening... Speak your operational query.");
    } catch (err: unknown) {
      setErrorMessage(`Microphone access error: ${err instanceof Error ? err.message : String(err)}`);
      setIsListening(false);
    }
  };

  const handleSpeakResponse = async () => {
    if (!currentResponseText) return;
    stopSpeaking();
    setIsSpeaking(true);
    try {
      const resp = await synthesizeVoiceSpeech(currentResponseText.slice(0, 1000), language);
      if (resp.status === "SUCCESS" && resp.audio_base64) {
        const audio = new Audio(`data:audio/wav;base64,${resp.audio_base64}`);
        currentAudioRef.current = audio;
        audio.onended = () => setIsSpeaking(false);
        audio.onerror = () => setIsSpeaking(false);
        await audio.play();
      } else {
        setErrorMessage(resp.error_message || "Local TTS engine (Piper or pyttsx3) not installed.");
        setIsSpeaking(false);
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
      setIsSpeaking(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        backdropFilter: "blur(4px)",
        zIndex: 500,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 580,
          backgroundColor: "var(--bg-1)",
          border: "1px solid var(--line-strong)",
          borderRadius: "var(--radius-panel)",
          boxShadow: "0 20px 48px rgba(0, 0, 0, 0.5)",
          padding: "24px 28px",
          display: "flex",
          flexDirection: "column",
          gap: 18,
          position: "relative",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", borderBottom: "1px solid var(--line)", paddingBottom: 14 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--brass)", letterSpacing: "0.08em" }}>
                SOVEREIGN VOICE INTERFACE
              </span>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "10.5px",
                  color: engineStatus?.stt_available ? "var(--sage)" : "var(--coral-text)",
                  border: `1px solid ${engineStatus?.stt_available ? "var(--sage)" : "var(--coral)"}`,
                  padding: "1px 6px",
                  borderRadius: "var(--radius-pill)",
                }}
              >
                {engineStatus?.stt_available ? "LOCAL STT READY" : "STT NOT INSTALLED"}
              </span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "10.5px", color: "var(--ink-3)" }}>
                LANG: {language.toUpperCase()}
              </span>
            </div>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "22px", color: "var(--ink)", fontWeight: 500, margin: 0 }}>
              {t("voiceModalTitle")}
            </h2>
            <p style={{ fontFamily: "var(--font-ui)", fontSize: "13px", color: "var(--ink-2)", margin: "4px 0 0" }}>
              {t("voiceSubtitle")}
            </p>
          </div>

          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "var(--ink-3)",
              fontSize: "18px",
              cursor: "pointer",
              padding: 4,
            }}
          >
            ✕
          </button>
        </div>

        {/* Audio Visualizer / Activity Pulse */}
        <div
          style={{
            background: "var(--bg-0)",
            border: "1px solid var(--line)",
            borderRadius: "var(--radius-panel)",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 14,
            minHeight: 140,
          }}
        >
          {isListening ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, height: 42 }}>
                {[0.4, 0.8, 1.0, 0.6, 0.9, 0.5, 0.7, 0.3].map((factor, idx) => (
                  <div
                    key={idx}
                    style={{
                      width: 6,
                      height: Math.max(8, (volumeLevel * factor * 0.4)),
                      backgroundColor: "var(--brass)",
                      borderRadius: 3,
                      transition: "height 50ms ease-out",
                    }}
                  />
                ))}
              </div>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--brass)" }}>
                {t("voiceListeningState")} ({language.toUpperCase()})
              </span>
            </div>
          ) : isTranscribing ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--sage)" }}>
                ⏳ {t("voiceTranscribingState")}
              </span>
            </div>
          ) : transcribedText ? (
            <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 8 }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--sage)" }}>
                TRANSCRIBED OPERATIONAL QUERY:
              </span>
              <textarea
                value={transcribedText}
                onChange={(e) => setTranscribedText(e.target.value)}
                rows={3}
                style={{
                  width: "100%",
                  background: "var(--bg-1)",
                  border: "1px solid var(--line-strong)",
                  borderRadius: "var(--radius-sm)",
                  color: "var(--ink)",
                  fontFamily: "var(--font-ui)",
                  fontSize: "14px",
                  padding: "10px 12px",
                  outline: "none",
                }}
              />
            </div>
          ) : (
            <div style={{ textAlign: "center" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--ink-3)" }}>
                {statusMessage || t("voiceIdleState")}
              </span>
            </div>
          )}
        </div>

        {/* Local Sovereign Guarantee Notice */}
        {!engineStatus?.stt_available && (
          <div
            style={{
              padding: "12px 14px",
              background: "rgba(217, 105, 78, 0.08)",
              border: "1px solid var(--coral)",
              borderRadius: "var(--radius-sm)",
              fontSize: "12.5px",
              color: "var(--ink-2)",
              lineHeight: 1.5,
            }}
          >
            <strong style={{ color: "var(--coral-text)", display: "block", marginBottom: 4 }}>
              {t("voiceUnavailableTitle")}
            </strong>
            {t("voiceUnavailableDesc")}
            <div style={{ marginTop: 6, fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--ink)" }}>
              Install command: <code>pip install vosk</code>
            </div>
          </div>
        )}

        {errorMessage && (
          <div
            style={{
              padding: "8px 12px",
              background: "rgba(217, 105, 78, 0.1)",
              border: "1px solid var(--coral)",
              borderRadius: "var(--radius-sm)",
              color: "var(--coral-text)",
              fontSize: "12px",
              fontFamily: "var(--font-mono)",
            }}
          >
            [VOICE NOTICE] {errorMessage}
          </div>
        )}

        {/* Action Controls */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", gap: 8 }}>
            {isListening ? (
              <button
                onClick={stopListening}
                className="btn-brass-primary"
                style={{ fontSize: "12px", padding: "6px 14px", background: "var(--coral)", borderColor: "var(--coral)" }}
              >
                {t("voiceStopListening")}
              </button>
            ) : (
              <button
                onClick={startListening}
                disabled={isTranscribing}
                className="btn-brass-primary"
                style={{ fontSize: "12px", padding: "6px 14px" }}
              >
                {t("voiceStartListening")}
              </button>
            )}

            {currentResponseText && (
              <button
                onClick={isSpeaking ? stopSpeaking : handleSpeakResponse}
                className="btn-brass-secondary"
                style={{ fontSize: "12px", padding: "6px 12px" }}
              >
                {isSpeaking ? t("voiceStopSpeaking") : "🔊 Read Response Aloud"}
              </button>
            )}
          </div>

          {transcribedText && (
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => {
                  onApplyQuery(transcribedText, false);
                  onClose();
                }}
                className="btn-brass-secondary"
                style={{ fontSize: "12px", padding: "6px 12px" }}
              >
                {t("voiceTransferQuery")}
              </button>
              <button
                onClick={() => {
                  onApplyQuery(transcribedText, true);
                  onClose();
                }}
                className="btn-brass-primary"
                style={{ fontSize: "12px", padding: "6px 14px" }}
              >
                {t("voiceExecuteQuery")}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
