export const THEME_STORAGE_KEY = "pokedex:theme";
export const LIGHT_QUERY = "(prefers-color-scheme: light)";
export const DARK_QUERY = "(prefers-color-scheme: dark)";

/** The ink of each theme in ui/tokens.css and ui/light.css: the page, the sky and the browser bar. */
export const THEME_INKS = { light: "#f3eee3", dark: "#0b0f1a" } as const;

export const THEME_COLOR_SELECTOR = 'meta[name="theme-color"]';

/**
 * Inlined in the head of the page, so the first paint already has the stored or
 * system theme, and so has the browser bar once the user chose one. Its hash is
 * part of the Content Security Policy.
 */
export const THEME_BOOT_SCRIPT = `(()=>{let s=null;try{s=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)})}catch{}const t=s==="light"||s==="dark"?s:matchMedia(${JSON.stringify(LIGHT_QUERY)}).matches?"light":"dark";document.documentElement.dataset.theme=t;if(s===t)for(const m of document.querySelectorAll(${JSON.stringify(THEME_COLOR_SELECTOR)}))m.content=${JSON.stringify(THEME_INKS)}[t]})()`;
