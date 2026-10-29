// Web Speech API Voice Agent Service for RVITM Mitra AI

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export class VoiceAgentService {
  private recognition: any = null;
  private isListeningState: boolean = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  constructor() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
    }
  }

  public isSpeechRecognitionSupported(): boolean {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  public isSpeechSynthesisSupported(): boolean {
    return 'speechSynthesis' in window;
  }

  public startListening(
    language: string,
    onTranscript: (transcript: string, isFinal: boolean) => void,
    onEnd: () => void,
    onError: (error: string) => void
  ): boolean {
    if (!this.recognition) {
      onError('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return false;
    }

    if (this.isListeningState) {
      this.stopListening();
    }

    // Map language to BCP-47 locale
    let locale = 'en-IN';
    if (language === 'kn' || language === 'kn-Latn') locale = 'kn-IN';
    else if (language === 'hi' || language === 'hi-Latn') locale = 'hi-IN';
    else locale = 'en-IN';

    this.recognition.lang = locale;
    this.isListeningState = true;

    this.recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      const text = finalTranscript || interimTranscript;
      onTranscript(text, !!finalTranscript);
    };

    this.recognition.onerror = (event: any) => {
      this.isListeningState = false;
      if (event.error !== 'no-speech') {
        onError(`Microphone error: ${event.error}`);
      }
      onEnd();
    };

    this.recognition.onend = () => {
      this.isListeningState = false;
      onEnd();
    };

    try {
      this.recognition.start();
      return true;
    } catch (err: any) {
      this.isListeningState = false;
      onError(err.message || 'Failed to start microphone');
      return false;
    }
  }

  public stopListening(): void {
    if (this.recognition && this.isListeningState) {
      try {
        this.recognition.stop();
      } catch (e) {
        // ignore
      }
      this.isListeningState = false;
    }
  }

  public speak(
    text: string,
    language: string = 'en',
    onStart?: () => void,
    onEnd?: () => void
  ): void {
    if (!this.isSpeechSynthesisSupported()) return;

    this.stopSpeaking();

    // Clean markdown syntax for fluent speech
    const cleanText = text
      .replace(/[#*_`~>\[\]\(\)]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    this.currentUtterance = utterance;

    // Set voice & locale
    let langCode = 'en-IN';
    if (language === 'kn') langCode = 'kn-IN';
    else if (language === 'hi') langCode = 'hi-IN';
    utterance.lang = langCode;
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    // Pick best matching system voice
    const voices = window.speechSynthesis.getVoices();
    const matchingVoice = voices.find(v => v.lang === langCode || v.lang.startsWith(langCode.slice(0, 2)));
    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }

    if (onStart) utterance.onstart = onStart;
    utterance.onend = () => {
      this.currentUtterance = null;
      if (onEnd) onEnd();
    };
    utterance.onerror = () => {
      this.currentUtterance = null;
      if (onEnd) onEnd();
    };

    window.speechSynthesis.speak(utterance);
  }

  public stopSpeaking(): void {
    if (this.isSpeechSynthesisSupported()) {
      window.speechSynthesis.cancel();
      this.currentUtterance = null;
    }
  }

  public isSpeaking(): boolean {
    return this.isSpeechSynthesisSupported() && window.speechSynthesis.speaking;
  }

  public getCurrentUtterance(): SpeechSynthesisUtterance | null {
    return this.currentUtterance;
  }
}

export const voiceAgent = new VoiceAgentService();
