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
		// Sensor nodes don't have input queues, they reject requests they
		// are not ready to perform.
		if (this.config?.definition.input_type === '') {
			this._has_queue = false;
		}
	}
}
