import { useEffect, useSyncExternalStore } from "react";

import {
  parseMotionPreference,
  resolveMotion,
  type Motion,
  type MotionPreference,
} from "../../domain/motion";
import { MOTION_STORAGE_KEY, REDUCED_MOTION_QUERY } from "./boot";

interface MotionSnapshot {
  readonly preference: MotionPreference;
  readonly revision: number;
  /** Reduced motion was seen while the preference stayed on the system, so the scene does not start later. */
  readonly systemHeld: boolean;
}

const listeners = new Set<() => void>();

/** Local storage may be refused, as in private windows; the choice then lasts for the page only. */
let unstored: MotionPreference = "system";
let revision = 0;
let held = false;
let snapshot: MotionSnapshot = { preference: "system", revision: 0, systemHeld: false };

function subscribe(listener: () => void): () => void {
  const media = window.matchMedia(REDUCED_MOTION_QUERY);
  const onStorage = (event: StorageEvent): void => {
    if (event.key === MOTION_STORAGE_KEY || event.key === null) listener();
  };
  const onMedia = (): void => {
    remember(readStored());
    listener();
  };
  media.addEventListener("change", onMedia);
  window.addEventListener("storage", onStorage);
  listeners.add(listener);
  return () => {
    media.removeEventListener("change", onMedia);
    window.removeEventListener("storage", onStorage);
    listeners.delete(listener);
  };
}

function readStored(): MotionPreference {
  try {
    return parseMotionPreference(window.localStorage.getItem(MOTION_STORAGE_KEY));
  } catch (error) {
    if (error instanceof DOMException) return unstored;
    throw error;
  }
}

function systemReduced(): boolean {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

function heldFor(preference: MotionPreference, reduced: boolean): boolean {
  if (preference !== "system") return false;
  const carried = snapshot.preference === preference ? held : false;
  return reduced || carried;
}

function remember(preference: MotionPreference): void {
  const systemHeld = heldFor(preference, systemReduced());
  held = systemHeld;
  if (
    snapshot.preference === preference &&
    snapshot.revision === revision &&
    snapshot.systemHeld === systemHeld
  ) {
    return;
  }
  snapshot = { preference, revision, systemHeld };
}

function getSnapshot(): MotionSnapshot {
  remember(readStored());
  return snapshot;
}

function notify(): void {
  for (const listener of listeners) listener();
}

function storePreference(preference: MotionPreference): void {
  revision += 1;
  try {
    window.localStorage.setItem(MOTION_STORAGE_KEY, preference);
  } catch (error) {
    if (!(error instanceof DOMException)) throw error;
    unstored = preference;
  }
  remember(preference);
  notify();
}

export interface MotionControl {
  readonly preference: MotionPreference;
  readonly revision: number;
  readonly systemReduced: boolean;
  readonly systemHeld: boolean;
  /** The motion drawn: the preference, or the system's while the preference is "system". */
  readonly motion: Motion;
  readonly choose: (preference: MotionPreference) => void;
}

/** The motion preference, following the system live while it is "system". */
export function useMotion(): MotionControl {
  const stored = useSyncExternalStore(subscribe, getSnapshot);
  const reduced = useSyncExternalStore(subscribe, systemReduced);
  return {
    preference: stored.preference,
    revision: stored.revision,
    systemReduced: reduced,
    systemHeld: stored.systemHeld,
    motion: resolveMotion({ preference: stored.preference, systemReduced: reduced }),
    choose: storePreference,
  };
}

/** Keep the root element on the resolved motion, which the motion variants follow. */
export function useDocumentMotion(): void {
  const { motion } = useMotion();
  useEffect(() => {
    document.documentElement.dataset["motion"] = motion;
  }, [motion]);
}

/** Tests empty storage without a storage event; drop the module cache with the page. */
export function resetMotionStore(): void {
  unstored = "system";
  revision = 0;
  held = false;
  snapshot = { preference: "system", revision: 0, systemHeld: false };
}
