import { MathUtils, PerspectiveCamera, Vector3 } from "three/webgpu";

import type { SceneCamera } from "../../../domain/sceneTypes";
import type { Inset, Viewport } from "../protocol";

const FOV = 46;
const EASE_RATE = 2.2;
const RETURN_RATE = 0.8;
const ORBIT_SPEED = 0.045;
const DRAG_SPEED = 0.005;
const MIN_ZOOM = 0.35;
const MAX_ZOOM = 2.5;
const MAX_ELEVATION = 1.2;
const REST_ELEVATION = 0.12;
const SETTLE = 0.001;
const MIN_FREE_SHARE = 0.3;

function ease(current: number, goal: number, share: number): number {
  return current + (goal - current) * share;
}

function shareOf(rate: number, delta: number): number {
  return 1 - Math.exp(-rate * delta);
}

/**
 * Orbits a target at a distance. The home sky turns slowly; the other layouts,
 * drawn in the plane facing the camera, bring the camera back in front of them.
 * Once the user turns, pans or zooms, the camera stays where they left it until
 * the goal changes or they recenter it.
 */
export class CameraRig {
  readonly camera = new PerspectiveCamera(FOV, 1, 0.1, 500);
  private readonly target = new Vector3();
  private readonly goalTarget = new Vector3();
  /** How far the user panned the target away from its goal. */
  private readonly offset = new Vector3();
  private readonly aim = new Vector3();
  private readonly across = new Vector3();
  private readonly upward = new Vector3();
  private distance = 60;
  private goalDistance = 34;
  private azimuth = 0;
  private elevation = REST_ELEVATION;
  private zoomFactor = 1;
  private orbiting = true;
  private navigated = false;
  private freeShare = 1;
  private height = 1;

  setGoal(goal: SceneCamera, orbiting: boolean): void {
    const { x, y, z } = goal.target;
    const same =
      this.goalTarget.equals(this.aim.set(x, y, z)) &&
      this.goalDistance === goal.distance &&
      this.orbiting === orbiting;
    if (same) return;
    this.goalTarget.set(x, y, z);
    this.goalDistance = goal.distance;
    this.orbiting = orbiting;
    this.recenter();
  }

  turn(dx: number, dy: number): void {
    this.azimuth -= dx * DRAG_SPEED;
    this.elevation = MathUtils.clamp(
      this.elevation + dy * DRAG_SPEED,
      -MAX_ELEVATION,
      MAX_ELEVATION,
    );
    this.navigated = true;
  }

  /** Slide the target so that what is under the pointer follows it. */
  pan(dx: number, dy: number): void {
    const perPixel = (2 * Math.tan(MathUtils.degToRad(FOV) / 2) * this.distance) / this.height;
    this.across.setFromMatrixColumn(this.camera.matrixWorld, 0).multiplyScalar(-dx * perPixel);
    this.upward.setFromMatrixColumn(this.camera.matrixWorld, 1).multiplyScalar(dy * perPixel);
    this.offset.add(this.across).add(this.upward);
    this.target.add(this.across).add(this.upward);
    this.navigated = true;
  }

  /** Move away by a factor above one, closer by a factor below one. */
  zoom(factor: number): void {
    this.zoomFactor = MathUtils.clamp(this.zoomFactor * factor, MIN_ZOOM, MAX_ZOOM);
    this.navigated = true;
  }

  recenter(): void {
    this.offset.set(0, 0, 0);
    this.zoomFactor = 1;
    this.navigated = false;
  }

  /** Fit the viewport, centering the view in the part the results leave free. */
  resize(viewport: Viewport, inset: Inset): void {
    const { width, height } = viewport;
    this.height = Math.max(height, 1);
    this.camera.aspect = width / this.height;
    const across = (inset.right - inset.left) / 2;
    const down = (inset.bottom - inset.top) / 2;
    this.camera.setViewOffset(width, height, across, down, width, height);
    this.freeShare = Math.min(
      1,
      Math.min(width - inset.left - inset.right, height - inset.top - inset.bottom) / height,
    );
    this.camera.updateProjectionMatrix();
  }

  /** Move the camera one frame closer to its goal; return whether it still moves. */
  update(delta: number): boolean {
    const before = this.camera.position.clone();
    this.target.lerp(this.aim.copy(this.goalTarget).add(this.offset), shareOf(EASE_RATE, delta));
    this.distance = ease(
      this.distance,
      (this.goalDistance * this.zoomFactor) / Math.max(this.freeShare, MIN_FREE_SHARE),
      shareOf(EASE_RATE, delta),
    );
    if (!this.navigated) this.rest(delta);
    const flat = Math.cos(this.elevation) * this.distance;
    this.camera.position.set(
      this.target.x + Math.sin(this.azimuth) * flat,
      this.target.y + Math.sin(this.elevation) * this.distance,
      this.target.z + Math.cos(this.azimuth) * flat,
    );
    this.camera.lookAt(this.target);
    this.camera.updateMatrixWorld();
    const turning = this.orbiting && !this.navigated;
    return turning || before.distanceTo(this.camera.position) > SETTLE;
  }

  /** Turn the home sky, or bring the camera back in front of a flat layout. */
  private rest(delta: number): void {
    this.elevation = ease(this.elevation, REST_ELEVATION, shareOf(RETURN_RATE, delta));
    if (this.orbiting) {
      this.azimuth += ORBIT_SPEED * delta;
      return;
    }
    const facing = Math.round(this.azimuth / (2 * Math.PI)) * 2 * Math.PI;
    this.azimuth = ease(this.azimuth, facing, shareOf(RETURN_RATE, delta));
  }
}
