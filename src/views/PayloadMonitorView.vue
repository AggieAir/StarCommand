<script lang="ts">
import Database, { Table } from '@/database';
import type { MissionConfiguration } from '@/datastructures/configuration';
import {
	DismissReason,
	Notification,
	NotificationUrgency,
} from '@/notification';
import { useNotifications } from '@/stores/notifications';
import { usePayloadStore } from '@/stores/payload';
import { defineComponent } from 'vue';
import ComputerStatus from '@/components/payload/Computer.vue';
import MissionOverview from '../components/payload/overview/MissionOverview.vue';
import type { Payload } from '@/datastructures/status';
import Tabs from '../components/widgets/Tabs.vue';

export default defineComponent({
	setup() {
		const payloadStore = usePayloadStore();
		return { payloadStore };
	},
	async mounted() {
		const config_uuid = localStorage.getItem('config_uuid');
		if (config_uuid) {
			const db = await Database.get_database();
			const config = await db.get<MissionConfiguration>(
				Table.MissionConfiguration,
				config_uuid
			);
			if (config) {
				this.payloadStore.initialize(config);
				return;
			} else {
				localStorage.removeItem('config_uuid');
				useNotifications().show(
					new Notification(
						'Mission not found.',
						'The mission loaded from the last session was not found in the database. An unconfigured payload monitor will be used.',
						NotificationUrgency.HIGH
					)
				);
			}
		} else {
			console.warn('No persistent configuration found');
			useNotifications().show(
				new Notification(
					'No mission configuration loaded.',
					'No prior mission was loaded. Click the "Load Mission" button to load a mission configuration. In the meantime, an unconfigured payload monitor will be used.',
					NotificationUrgency.NORMAL,
					(reason) => {
						if (reason === DismissReason.USER_CLICK) {
							this.$router.push({ name: 'load' });
						}
					},
					null
				)
			);
		}
		this.payloadStore.initialize();
	},
	computed: {
		// ...mapState(usePayloadStore, ['payload']),
		payload(): Payload | null {
			return usePayloadStore().payload as Payload | null;
		},
	},
	components: {
		ComputerStatus,
		MissionOverview,
		Tabs,
	},
});
</script>

<template>
	<div class="monitor-view">
		<div class="monitor-header">
			<span v-if="payloadStore.payload" class="monitor-title">
				{{ payloadStore.payload.config?.name ?? 'Mission' }} Payload Monitor
			</span>
			<span v-else class="monitor-title">Payload Monitor</span>
			<span class="monitor-subtitle error" v-if="!payloadStore.payload"
				>No payload connected</span
			>
			<span
				class="monitor-subtitle warning"
				v-else-if="!payloadStore.payload.config"
			>
				Mission config could not be loaded, not all features will be available
			</span>
			<span class="monitor-subtitle" v-else> Mission config loaded </span>
		</div>
		<Tabs
			:tabs="[
				{
					name: 'overview',
					text: 'Overview',
				},
			]"
			bottom
			class="main"
		>
			<template #overview>
				<MissionOverview
					class="monitor-overview"
					v-if="payload"
					:payload="payload"
				/>
			</template>
		</Tabs>
	</div>
</template>

<style lang="scss" scoped>
.monitor-view {
	user-select: none;
	gap: 1rem;
	display: flex;
	flex-direction: column;
	height: 100%;

	.monitor-header {
		grid-area: head;

		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 0.5rem;

		.monitor-title {
			font-size: 1.7rem;
			font-weight: bold;
		}

		.monitor-subtitle {
			font-size: 0.8rem;
			font-weight: light;
			font-style: italic;

			&.error {
				color: var(--color-error);
			}

			&.warning {
				color: var(--color-warning);
			}
		}
	}

	.main {
		flex-grow: 1;
	}
}
</style>
