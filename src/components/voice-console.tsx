"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { Mic, MicOff, X } from "lucide-react";

// ---------------------------------------------------------------------------
// Minimal local type definitions for the Web Speech API
// (not fully covered by TypeScript's built-in DOM lib)
// ---------------------------------------------------------------------------

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionLike extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror: ((e: Event) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

// ---------------------------------------------------------------------------
// Feature detection helpers (all guarded for SSR)
// ---------------------------------------------------------------------------

function getSpeechRecognitionCtor():
  | (new () => SpeechRecognitionLike)
  | null {
  if (typeof window === "undefined") return null;
  const w = window as typeof window & {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

function hasGetUserMedia(): boolean {
  if (typeof navigator === "undefined") return false;
  return typeof navigator.mediaDevices?.getUserMedia === "function";
}

function speak(text: string): void {
  if (typeof window === "undefined") return;
  if (!("speechSynthesis" in window)) return;
  const utter = new window.SpeechSynthesisUtterance(text);
  utter.volume = 0.7;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utter);
}

// ---------------------------------------------------------------------------
// Canvas spectrum renderer
// ---------------------------------------------------------------------------

const CANVAS_SIZE = 280;
const CENTER = CANVAS_SIZE / 2;
const BASE_RADIUS = 60;
const MAX_BAR_LEN = 72;
const NUM_BARS = 64;

function drawSpectrum(
  ctx: CanvasRenderingContext2D,
  dataArray: Uint8Array,
  volume: number,
): void {
  ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  // Soft glow center — scales with volume
  const glowRadius = BASE_RADIUS * (0.85 + volume * 0.3);
  const glow = ctx.createRadialGradient(
    CENTER,
    CENTER,
    0,
    CENTER,
    CENTER,
    glowRadius,
  );
  glow.addColorStop(0, `rgba(34,211,238,${0.12 + volume * 0.2})`);
  glow.addColorStop(0.5, `rgba(129,140,248,${0.06 + volume * 0.1})`);
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.beginPath();
  ctx.arc(CENTER, CENTER, glowRadius, 0, Math.PI * 2);
  ctx.fillStyle = glow;
  ctx.fill();

  // Inner static circle
  ctx.beginPath();
  ctx.arc(CENTER, CENTER, BASE_RADIUS - 2, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(34,211,238,0.25)";
  ctx.lineWidth = 1;
  ctx.stroke();

  // Radial bars
  const step = Math.floor(dataArray.length / NUM_BARS);
  for (let i = 0; i < NUM_BARS; i++) {
    const raw = dataArray[i * step] ?? 0;
    const barLen = (raw / 255) * MAX_BAR_LEN;
    const angle = (i / NUM_BARS) * Math.PI * 2 - Math.PI / 2;

    const x1 = CENTER + Math.cos(angle) * BASE_RADIUS;
    const y1 = CENTER + Math.sin(angle) * BASE_RADIUS;
    const x2 = CENTER + Math.cos(angle) * (BASE_RADIUS + barLen);
    const y2 = CENTER + Math.sin(angle) * (BASE_RADIUS + barLen);

    // Gradient along each bar: cyan at root → violet at tip
    const grad = ctx.createLinearGradient(x1, y1, x2, y2);
    grad.addColorStop(0, `rgba(34,211,238,${0.7 + volume * 0.3})`);
    grad.addColorStop(1, `rgba(129,140,248,${0.4 + volume * 0.3})`);

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = grad;
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.stroke();
  }

  // Mic icon circle in centre (small dot)
  ctx.beginPath();
  ctx.arc(CENTER, CENTER, 6, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(34,211,238,${0.6 + volume * 0.4})`;
  ctx.fill();
}

// ---------------------------------------------------------------------------
// Supported command list (for "help" intent)
// ---------------------------------------------------------------------------

const HELP_COMMANDS = [
  '"new request" / "create" — new ticket',
  '"urgent" — filter urgent',
  '"open" — filter open',
  '"in progress" — filter in-progress',
  '"IT / HR / finance / facilities / logistics" — filter category',
  '"clear" / "reset" — clear filters',
  '"queue" / "dashboard" / "home" — go to dashboard',
  '"help" — show this list',
];

// ---------------------------------------------------------------------------
// Intent parser
// ---------------------------------------------------------------------------

type ParsedIntent =
  | { kind: "navigate"; path: string; confirmation: string }
  | { kind: "help" }
  | { kind: "unknown" };

function parseIntent(transcript: string): ParsedIntent {
  const t = transcript.toLowerCase();
  if (t.includes("new request") || t.includes("create"))
    return { kind: "navigate", path: "/dashboard/new", confirmation: "Opening new request" };
  if (t.includes("urgent"))
    return { kind: "navigate", path: "/dashboard?priority=URGENT", confirmation: "Showing urgent" };
  if (t.includes("in progress"))
    return { kind: "navigate", path: "/dashboard?status=IN_PROGRESS", confirmation: "Showing in-progress" };
  if (t.includes("open"))
    return { kind: "navigate", path: "/dashboard?status=OPEN", confirmation: "Showing open" };
  if (t.includes("it") && /\bit\b/.test(t))
    return { kind: "navigate", path: "/dashboard?category=IT", confirmation: "Filtering IT" };
  if (t.includes("hr") || t.includes("human resource"))
    return { kind: "navigate", path: "/dashboard?category=HR", confirmation: "Filtering HR" };
  if (t.includes("finance"))
    return { kind: "navigate", path: "/dashboard?category=Finance", confirmation: "Filtering Finance" };
  if (t.includes("facilit"))
    return { kind: "navigate", path: "/dashboard?category=Facilities", confirmation: "Filtering Facilities" };
  if (t.includes("logistic"))
    return { kind: "navigate", path: "/dashboard?category=Logistics", confirmation: "Filtering Logistics" };
  if (t.includes("clear") || t.includes("reset"))
    return { kind: "navigate", path: "/dashboard", confirmation: "Filters cleared" };
  if (t.includes("queue") || t.includes("dashboard") || t.includes("home"))
    return { kind: "navigate", path: "/dashboard", confirmation: "Going to dashboard" };
  if (t.includes("help"))
    return { kind: "help" };
  return { kind: "unknown" };
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function VoiceConsole() {
  const router = useRouter();

  // Panel open state
  const [panelOpen, setPanelOpen] = useState(false);

  // Feature detection (deferred to effect so SSR is safe)
  const [hasAudio, setHasAudio] = useState(false);
  const [hasSpeech, setHasSpeech] = useState(false);

  // Listening state
  const [listening, setListening] = useState(false);
  // Ref mirror so callbacks closed over at creation time can read current value
  const listeningRef = useRef(false);

  // Transcript lines
  const [interim, setInterim] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showHelp, setShowHelp] = useState(false);

  // Audio / recognition refs (never trigger re-renders)
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Feature detect on mount (client-only)
  useEffect(() => {
    setHasAudio(hasGetUserMedia());
    setHasSpeech(getSpeechRecognitionCtor() !== null);
  }, []);

  // -------------------------------------------------------------------------
  // Canvas animation loop
  // -------------------------------------------------------------------------

  const startCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const analyser = analyserRef.current;
    if (!canvas || !ctx || !analyser) return;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const loop = () => {
      analyser.getByteFrequencyData(dataArray);
      // Compute average volume 0..1
      const sum = dataArray.reduce((a, b) => a + b, 0);
      const vol = sum / (dataArray.length * 255);
      drawSpectrum(ctx, dataArray, vol);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
  }, []);

  const stopCanvas = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    // Clear canvas
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  }, []);

  // -------------------------------------------------------------------------
  // Idle canvas animation (slow pulse when not listening)
  // -------------------------------------------------------------------------

  useEffect(() => {
    if (!panelOpen || listening) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    // Idle: draw a static low-level ring
    const idle = new Uint8Array(128).fill(8);
    let frame: number;
    let t = 0;
    const loop = () => {
      t += 0.02;
      for (let i = 0; i < idle.length; i++) {
        idle[i] = Math.round(8 + 6 * Math.sin(t + i * 0.3));
      }
      drawSpectrum(ctx, idle, 0.05);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [panelOpen, listening]);

  // -------------------------------------------------------------------------
  // Start / Stop listening
  // -------------------------------------------------------------------------

  const stopListening = useCallback(() => {
    // Cancel RAF
    stopCanvas();

    // Stop recognition
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }

    // Tear down audio
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
      analyserRef.current = null;
    }

    listeningRef.current = false;
    setListening(false);
    setInterim("");
  }, [stopCanvas]);

  const startListening = useCallback(async () => {
    if (!hasAudio || !hasSpeech) return;
    setConfirmation("");
    setShowHelp(false);
    setInterim("");

    // --- Audio setup ---
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setConfirmation("Mic access denied — please allow microphone.");
      return;
    }
    streamRef.current = stream;

    const audioCtx = new AudioContext();
    audioCtxRef.current = audioCtx;
    const source = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    analyserRef.current = analyser;

    startCanvas();

    // --- Speech recognition ---
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) return;

    const rec = new Ctor();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";
    recognitionRef.current = rec;

    rec.onresult = (e: SpeechRecognitionEvent) => {
      let interimText = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const result = e.results[i];
        if (!result) continue;
        const alt = result[0];
        if (!alt) continue;
        if (result.isFinal) {
          const intent = parseIntent(alt.transcript);
          if (intent.kind === "navigate") {
            setConfirmation(intent.confirmation);
            speak(intent.confirmation);
            router.push(intent.path);
          } else if (intent.kind === "help") {
            setShowHelp(true);
            setConfirmation("Here are the available commands:");
            speak("Here are the available commands");
          } else {
            setConfirmation("Command not recognized — say 'help' for a list.");
            speak("Command not recognized");
          }
          setInterim("");
        } else {
          interimText += alt.transcript;
        }
      }
      setInterim(interimText);
    };

    rec.onerror = () => {
      setConfirmation("Recognition error — try again.");
      stopListening();
    };

    rec.onend = () => {
      // Use ref so this callback reads current value, not stale closure
      if (recognitionRef.current === rec && listeningRef.current) {
        try { rec.start(); } catch { /* already started */ }
      }
    };

    try {
      rec.start();
    } catch {
      setConfirmation("Could not start recognition.");
      stopListening();
      return;
    }

    listeningRef.current = true;
    setListening(true);
  }, [hasAudio, hasSpeech, router, startCanvas, stopListening]);

  // -------------------------------------------------------------------------
  // Cleanup on unmount
  // -------------------------------------------------------------------------

  useEffect(() => {
    return () => {
      stopListening();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Stop listening when panel closes
  const closePanel = useCallback(() => {
    if (listening) stopListening();
    setPanelOpen(false);
    setConfirmation("");
    setInterim("");
    setShowHelp(false);
  }, [listening, stopListening]);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  const unavailable = !hasAudio || !hasSpeech;

  return (
    <>
      {/* Floating mic button */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
        {/* Panel */}
        {panelOpen && (
          <div
            className="w-[320px] rounded-2xl border border-white/10 bg-[#0c0e13] shadow-[0_0_40px_rgba(0,0,0,0.7),0_0_24px_rgba(34,211,238,0.1)] overflow-hidden"
            role="dialog"
            aria-label="Voice command console"
          >
            {/* Panel header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <span className="font-mono text-xs text-slate-400 tracking-widest uppercase">
                Voice Console
              </span>
              <button
                onClick={closePanel}
                className="text-slate-500 hover:text-slate-300 transition-colors rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22d3ee]"
                aria-label="Close voice console"
              >
                <X size={14} />
              </button>
            </div>

            {unavailable ? (
              /* Unavailable state */
              <div className="px-4 py-6">
                <p className="font-mono text-sm text-slate-500 leading-relaxed">
                  Voice mode needs a Chromium-based browser with microphone
                  access (Chrome, Edge, Arc). Safari and Firefox are not
                  supported.
                </p>
              </div>
            ) : (
              <>
                {/* Canvas spectrum */}
                <div className="flex items-center justify-center py-4 bg-[#080a0f]">
                  <canvas
                    ref={canvasRef}
                    width={CANVAS_SIZE}
                    height={CANVAS_SIZE}
                    className="block"
                    aria-hidden="true"
                  />
                </div>

                {/* Interim transcript */}
                <div className="min-h-[36px] px-4 py-2 border-t border-white/10">
                  {interim ? (
                    <p className="font-mono text-sm text-[#22d3ee] truncate">
                      <span className="text-slate-500 mr-1">›</span>
                      {interim}
                    </p>
                  ) : (
                    <p className="font-mono text-sm text-slate-600">
                      {listening ? "Listening…" : "Press Start to speak"}
                    </p>
                  )}
                </div>

                {/* Confirmation / result */}
                {confirmation && (
                  <div className="px-4 pb-2">
                    <p className="font-mono text-xs text-[#818cf8]">
                      {confirmation}
                    </p>
                  </div>
                )}

                {/* Help command list */}
                {showHelp && (
                  <ul className="mx-4 mb-3 rounded-xl border border-white/10 bg-white/[0.03] divide-y divide-white/5">
                    {HELP_COMMANDS.map((cmd) => (
                      <li
                        key={cmd}
                        className="px-3 py-1.5 font-mono text-[11px] text-slate-400"
                      >
                        {cmd}
                      </li>
                    ))}
                  </ul>
                )}

                {/* Start / Stop button */}
                <div className="px-4 pb-4">
                  <button
                    onClick={listening ? stopListening : startListening}
                    className={`w-full rounded-xl py-2.5 font-mono text-sm font-medium transition-all duration-200 border focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22d3ee] ${
                      listening
                        ? "border-[#22d3ee]/30 bg-[#22d3ee]/10 text-[#22d3ee] hover:bg-[#22d3ee]/15 shadow-[0_0_16px_rgba(34,211,238,0.15)]"
                        : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                    }`}
                  >
                    {listening ? (
                      <span className="flex items-center justify-center gap-2">
                        <MicOff size={14} />
                        Stop listening
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <Mic size={14} />
                        Start listening
                      </span>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Trigger button */}
        <button
          onClick={() => (panelOpen ? closePanel() : setPanelOpen(true))}
          aria-label={panelOpen ? "Close voice console" : "Open voice console"}
          className={`flex items-center justify-center w-14 h-14 rounded-full border transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22d3ee] ${
            panelOpen || listening
              ? "border-[#22d3ee]/50 bg-[#0c0e13] text-[#22d3ee] shadow-[0_0_24px_rgba(34,211,238,0.28)]"
              : "border-white/10 bg-[#0c0e13] text-slate-400 hover:text-[#22d3ee] hover:border-[#22d3ee]/30 hover:shadow-[0_0_16px_rgba(34,211,238,0.15)]"
          }`}
        >
          {listening ? <Mic size={22} className="animate-pulse" /> : <Mic size={22} />}
        </button>
      </div>
    </>
  );
}
