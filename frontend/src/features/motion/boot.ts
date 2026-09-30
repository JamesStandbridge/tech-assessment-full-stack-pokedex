export const MOTION_STORAGE_KEY = "pokedex:motion";
export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/**
 * Inlined in the head of the page, so the first paint already follows the stored
 * or system motion. Its hash is part of the Content Security Policy. Still is
 * reduced, animated is full, and anything else follows the system, as resolveMotion does.
 */
export const MOTION_BOOT_SCRIPT = `(()=>{let s=null;try{s=localStorage.getItem(${JSON.stringify(MOTION_STORAGE_KEY)})}catch{}const reduced=matchMedia(${JSON.stringify(REDUCED_MOTION_QUERY)}).matches;document.documentElement.dataset.motion=s==="still"||(s!=="animated"&&reduced)?"reduced":"full"})()`;
