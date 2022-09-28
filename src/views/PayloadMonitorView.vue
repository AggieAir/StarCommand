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
import { type Payload, PayloadState } from '@/datastructures/status/payload';
import Tabs from '../components/widgets/Tabs.vue';
import Button from '../components/widgets/Button.vue';
import Control from '../components/payload/Control.vue';
import type { CaptureGroup } from '@/datastructures/status/capture_group';
import CaptureGroupDetail from '../components/payload/details/CaptureGroupDetail.vue';

export default defineComponent({
	setup() {
		const payloadStore = usePayloadStore();
		return { payloadStore, PayloadState };
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
		capture_groups(): [string, CaptureGroup][] {
			return [...(this.payload?.capture_groups.entries() ?? [])];
		},
		tabs() {
			// @ts-ignore
			const capture_groups = this.capture_groups;
			return [
				{
					name: 'overview',
					text: 'Overview',
				},
				...capture_groups.map(([name]: [string, any]) => ({
					name,
					text: `Capture group ${name}`,
				})),
			];
		},
	},
	components: {
		ComputerStatus,
		MissionOverview,
		Tabs,
		Button,
		Control,
		CaptureGroupDetail,
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
			<span class="monitor-subtitle" v-if="payload">
				{{ payload.state_string }}
			</span>
		</div>
		<Tabs :tabs="tabs" bottom class="main">
			<template #overview>
				<MissionOverview
					class="view monitor-overview"
					v-if="payload"
					:payload="payload"
				/>
			</template>
			<template v-for="[name, group] in capture_groups" #[name] :key="name">
				<CaptureGroupDetail class="view" :capture_group="group" />
			</template>
		</Tabs>
		<Control />
	</div>
</template>

<style lang="scss" scoped>
.monitor-view {
	user-select: none;
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

			&.shutdown-button {
				&::after {
					content: attr(data-state);
				}

				&:hover::after {
					content: 'End Mission';
					color: var(--color-error);
				}
			}

			&.start-button {
				&::after {
					content: attr(data-state);
				}

				&:hover::after {
					content: 'Start Mission';
					color: var(--color-success);
				}
			}
		}
	}

	.main {
		flex-grow: 1;
		max-height: 100%;
		.view {
			height: 100%;
			overflow-y: scroll;
		}
	}
}
</style>
