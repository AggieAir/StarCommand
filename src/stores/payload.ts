import type { MissionConfiguration } from '@/datastructures/configuration';
import { Payload } from '@/datastructures/status';
import type { Heartbeat, HeartbeatType } from '@/datastructures/status_input';
import { defineStore } from 'pinia';
import { useDatalink } from './datalink';

export const usePayloadStore = defineStore({
	id: 'payload',
	state: () => {
		useDatalink().datalink.on([], (msg) => {
			usePayloadStore().payload?.handle_update(
				msg.payload as Heartbeat,
				msg.type as HeartbeatType,
				msg.origin as string
			);
		});
		return {
			payload: null as Payload | null,
		};
	},
	getters: {
		config: (state) => {
			return state.payload?.config;
		},
	},
	actions: {
		async initialize(config?: MissionConfiguration) {
			if (config?.uuid) {
				localStorage.setItem('config_uuid', config.uuid);
			}
			if (config && this.payload?.config?.uuid !== config.uuid) {
				this.payload = new Payload(config);
			} else if (!config) {
				// TODO: get config from database
				this.payload = new Payload();
			}
		},
	},
});
