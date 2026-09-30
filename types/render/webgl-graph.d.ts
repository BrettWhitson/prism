import { Camera } from "./camera.js";
import { parseColor } from "./color.js";
/** Input timings and distances; setOptions({ input }) changes any of them. */
export declare const DEFAULT_INPUT: {
  smoothZoom: boolean;
  zoomSpeed: number;
  draggable: boolean;
  doubleTapMs: number;
  longPressMs: number;
  /** How far a pointer moves before a press becomes a drag, per pointer type (CSS px). */
  dragThreshold: {
    mouse: number;
    pen: number;
    touch: number;
  };
  /** Time constant of the camera's glide after a flick (seconds); 0: no glide. */
  panInertia: number;
  /** px/s; slower than this, letting go of a pan just stops. */
  flickMinSpeed: number;
};
/** Interaction and label colours; override any of them with the constructor's `colors` option. */
export declare const DEFAULT_COLORS: {
  selected: string;
  hover: string;
  labelText: string;
  edgeLabelText: string;
  labelBackdrop: string;
  edgeLabelBackdrop: string;
  /** Card nodes: the title and the value, the subtitle, the inside of the port dots. */
  cardText: string;
  cardMuted: string;
  portFill: string;
};
export { parseColor };
export { wrapLabel } from "./labels.js";
export declare class WebGLGraph {
  #private;
  container: HTMLElement;
  handlers: {
    onNodeTap?: any;
    onNodeDoubleTap?: any;
    onNodeContextTap?: any;
    onNodeHover?: any;
    onPointerMove?: any;
    onBackgroundTap?: any;
    onViewportChange?: any;
    onNodeDragStart?: any;
    onNodeDrag?: any;
    onNodeDragEnd?: any;
  };
  canvas: HTMLCanvasElement;
  labelCanvas: HTMLCanvasElement;
  gl: WebGL2RenderingContext;
  labelContext: CanvasRenderingContext2D;
  resizeObserver: ResizeObserver;
  width: number;
  height: number;
  dpr: any;
  edgeProgram: WebGLProgram;
  arrowProgram: WebGLProgram;
  uniforms: Map<any, any>;
  edgeVao: WebGLVertexArrayObject;
  edgeBuffer: WebGLBuffer;
  atlasCanvas: HTMLCanvasElement;
  atlasContext: CanvasRenderingContext2D;
  iconTexture: WebGLTexture;
  nodeProgram: WebGLProgram;
  edgePieceCount: number;
  nodeCount: number;
  topNodeCount: number;
  camera: Camera;
  /** Timings of the last frame, for profiling. */
  stats: {
    drawMs: number;
    uploadMs: number;
    partialUpload: boolean;
    /** Frames drawn so far (the engine only draws when something changes). */
    frames: number;
    labels: number;
    visibleNodes: number;
    animating: number;
  };
  /** @type {WebGLVertexArrayObject} */ nodeVao: WebGLVertexArrayObject;
  /** @type {WebGLBuffer} */ nodeBuffer: WebGLBuffer;
  /** @type {WebGLVertexArrayObject} */ topNodeVao: WebGLVertexArrayObject;
  /** @type {WebGLBuffer} */ topNodeBuffer: WebGLBuffer;
  /**
   * @param {HTMLElement} container  the graph fills it
   * @param {{ onNodeTap?, onNodeDoubleTap?, onNodeContextTap?, onNodeHover?, onPointerMove?, onBackgroundTap?,
   *           onViewportChange?, onNodeDragStart?, onNodeDrag?, onNodeDragEnd? }} [handlers]
   * @param {{ preserveDrawingBuffer?: boolean, badgeUrl?: string, colors?: Partial<typeof DEFAULT_COLORS> }} [options]
   *   badgeUrl: the image drawn in the corner of nodes whose style has `badge: true`
   */
  constructor(
    container: HTMLElement,
    handlers?: {
      onNodeTap?: any;
      onNodeDoubleTap?: any;
      onNodeContextTap?: any;
      onNodeHover?: any;
      onPointerMove?: any;
      onBackgroundTap?: any;
      onViewportChange?: any;
      onNodeDragStart?: any;
      onNodeDrag?: any;
      onNodeDragEnd?: any;
    },
    {
      preserveDrawingBuffer,
      badgeUrl,
      colors,
    }?: {
      preserveDrawingBuffer?: boolean;
      badgeUrl?: string;
      colors?: Partial<typeof DEFAULT_COLORS>;
    },
  );
  /**
   * @param {{ motion?: { enabled?: boolean, durationMs?: number, feel?: string }, dimAlpha?: number,
   *           flowSpeed?: number, smoothZoom?: boolean, zoomSpeed?: number, draggable?: boolean,
   *           input?: Partial<typeof DEFAULT_INPUT>,
   *           labels?: Partial<{ position: string, backdrop: boolean, fadeZoom: number, maxWidth: number,
   *           overflow: string, cardDetailZoom: number }> }} options
   */
  setOptions(options: {
    motion?: {
      enabled?: boolean;
      durationMs?: number;
      feel?: string;
    };
    dimAlpha?: number;
    flowSpeed?: number;
    smoothZoom?: boolean;
    zoomSpeed?: number;
    draggable?: boolean;
    input?: Partial<typeof DEFAULT_INPUT>;
    labels?: Partial<{
      position: string;
      backdrop: boolean;
      fadeZoom: number;
      maxWidth: number;
      overflow: string;
      cardDetailZoom: number;
    }>;
  }): void;
  /** The interaction colours (DEFAULT_COLORS), a copy. */
  get colors(): {
    selected: string;
    hover: string;
    labelText: string;
    edgeLabelText: string;
    labelBackdrop: string;
    edgeLabelBackdrop: string;
    /** Card nodes: the title and the value, the subtitle, the inside of the port dots. */
    cardText: string;
    cardMuted: string;
    portFill: string;
  };
  /** Change any interaction colours (selection, hover, label text and backdrops): they apply at once. */
  setColors(patch: any): void;
  get motionEnabled(): boolean;
  /**
   * Replace the graph. Nodes that stay keep their place on screen and glide to their new position; with `animate`,
   * new nodes grow out of `spawnFrom` (id → point) after `delays` (id → ms), and removed nodes fade into `ghostTo`
   * (id → point). Without it everything snaps. The camera isn't moved (see fitView / moveCamera). A node being dragged
   * stays under the pointer if it's still there; if it's gone, the drag ends (onNodeDragEnd). Positions and sizes
   * that aren't finite numbers are read as 0 and the smallest size.
   *
   * @param {{ nodes: { id: string, x: number, y: number, width: number, height: number, style: any }[],
   *           edges: { id: string, source: string, target: string, style: any }[], routing?: string,
   *           flowAxis?: string, cornerRadius?: number, curvature?: number,
   *           portDirection?: { x: number, y: number } }} graph
   * @param {{ animate?: boolean, spawnFrom?: Map<string, {x: number, y: number}>, delays?: Map<string, number>,
   *           ghostTo?: Map<string, {x: number, y: number}> }} [transition]
   */
  setGraph(
    graph: {
      nodes: {
        id: string;
        x: number;
        y: number;
        width: number;
        height: number;
        style: any;
      }[];
      edges: {
        id: string;
        source: string;
        target: string;
        style: any;
      }[];
      routing?: string;
      flowAxis?: string;
      cornerRadius?: number;
      curvature?: number;
      portDirection?: {
        x: number;
        y: number;
      };
    },
    {
      animate,
      spawnFrom,
      delays,
      ghostTo,
    }?: {
      animate?: boolean;
      spawnFrom?: Map<
        string,
        {
          x: number;
          y: number;
        }
      >;
      delays?: Map<string, number>;
      ghostTo?: Map<
        string,
        {
          x: number;
          y: number;
        }
      >;
    },
  ): void;
  /**
   * Restyle nodes and edges in place (no movement): [{ id, style }]. A node whose size changed (`style.width` and
   * `style.height`, or `style.size` for both) is resized to it where it stands, on a spring when animations are on.
   */
  updateStyles(nodeUpdates?: any[], edgeUpdates?: any[]): void;
  /**
   * Move nodes (a force simulation, a drag): entries of [id, x, y]. They jump there: whatever is calling this is
   * already animating them.
   */
  moveNodes(entries: any): void;
  /** Select a node (null, or an id not in the graph, for none). */
  select(id: any): void;
  get selected(): any;
  /** Nodes drawn faded (their edges too, unless emphasised); null for none. */
  setDimmed(ids: any): void;
  /** Nodes that glow in a colour (highlights, flashes): Map id → colour, or null. */
  setEmphasis(colorsById: any): void;
  /** Nodes whose labels stay visible however far out you zoom (e.g. a hovered lineage). */
  setLabelFocus(ids: any): void;
  /** Edges drawn in a colour, wider, optionally with flow: Map id → { color, boost?, flow? (+1 → target, −1 → source) }. */
  setEdgeEmphasis(stateById: any): void;
  /** A kick to a node's glow: it flares and settles back (springs make this a velocity impulse). */
  pulse(id: any): void;
  /** Run `tick(dt)` every frame until it returns false (physics, custom animations). */
  addTicker(tick: any): () => boolean;
  hasNode(id: any): boolean;
  nodeIds(): any[];
  /** Where a node is headed (its layout position), or null. */
  positionOf(id: any): {
    x: any;
    y: any;
  };
  /** Where a node is right now (world units, mid-animation included), or null. */
  livePositionOf(id: any): {
    x: any;
    y: any;
  };
  /**
   * Change how edges are routed (a style setting) without replacing the graph. `portDirection`: a unit vector toward
   * the root side of the flow, where card nodes put their out port (their in port is opposite); zero for none.
   */
  setRouting({
    routing,
    flowAxis,
    cornerRadius,
    curvature,
    portDirection,
  }: {
    cornerRadius: any;
    curvature: any;
    flowAxis: any;
    portDirection: any;
    routing: any;
  }): void;
  /** Where a node is on screen right now (CSS pixels), or null. */
  screenPositionOf(id: any): {
    x: number;
    y: number;
  };
  /** World box around the given nodes' final positions (all nodes by default). */
  bounds(ids?: any): {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  };
  /**
   * Move the camera to { zoom, panX, panY }. Animated moves ride springs on the view's centre and (log) zoom, so they
   * can be retargeted mid-flight; any direct input (wheel, drag) takes over at once.
   */
  moveCamera(
    {
      zoom,
      panX,
      panY,
    }: {
      panX: any;
      panY: any;
      zoom: any;
    },
    {
      animate,
    }?: {
      animate?: boolean;
    },
  ): void;
  /** The camera that fits `bounds` (default: every node) with `padding` pixels to spare. */
  viewFor(
    bounds?: {
      x1: number;
      y1: number;
      x2: number;
      y2: number;
    },
    {
      padding,
      maxZoom,
    }?: {
      maxZoom?: number;
      padding?: number;
    },
  ): {
    zoom: number;
    panX: number;
    panY: number;
  };
  fitView({
    animate,
    ids,
    padding,
    maxZoom,
  }?: {
    animate?: boolean;
    ids?: any;
    maxZoom?: number;
    padding?: number;
  }): void;
  /** Zoom around the middle of the view. */
  zoomBy(
    factor: any,
    {
      animate,
    }?: {
      animate?: boolean;
    },
  ): void;
  /** Put a node in the middle of the view (at `zoom`, or the current zoom). */
  centerOn(
    id: any,
    {
      zoom,
      animate,
    }?: {
      animate?: boolean;
      zoom?: any;
    },
  ): void;
  /** Pan (not zoom) just enough to bring a node on screen with `margin` pixels to spare. */
  reveal(
    id: any,
    {
      margin,
      animate,
    }?: {
      animate?: boolean;
      margin?: number;
    },
  ): void;
  /** The camera's destination, for callers that plan relative to it. */
  get cameraTarget(): {
    zoom: number;
    panX: number;
    panY: number;
  };
  resize(): void;
  /** Stop everything, remove the canvases and let go of the GPU. The graph can't be used afterwards. */
  destroy(): void;
  /** Draw a frame soon (once, however often it's asked for). Nothing happens after destroy() or while the GPU is lost. */
  requestRender(): void;
  /**
   * The whole graph as a canvas at `scale` (world units → pixels), every label drawn, over `background` (a CSS
   * colour; null or "transparent" for none). It's drawn as it is on screen right now (mid-transition included).
   * Rendered in tiles, so it can be larger than the GPU's own limits; `scale` shrinks to keep it within `maxSide` and
   * `maxPixels`. Throws when the GPU context is lost or the browser can't make a canvas that big.
   */
  renderToCanvas({
    scale,
    background,
    padding,
    maxSide,
    maxPixels,
  }?: {
    background?: any;
    maxPixels?: number;
    maxSide?: number;
    padding?: number;
    scale?: number;
  }): HTMLCanvasElement;
}
/**
 * The glide velocity (px/s) for letting go of a pan at `now`, from its recent moves ({ at, dx, dy }), or null for no
 * glide. Only moves in the last FLICK_WINDOW_MS count, so holding still before letting go stops the view.
 */
export declare function flickVelocity(
  samples: any,
  now: any,
  minSpeed?: number,
): {
  vx: number;
  vy: number;
};
