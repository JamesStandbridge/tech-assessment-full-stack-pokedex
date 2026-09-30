import { type RefObject, useEffect, useEffectEvent } from "react";

import { type Contact, type Gesture, GestureTracker, wheelFactor } from "./gestures";

const PRIMARY = 0;

function contactOf(element: HTMLElement, event: PointerEvent): Contact {
  const box = element.getBoundingClientRect();
  return {
    id: event.pointerId,
    x: event.clientX - box.left,
    y: event.clientY - box.top,
    panning: event.button !== PRIMARY || event.shiftKey,
  };
}

interface Handlers {
  readonly down: (event: PointerEvent) => void;
  readonly move: (event: PointerEvent) => void;
  readonly up: (event: PointerEvent) => void;
  readonly cancel: (event: PointerEvent) => void;
  readonly leave: () => void;
  readonly menu: (event: MouseEvent) => void;
  readonly wheel: (event: WheelEvent) => void;
}

function handlers(element: HTMLElement, emit: (gesture: Gesture) => void): Handlers {
  const tracker = new GestureTracker(emit);
  return {
    down: (event) => {
      element.setPointerCapture(event.pointerId);
      tracker.down(contactOf(element, event));
    },
    move: (event) => {
      tracker.move(contactOf(element, event));
    },
    up: (event) => {
      tracker.up(contactOf(element, event));
    },
    cancel: (event) => {
      tracker.cancel(event.pointerId);
    },
    leave: () => {
      emit({ type: "leave" });
    },
    menu: (event) => {
      event.preventDefault();
    },
    wheel: (event) => {
      event.preventDefault();
      const box = element.getBoundingClientRect();
      const factor = wheelFactor(event.deltaY, event.deltaMode);
      emit({ type: "zoom", factor, x: event.clientX - box.left, y: event.clientY - box.top });
    },
  };
}

function listen(element: HTMLElement, emit: (gesture: Gesture) => void): () => void {
  const on = handlers(element, emit);
  element.addEventListener("pointerdown", on.down);
  element.addEventListener("pointermove", on.move);
  element.addEventListener("pointerup", on.up);
  element.addEventListener("pointercancel", on.cancel);
  element.addEventListener("pointerleave", on.leave);
  element.addEventListener("contextmenu", on.menu);
  element.addEventListener("wheel", on.wheel, { passive: false });
  return () => {
    element.removeEventListener("pointerdown", on.down);
    element.removeEventListener("pointermove", on.move);
    element.removeEventListener("pointerup", on.up);
    element.removeEventListener("pointercancel", on.cancel);
    element.removeEventListener("pointerleave", on.leave);
    element.removeEventListener("contextmenu", on.menu);
    element.removeEventListener("wheel", on.wheel);
  };
}

/** Turn the pointer and the wheel over an element into gestures. */
export function useGestures(
  hostRef: RefObject<HTMLElement | null>,
  onGesture: (gesture: Gesture) => void,
): void {
  const emit = useEffectEvent(onGesture);
  useEffect(() => {
    const element = hostRef.current;
    if (element === null) return;
    return listen(element, emit);
  }, [hostRef]);
}

/** The cursor over a surface: a hand that grabs, or a pointer over a star. */
export function cursorOf(hovering: boolean): string {
  return hovering ? "cursor-pointer" : "cursor-grab active:cursor-grabbing";
}
