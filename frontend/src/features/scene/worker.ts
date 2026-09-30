import { assertNever } from "../../domain/assertNever";
import { Engine } from "./engine/Engine";
import type { FromWorker, ToWorker } from "./protocol";

type Command = Exclude<ToWorker, { readonly type: "start" }>;

let engine: Engine | null = null;
const pending: Command[] = [];

function post(message: FromWorker, transfer: Transferable[] = []): void {
  self.postMessage(message, { transfer });
}

function apply(target: Engine, command: Command): void {
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
    case "drag":
      target.drag(command.dx, command.dy);
      return;
    case "zoom":
      target.zoom(command.delta);
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
