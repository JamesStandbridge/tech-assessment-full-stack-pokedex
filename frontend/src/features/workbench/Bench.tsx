import type { JSX } from "react";

import type { Species } from "../../api/contract";
import { type BenchCell, type BenchRow, benchRows, signed } from "../../domain/bench";
import { displayName } from "../../domain/entities";
import { Button } from "../../ui/Button";
import { BENCH_SIZE } from "../../domain/workbench";
import { Panel } from "../../ui/Panel";
import { RemoteImage } from "../../ui/RemoteImage";
import { TypeBadge } from "../../ui/TypeBadge";
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
      className={`px-2 py-2 text-right font-mono text-sm tabular-nums ${cell.leader ? "text-text" : "text-muted"}`}
    >
      {cell.leader ? <LeaderStar /> : null}
      {cell.value}
      {cell.difference === null ? null : (
        <span className="text-muted block text-xs">({signed(cell.difference)})</span>
      )}
      {cell.leader ? <span className="sr-only">, leader</span> : null}
    </td>
  );
}

function ContenderActions(props: {
  readonly contender: string;
  readonly reference: boolean;
}): JSX.Element {
  const workbench = useWorkbench();
  const name = displayName(props.contender);
  return (
    <div className="flex">
      <Button
        variant={props.reference ? "primary" : "quiet"}
        size="small"
        aria-label={`Pin ${name} as the reference`}
        aria-pressed={props.reference}
        onPress={() => {
          workbench.pin(props.reference ? null : props.contender);
        }}
      >
        {props.reference ? "Reference" : "Pin"}
      </Button>
      <Button
        variant="quiet"
        size="small"
        aria-label={`Stop comparing ${name}`}
        onPress={() => {
          workbench.uncompare(props.contender);
        }}
      >
        <span aria-hidden="true">&times;</span>
      </Button>
    </div>
  );
}

function Contender(props: {
  readonly contender: Species;
  readonly reference: boolean;
}): JSX.Element {
  const name = displayName(props.contender.name);
  return (
    <th scope="col" data-contender={props.contender.name} className="px-1 pb-3 align-bottom">
      <div className="flex flex-col items-center gap-1.5">
        <div className="specimen p-1">
          <RemoteImage src={props.contender.sprite_url} alt="" size={44} />
        </div>
        <span className="font-display text-lg leading-none font-semibold">{name}</span>
        <span className="flex gap-1">
          {props.contender.types.map((type) => (
            <TypeBadge key={type} type={type} compact />
          ))}
        </span>
        <ContenderActions contender={props.contender.name} reference={props.reference} />
      </div>
    </th>
  );
}

function Row({ row }: { readonly row: BenchRow }): JSX.Element {
  const total = row.stat === "total";
  return (
    <tr className={total ? "border-rule border-t-3 border-double" : "border-line border-t"}>
      <th scope="row" className="py-2 pr-2 text-left font-normal">
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

function BenchTable(props: {
  readonly contenders: readonly Species[];
  readonly reference: string | null;
}): JSX.Element {
  return (
    <div className="-mx-1 overflow-x-auto">
      <table className="w-full text-sm">
        <caption className="sr-only">Base stats side by side</caption>
        <thead>
          <tr>
            <td />
            {props.contenders.map((contender) => (
              <Contender
                key={contender.name}
                contender={contender}
                reference={contender.name === props.reference}
              />
            ))}
          </tr>
        </thead>
        <tbody>
          {benchRows(props.contenders, props.reference).map((row) => (
            <Row key={row.stat} row={row} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Up to four Pokémon from any search, side by side, with leaders and differences (SYS-UI-028). */
export function Bench(): JSX.Element | null {
  const { workbench } = useWorkbench();
  const contenders = useContenders(workbench.bench);
  if (contenders.length === 0) return null;
  return (
    <Panel
      label="Bench"
      eyebrow="Comparison"
      title="Bench"
      count={`${String(contenders.length)}/${String(BENCH_SIZE)}`}
      actions={
        <span aria-hidden="true" className="catalogue text-muted flex items-center">
          <LeaderStar />
          Leader
        </span>
      }
    >
      <BenchTable contenders={contenders} reference={workbench.reference} />
    </Panel>
  );
}
