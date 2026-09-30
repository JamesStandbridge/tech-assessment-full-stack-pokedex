import type { JSX } from "react";

import type { Species } from "../../api/contract";
import { type BenchCell, type BenchRow, benchRows, signed } from "../../domain/bench";
import { displayName } from "../../domain/entities";
import { Button } from "../../ui/Button";
import { RemoteImage } from "../../ui/RemoteImage";
import { useContenders } from "./data";
import { useWorkbench } from "./WorkbenchContext";

function LeaderStar(): JSX.Element {
  return (
    <svg aria-hidden="true" viewBox="0 0 10 10" className="text-accent mr-1 inline size-2.5">
      <path d="M5 0Q5 5 10 5Q5 5 5 10Q5 5 0 5Q5 5 5 0Z" fill="currentColor" />
    </svg>
  );
}

function Cell({ cell }: { readonly cell: BenchCell }): JSX.Element {
  return (
    <td
      data-contender={cell.name}
      data-leader={cell.leader}
      className={`px-1.5 py-1.5 text-right font-mono text-xs tabular-nums ${cell.leader ? "text-text" : "text-muted"}`}
    >
      {cell.leader ? <LeaderStar /> : null}
      {cell.value}
      {cell.difference === null ? null : (
        <span className="text-muted block text-[0.65rem]">({signed(cell.difference)})</span>
      )}
      {cell.leader ? <span className="sr-only">, leader</span> : null}
    </td>
  );
}

function Contender(props: {
  readonly contender: Species;
  readonly reference: boolean;
}): JSX.Element {
  const workbench = useWorkbench();
  const name = displayName(props.contender.name);
  return (
    <th scope="col" data-contender={props.contender.name} className="px-1 pb-2 align-bottom">
      <div className="flex flex-col items-center gap-1">
        <div className="specimen p-0.5">
          <RemoteImage src={props.contender.sprite_url} alt="" size={36} />
        </div>
        <span className="font-display text-base leading-none font-semibold">{name}</span>
        <div className="flex">
          <Button
            variant={props.reference ? "primary" : "quiet"}
            size="small"
            aria-label={`Pin ${name} as the reference`}
            aria-pressed={props.reference}
            onPress={() => {
              workbench.pin(props.reference ? null : props.contender.name);
            }}
          >
            {props.reference ? "Reference" : "Pin"}
          </Button>
          <Button
            variant="quiet"
            size="small"
            aria-label={`Stop comparing ${name}`}
            onPress={() => {
              workbench.uncompare(props.contender.name);
            }}
          >
            <span aria-hidden="true">&times;</span>
          </Button>
        </div>
      </div>
    </th>
  );
}

function Row({ row }: { readonly row: BenchRow }): JSX.Element {
  const total = row.stat === "total";
  return (
    <tr className={total ? "border-rule border-t-3 border-double" : "border-line border-t"}>
      <th scope="row" className="py-1.5 pr-2 text-left font-normal">
        <span className="flex items-baseline gap-2">
          <span className={`catalogue ${total ? "text-text" : "text-muted"}`}>{row.label}</span>
          <span aria-hidden="true" className="leader flex-1" />
        </span>
      </th>
      {row.cells.map((cell) => (
        <Cell key={cell.name} cell={cell} />
      ))}
    </tr>
  );
}

/** Up to four Pokémon from any search, side by side, with leaders and differences (SYS-UI-028). */
export function Bench(): JSX.Element | null {
  const { workbench } = useWorkbench();
  const contenders = useContenders(workbench.bench);
  if (contenders.length === 0) return null;
  return (
    <section aria-label="Bench" className="plate pointer-events-auto overflow-x-auto p-3 sm:p-4">
      <table className="w-full text-sm">
        <caption className="pb-2 text-left">
          <span className="border-line flex items-baseline justify-between border-b pb-2">
            <span className="font-display text-xl font-semibold">Bench</span>
            <span aria-hidden="true" className="catalogue text-muted">
              <LeaderStar />
              Leader
            </span>
          </span>
        </caption>
        <thead>
          <tr>
            <td />
            {contenders.map((contender) => (
              <Contender
                key={contender.name}
                contender={contender}
                reference={contender.name === workbench.reference}
              />
            ))}
          </tr>
        </thead>
        <tbody>
          {benchRows(contenders, workbench.reference).map((row) => (
            <Row key={row.stat} row={row} />
          ))}
        </tbody>
      </table>
    </section>
  );
}
