import { Color, Scene, WebGPURenderer } from "three/webgpu";

import type { SceneFrame } from "../../../domain/scene";
import { SKY_COLOR, weatherHex } from "../palette";
import {
  type Backend,
  type FromWorker,
  type Inset,
  type Mark,
  NO_INSET,
  type StarSeed,
  type Viewport,
} from "../protocol";
import { spriteAtlas } from "./atlas";
import { CameraRig } from "./cameraRig";
import { Filaments } from "./filaments";
import { Guides } from "./guides";
import { LabelTracker } from "./labels";
import { pickStar } from "./lens";
import { Motes } from "./motes";
import { starUniforms } from "./starMaterial";
import { Stars } from "./stars";

export type Post = (message: FromWorker, transfer?: Transferable[]) => void;

const MOTES: Readonly<Record<Backend, number>> = { webgpu: 40_000, webgl2: 4_000 };
const MAX_PIXEL_RATIO = 2;
/** The first frames compile shaders; the guard measures the second after them. */
const FPS_WINDOW = { from: 0.6, to: 1.6 } as const;
const SKY_TINT = 0.05;

function backendOf(renderer: WebGPURenderer): Backend {
  return "isWebGPUBackend" in renderer.backend ? "webgpu" : "webgl2";
}

export class Engine {
  private readonly scene = new Scene();
  /** The camera, which the user turns, pans and zooms. */
  readonly rig = new CameraRig();
  private readonly filaments = new Filaments();
  private readonly guides = new Guides();
  private readonly labels = new LabelTracker();
  private readonly sky = new Color(SKY_COLOR);
  private readonly skyGoal = new Color(SKY_COLOR);
  private readonly clockStart = performance.now();
  private viewport: Viewport;
  private last = 0;
  private frames = 0;
  private measured = false;
  private hovered: string | null = null;
  private covered: Inset = NO_INSET;

  private constructor(
    private readonly renderer: WebGPURenderer,
    private readonly parts: { readonly stars: Stars; readonly motes: Motes },
    private readonly post: Post,
  ) {
    this.viewport = { width: 1, height: 1, pixelRatio: 1 };
    this.scene.add(
      this.parts.motes.object,
      this.guides.object,
      this.filaments.object,
      this.parts.stars.object,
    );
  }

  static async start(
    setup: {
      readonly canvas: OffscreenCanvas;
      readonly seeds: readonly StarSeed[];
      readonly viewport: Viewport;
    },
    post: Post,
  ): Promise<Engine> {
    const { canvas, seeds } = setup;
    const renderer = new WebGPURenderer({ canvas, antialias: true });
    await renderer.init();
    const backend = backendOf(renderer);
    const atlas = spriteAtlas(seeds);
    const parts = { stars: new Stars(seeds, atlas.texture), motes: new Motes(MOTES[backend]) };
    const engine = new Engine(renderer, parts, post);
    engine.resize(setup.viewport);
    renderer.onDeviceLost = () => {
      post({ type: "lost" });
    };
    canvas.addEventListener("webglcontextlost", () => {
      post({ type: "lost" });
    });
    void atlas.ready.then(() => {
      starUniforms.atlasReady.value = 1;
    });
    await renderer.computeAsync(parts.motes.scatter);
    await renderer.setAnimationLoop(() => {
      engine.frame();
    });
    post({ type: "ready", backend });
    return engine;
  }

  resize(viewport: Viewport): void {
    this.viewport = viewport;
    this.renderer.setPixelRatio(Math.min(viewport.pixelRatio, MAX_PIXEL_RATIO));
    this.renderer.setSize(viewport.width, viewport.height, false);
    this.rig.resize(viewport, this.covered);
  }

  inset(covered: Inset): void {
    this.covered = covered;
    this.rig.resize(this.viewport, covered);
  }

  stage(frame: SceneFrame, marks: readonly Mark[]): void {
    const time = this.now();
    this.parts.stars.stage(frame, time);
    this.filaments.stage(frame, time);
    this.guides.stage(frame, time);
    this.labels.track(frame, marks);
    this.parts.motes.setWeather(frame.weather);
    this.rig.setGoal(
      frame.camera,
      frame.layout === "atlas" && frame.nodes.every((node) => node.emphasis === "idle"),
    );
    const tint = frame.weather === null ? SKY_COLOR : weatherHex(frame.weather);
    this.skyGoal.set(SKY_COLOR).lerp(new Color(tint), frame.weather === null ? 0 : SKY_TINT);
  }

  highlight(ids: readonly string[]): void {
    this.parts.stars.highlight(new Set(ids), this.now());
  }

  hover(x: number, y: number): void {
    const found = pickStar(this.parts.stars, this.lens(), { x, y, time: this.now() });
    if (found !== this.hovered) {
      this.hovered = found;
      this.post({ type: "hover", id: found });
    }
  }

  leave(): void {
    if (this.hovered === null) return;
    this.hovered = null;
    this.post({ type: "hover", id: null });
  }

  click(x: number, y: number): void {
    const found = pickStar(this.parts.stars, this.lens(), { x, y, time: this.now() });
    if (found !== null) this.post({ type: "pick", id: found });
  }

  private now(): number {
    return (performance.now() - this.clockStart) / 1000;
  }

  private lens(): { readonly camera: Engine["rig"]["camera"]; readonly viewport: Viewport } {
    return { camera: this.rig.camera, viewport: this.viewport };
  }

  private frame(): void {
    const time = this.now();
    const delta = Math.min(time - this.last, 0.1);
    this.last = time;
    starUniforms.time.value = time;
    this.rig.update(delta);
    this.sky.lerp(this.skyGoal, 1 - Math.exp(-2 * delta));
    this.renderer.setClearColor(this.sky);
    void this.renderer.compute(this.parts.motes.step(delta, time));
    this.filaments.update(time, (id) => {
      const slot = this.parts.stars.slotOf(id);
      return slot === undefined ? null : this.parts.stars.positionAt(slot, time);
    });
    this.guides.update(time);
    this.renderer.render(this.scene, this.rig.camera);
    this.report(time);
  }

  private report(time: number): void {
    const positions = this.labels.measure(this.parts.stars, this.lens(), {
      time,
      hovered: this.hovered,
    });
    if (positions !== null) this.post({ type: "labels", positions }, [positions.buffer]);
    if (this.measured || time < FPS_WINDOW.from) return;
    this.frames += 1;
    if (time >= FPS_WINDOW.to) {
      this.measured = true;
      this.post({ type: "fps", value: this.frames / (FPS_WINDOW.to - FPS_WINDOW.from) });
    }
  }
}
