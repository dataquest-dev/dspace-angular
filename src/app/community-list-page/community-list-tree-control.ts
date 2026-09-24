import { FlatTreeControl } from '@angular/cdk/tree';

import { Community } from '../core/shared/community.model';
import { FlatNode } from './flat-node.model';

/**
 * Tree control for the community list. A row keeps the node object from its first render, so this
 * answers by id from the component's expanded nodes, never from the model the arrow keys move.
 */
export class CommunityListTreeControl extends FlatTreeControl<FlatNode> {
  constructor(private readonly getExpandedNodes: () => FlatNode[]) {
    // Only community rows can be expanded, so only they get an aria-expanded attribute.
    super((node: FlatNode) => node.level, (node: FlatNode) => node.payload instanceof Community);
  }

  /**
   * Whether this node is currently showing its children.
   */
  isExpanded(node: FlatNode): boolean {
    return this.getExpandedNodes().some((expanded: FlatNode) => expanded.id === node.id);
  }
}
