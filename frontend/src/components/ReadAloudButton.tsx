"use client";

import React, { useEffect, useId, useState } from "react";
import { synthesizeVoiceSpeech } from "@/lib/api";
import { useTranslation, Language } from "@/lib/i18n";
import { readAloudCoordinator } from "@/lib/readAloudCoordinator";

interface ReadAloudButtonProps {
  text: string;
  targetLanguage?: Language;
  label?: string;
  compact?: boolean;
  style?: React.CSSProperties;
}

/**
 * Sanitizes markdown or code blocks for clean, natural speech synthesis.
 */
function cleanTextForSpeech(rawText: string): string {
  if (!rawText) return "";
  return rawText
    .replace(/```[\s\S]*?```/g, " [code block omitted] ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/#{1,6}\s+/g, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[|>]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function ReadAloudButton({
  text,
  targetLanguage,
  label,
  compact = false,
  style,
}: ReadAloudButtonProps) {
  const componentId = useId();
  const { language: currentAppLanguage, t } = useTranslation();
  const effectiveLanguage = targetLanguage || currentAppLanguage;

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync state with global coordinator
  useEffect(() => {
    const unsubscribe = readAloudCoordinator.subscribe((activeId) => {
      setIsPlaying(activeId === componentId);
    });
    return () => {
      unsubscribe();
    };
  }, [componentId]);

  // Clean up if unmounted while playing
  useEffect(() => {
    return () => {
      if (readAloudCoordinator.getActiveTextId() === componentId) {
        readAloudCoordinator.stopAll();
      }
    };
  }, [componentId]);

  const handleTogglePlayback = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setErrorMessage(null);

    // If currently playing, clicking stops playback
    if (isPlaying) {
      readAloudCoordinator.stopAll();
      return;
    }

    const textToSpeak = cleanTextForSpeech(text);
    if (!textToSpeak) return;

    setIsLoading(true);

    try {
      // Truncate to first 450 characters (approx 2-3 core sentences) for snappy response
      const snippetToSpeak = textToSpeak.length > 450 ? textToSpeak.slice(0, 450) + "..." : textToSpeak;

      // 1. Prioritize INSTANT on-device browser SpeechSynthesis (0ms lag, supports system EN, HI, KN)
      if (typeof window !== "undefined" && window.speechSynthesis) {
        const voices = window.speechSynthesis.getVoices();
        const targetPrefix = effectiveLanguage === "hi" ? "hi" : effectiveLanguage === "kn" ? "kn" : "en";

        // Find best matching voice for selected language
        const matchedVoice =
          voices.find((v) => v.lang.toLowerCase().startsWith(targetPrefix)) ||
          voices.find((v) => v.lang.toLowerCase().includes(targetPrefix)) ||
          (effectiveLanguage === "en" ? voices.find((v) => v.lang.startsWith("en")) : undefined);

        if (matchedVoice || voices.length > 0) {
          const utterance = new SpeechSynthesisUtterance(snippetToSpeak);
          if (matchedVoice) {
            utterance.voice = matchedVoice;
            utterance.lang = matchedVoice.lang;
          } else {
            utterance.lang = effectiveLanguage === "hi" ? "hi-IN" : effectiveLanguage === "kn" ? "kn-IN" : "en-US";
          }
          utterance.rate = 1.05;

          readAloudCoordinator.setActiveSpeechSynthesis(componentId, utterance);
          window.speechSynthesis.speak(utterance);
          setIsLoading(false);
          return;
        }
      }

      // 2. Fast bounded fallback to local sovereign backend synthesis (capped at 3s to prevent hangs)
      const timeoutPromise = new Promise<{ status: string; error_message?: string }>((_, reject) =>
        setTimeout(() => reject(new Error("Local voice backend synthesis timed out (3s).")), 3000)
      );

      const synthPromise = synthesizeVoiceSpeech(snippetToSpeak.slice(0, 300), effectiveLanguage);
      const res = await Promise.race([synthPromise, timeoutPromise]);

      if (res.status === "SUCCESS" && (res as any).audio_base64) {
        const audio = new Audio(`data:audio/wav;base64,${(res as any).audio_base64}`);
        readAloudCoordinator.setActiveAudio(componentId, audio);
        await audio.play();
        setIsLoading(false);
        return;
      }

      // 3. Truthfully report unavailable state
      const langName = effectiveLanguage === "hi" ? "Hindi" : effectiveLanguage === "kn" ? "Kannada" : "English";
      const errMsg =
        res.error_message ||
        `Local offline voice for ${langName} (${effectiveLanguage}) is not installed on this host.`;
      setErrorMessage(errMsg);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  };

  const getButtonText = () => {
    if (isLoading) {
      return t("readAloudPlaying");
    }
    if (isPlaying) {
      return t("readAloudStop");
    }
    if (label) return label;
    return t("readAloudLabel");
  };

  return (
    <div style={{ display: "inline-flex", flexDirection: "column", gap: 4, ...style }}>
      <button
        type="button"
        onClick={handleTogglePlayback}
        disabled={isLoading || !text.trim()}
        aria-label={isPlaying ? "Stop speech readout" : "Read text aloud with local sovereign voice"}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          background: isPlaying ? "rgba(224, 169, 109, 0.15)" : "var(--bg-0)",
          border: isPlaying ? "1px solid var(--brass)" : "1px solid var(--line-strong)",
          borderRadius: "var(--radius-pill)",
          color: isPlaying ? "var(--brass)" : "var(--ink-2)",
          fontFamily: "var(--font-mono)",
          fontSize: compact ? "11px" : "12px",
          fontWeight: 500,
          padding: compact ? "3px 8px" : "5px 12px",
          cursor: "pointer",
          transition: "all var(--dur-fast) var(--ease-out)",
          userSelect: "none",
        }}
        title={`Read aloud in ${effectiveLanguage.toUpperCase()} using on-premise local voice`}
      >
        <span style={{ fontSize: compact ? "11px" : "13px", lineHeight: 1 }}>
          {isPlaying ? "⏹" : isLoading ? "⏳" : "🔊"}
        </span>
        <span>{getButtonText()}</span>

        {isPlaying && (
          <span
            style={{
              display: "inline-block",
              width: 6,
              height: 6,
              borderRadius: "50%",
              backgroundColor: "var(--brass)",
              animation: "pulse 1s infinite",
            }}
          />
        )}
      </button>

      {errorMessage && (
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            color: "var(--coral)",
            maxWidth: 380,
            lineHeight: 1.3,
            background: "rgba(217, 105, 78, 0.08)",
            padding: "4px 8px",
            borderRadius: "var(--radius-sm)",
            border: "1px solid rgba(217, 105, 78, 0.2)",
          }}
        >
          <span>⚠ {errorMessage}</span>
        </div>
      )}
    </div>
  );
}
