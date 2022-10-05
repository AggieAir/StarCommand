import Database, { Table } from '@/database';
import {
	generate_uuid,
	type MissionMetadata,
	type CaptureGroupConfiguration,
	type MissionConfiguration,
	type NodeConfiguration,
	type SensorConfiguration,
} from '@/datastructures/configuration';
import type { NodeDefinition } from '@/datastructures/definition';
import type { UUID, ValueOf } from '@/utility_types';
import { defineStore } from 'pinia';
import { Prompt } from './prompt';

export const useConfigStore = defineStore({
	id: 'config',
	state: () => ({
		config: null as MissionConfiguration | null,
		dirty: false,
	}),
	actions: {
		async new_config() {
			this.config = {
				uuid: generate_uuid(),
				name: await new Prompt(
					'New config name',
					'Please input a name for the new configuration:'
				).show(),
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
			const that = this;
			this.config = new Proxy<MissionConfiguration>(config, {
				set(
					target,
					property: keyof MissionConfiguration,
					new_value: ValueOf<MissionConfiguration>
				) {
					if (target[property] === new_value) return true;
					(target[property] as any) = new_value;
					that.dirty = true;
					return true;
				},
			});
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
						'Please input a date for the new configuration:'
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
		): NodeConfiguration | undefined {
			return this.get_sensor(group, sensor)?.nodes.find(
				(node) => node.name === node_name
			);
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
			const node: NodeConfiguration = {
				name,
				human_name: definition.human_name,
				executable: definition.executable,
				definition,
				config: {},
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
			if (!metadata) {
				console.debug('Creating new metadata for mission');
				await db.save<MissionMetadata>(Table.MissionMetadata, {
					name: this.config.name,
					uuid: this.config.uuid,
					date: this.config.date ?? 'none',
					payload: this.config.payload,
					aircraft: this.config.aircraft?.name ?? 'none',
				});
			}
			await db.clobber<MissionConfiguration>(
				Table.MissionConfiguration,
				this.config
			);
			this.dirty = false;
		},
	},
});
