// Accurate voice search: record a few seconds, then let the server transcribe it
// with OpenAI (much better at phrases and rare words than phone speech
// recognition). Recording stops by itself after a short pause, or with stop().

let availability: Promise<boolean> | null = null;

/** True when this browser can record and the server can transcribe */
export function isAccurateVoiceAvailable(): Promise<boolean> {
  if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
    return Promise.resolve(false);
  }
  availability ??= fetch('/api/transcribe/status')
    .then((r) => r.json())
    .then((d) => !!d.available)
    .catch(() => false);
  return availability;
}

export interface Recording {
  /** Stop now and transcribe what was said */
  stop: () => void;
  /** Stop and throw the recording away */
  cancel: () => void;
  /** The transcribed text ('' if nothing was heard) */
  result: Promise<string>;
}

const pickMimeType = () =>
  ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'].find(
    (t) => typeof MediaRecorder.isTypeSupported === 'function' && MediaRecorder.isTypeSupported(t)
  ) || '';

export class VoiceError extends Error {
  constructor(public kind: 'blocked' | 'no-mic' | 'silence' | 'server', message: string) {
    super(message);
  }
}

export async function startRecording(callbacks: { onSpeech?: () => void; onTranscribing?: () => void } = {}): Promise<Recording> {
  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
  } catch (err: any) {
    if (err?.name === 'NotAllowedError' || err?.name === 'SecurityError') {
      throw new VoiceError('blocked', 'Microphone access is blocked. Allow it in your browser settings, then try again.');
    }
    throw new VoiceError('no-mic', 'No microphone was found. Check one is connected, or type the word instead.');
  }

  const mimeType = pickMimeType();
  const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);

  let cancelled = false;
  let heardSpeech = false;
  const startedAt = Date.now();

  // Stop after a short pause once speech has started (and after 15s at most)
  let audioCtx: AudioContext | null = null;
  let timer: ReturnType<typeof setInterval> | null = null;
  try {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    audioCtx = new Ctx();
    await audioCtx.resume().catch(() => {});
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 1024;
    audioCtx.createMediaStreamSource(stream).connect(analyser);
    const buf = new Float32Array(analyser.fftSize);
    let loudFrames = 0;
    let quietSince = 0;
    timer = setInterval(() => {
      analyser.getFloatTimeDomainData(buf);
      let sum = 0;
      for (const v of buf) sum += v * v;
      const rms = Math.sqrt(sum / buf.length);
      const now = Date.now();
      if (rms > 0.035) {
        loudFrames++;
        quietSince = 0;
        if (loudFrames >= 2 && !heardSpeech) {
          heardSpeech = true;
          callbacks.onSpeech?.();
        }
      } else if (rms < 0.018) {
        quietSince ||= now;
        if (heardSpeech && now - quietSince > 1300) stopRecorder();
      }
      if (!heardSpeech && now - startedAt > 8000) stopRecorder(); // nothing said
      if (now - startedAt > 15000) stopRecorder();
    }, 100);
  } catch {
    // No level meter (rare): the user taps Done, or it stops after 15s
    setTimeout(() => stopRecorder(), 15000);
    heardSpeech = true;
  }

  const cleanup = () => {
    if (timer) clearInterval(timer);
    stream.getTracks().forEach((t) => t.stop());
    audioCtx?.close().catch(() => {});
  };

  const stopped = new Promise<void>((resolve) => (recorder.onstop = () => resolve()));
  function stopRecorder() {
    if (recorder.state !== 'inactive') recorder.stop();
  }

  const result = (async () => {
    await stopped;
    cleanup();
    if (cancelled) return '';
    if (!heardSpeech) throw new VoiceError('silence', "We didn't hear anything. Tap the mic and speak a little closer.");
    callbacks.onTranscribing?.();
    const blob = new Blob(chunks, { type: recorder.mimeType || mimeType || 'audio/webm' });
    const audio = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
    const res = await fetch('/api/transcribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ audio, mimeType: blob.type })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new VoiceError('server', data.error || 'Voice search is unavailable right now. Type the word instead.');
    return String(data.text || '').trim();
  })();

  recorder.start(250);
  return {
    stop: stopRecorder,
    cancel: () => {
      cancelled = true;
      stopRecorder();
    },
    result
  };
}
