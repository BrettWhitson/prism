/**
 * Springs drive every motion in the renderer: node positions, fades, glows and the camera. Each value chases a target;
 * retargeting mid-flight just bends the motion (no restarts, no jumps), which is what makes interrupted transitions,
 * drags and rapid clicks feel continuous. Pure: no DOM.
 */
/**
 * Spring constants for an animation that should settle in about `durationMs`, in the given feel:
 *  - smooth: critically damped (no overshoot);
 *  - snappy: critically damped, quicker off the mark;
 *  - bouncy: underdamped, overshoots once and settles;
 *  - linear: heavily damped, an even glide;
 *  - or any feel added with registerEasing (plugins.js).
 * @returns {{ omega: number, zeta: number }}  angular frequency (1/s) and damping ratio
 */
export declare function springFor(
  durationMs: any,
  feel?: string,
): {
  omega: number;
  zeta: number;
};
/**
 * Advance one spring value by `dt` seconds toward `target`. `state` is { value, velocity } and is updated in place.
 * Semi-implicit Euler in small sub-steps: stable for any frame time a browser produces. Within `precision` (and
 * barely moving) it lands exactly on the target and stops.
 * @returns {boolean} still moving
 */
export declare function stepSpring(
  state: any,
  target: any,
  dt: any,
  {
    omega,
    zeta,
  }: {
    omega: any;
    zeta: any;
  },
  precision?: number,
): boolean;
/** A value with a spring attached. */
export declare class Spring {
  precision: number;
  value: number;
  target: number;
  velocity: number;
  params: {
    omega: number;
    zeta: number;
  };
  /**
   * @param {number} value  @param {{ omega: number, zeta: number }} params
   * @param {number} [precision]  how close counts as there (in the value's own units)
   */
  constructor(
    value: number,
    params: {
      omega: number;
      zeta: number;
    },
    precision?: number,
  );
  /** Chase a new target (from wherever it is now, keeping its velocity). NaN and ±Infinity are ignored. */
  set(target: any): void;
  /** Jump there, no motion. NaN and ±Infinity are ignored. */
  snap(value: any): void;
  get moving(): boolean;
  /** @returns {boolean} still moving */
  step(dt: any): boolean;
}
