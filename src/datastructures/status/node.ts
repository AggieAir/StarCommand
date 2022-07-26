import type { NodeConfiguration } from '../configuration';
import type { NodeDefinition } from '../definition';
import { StardosNode } from './node_base';

/**
 * Contains status information for STARDOS nodes.
 * This class is sufficient for sensor and processing nodes, but
 */
export class ProcessingNode extends StardosNode<
	NodeConfiguration,
	NodeDefinition
> {
	protected constructor(name: string) {
		super(name);
	}

	protected parse_config(): void {
		// nothing to do
	}
}
