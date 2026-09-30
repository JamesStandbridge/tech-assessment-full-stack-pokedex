import { type RefObject, useEffect, useState } from "react";

const HOLDING = ["pointerenter", "focusin"] as const;
const RELEASING = ["pointerleave", "focusout"] as const;

/** Whether an element has the pointer or the focus, so what it shows must not go away. */
export function useHeld(elementRef: RefObject<HTMLElement | null>): boolean {
  const [held, setHeld] = useState(false);
  useEffect(() => {
    const element = elementRef.current;
    if (element === null) return;
    const hold = (): void => {
      setHeld(true);
    };
    const release = (): void => {
      setHeld(false);
    };
    for (const type of HOLDING) element.addEventListener(type, hold);
    for (const type of RELEASING) element.addEventListener(type, release);
    return () => {
      for (const type of HOLDING) element.removeEventListener(type, hold);
      for (const type of RELEASING) element.removeEventListener(type, release);
    };
  }, [elementRef]);
  return held;
}
