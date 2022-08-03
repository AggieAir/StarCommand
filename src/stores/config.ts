import Database, { Table } from '@/database';
import {
	generate_uuid,
	type MissionMetadata,
	type CaptureGroupConfiguration,
	type MissionConfiguration,
	type NodeConfiguration,
	type SensorConfiguration,
} from '@/datastructures/configuration';
import { defineStore } from 'pinia';

export const useConfigStore = defineStore({
	id: 'config',
	state: () => ({
		config: null as MissionConfiguration | null,
	}),
	actions: {
		new_config() {
			this.config = {
				uuid: generate_uuid(),
				name: '',
				payload: '',
				altitude: 0,
				capture_groups: [],
			};
		},
		async load_config(uuid: string) {
			const db = await Database.get_database();
			const config = await db.get<MissionConfiguration>(
				Table.MissionConfiguration,
				uuid
			);
			this.config = config;
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
					date: this.config.date ?? 'unknown',
					payload: this.config.payload,
					aircraft: this.config.aircraft?.name ?? 'unknown',
				});
			}
		},
	},
});
