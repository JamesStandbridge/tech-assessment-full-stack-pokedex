export const THEME_STORAGE_KEY = "pokedex:theme";
export const LIGHT_QUERY = "(prefers-color-scheme: light)";

/**
 * Inlined in the head of the page, so the first paint already has the stored or
 * system theme. Its hash is part of the Content Security Policy.
 */
export const THEME_BOOT_SCRIPT = `(()=>{let s=null;try{s=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)})}catch{}document.documentElement.dataset.theme=s==="light"||s==="dark"?s:matchMedia(${JSON.stringify(LIGHT_QUERY)}).matches?"light":"dark"})()`;
