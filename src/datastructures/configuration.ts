import { ConstraintRelation, ConstraintType } from './definition';
import type {
	AircraftDefinition,
	CaptureTypeDefinition,
	ConfigEntryConstraint,
	NodeDefinition,
} from './definition';
import type { UUID } from '@/utility_types';

export type ConfigEntries<T> = {
	[key: string]: T;
};

export type NodeConfiguration = {
	name: string; // Name of this particular instance, must be unique within sensor
	human_name: string;
	executable: string;
	config: ConfigEntries<string | number | boolean>;
	definition: NodeDefinition;
};

export type SensorConfiguration = {
	name: string; // Name of this particular sensor, must be unique within capture group
	nodes: NodeConfiguration[]; // List of NodeConfiguration objects
};

export type CaptureGroupConfiguration = {
	name: string; // Name of this particular group, must be unique among capture groups
	sensors: SensorConfiguration[]; // List of SensorConfiguration objects
	definition?: CaptureTypeDefinition;
	config?: ConfigEntries<string | number | boolean>;
	cadence?: number;
	activation_alt?: number;
	deactivation_alt?: number;
};

export type MissionConfiguration = {
	aircraft?: AircraftDefinition; // The AircraftDefinition describing the aircraft used
	payload: string; // Name of payload computer used
	altitude: number; // Crusing altitude of flight; mainly used to provide warnings
	date?: string; // Date string representing the day of the mission, ISO-8601 format
	name: string;
	uuid: string; // Used to easily identify the mission when querying payload for its config
	capture_groups: CaptureGroupConfiguration[]; // List of CaptureGroupConfiguration objects
};

export interface MissionMetadata {
	name: string;
	uuid: UUID;
	date: string;
	payload: string;
	aircraft: string;
}

export function validate_node(obj: any): obj is NodeConfiguration {
	return (
		obj != null &&
		typeof obj === 'object' &&
		typeof obj['name'] === 'string' &&
		typeof obj['executable'] === 'string' &&
		typeof obj['config'] === 'object' &&
		typeof obj['definition'] === 'object'
	);
}

export function validate_sensor(obj: any): obj is SensorConfiguration {
	let nodes = false;
	if (obj && typeof obj === 'object' && typeof obj['nodes'] === 'object') {
		nodes = true;
		obj['nodes'].forEach((element: unknown) => {
			nodes = nodes && validate_node(element);
		});
	}
	return nodes && typeof obj['name'] === 'string';
}

export function validate_capture_group(
	obj: any
): obj is CaptureGroupConfiguration {
	let sensors = false;
	if (obj && typeof obj === 'object' && typeof obj['sensors'] === 'object') {
		sensors = true;
		obj['sensors'].forEach((element: unknown) => {
			sensors = sensors && validate_sensor(element);
		});
	}
	return (
		obj &&
		typeof obj === 'object' &&
		typeof obj['name'] === 'string' &&
		typeof obj['activation_alt'] === 'number' &&
		typeof obj['deactivation_alt'] === 'number' &&
		typeof obj['cadence'] === 'number' &&
		sensors
	);
}

export function validate_mission(obj: any): obj is MissionConfiguration {
	let capture_groups = false;
	if (
		obj &&
		typeof obj === 'object' &&
		typeof obj['capture_groups'] === 'object'
	) {
		capture_groups = true;
		obj['capture_groups'].forEach((element: unknown) => {
			capture_groups = capture_groups && validate_capture_group(element);
		});
	}
	return (
		obj &&
		typeof obj === 'object' &&
		typeof obj['aircraft'] === 'object' &&
		typeof obj['payload'] === 'string' &&
		typeof obj['altitude'] === 'number' &&
		typeof obj['date'] === 'string' &&
		typeof obj['name'] === 'string' &&
		(obj['uuid'] === undefined || typeof obj['uuid'] === 'string') &&
		capture_groups
	);
}

function check_constraint_value(
	value: string | number | boolean | undefined,
	constraint: ConfigEntryConstraint,
	compare_against: string | number | boolean | undefined
): boolean {
	if (typeof value === 'string') {
		switch (constraint.relation) {
			case ConstraintRelation.EQUALS:
				return value === compare_against;
			case ConstraintRelation.MATCHES:
				return new RegExp(compare_against as string).test(value);
			default:
				console.error(
					'Error: invalid constraint for string value; lexicographical comparisons are not supported at this time.'
				);
				return false;
		}
	} else if (typeof value === 'number') {
		if (compare_against === undefined) {
			return false;
		}
		switch (constraint.relation) {
			case ConstraintRelation.EQUALS:
				return value === compare_against;
			case ConstraintRelation.GREATER_THAN:
				return value > compare_against;
			case ConstraintRelation.LESS_THAN:
				return value < compare_against;
			case ConstraintRelation.GREATER_EQUALS:
				return value >= compare_against;
			case ConstraintRelation.LESS_EQUALS:
				return value <= compare_against;
			default:
				console.error(
					'Error: invalid constraint for number value; cannot perform pattern matching on number value.'
				);
				return false;
		}
	} else {
		switch (constraint.relation) {
			case ConstraintRelation.EQUALS:
				return value === compare_against;
			default:
				console.error(
					'Error: invalid constraint for boolean value; can only check boolean values for equality.'
				);
				return false;
		}
	}
}

export function check_constraint(
	value: string | number | boolean | undefined,
	constraint: ConfigEntryConstraint,
	mission?: MissionConfiguration,
	config?: ConfigEntries<string | number | boolean | undefined>
): boolean {
	let result: boolean;
	switch (constraint.type) {
		case ConstraintType.STATIC:
			result = check_constraint_value(value, constraint, constraint.value);
			break;
		case ConstraintType.LINKED:
			if (!config) {
				console.error(
					'Error: linked constraint without config object; cannot check constraint.'
				);
				return false;
			}
			result = check_constraint_value(
				value,
				constraint,
				config[constraint.target]
			);
			break;
		case ConstraintType.CONFIG_LINKED:
			if (!mission) {
				console.error(
					'Error: config linked constraint without mission object; cannot check constraint.'
				);
				return false;
			}
			result = check_constraint_value(
				value,
				constraint,
				// @ts-ignore: If this comes back as undefined, that's fine. This data isn't saved anyways.
				mission[constraint.target] as string | number | boolean
			);
	}

	return constraint.invert ? !result : result;
}

/**
 * Creates a new UUID.
 * @returns A new UUID.
 *
 * @remarks
 * We can't rely on the crypto-random UUID generator because it doesn't support
 * running in insecure contexts, and we need to be able to generate UUIDs in
 * the browser when running on a local server.
 */
export function generate_uuid(): UUID {
	if (crypto.randomUUID !== undefined) {
		return crypto.randomUUID();
	}
	console.warn('Warning: falling back to insecure UUID generator.');
	const random_bytes = crypto.getRandomValues(new Uint8Array(16));
	let index = 0;
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
		const randnum =
			index % 2 == 0
				? random_bytes[(index / 2) | 0] % 16
				: random_bytes[(index / 2) | 0] >> 4;
		const value = char === 'x' ? randnum : (randnum & 0x3) | 0x8;
		return value.toString(16);
	});
}
