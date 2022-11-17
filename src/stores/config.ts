import Database, { Table } from '@/database';
import {
	generate_uuid,
	type MissionMetadata,
	type CaptureGroupConfiguration,
	type MissionConfiguration,
	type NodeConfiguration,
	type SensorConfiguration,
	check_constraint,
	type ConfigEntries,
} from '@/datastructures/configuration';
import {
	ConfigEntryType,
	type NodeDefinition,
} from '@/datastructures/definition';
import type { UUID, ValueOf } from '@/utility_types';
import { defineStore } from 'pinia';
import { Prompt, PromptType } from './prompt';

export const useConfigStore = defineStore({
	id: 'config',
	state: () => ({
		config: null as MissionConfiguration | null,
		selected_sensor: undefined as SensorConfiguration | undefined,
		dirty: false,
		just_loaded: true,
	}),
	actions: {
		async new_config() {
			const name = await new Prompt(
				'New config name',
				'Please input a name for the new configuration:'
			).show();
			this.config = {
				uuid: generate_uuid(),
				name,
				payload: '',
				altitude: 0,
				capture_groups: [],
			};
			this.dirty = true;
		},
		async load_config(uuid: string) {
			const db = await Database.get_database();
			const config = await db.get<MissionConfiguration>(
				Table.MissionConfiguration,
				uuid
			);
			this.just_loaded = true;
			this.config = config;
			console.log('Flagging config as clean');
			this.dirty = false;
		},
		async clone_config(
			uuid: string,
			name?: string,
			date?: string
		): Promise<UUID> {
			const db = await Database.get_database();
			const config = await db.get<MissionConfiguration>(
				Table.MissionConfiguration,
				uuid
			);
			const metadata: MissionMetadata = {
				uuid: generate_uuid(),
				name:
					name ??
					(await new Prompt(
						'New config name',
						'Please input a name for the new configuration:'
					).show()),
				date:
					date ??
					(await new Prompt(
						'New mission date',
						'Please input a date for the new configuration:',
						PromptType.DATE
					).show()),
				payload: config.payload,
				aircraft: config.aircraft?.name ?? 'none',
			};
			config.uuid = metadata.uuid;
			config.name = metadata.name;
			config.date = metadata.date;
			await db.save(Table.MissionMetadata, metadata);
			await db.save(Table.MissionConfiguration, config);
			return config.uuid;
		},
		get_capture_group(name: string): CaptureGroupConfiguration | undefined {
			return this.config?.capture_groups.find((group) => group.name === name);
		},
		get_sensor(group: string, name: string): SensorConfiguration | undefined {
			return this.get_capture_group(group)?.sensors.find(
				(sensor) => sensor.name === name
			);
		},
		get_node(
			group: string,
			sensor: string,
			node_name: string
		): [
			NodeConfiguration | undefined, // The node
			() => NodeConfiguration | undefined, // A function which returns the previous node
			() => NodeConfiguration | undefined // A function which returns the next node
		] {
			return [
				this.get_sensor(group, sensor)?.nodes.find(
					(node) => node.name === node_name
				),
				() => {
					const nodes = this.get_sensor(group, sensor)?.nodes;
					const index = nodes?.findIndex(({ name }) => name === node_name);
					if (index === undefined) return undefined;
					return nodes?.[index - 1];
				},
				() => {
					const nodes = this.get_sensor(group, sensor)?.nodes;
					const index = nodes?.findIndex(({ name }) => name === node_name);
					if (index === undefined) return undefined;
					return nodes?.[index + 1];
				},
			];
		},
		add_capture_group(name: string): CaptureGroupConfiguration | undefined {
			const group = {
				name,
				config: {},
				definition: undefined,
				sensors: [],
			};
			this.dirty = true;
			this.config?.capture_groups.push(group);
			return group;
		},
		add_sensor(
			name: string,
			capture_group: CaptureGroupConfiguration
		): SensorConfiguration {
			const sensor = {
				name,
				nodes: [],
			};
			this.dirty = true;
			capture_group.sensors.push(sensor);
			return sensor;
		},
		add_node(
			definition: NodeDefinition,
			sensor: SensorConfiguration
		): NodeConfiguration {
			const name: string = (() => {
				// Get a list of other nodes that share this node definition
				const other_nodes = sensor.nodes.filter(
					(node) => node.definition.name == definition.name
				);
				if (other_nodes.length > 0) {
					// If those nodes exist, rename them all with indices indicating their relative positioning
					// in the pipeline
					other_nodes.forEach(
						(node, index) => (node.name = `${node.definition.name}_${index}`)
					);
					return `${definition.name}_${other_nodes.length}`;
				} else {
					// Otherwise, just return the name of the definition.
					return definition.name;
				}
			})();
			const config = definition.config_entries.reduce<
				ConfigEntries<string | number | boolean>
			>((acc, entry) => {
				// acc[entry.name] = entry.default ?? '';
				if (entry.default !== undefined) {
					acc[entry.name] = entry.default;
					return acc;
				}
				switch (entry.type) {
					// case ConfigEntryType.INTEGER:
					// case ConfigEntryType.FLOAT:
					// 	acc[entry.name] = 0;
					// 	break;
					case ConfigEntryType.BOOLEAN:
						acc[entry.name] = false;
						break;
					default:
						acc[entry.type] = '';
				}
				return acc;
			}, {});
			const node: NodeConfiguration = {
				name,
				human_name: definition.human_name,
				executable: definition.executable,
				definition,
				config,
			};
			this.dirty = true;
			sensor.nodes.push(node);
			return node;
		},
		remove_capture_group(group: CaptureGroupConfiguration) {
			if (!this.config) return;
			this.dirty = true;
			this.config.capture_groups = this.config.capture_groups.filter(
				(test) => test !== group
			);
		},
		remove_sensor(
			sensor: SensorConfiguration,
			from: CaptureGroupConfiguration
		) {
			this.dirty = true;
			from.sensors = from.sensors.filter((test) => test !== sensor);
		},
		remove_node(node: NodeConfiguration, from: SensorConfiguration) {
			this.dirty = true;
			from.nodes = from.nodes.filter((test) => test !== node);
			// Rename all other nodes in the pipeline to adjust for the removed node
			const matching = from.nodes.filter(
				(test) => test.definition.name == node.definition.name
			);
			if (matching.length === 1) {
				matching[0].name = matching[0].definition.name;
			} else if (matching.length > 1) {
				matching.forEach((node, index) => {
					node.name = `${node.definition.name}_${index}`;
				});
			}
		},
		/**
		 * Promoting a node places it earlier in the pipeline by one node.
		 * @param node The node to promote
		 * @param sensor The sensor the node is in. The function will do nothing if the given node is not in this sensor.
		 */
		promote_node(node: NodeConfiguration, sensor: SensorConfiguration) {
			const index = sensor.nodes.findIndex((test) => test === node);
			if (index === -1) {
				throw new Error('Cannot promote a node in a sensor it is not in');
			}
			if (index < 1) {
				throw new Error(
					'Node is already the first node in the sensor, cannot promote'
				);
			}
			this.dirty = true;
			sensor.nodes.splice(index, 1);
			sensor.nodes.splice(index - 1, 0, node);
		},
		demote_node(node: NodeConfiguration, sensor: SensorConfiguration) {
			const index = sensor.nodes.findIndex((test) => test === node);
			if (index === -1) {
				throw new Error('Cannot demote a node in a sensor it is not in');
			}
			if (index >= sensor.nodes.length - 1) {
				throw new Error(
					'Node is already the last node in the sensor, cannot demote'
				);
			}
			this.dirty = true;
			sensor.nodes.splice(index, 1);
			sensor.nodes.splice(index + 1, 0, node);
		},
		async save_config() {
			if (!this.config) {
				throw new Error('No config to save');
			}
			const db = await Database.get_database();
			const metadata = await db.get<MissionMetadata>(
				Table.MissionMetadata,
				this.config.name
			);
			if (!this.config.uuid) {
				this.config.uuid = generate_uuid();
			}
			console.debug('Updating metadata for mission');
			await db.clobber<MissionMetadata>(Table.MissionMetadata, {
				name: this.config.name,
				uuid: this.config.uuid,
				date: this.config.date ?? 'none',
				payload: this.config.payload,
				aircraft: this.config.aircraft?.name ?? 'none',
			});

			await db.clobber<MissionConfiguration>(
				Table.MissionConfiguration,
				this.config
			);
			this.dirty = false;
		},
		select_sensor(sensor: SensorConfiguration) {
			this.selected_sensor = sensor;
		},
		deselect_sensor() {
			this.selected_sensor = undefined;
		},
		validate_node_config(node: NodeConfiguration): boolean[] {
			return Object.entries(node.config).map<boolean>(([field, value]) => {
				const definition = node.definition.config_entries.find(
					({ name }) => name === field
				);
				// If we can't find the definition, that's a problem. Return false.
				if (!definition) return false;
				// Booleans are always valid
				if (definition.type === ConfigEntryType.BOOLEAN) {
					return true;
				}
				// Basic checks that are valid for every type
				if (definition.required && (value === '' || value === undefined)) {
					// An empty required config is invalid.
					return false;
				} else if (value === '' || value === undefined) {
					// An empty non-required config is valid, inherit previous value.
					return true;
				}
				// Type-specific checking
				switch (definition.type) {
					case ConfigEntryType.INTEGER:
						const int =
							typeof value === 'number' ? value : parseInt(value as string);
						if (isNaN(int)) {
							// Needs to be a number
							return false;
						}
						if (int !== Math.floor(int)) {
							// Needs to be an integer
							return false;
						}
					case ConfigEntryType.FLOAT:
						const float =
							typeof value === 'number' ? value : parseFloat(value as string);
						if (isNaN(float)) {
							// Needs to be a number
							return false;
						}
				}
				// Constraint validation
				const constraints =
					definition.constraints?.reduce<boolean>(
						(acc, constraint) =>
							acc &&
							check_constraint(
								value,
								constraint,
								this.config ?? undefined,
								node.config
							),
						true
					) ?? true;
				return constraints;
			}, true);
		},
	},
});

// private functions for validating specific types of config data

export type ConfigStore = ReturnType<typeof useConfigStore>;
