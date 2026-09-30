import { Color } from "three/webgpu";

import type { Theme } from "../../../domain/theme";
import { skyHex, weatherHex } from "../palette";

const WEATHER_TINT = 0.05;
const EASE_RATE = 2;

/** The clear colour of the scene: the ink of the theme, faintly tinted by the weather of a reading. */
export class Sky {
  readonly color: Color;
  private readonly goal: Color;
  private weather: string | null = null;

  constructor(private theme: Theme) {
    this.color = new Color(skyHex(theme));
    this.goal = this.color.clone();
  }

  setWeather(weather: string | null): void {
    this.weather = weather;
    this.aim();
  }

  setTheme(theme: Theme): void {
    this.theme = theme;
    this.aim();
  }

  update(delta: number): void {
    this.color.lerp(this.goal, 1 - Math.exp(-EASE_RATE * delta));
  }

  private aim(): void {
    this.goal.set(skyHex(this.theme));
    if (this.weather !== null) this.goal.lerp(new Color(weatherHex(this.weather)), WEATHER_TINT);
  }
}
