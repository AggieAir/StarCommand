<script lang="ts">
import type { CaptureGroup } from '@/datastructures/status/capture_group';
import { defineComponent, type PropType } from 'vue';
import SensorDetail from './SensorDetail.vue';
import Button from '../../widgets/Button.vue';
import { usePayloadStore } from '@/stores/payload';

export default defineComponent({
	props: {
		capture_group: {
			type: Object as PropType<CaptureGroup>,
			required: true,
		},
	},
	computed: {
		active() {
			return (
				this.capture_group.state.state === 10 ||
				this.capture_group.state.state === 11
			);
		},
		standby() {
			return this.capture_group.state?.state > 11;
		},
		state() {
			const state = this.capture_group.state.state;
			const name = this.capture_group.definition?.states?.[state];
			if (name) {
				return name;
			}
			console.warn(`Undefined state: ${state}`);
			if (state === -129) {
				return 'Offline';
			}
			if (state < 0) {
				return 'Error';
			}
			if (state < 10) {
				return 'Initializing';
			}
			if (state < 12) {
				return 'Running';
			}
			return 'Standby';
		},
		error() {
			return this.capture_group.state.state < 0;
		},
		initializing() {
			return (
				this.capture_group.state.state >= 0 &&
				this.capture_group.state.state < 10
			);
		},
		controllable() {
			return this.capture_group.definition?.manual ?? true;
		},
	},
	methods: {
		activate() {
			usePayloadStore().payload?.activate(this.capture_group.name);
		},
		deactivate() {
			usePayloadStore().payload?.deactivate(this.capture_group.name);
		},
	},
	components: { SensorDetail, Button },
});
</script>

<template>
	<div class="capture-group-detail">
		<div class="header">
			<div class="name">Capture group: {{ capture_group.name }}</div>
			<div class="info">
				<div class="state">
					<div :class="{ standby, active, error, initializing }">
						{{ state }}
					</div>
				</div>
				<div class="requests">
					Capture attempts:
					<span>{{ capture_group.state.requests ?? 0 }}</span>
				</div>
			</div>
		</div>
		<div class="control" v-if="controllable">
			<Button class="activate" @click="activate" :disabled="!standby">
				Activate
			</Button>
			<Button class="deactivate" @click="deactivate" :disabled="!active">
				Deactivate
			</Button>
		</div>
		<div class="sensors">
			<SensorDetail
				class="sensor"
				v-for="[name, sensor] in capture_group.sensors"
				:key="name"
				:sensor="sensor"
			/>
		</div>
	</div>
</template>

<style lang="scss" scoped>
.capture-group-detail {
	.header {
		text-align: center;
		.name {
			font-weight: bold;
			font-size: 1.3rem;
		}

		.info {
			display: flex;
			width: 50%;
			margin: auto;
			justify-content: space-between;
			padding: 0.25rem;
		}
	}

	.control {
		display: flex;
		width: 50%;
		margin: auto;
		margin-bottom: 0.5rem;

		.button {
			flex: 1 0 content;
			text-align: center;
			font-size: 1.1rem;

			&.activate {
				color: var(--color-green);
			}

			&.deactivate {
				color: var(--color-red);
			}

			&.disabled {
				color: var(--color-border);
			}
		}
	}

	.sensors {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.standby {
		color: var(--color-green);
	}

	.active {
		color: var(--color-green);
	}

	.error {
		color: var(--color-red);
	}

	.initializing {
		color: var(--color-blue);
	}
}
</style>
