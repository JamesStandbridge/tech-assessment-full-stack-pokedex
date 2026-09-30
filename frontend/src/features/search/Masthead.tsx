import type { JSX, ReactNode } from "react";

/** The title page of the atlas: the wordmark, its subtitle, and the page tools. */
export function Masthead({ tools }: { readonly tools?: ReactNode }): JSX.Element {
  return (
    <header className="border-ink border-b-[3px] border-double pb-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label text-ink-soft">Being an atlas of the 151 species of Kanto</p>
          <h1 className="mt-1 text-5xl leading-none sm:text-6xl">
            Pokédex <span className="text-rubric italic">Search</span>
          </h1>
        </div>
        <div className="flex items-center gap-2">{tools}</div>
      </div>
    </header>
  );
}
