"use client";

type PlaybackListener = (activeTextId: string | null) => void;

class ReadAloudCoordinator {
  private activeTextId: string | null = null;
  private currentAudio: HTMLAudioElement | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private listeners: Set<PlaybackListener> = new Set();

  public subscribe(listener: PlaybackListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    for (const listener of this.listeners) {
      try {
        listener(this.activeTextId);
      } catch (err) {
        console.error("Error in read-aloud listener", err);
      }
    }
  }

  public getActiveTextId(): string | null {
    return this.activeTextId;
  }

  public stopAll() {
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      } catch {
        // ignore
      }
      this.currentAudio = null;
    }

    if (typeof window !== "undefined" && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
      this.currentUtterance = null;
    }

    if (this.activeTextId !== null) {
      this.activeTextId = null;
      this.notify();
    }
  }

  public setActiveAudio(textId: string, audio: HTMLAudioElement) {
    this.stopAll();
    this.activeTextId = textId;
    this.currentAudio = audio;
    this.notify();

    audio.onended = () => {
      if (this.activeTextId === textId) {
        this.activeTextId = null;
        this.currentAudio = null;
        this.notify();
      }
    };

    audio.onerror = () => {
      if (this.activeTextId === textId) {
        this.activeTextId = null;
        this.currentAudio = null;
        this.notify();
      }
    };
  }

  public setActiveSpeechSynthesis(textId: string, utterance: SpeechSynthesisUtterance) {
    this.stopAll();
    this.activeTextId = textId;
    this.currentUtterance = utterance;
    this.notify();

    utterance.onend = () => {
      if (this.activeTextId === textId) {
        this.activeTextId = null;
        this.currentUtterance = null;
        this.notify();
      }
    };

    utterance.onerror = () => {
      if (this.activeTextId === textId) {
        this.activeTextId = null;
        this.currentUtterance = null;
        this.notify();
      }
    };
  }
}

export const readAloudCoordinator = new ReadAloudCoordinator();
