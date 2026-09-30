import type { JSX, ReactNode } from "react";

import type { SearchResponse } from "../../api/contract";
import { Button } from "../../ui/Button";

function Message(props: { readonly title: string; readonly children: ReactNode }): JSX.Element {
  return (
    <section aria-live="polite" className="border-rule border-l-2 py-1 pl-4">
      <h2 className="font-display mb-2 text-2xl leading-tight font-semibold">{props.title}</h2>
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
      <p className="text-muted">{props.response.explanation}</p>
      <ul aria-label="Suggestions" className="mt-4 flex flex-wrap gap-2">
        {props.response.suggestions.map((suggestion) => (
          <li key={suggestion.query}>
            <Button
              variant="outline"
              size="small"
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
      <p className="text-muted">{message}</p>
    </Message>
  );
}

export function FailedSearch(props: {
  readonly message: string;
  readonly onRetry: () => void;
}): JSX.Element {
  return (
    <Message title="The search failed">
      <p className="text-muted mb-4">{props.message} Check the connection, then retry.</p>
      <Button variant="primary" onPress={props.onRetry}>
        Retry
      </Button>
    </Message>
  );
}
