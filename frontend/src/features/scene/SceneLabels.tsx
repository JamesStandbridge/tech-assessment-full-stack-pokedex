import { type JSX, type KeyboardEvent, type RefObject, useState } from "react";

import type { SceneNode } from "../../domain/sceneTypes";
import { LABEL_STRIDE, type Mark } from "./protocol";

interface SceneLabelsProps {
  readonly layerRef: RefObject<HTMLDivElement | null>;
  readonly nodes: readonly SceneNode[];
  readonly marks: readonly Mark[];
  readonly hovered: SceneNode | null;
  readonly highlighted: ReadonlySet<string>;
  readonly onSelect: (node: SceneNode) => void;
  readonly onFocusNode: (id: string | null) => void;
}

const LABEL_GAP = 4;
/** Share of a star's radius its sprite covers; labels sit under the sprite, not under the glow. */
const SPRITE_SHARE = 0.6;

/** Move every label under its star; labels of stars behind the camera are hidden. */
export function placeLabels(layer: HTMLElement, positions: Float32Array): void {
  for (const element of layer.querySelectorAll<HTMLElement>("[data-slot]")) {
    const offset = Number(element.dataset["slot"]) * LABEL_STRIDE;
    const x = positions[offset];
    const y = positions[offset + 1];
    const radius = positions[offset + 2] ?? 0;
    const visible = x !== undefined && y !== undefined && positions[offset + 3] === 1;
    element.style.visibility = visible ? "visible" : "hidden";
    if (visible) {
      const below = y + radius * SPRITE_SHARE + LABEL_GAP;
      element.style.transform = `translate(${String(x)}px, ${String(below)}px) translateX(-50%)`;
    }
  }
}

const EMPHASIS_CLASS: Readonly<Record<SceneNode["emphasis"], string>> = {
  idle: "text-xs",
  lit: "text-xs",
  front: "text-sm font-semibold",
  dim: "text-xs",
};

const STEPS: Readonly<Record<string, number>> = {
  ArrowRight: 1,
  ArrowDown: 1,
  ArrowLeft: -1,
  ArrowUp: -1,
};

function focusSibling(event: KeyboardEvent<HTMLButtonElement>): void {
  const step = STEPS[event.key];
  if (step === undefined) return;
  event.preventDefault();
  const buttons = [...(event.currentTarget.parentElement?.querySelectorAll("button") ?? [])];
  const index = buttons.indexOf(event.currentTarget);
  buttons[(index + step + buttons.length) % buttons.length]?.focus();
}

interface StarLabelProps {
  readonly node: SceneNode;
  readonly slot: number;
  readonly tabbable: boolean;
  readonly highlighted: boolean;
  readonly onSelect: (node: SceneNode) => void;
  readonly onFocusNode: (id: string | null) => void;
  readonly onActive: () => void;
}

function StarLabel(props: StarLabelProps): JSX.Element {
  const { node, slot, tabbable, highlighted, onSelect, onFocusNode, onActive } = props;
  const leave = (): void => {
    onFocusNode(null);
  };
  const enter = (): void => {
    onFocusNode(node.id);
  };
  return (
    <button
      type="button"
      data-slot={slot}
      data-node={node.id}
      data-emphasis={node.emphasis}
      data-rank={node.rank ?? undefined}
      data-ring={node.ring ?? undefined}
      data-highlighted={highlighted}
      tabIndex={tabbable ? 0 : -1}
      className={`scene-label pointer-events-auto invisible absolute top-0 left-0 ${EMPHASIS_CLASS[node.emphasis]}`}
      onClick={() => {
        onSelect(node);
      }}
      onFocus={() => {
        onActive();
        enter();
      }}
      onBlur={leave}
      onPointerEnter={enter}
      onPointerLeave={leave}
      onKeyDown={focusSibling}
    >
      {node.label}
    </button>
  );
}

function Tag(props: {
  readonly slot: number;
  readonly text: string;
  readonly kind: string;
}): JSX.Element {
  return (
    <span
      aria-hidden="true"
      data-slot={props.slot}
      className={`${props.kind} invisible absolute top-0 left-0 text-xs`}
    >
      {props.text}
    </span>
  );
}

/** The names of the stars as buttons over them: one tab stop, arrows move between stars. */
export function SceneLabels(props: SceneLabelsProps): JSX.Element {
  const { layerRef, nodes, marks, hovered, highlighted } = props;
  const [active, setActive] = useState(0);
  const unnamedHover = hovered !== null && !nodes.some((node) => node.id === hovered.id);
  return (
    <div ref={layerRef} className="pointer-events-none absolute inset-0 overflow-hidden">
      {nodes.map((node, index) => (
        <StarLabel
          key={node.id}
          node={node}
          slot={index}
          tabbable={index === Math.min(active, nodes.length - 1)}
          highlighted={highlighted.has(node.id)}
          onSelect={props.onSelect}
          onFocusNode={props.onFocusNode}
          onActive={() => {
            setActive(index);
          }}
        />
      ))}
      {marks.map((mark, index) => (
        <Tag key={mark.id} slot={nodes.length + index} text={mark.label} kind="scene-mark" />
      ))}
      {unnamedHover ? (
        <Tag slot={nodes.length + marks.length} text={hovered.label} kind="scene-label" />
      ) : null}
    </div>
  );
}
