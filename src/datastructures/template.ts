import type {
	CaptureGroupConfiguration,
	MissionConfiguration,
	NodeConfiguration,
	SensorConfiguration,
} from './configuration';
import type {
	AircraftDefinition,
	AvionicsDefinition,
	NodeDefinition,
} from './definition';

export type NodeTemplate = {
	name: string;
	human_name: string;
	config: { [key: string]: string | number | boolean };
	definition: string;
};

export type SensorTemplate = {
	name: string;
	nodes: NodeTemplate[];
};

export type CaptureGroupTemplate = {
	name: string;
	sensors: SensorTemplate[];
	activation_alt: number | undefined;
	deactivation_alt: number | undefined;
	cadence: number | undefined;
};

export type AircraftTemplate = {
	platform: string;
	avionics: AvionicsDefinition;
	copilot_installed: boolean;
};

export type MissionTemplate = {
	aircraft: AircraftDefinition | undefined;
	payload: string | undefined;
	altitude: number | undefined;
	name: string;
	capture_groups: CaptureGroupTemplate[];
};

function aircraft_compatible(
	definition: AircraftDefinition | undefined,
	template: AircraftTemplate | undefined
): boolean {
	if (!definition) {
		return true;
	}
	let result = true;
	result &&= definition.avionics.name === template!.avionics.name;
	result &&= definition.platform === template!.platform;
	result &&= definition.has_copilot === template!.copilot_installed;
	return result;
}

function realize_mission(
	template: MissionTemplate,
	node_definitions: NodeDefinition[]
): MissionConfiguration {
	return {
		name: template.name,
		date: undefined,
		payload: template.payload ? template.payload : '',
		altitude: template.altitude ? template.altitude : 0,
		aircraft: template.aircraft,
		uuid: undefined,
		capture_groups: template.capture_groups.map((cg) =>
			realize_capture_group(cg, node_definitions)
		),
	};
}

function realize_capture_group(
	template: CaptureGroupTemplate,
	node_definitions: NodeDefinition[]
): CaptureGroupConfiguration {
	return {
		name: template.name,
		activation_alt: template.activation_alt,
		deactivation_alt: template.deactivation_alt,
		cadence: template.cadence,
		sensors: template.sensors.map((sensor) =>
			realize_sensor(sensor, node_definitions)
		),
	};
}

function realize_sensor(
	template: SensorTemplate,
	node_definitions: NodeDefinition[]
): SensorConfiguration {
	return rename_safely({
		name: template.name,
		nodes: template.nodes
			.map((node) => realize_node(node, node_definitions))
			.map(rename_uniquely)
			.map(rename_safely),
	} as SensorConfiguration);
}

type HasName = {
	name: string;
	[x: string]: any;
};

export function rename_uniquely<T extends HasName>(
	value: T,
	index: number,
	array: T[]
): T {
	let result = {} as T;
	Object.assign(result, value);
	if (/_\d+$/.test(value.name)) {
		return result;
	}
	let seq = array
		.slice(0, index)
		.reduce<number>(
			(accumulator: number, iterator: T) =>
				iterator.name === value.name ? accumulator + 1 : accumulator,
			0
		);
	result.name = `${value.name}_${seq}`;
	return result;
}

export function rename_safely<T extends HasName>(value: T): T {
	let result = {} as T;
	Object.assign(result, value);
	// @ts-ignore
	result.name = result.name.toLowerCase().replaceAll(' ', '_');
	return result;
}

function realize_node(
	template: NodeTemplate,
	node_definitions: NodeDefinition[]
): NodeConfiguration {
	const definition = node_definitions.find(
		(def) => def.name === template.definition
	);
	if (!definition) {
		console.error(
			`Error realizing node ${template.name}: definition for ${template.definition} not found in database`
		);
		throw 'Realize node error';
	}
	return {
		name: definition.name,
		human_name: template.human_name,
		executable: definition.executable,
		config: template.config,
		definition: definition,
	};
}

export const realize = {
	mission: realize_mission,
	capture_group: realize_capture_group,
	sensor: realize_sensor,
	node: realize_node,
};

function templatize_node(config: NodeConfiguration): NodeTemplate {
	return {
		name: config.name,
		human_name: config.human_name,
		config: config.config,
		definition: config.definition.name,
	};
}

function templatize_sensor(config: SensorConfiguration): SensorTemplate {
	return {
		name: config.name,
		nodes: config.nodes.map(templatize_node),
	};
}

function templatize_capture_group(
	config: CaptureGroupConfiguration
): CaptureGroupTemplate {
	return {
		name: config.name,
		activation_alt: config.activation_alt,
		deactivation_alt: config.deactivation_alt,
		cadence: config.cadence,
		sensors: config.sensors.map(templatize_sensor),
	};
}

function templatize_mission(config: MissionConfiguration): MissionTemplate {
	return {
		aircraft: config.aircraft,
		payload: config.payload,
		altitude: config.altitude,
		name: config.name,
		capture_groups: config.capture_groups.map(templatize_capture_group),
	};
}

export const templatize = {
	mission: templatize_mission,
	capture_group: templatize_capture_group,
	sensor: templatize_sensor,
	node: templatize_node,
};
