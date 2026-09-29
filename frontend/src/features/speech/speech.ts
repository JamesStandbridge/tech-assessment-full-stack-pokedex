/**
 * The Web Speech API, reached through feature detection: recognition is still
 * prefixed in some browsers and absent from the TypeScript DOM library.
 */
interface RecognitionEvent {
  readonly results: ArrayLike<ArrayLike<{ readonly transcript: string }>>;
}

interface Recognition {
  lang: string;
  interimResults: boolean;
  onresult: ((event: RecognitionEvent) => void) | null;
  start: () => void;
}

type RecognitionConstructor = new () => Recognition;

function isRecognitionConstructor(value: unknown): value is RecognitionConstructor {
  return typeof value === "function";
}

function recognitionConstructor(): RecognitionConstructor | null {
  const candidate: unknown =
    Reflect.get(window, "SpeechRecognition") ?? Reflect.get(window, "webkitSpeechRecognition");
  return isRecognitionConstructor(candidate) ? candidate : null;
}

export function canListen(): boolean {
  return recognitionConstructor() !== null;
}

/** Listen once and hand over the transcript; starts only on a user action. */
export function listen(onTranscript: (transcript: string) => void): void {
  const Constructor = recognitionConstructor();
  if (Constructor === null) return;
  const recognition = new Constructor();
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.onresult = (event) => {
    const transcript = event.results[0]?.[0]?.transcript.trim() ?? "";
    if (transcript !== "") onTranscript(transcript);
  };
  recognition.start();
}

export function canSpeak(): boolean {
  return "speechSynthesis" in window;
}

/** Read a text aloud; called only from a user action (SYS-A11Y-004). */
export function speak(text: string): void {
  if (!canSpeak()) return;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
}
