import { type JSX, type RefObject, useEffect, useEffectEvent, useRef } from "react";

import type { Species } from "../../api/contract";
import { assertNever } from "../../domain/assertNever";
import type { SceneFrame } from "../../domain/scene";
import { typeHex } from "./palette";
import type { FromWorker, Inset, Mark, StarSeed, ToWorker, Viewport } from "./protocol";
import { MIN_FPS } from "./support";
import { usePointer } from "./usePointer";

interface SceneEvents {
  readonly onLabels: (positions: Float32Array) => void;
  readonly onHover: (id: string | null) => void;
  readonly onPick: (id: string) => void;
  /** The scene cannot run smoothly: too slow, lost, or failed to start. */
  readonly onFallback: () => void;
}

interface ConstellationCanvasProps extends SceneEvents {
  readonly species: readonly Species[];
  readonly frame: SceneFrame;
  readonly marks: readonly Mark[];
  readonly highlighted: readonly string[];
  readonly inset: Inset;
}

function send(worker: Worker, message: ToWorker, transfer: Transferable[] = []): void {
  worker.postMessage(message, transfer);
}

function viewportOf(element: HTMLElement): Viewport {
  return {
    width: Math.max(1, element.clientWidth),
    height: Math.max(1, element.clientHeight),
    pixelRatio: window.devicePixelRatio,
  };
}

function seedsOf(species: readonly Species[]): readonly StarSeed[] {
  return species.map((one) => ({
    name: one.name,
    sprite: one.sprite_url,
    color: typeHex(one.types[0] ?? "normal"),
  }));
}

function dispatch(message: FromWorker, events: SceneEvents): void {
  switch (message.type) {
    case "ready":
      return;
    case "labels":
      events.onLabels(message.positions);
      return;
    case "hover":
      events.onHover(message.id);
      return;
    case "pick":
      events.onPick(message.id);
      return;
    case "fps":
      if (message.value < MIN_FPS) events.onFallback();
      return;
    case "lost":
    case "failed":
      events.onFallback();
      return;
    default:
      assertNever(message);
  }
}

/** Hand the canvas to the worker, then keep the worker told of its size. */
function startScene(
  parts: {
    readonly element: HTMLElement;
    readonly canvas: HTMLCanvasElement;
    readonly worker: Worker;
  },
  species: readonly StarSeed[],
): ResizeObserver {
  const { element, canvas, worker } = parts;
  const offscreen = canvas.transferControlToOffscreen();
  const viewport = viewportOf(element);
  send(worker, { type: "start", canvas: offscreen, viewport, species }, [offscreen]);
  const observer = new ResizeObserver(() => {
    send(worker, { type: "resize", viewport: viewportOf(element) });
  });
  observer.observe(element);
  return observer;
}

function useWorker(
  hostRef: RefObject<HTMLDivElement | null>,
  species: readonly Species[],
  events: SceneEvents,
): RefObject<Worker | null> {
  const workerRef = useRef<Worker | null>(null);
  const receive = useEffectEvent((event: MessageEvent<FromWorker>) => {
    dispatch(event.data, events);
  });
  const fail = useEffectEvent(() => {
    events.onFallback();
  });
  const seeds = useEffectEvent(() => seedsOf(species));
  useEffect(() => {
    const element = hostRef.current;
    if (element === null) return;
    const canvas = document.createElement("canvas");
    canvas.className = "absolute inset-0 h-full w-full";
    element.append(canvas);
    const worker = new Worker(new URL("./worker.ts", import.meta.url), { type: "module" });
    worker.addEventListener("message", receive);
    worker.addEventListener("error", fail);
    const observer = startScene({ element, canvas, worker }, seeds());
    workerRef.current = worker;
    return () => {
      observer.disconnect();
      worker.removeEventListener("message", receive);
      worker.removeEventListener("error", fail);
      worker.terminate();
      canvas.remove();
      workerRef.current = null;
    };
  }, [hostRef]);
  return workerRef;
}

/** The constellation drawn by the GPU in a worker; decorative, since the page names everything it shows. */
export function ConstellationCanvas(props: ConstellationCanvasProps): JSX.Element {
  const { species, frame, marks, highlighted, inset, ...events } = props;
  const hostRef = useRef<HTMLDivElement>(null);
  const workerRef = useWorker(hostRef, species, events);
  usePointer(hostRef, workerRef);
  useEffect(() => {
    if (workerRef.current !== null) send(workerRef.current, { type: "inset", inset });
  }, [workerRef, inset]);
  useEffect(() => {
    if (workerRef.current !== null) send(workerRef.current, { type: "stage", frame, marks });
  }, [workerRef, frame, marks]);
  useEffect(() => {
    if (workerRef.current !== null) {
      send(workerRef.current, { type: "highlight", ids: highlighted });
    }
  }, [workerRef, highlighted]);
  return <div ref={hostRef} aria-hidden="true" className="absolute inset-0 touch-none" />;
}
