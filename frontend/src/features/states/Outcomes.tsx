import type { JSX, ReactNode } from "react";

import type { SearchResponse } from "../../api/contract";
import { Button } from "../../ui/Button";

function Message(props: { readonly title: string; readonly children: ReactNode }): JSX.Element {
  return (
    <section aria-live="polite" className="border-ink max-w-2xl border-t pt-5">
      <p className="label text-rubric mb-2">Erratum</p>
      <h2 className="mb-3 text-3xl">{props.title}</h2>
      {props.children}
    </section>
  );
}

/** Nothing answers a valid query: say why, and offer queries that do (SYS-UI-023). */
export function EmptyOutcome(props: {
  readonly response: SearchResponse;
  readonly onRun: (query: string) => void;
}): JSX.Element {
  return (
    <Message title="No match in the Pokédex">
      <p className="text-ink-soft italic">{props.response.explanation}</p>
      <p className="label text-ink-soft mt-5 mb-1">Try instead</p>
      <ul aria-label="Suggestions" className="space-y-1">
        {props.response.suggestions.map((suggestion) => (
          <li key={suggestion.query}>
            <Button
              variant="link"
              onPress={() => {
                props.onRun(suggestion.query);
              }}
            >
              {suggestion.label}
            </Button>
          </li>
        ))}
      </ul>
    </Message>
  );
}

export function InvalidQuery({ message }: { readonly message: string }): JSX.Element {
  return (
    <Message title="This query cannot be searched">
      <p className="text-ink-soft italic">{message}</p>
    </Message>
  );
}

export function FailedSearch(props: {
  readonly message: string;
  readonly onRetry: () => void;
}): JSX.Element {
  return (
    <Message title="The search failed">
      <p className="text-ink-soft mb-4 italic">{props.message} Check the connection, then retry.</p>
      <Button variant="primary" onPress={props.onRetry}>
        Retry
      </Button>
    </Message>
  );
}
