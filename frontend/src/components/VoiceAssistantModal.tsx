"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  VoiceEngineStatus,
  fetchVoiceStatus,
  synthesizeVoiceSpeech,
  transcribeVoiceAudio,
} from "@/lib/api";
import { useTranslation } from "@/lib/i18n";
import { readAloudCoordinator } from "@/lib/readAloudCoordinator";

interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyQuery: (queryText: string, autoRun?: boolean) => void;
  currentResponseText?: string;
}

/**
 * Encodes Float32 PCM audio samples into a standard 16-bit mono PCM WAV Blob.
 */
function encodeWav(samples: Float32Array, sampleRate: number): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  function writeString(offset: number, str: string) {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  }

  writeString(0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true); // Block align
  view.setUint16(34, 16, true); // 16 bits
  writeString(36, "data");
  view.setUint32(40, samples.length * 2, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  return new Blob([buffer], { type: "audio/wav" });
}

export function VoiceAssistantModal({
  isOpen,
  onClose,
  onApplyQuery,
  currentResponseText,
}: VoiceAssistantModalProps) {
  const { language, setLanguage } = useTranslation();
  const [engineStatus, setEngineStatus] = useState<VoiceEngineStatus | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [transcribedText, setTranscribedText] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [volumeLevel, setVolumeLevel] = useState<number>(0);
  const [showSetupGuide, setShowSetupGuide] = useState<boolean>(false);

  // Audio Context and Stream References for PCM Capture
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const pcmBuffersRef = useRef<Float32Array[]>([]);
  const animFrameRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  const stopListening = () => {
    if (scriptProcessorRef.current) {
      try {
        scriptProcessorRef.current.disconnect();
      } catch {
        // ignore
      }
      scriptProcessorRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      try {
        audioContextRef.current.close();
      } catch {
        // ignore
      }
      audioContextRef.current = null;
    }

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    setIsListening(false);
    setVolumeLevel(0);
  };

  const stopSpeaking = () => {
    readAloudCoordinator.stopAll();
    setIsSpeaking(false);
  };

  // Fetch truthful status on modal open
  useEffect(() => {
    if (!isOpen) return;

    fetchVoiceStatus()
      .then((res) => {
        setEngineStatus(res);
        const sttReady = res.stt_models?.[language] === "ready";
        const ttsReady = res.tts_voices?.[language] === "ready";

        if (!res.stt_available && !res.tts_available) {
          setStatusMessage("Sovereign voice engines are not currently installed. Zero-cloud guarantee active.");
        } else if (!sttReady && !ttsReady) {
          setStatusMessage(
            `Voice engines active, but models/voices for ${language.toUpperCase()} are not installed.`
          );
        } else if (!sttReady) {
          setStatusMessage(
            `TTS voice active (${res.tts_engine}). STT model for ${language.toUpperCase()} is not installed.`
          );
        } else {
          setStatusMessage(`Local voice active: STT (${res.stt_engine}) · TTS (${res.tts_engine})`);
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
          stt_models: { en: "engine_not_installed", hi: "engine_not_installed", kn: "engine_not_installed" },
          tts_voices: { en: "engine_not_installed", hi: "engine_not_installed", kn: "engine_not_installed" },
          cloud_providers_configured: 0,
          sovereign_guarantee: "100% on-premise sovereign audio pipeline.",
          setup_instructions: {
            vosk: "pip install vosk && download vosk model into data/models/voice/vosk/{lang}",
            pyttsx3: "Uses host offline SAPI5 voices (Windows Settings > Speech > Add Voices).",
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
    pcmBuffersRef.current = [];

    // Check if browser has microphone support
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setErrorMessage("Microphone audio capture is not supported in this browser environment.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioCtx({ sampleRate: 16000 });
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      // Real-time volume meter
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateMeter = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        setVolumeLevel(Math.min(100, Math.round((avg / 128) * 100)));
        animFrameRef.current = requestAnimationFrame(updateMeter);
      };
      updateMeter();

      // Collect raw PCM samples via ScriptProcessorNode (bufferSize 4096)
      const processor = audioCtx.createScriptProcessor(4096, 1, 1);
      scriptProcessorRef.current = processor;

      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        pcmBuffersRef.current.push(new Float32Array(inputData));
      };

      source.connect(analyser);
      analyser.connect(processor);
      processor.connect(audioCtx.destination);

      setIsListening(true);
      setStatusMessage("Listening... Speak your operational query, then click Stop.");
    } catch (err: unknown) {
      setErrorMessage(`Microphone access error: ${err instanceof Error ? err.message : String(err)}`);
      setIsListening(false);
    }
  };

  const handleStopAndTranscribe = async () => {
    // 1. Snapshot and stop recording
    const capturedBuffers = [...pcmBuffersRef.current];
    stopListening();

    if (capturedBuffers.length === 0) {
      setErrorMessage("No audio recorded. Please try again.");
      return;
    }

    // 2. Concatenate PCM float buffers
    let totalLength = 0;
    for (const buf of capturedBuffers) {
      totalLength += buf.length;
    }
    const combinedSamples = new Float32Array(totalLength);
    let offset = 0;
    for (const buf of capturedBuffers) {
      combinedSamples.set(buf, offset);
      offset += buf.length;
    }

    if (totalLength < 16000 * 0.4) {
      setErrorMessage("Audio recording was too brief (< 400ms). Please speak clearly and try again.");
      return;
    }

    // 3. Encode to standard PCM WAV (16kHz mono)
    const wavBlob = encodeWav(combinedSamples, 16000);

    setIsTranscribing(true);
    setStatusMessage("Transcribing audio on local host...");

    try {
      const result = await transcribeVoiceAudio(wavBlob, language);
      if (result.status === "SUCCESS" && result.text) {
        setTranscribedText(result.text);
        setStatusMessage(
          `Transcribed locally (${result.engine}) with ${(result.confidence * 100).toFixed(0)}% confidence.`
        );
      } else if (result.status === "ENGINE_UNAVAILABLE") {
        setErrorMessage(
          result.error_message ||
            `Local STT engine/model for ${language.toUpperCase()} is not installed on this host.`
        );
      } else {
        setErrorMessage(result.error_message || "Could not transcribe audio locally.");
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setIsTranscribing(false);
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
        readAloudCoordinator.setActiveAudio("voice-modal", audio);
        audio.onended = () => setIsSpeaking(false);
        audio.onerror = () => setIsSpeaking(false);
        await audio.play();
      } else {
        setErrorMessage(resp.error_message || "Local TTS voice not available for this language.");
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
        inset: 0,
        backgroundColor: "rgba(10, 11, 13, 0.82)",
        backdropFilter: "blur(6px)",
        zIndex: 1000,
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
          maxWidth: 620,
          backgroundColor: "var(--bg-1)",
          border: "1px solid var(--line-strong)",
          borderRadius: "var(--radius-hero)",
          padding: "28px 32px",
          display: "flex",
          flexDirection: "column",
          gap: 20,
          boxShadow: "0 24px 48px rgba(0, 0, 0, 0.6)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: "16px" }}>🎙</span>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "12px",
                  color: "var(--brass)",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}
              >
                SOVEREIGN VOICE INTERFACE
              </span>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "11px",
                  color: "var(--sage)",
                  background: "rgba(156, 195, 168, 0.1)",
                  padding: "2px 6px",
                  borderRadius: "var(--radius-pill)",
                  border: "1px solid var(--sage)",
                }}
              >
                AIR-GAPPED · ZERO CLOUD
              </span>
            </div>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "22px", color: "var(--ink)", fontWeight: 500 }}>
              Local Multilingual Speech Assistant
            </h2>
          </div>

          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "var(--ink-3)",
              fontSize: "18px",
              cursor: "pointer",
              padding: "4px 8px",
            }}
          >
            ✕
          </button>
        </div>

        {/* Language Selection & Truthful Status Strip */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "var(--bg-0)",
            padding: "10px 14px",
            borderRadius: "var(--radius-panel)",
            border: "1px solid var(--line)",
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--ink-2)" }}>Language:</span>
            {(["en", "hi", "kn"] as const).map((lng) => {
              const sttStatus = engineStatus?.stt_models?.[lng] || "engine_not_installed";
              const isReady = sttStatus === "ready";
              return (
                <button
                  key={lng}
                  onClick={() => setLanguage(lng)}
                  style={{
                    background: language === lng ? "var(--brass)" : "var(--bg-2)",
                    color: language === lng ? "#000" : "var(--ink)",
                    border: "1px solid var(--line)",
                    borderRadius: "var(--radius-pill)",
                    fontFamily: "var(--font-mono)",
                    fontSize: "12px",
                    fontWeight: 600,
                    padding: "3px 10px",
                    cursor: "pointer",
                  }}
                  title={`STT status for ${lng.toUpperCase()}: ${sttStatus}`}
                >
                  {lng === "en" ? "EN (English)" : lng === "hi" ? "HI (हिंदी)" : "KN (ಕನ್ನಡ)"}
                  {isReady && " ✓"}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setShowSetupGuide(!showSetupGuide)}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--brass)",
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            {showSetupGuide ? "Hide Setup Guide" : "Offline Setup Instructions"}
          </button>
        </div>

        {/* Offline Setup Guide (Collapsible) */}
        {showSetupGuide && (
          <div
            style={{
              background: "var(--bg-0)",
              border: "1px solid var(--line-strong)",
              borderRadius: "var(--radius-panel)",
              padding: "12px 14px",
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              lineHeight: 1.5,
              color: "var(--ink-2)",
            }}
          >
            <div style={{ fontWeight: 600, color: "var(--ink)", marginBottom: 6 }}>
              Local Offline Voice Stack Diagnostics:
            </div>
            <div>• STT Engine: <strong style={{ color: "var(--brass)" }}>{engineStatus?.stt_engine || "none"}</strong></div>
            <div>• STT Models: EN (<strong style={{ color: engineStatus?.stt_models?.en === "ready" ? "var(--sage)" : "var(--coral)" }}>{engineStatus?.stt_models?.en || "not_installed"}</strong>) · HI (<strong style={{ color: engineStatus?.stt_models?.hi === "ready" ? "var(--sage)" : "var(--coral)" }}>{engineStatus?.stt_models?.hi || "not_installed"}</strong>) · KN (<strong style={{ color: engineStatus?.stt_models?.kn === "ready" ? "var(--sage)" : "var(--coral)" }}>{engineStatus?.stt_models?.kn || "not_installed"}</strong>)</div>
            <div>• TTS Engine: <strong style={{ color: "var(--brass)" }}>{engineStatus?.tts_engine || "none"}</strong> (Host SAPI5 Voices: {engineStatus?.installed_voices_details?.length || 0})</div>
            <div>• TTS Voices: EN (<strong style={{ color: engineStatus?.tts_voices?.en === "ready" ? "var(--sage)" : "var(--coral)" }}>{engineStatus?.tts_voices?.en || "missing"}</strong>) · HI (<strong style={{ color: engineStatus?.tts_voices?.hi === "ready" ? "var(--sage)" : "var(--coral)" }}>{engineStatus?.tts_voices?.hi || "missing"}</strong>) · KN (<strong style={{ color: engineStatus?.tts_voices?.kn === "ready" ? "var(--sage)" : "var(--coral)" }}>{engineStatus?.tts_voices?.kn || "missing"}</strong>)</div>
            <div style={{ marginTop: 8, color: "var(--ink-3)" }}>
              To install Vosk STT models: Place downloaded model directories into <code>backend/data/models/voice/vosk/en</code>, <code>hi</code>, or <code>kn</code>.
            </div>
          </div>
        )}

        {/* Waveform & Listening State Card */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px 20px",
            background: "var(--bg-0)",
            border: "1px solid var(--line)",
            borderRadius: "var(--radius-panel)",
            minHeight: 140,
            gap: 14,
          }}
        >
          {/* Animated Waveform Meter */}
          <div style={{ display: "flex", alignItems: "center", gap: 4, height: 40 }}>
            {Array.from({ length: 16 }).map((_, i) => {
              const barHeight = isListening ? Math.max(6, Math.min(36, volumeLevel * (1 + Math.sin(i * 0.8)))) : 4;
              return (
                <div
                  key={i}
                  style={{
                    width: 5,
                    height: barHeight,
                    backgroundColor: isListening ? "var(--brass)" : "var(--line-strong)",
                    borderRadius: 3,
                    transition: "height 0.08s ease",
                  }}
                />
              );
            })}
          </div>

          <div style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: isListening ? "var(--brass)" : "var(--ink-3)", textAlign: "center" }}>
            {statusMessage}
          </div>

          {/* Microphone Action Button */}
          <div style={{ display: "flex", gap: 12 }}>
            {!isListening ? (
              <button
                onClick={startListening}
                disabled={isTranscribing}
                className="btn-brass-primary"
                style={{ fontSize: "13px", padding: "8px 20px" }}
              >
                🎙 Start Listening
              </button>
            ) : (
              <button
                onClick={handleStopAndTranscribe}
                className="btn-brass-primary"
                style={{ fontSize: "13px", padding: "8px 20px", background: "var(--coral)", borderColor: "var(--coral)" }}
              >
                ⏹ Stop & Transcribe
              </button>
            )}

            {isListening && (
              <button
                onClick={stopListening}
                className="btn-brass-secondary"
                style={{ fontSize: "13px", padding: "8px 16px" }}
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* Error Feedback */}
        {errorMessage && (
          <div
            style={{
              padding: "10px 14px",
              background: "rgba(217, 105, 78, 0.1)",
              border: "1px solid var(--coral)",
              borderRadius: "var(--radius-sm)",
              color: "var(--coral-text)",
              fontSize: "12px",
              fontFamily: "var(--font-mono)",
              lineHeight: 1.4,
            }}
          >
            <span>⚠ {errorMessage}</span>
          </div>
        )}

        {/* Transcribed Query Card */}
        {transcribedText && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
              background: "var(--bg-0)",
              border: "1px solid var(--line-strong)",
              borderRadius: "var(--radius-panel)",
              padding: "14px 16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--ink-3)", textTransform: "uppercase" }}>
                Transcribed Query Output:
              </span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--sage)" }}>
                Verified On-Premise
              </span>
            </div>

            <p style={{ fontFamily: "var(--font-ui)", fontSize: "14px", color: "var(--ink)", lineHeight: 1.5, margin: 0 }}>
              &ldquo;{transcribedText}&rdquo;
            </p>

            <div style={{ display: "flex", gap: 10, marginTop: 4, flexWrap: "wrap" }}>
              <button
                onClick={() => {
                  onApplyQuery(transcribedText, false);
                  onClose();
                }}
                className="btn-brass-secondary"
                style={{ fontSize: "12px", padding: "6px 12px" }}
              >
                Transfer to Question Field
              </button>

              <button
                onClick={() => {
                  onApplyQuery(transcribedText, true);
                  onClose();
                }}
                className="btn-brass-primary"
                style={{ fontSize: "12px", padding: "6px 14px" }}
              >
                Review & Run Investigation Loop ▶
              </button>
            </div>
          </div>
        )}

        {/* Read Aloud Previous Response Action */}
        {currentResponseText && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              paddingTop: 12,
              borderTop: "1px solid var(--line)",
              flexWrap: "wrap",
              gap: 10,
            }}
          >
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--ink-2)" }}>
              Read current mission answer aloud:
            </span>

            <button
              onClick={isSpeaking ? stopSpeaking : handleSpeakResponse}
              className="btn-brass-secondary"
              style={{ fontSize: "12px", padding: "6px 14px", display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              <span>{isSpeaking ? "⏹ Stop Speaking" : "🔊 Read Current Response Aloud"}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
