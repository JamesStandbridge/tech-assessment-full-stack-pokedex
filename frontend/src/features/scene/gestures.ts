/** A primary drag turns the scene; a secondary, Shift or two-finger drag pans it. */
type DragMode = "turn" | "pan";

export type Gesture =
  | { readonly type: "hover"; readonly x: number; readonly y: number }
  | { readonly type: "leave" }
  | { readonly type: "click"; readonly x: number; readonly y: number }
  | { readonly type: "drag"; readonly dx: number; readonly dy: number; readonly mode: DragMode }
  /** A factor above one zooms out, below one zooms in, around the given point. */
  | { readonly type: "zoom"; readonly factor: number; readonly x: number; readonly y: number };

/** A pointer on the surface, in pixels from its top left corner. */
export interface Contact {
  readonly id: number;
  readonly x: number;
  readonly y: number;
  readonly panning: boolean;
}

interface At {
  readonly x: number;
  readonly y: number;
}

interface Press {
  readonly start: At;
  last: At;
  readonly panning: boolean;
  dragging: boolean;
}

/** Past this distance in pixels, a press becomes a drag. */
const DRAG_THRESHOLD = 4;
const WHEEL_SPEED = 0.0012;
const LINE_HEIGHT = 16;
const PAGE_HEIGHT = 800;
const WHEEL_UNITS: readonly number[] = [1, LINE_HEIGHT, PAGE_HEIGHT];

/** The zoom factor of a wheel turn, whatever unit the wheel reports. */
export function wheelFactor(deltaY: number, deltaMode: number): number {
  return Math.exp(deltaY * (WHEEL_UNITS[deltaMode] ?? 1) * WHEEL_SPEED);
}

function midpoint(first: At, second: At): At {
  return { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 };
}

function spread(first: At, second: At): number {
  return Math.max(1, Math.hypot(first.x - second.x, first.y - second.y));
}

/** Turns the contacts of pointers into hovers, clicks, drags and pinch zooms. */
export class GestureTracker {
  private readonly presses = new Map<number, Press>();

  constructor(private readonly emit: (gesture: Gesture) => void) {}

  down(contact: Contact): void {
    const at = { x: contact.x, y: contact.y };
    this.presses.set(contact.id, {
      start: at,
      last: at,
      panning: contact.panning,
      dragging: false,
    });
    if (this.presses.size > 1) {
      for (const press of this.presses.values()) press.dragging = true;
    }
  }

  move(contact: Contact): void {
    const press = this.presses.get(contact.id);
    if (press === undefined) {
      if (this.presses.size === 0) this.emit({ type: "hover", x: contact.x, y: contact.y });
      return;
    }
    if (this.presses.size > 1) {
      this.pinch(press, contact);
      return;
    }
    const { start, last } = press;
    press.dragging ||= Math.hypot(contact.x - start.x, contact.y - start.y) > DRAG_THRESHOLD;
    press.last = { x: contact.x, y: contact.y };
    if (!press.dragging) return;
    const mode = press.panning ? "pan" : "turn";
    this.emit({ type: "drag", dx: contact.x - last.x, dy: contact.y - last.y, mode });
  }

  up(contact: Contact): void {
    const press = this.presses.get(contact.id);
    this.presses.delete(contact.id);
    if (press !== undefined && !press.dragging && this.presses.size === 0) {
      this.emit({ type: "click", x: contact.x, y: contact.y });
    }
  }

  cancel(id: number): void {
    this.presses.delete(id);
  }

  /** Two pointers pan by their midpoint and zoom by their spread. */
  private pinch(press: Press, contact: Contact): void {
    const other = [...this.presses.values()].find((candidate) => candidate !== press);
    if (other === undefined) return;
    const before = {
      center: midpoint(press.last, other.last),
      spread: spread(press.last, other.last),
    };
    press.last = { x: contact.x, y: contact.y };
    const center = midpoint(press.last, other.last);
    const dx = center.x - before.center.x;
    const dy = center.y - before.center.y;
    this.emit({ type: "drag", dx, dy, mode: "pan" });
    const factor = before.spread / spread(press.last, other.last);
    this.emit({ type: "zoom", factor, x: center.x, y: center.y });
  }
}
