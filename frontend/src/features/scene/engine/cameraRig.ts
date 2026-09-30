import { PerspectiveCamera, Vector3 } from "three/webgpu";

import type { SceneCamera } from "../../../domain/sceneTypes";
import type { Inset, Viewport } from "../protocol";

const FOV = 46;
const EASE_RATE = 2.2;
const RETURN_RATE = 0.8;
const ORBIT_SPEED = 0.045;
const DRAG_SPEED = 0.005;
const ZOOM_SPEED = 0.0012;
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
 */
export class CameraRig {
  readonly camera = new PerspectiveCamera(FOV, 1, 0.1, 500);
  private readonly target = new Vector3();
  private readonly goalTarget = new Vector3();
  private distance = 60;
  private goalDistance = 34;
  private azimuth = 0;
  private elevation = REST_ELEVATION;
  private zoomFactor = 1;
  private orbiting = true;
  private freeShare = 1;

  setGoal(goal: SceneCamera, orbiting: boolean): void {
    this.goalTarget.set(goal.target.x, goal.target.y, goal.target.z);
    this.goalDistance = goal.distance;
    this.zoomFactor = 1;
    this.orbiting = orbiting;
  }

  drag(dx: number, dy: number): void {
    this.azimuth -= dx * DRAG_SPEED;
    this.elevation = Math.max(
      -MAX_ELEVATION,
      Math.min(MAX_ELEVATION, this.elevation + dy * DRAG_SPEED),
    );
  }

  zoom(delta: number): void {
    this.zoomFactor = Math.max(
      MIN_ZOOM,
      Math.min(MAX_ZOOM, this.zoomFactor * Math.exp(delta * ZOOM_SPEED)),
    );
  }

  /** Fit the viewport, centering the view in the part the results leave free. */
  resize(viewport: Viewport, inset: Inset): void {
    const { width, height } = viewport;
    this.camera.aspect = width / Math.max(height, 1);
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
    this.target.lerp(this.goalTarget, shareOf(EASE_RATE, delta));
    this.distance = ease(
      this.distance,
      (this.goalDistance * this.zoomFactor) / Math.max(this.freeShare, MIN_FREE_SHARE),
      shareOf(EASE_RATE, delta),
    );
    if (this.orbiting) {
      this.azimuth += ORBIT_SPEED * delta;
    } else {
      const facing = Math.round(this.azimuth / (2 * Math.PI)) * 2 * Math.PI;
      this.azimuth = ease(this.azimuth, facing, shareOf(RETURN_RATE, delta));
      this.elevation = ease(this.elevation, REST_ELEVATION, shareOf(RETURN_RATE, delta));
    }
    const flat = Math.cos(this.elevation) * this.distance;
    this.camera.position.set(
      this.target.x + Math.sin(this.azimuth) * flat,
      this.target.y + Math.sin(this.elevation) * this.distance,
      this.target.z + Math.cos(this.azimuth) * flat,
    );
    this.camera.lookAt(this.target);
    this.camera.updateMatrixWorld();
    return this.orbiting || before.distanceTo(this.camera.position) > SETTLE;
  }
}
