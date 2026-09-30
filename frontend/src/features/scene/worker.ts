import { assertNever } from "../../domain/assertNever";
import { Engine } from "./engine/Engine";
import type { FromWorker, ToWorker } from "./protocol";

type Command = Exclude<ToWorker, { readonly type: "start" }>;
type Steer = Extract<Command, { readonly type: "turn" | "pan" | "zoom" | "recenter" }>;

let engine: Engine | null = null;
const pending: Command[] = [];

function post(message: FromWorker, transfer: Transferable[] = []): void {
  self.postMessage(message, { transfer });
}

const STEERS: ReadonlySet<Command["type"]> = new Set(["turn", "pan", "zoom", "recenter"]);

function isSteer(command: Command): command is Steer {
  return STEERS.has(command.type);
}

function steer(rig: Engine["rig"], command: Steer): void {
  switch (command.type) {
    case "turn":
      rig.turn(command.dx, command.dy);
      return;
    case "pan":
      rig.pan(command.dx, command.dy);
      return;
    case "zoom":
      rig.zoom(command.factor);
      return;
    case "recenter":
      rig.recenter();
      return;
    default:
      assertNever(command);
  }
}

function apply(target: Engine, command: Command): void {
  if (isSteer(command)) {
    steer(target.rig, command);
    return;
  }
  switch (command.type) {
    case "resize":
      target.resize(command.viewport);
      return;
    case "inset":
      target.inset(command.inset);
      return;
    case "stage":
      target.stage(command.frame, command.marks);
      return;
    case "highlight":
      target.highlight(command.ids);
      return;
    case "hover":
      target.hover(command.x, command.y);
      return;
    case "leave":
      target.leave();
      return;
    case "click":
      target.click(command.x, command.y);
      return;
    default:
      assertNever(command);
  }
}

function start(message: Extract<ToWorker, { readonly type: "start" }>): void {
  Engine.start({ canvas: message.canvas, seeds: message.species, viewport: message.viewport }, post)
    .then((started) => {
      engine = started;
      for (const command of pending.splice(0)) apply(started, command);
    })
    .catch((error: unknown) => {
      post({ type: "failed", message: error instanceof Error ? error.message : String(error) });
    });
}

self.addEventListener("message", (event: MessageEvent<ToWorker>) => {
  const message = event.data;
  if (message.type === "start") {
    start(message);
  } else if (engine === null) {
    pending.push(message);
  } else {
    apply(engine, message);
  }
});
