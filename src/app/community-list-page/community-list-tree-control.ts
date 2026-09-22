import { FlatTreeControl } from '@angular/cdk/tree';

import { Community } from '../core/shared/community.model';
import { FlatNode } from './flat-node.model';

/**
 * Tree control for the community list. The rows render from `node.isExpanded` while `aria-expanded`
 * reads the tree control, so the control answers from that same flag: the arrow keys move the
 * control's own expansion model, and a row must not announce an expansion that never happened.
 */
export class CommunityListTreeControl extends FlatTreeControl<FlatNode> {
  constructor() {
    // Only community rows can be expanded, so only they get an aria-expanded attribute.
    super((node: FlatNode) => node.level, (node: FlatNode) => node.payload instanceof Community);
  }

  /**
   * Whether this node is currently showing its children.
   */
  isExpanded(node: FlatNode): boolean {
    return node.isExpanded === true;
  }
}
