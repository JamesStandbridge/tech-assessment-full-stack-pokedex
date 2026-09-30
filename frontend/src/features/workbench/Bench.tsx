import type { JSX } from "react";

import type { Species } from "../../api/contract";
import { type BenchCell, benchRows, signed } from "../../domain/bench";
import { displayName } from "../../domain/entities";
import { Button } from "../../ui/Button";
import { RemoteImage } from "../../ui/RemoteImage";
import { useContenders } from "./data";
import { useWorkbench } from "./WorkbenchContext";

function Cell({ cell }: { readonly cell: BenchCell }): JSX.Element {
  return (
    <td
      data-contender={cell.name}
      data-leader={cell.leader}
      className={`px-1 py-1 text-right text-xs tabular-nums ${cell.leader ? "text-accent-soft font-semibold" : ""}`}
    >
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
    <th scope="col" data-contender={props.contender.name} className="px-1 py-1 align-bottom">
      <div className="flex flex-col items-center gap-1">
        <RemoteImage src={props.contender.sprite_url} alt="" size={32} />
        <span className="text-xs">{name}</span>
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
            <span aria-hidden="true">x</span>
          </Button>
        </div>
      </div>
    </th>
  );
}

/** Up to four Pokémon from any search, side by side, with leaders and differences (SYS-UI-028). */
export function Bench(): JSX.Element | null {
  const { workbench } = useWorkbench();
  const contenders = useContenders(workbench.bench);
  if (contenders.length === 0) return null;
  return (
    <section
      aria-label="Bench"
      className="panel pointer-events-auto overflow-x-auto rounded-2xl p-3"
    >
      <table className="w-full text-sm">
        <caption className="pb-2 text-left text-sm font-semibold">Bench</caption>
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
            <tr key={row.stat} className="border-line border-t">
              <th scope="row" className="text-muted px-1 py-1 text-left text-xs font-medium">
                {row.label}
              </th>
              {row.cells.map((cell) => (
                <Cell key={cell.name} cell={cell} />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
