import type { SensorConfiguration } from '../configuration';
import { ProcessingNode } from './node';
import { StardosNode } from './node_base';
import { Status } from './status_enums';

export class Sensor {
	private _nodes: ProcessingNode[] = [];
	private config?: SensorConfiguration;

	public get nodes(): Readonly<ProcessingNode[]> {
		return this._nodes;
	}

	private constructor(public readonly name: string) {}

	public static from_config(config: SensorConfiguration): Sensor {
		const sensor = new Sensor(config.name);
		sensor.config = config;

		sensor._nodes = config.nodes.map((node) =>
			ProcessingNode.from_config(node)
		);

		return sensor;
	}

	public static from_heartbeat(name: string): Sensor {
		const sensor = new Sensor(name);
		return sensor;
	}

	public add_sensor_from_heartbeat(name: string): void {
		const node: ProcessingNode = ProcessingNode.from_heartbeat(name);
		this._nodes.push(node);
	}

	public get status_code(): Status {
		return this.nodes.reduce((acc, node) => {
			return Math.max(acc, node.status_code);
		}, Status.ONLINE);
	}
}
