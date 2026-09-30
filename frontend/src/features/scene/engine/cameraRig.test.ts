import type { Vector3 } from "three/webgpu";
import { beforeEach, describe, expect, test } from "vitest";

import { NO_INSET } from "../protocol";
import { CameraRig } from "./cameraRig";

const FLAT = { target: { x: 0, y: 0, z: 0 }, distance: 30, aspect: 1 };
const OTHER = { target: { x: 10, y: 0, z: 0 }, distance: 30, aspect: 1 };

function settle(rig: CameraRig, seconds = 10): void {
  for (let step = 0; step < seconds * 20; step += 1) rig.update(0.05);
}

function position(rig: CameraRig): Vector3 {
  return rig.camera.position.clone();
}

describe("CameraRig", () => {
  let rig: CameraRig;

  beforeEach(() => {
    rig = new CameraRig();
    rig.resize({ width: 800, height: 600, pixelRatio: 1 }, NO_INSET);
    rig.setGoal(FLAT, false);
    settle(rig);
  });

  test("a flat layout is seen from the front once settled", () => {
    expect(position(rig).x).toBeCloseTo(0, 1);
    expect(rig.update(0.05)).toBe(false);
  });

  test("a turned camera stays where the user left it", () => {
    rig.turn(200, 0);
    settle(rig);
    expect(Math.abs(position(rig).x)).toBeGreaterThan(10);
  });

  test("a pan moves the target across the view by the drag", () => {
    const before = position(rig);
    rig.pan(-100, 0);
    settle(rig);
    const after = position(rig);
    expect(after.x - before.x).toBeGreaterThan(0);
    expect(after.y - before.y).toBeCloseTo(0, 3);
  });

  test("a zoom brings the camera closer, within bounds", () => {
    const before = position(rig).length();
    rig.zoom(0.5);
    settle(rig);
    expect(position(rig).length()).toBeCloseTo(before * 0.5, 0);
    rig.zoom(1e-3);
    settle(rig);
    expect(position(rig).length()).toBeGreaterThan(before * 0.3);
  });

  test("recentering brings the camera back in front of the goal", () => {
    const front = position(rig);
    rig.turn(150, 40);
    rig.pan(80, -60);
    rig.zoom(2);
    settle(rig, 2);
    rig.recenter();
    settle(rig, 30);
    expect(position(rig).distanceTo(front)).toBeLessThan(0.1);
  });

  test("the same goal keeps the user's view, a new goal drops it", () => {
    rig.turn(200, 0);
    settle(rig);
    const turned = position(rig);
    rig.setGoal(FLAT, false);
    settle(rig);
    expect(position(rig).distanceTo(turned)).toBeLessThan(0.1);
    rig.setGoal(OTHER, false);
    settle(rig, 30);
    expect(position(rig).x).toBeCloseTo(OTHER.target.x, 0);
  });

  test("the home sky orbits until the user turns it", () => {
    rig.setGoal(FLAT, true);
    const start = position(rig);
    settle(rig, 1);
    expect(position(rig).distanceTo(start)).toBeGreaterThan(0.1);
    rig.turn(10, 0);
    settle(rig, 1);
    const held = position(rig);
    settle(rig, 1);
    expect(position(rig).distanceTo(held)).toBeLessThan(1e-3);
  });
});
