import type { CaptureGroupConfiguration } from '../configuration';
import type { CaptureTypeDefinition } from '../definition';
import { StardosNode } from './node_base';
import { Sensor } from './sensor';

export class CaptureGroup extends StardosNode<
	CaptureGroupConfiguration,
	CaptureTypeDefinition
> {
	private _sensors = new Map<string, Sensor>();

	public get sensors(): Readonly<Map<string, Sensor>> {
		return this._sensors;
	}

	protected parse_config(config: CaptureGroupConfiguration): void {
		this._sensors = new Map(
			config.sensors.map((sensor) => [sensor.name, Sensor.from_config(sensor)])
		);
	}
}
