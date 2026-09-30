/**
 * Where things come from and go to when one graph turns into the next. Pure: no DOM.
 *
 * A new node grows out of its nearest ancestor that was already on screen, so expanding a node visibly unfolds it; a
 * removed node folds back into its nearest ancestor that stays (collapsing reads the same way in reverse). Ancestors
 * are whatever the links say (child → parent maps); ids mean nothing here.
 */
/**
 * @param {{ previous: Map<string, {x: number, y: number}>, nodeIds: string[], parentOf: Map<string, string>,
 *           previousParentOf?: Map<string, string>, rootId?: string }} graphs
 *   previous: positions on screen now; parentOf: child → parent in the new graph; previousParentOf: the same for the
 *   old graph (to fold removed nodes into their parents).
 */
export declare function planTransition({
  previous,
  nodeIds,
  parentOf,
  previousParentOf,
  rootId,
}: {
  previous: Map<
    string,
    {
      x: number;
      y: number;
    }
  >;
  nodeIds: string[];
  parentOf: Map<string, string>;
  previousParentOf?: Map<string, string>;
  rootId?: string;
}): {
  startOf: (id: any) => {
    x: number;
    y: number;
  };
  ghostDestinations: (finalPositions: any, anchorId?: any) => Map<any, any>;
};
