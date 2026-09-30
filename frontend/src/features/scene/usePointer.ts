import { type RefObject, useEffect } from "react";

import type { ToWorker } from "./protocol";

/** Past this distance in pixels, a press becomes a drag that turns the sky. */
const DRAG_THRESHOLD = 4;

interface Press {
  readonly x: number;
  readonly y: number;
  lastX: number;
  lastY: number;
  dragging: boolean;
}

type Send = (message: ToWorker) => void;

interface PressHandlers {
  readonly down: (event: PointerEvent) => void;
  readonly move: (event: PointerEvent) => void;
  readonly up: (event: PointerEvent) => void;
}

function pressHandlers(element: HTMLElement, send: Send): PressHandlers {
  let press: Press | null = null;
  const local = (event: PointerEvent): { x: number; y: number } => {
    const box = element.getBoundingClientRect();
    return { x: event.clientX - box.left, y: event.clientY - box.top };
  };
  return {
    down: (event) => {
      const at = local(event);
      press = { ...at, lastX: at.x, lastY: at.y, dragging: false };
      element.setPointerCapture(event.pointerId);
    },
    move: (event) => {
      const at = local(event);
      if (press === null) {
        send({ type: "hover", ...at });
        return;
      }
      press.dragging ||= Math.hypot(at.x - press.x, at.y - press.y) > DRAG_THRESHOLD;
      if (press.dragging) send({ type: "drag", dx: at.x - press.lastX, dy: at.y - press.lastY });
      press.lastX = at.x;
      press.lastY = at.y;
    },
    up: (event) => {
      if (press !== null && !press.dragging) send({ type: "click", ...local(event) });
      press = null;
    },
  };
}

/** Forward the pointer to the engine: hover and click pick a star, drag turns, wheel zooms. */
export function usePointer(
  hostRef: RefObject<HTMLDivElement | null>,
  workerRef: RefObject<Worker | null>,
): void {
  useEffect(() => {
    const element = hostRef.current;
    if (element === null) return;
    const send: Send = (message) => {
      workerRef.current?.postMessage(message);
    };
    const { down, move, up } = pressHandlers(element, send);
    const leave = (): void => {
      send({ type: "leave" });
    };
    const wheel = (event: WheelEvent): void => {
      event.preventDefault();
      send({ type: "zoom", delta: event.deltaY });
    };
    element.addEventListener("pointerdown", down);
    element.addEventListener("pointermove", move);
    element.addEventListener("pointerup", up);
    element.addEventListener("pointerleave", leave);
    element.addEventListener("wheel", wheel, { passive: false });
    return () => {
      element.removeEventListener("pointerdown", down);
      element.removeEventListener("pointermove", move);
      element.removeEventListener("pointerup", up);
      element.removeEventListener("pointerleave", leave);
      element.removeEventListener("wheel", wheel);
    };
  }, [hostRef, workerRef]);
}
