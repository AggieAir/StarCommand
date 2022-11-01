<script lang="ts">
import type { CaptureGroup } from '@/datastructures/status/capture_group';
import { defineComponent, type PropType } from 'vue';
import SensorOverview from './SensorOverview.vue';
import Button from '../../widgets/Button.vue';
import { usePayloadStore } from '@/stores/payload';

export default defineComponent({
	props: {
		capture_group: {
			type: Object as PropType<CaptureGroup>,
			required: true,
		},
	},
	components: { SensorOverview, Button },
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
			if (state === -129) {
				return 'Offline';
			}
			console.warn(`Undefined state: ${state}`);
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
	},
	methods: {
		activate() {
			usePayloadStore().payload?.activate(this.capture_group.name);
		},
		deactivate() {
			usePayloadStore().payload?.deactivate(this.capture_group.name);
		},
	},
});
</script>

<template>
	<div class="capture-group-overview">
		<div class="header">
			<span class="name">
				{{ capture_group.name }}
			</span>
			<div class="state">
				<div :class="{ standby, active, error, initializing }">
					{{ state }}
				</div>
			</div>
			<span class="requests">
				Capture attempts:
				<span>
					{{ capture_group.state.requests ?? 0 }}
				</span>
			</span>
		</div>
		<div class="sensors">
			<SensorOverview
				class="sensor"
				v-for="[name, sensor] in capture_group.sensors"
				:key="name"
				:sensor="sensor"
			/>
			<div class="control">
				<Button class="activate" @click="activate" :disabled="!standby">
					Activate
				</Button>
				<Button class="deactivate" @click="deactivate" :disabled="!active">
					Deactivate
				</Button>
			</div>
		</div>
	</div>
</template>

<style scoped lang="scss">
.capture-group-overview {
	.header {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: 0.5rem;
		.name {
			text-align: left;
			font-weight: bold;
			font-size: 1.1rem;
			flex-grow: 1;
		}

		.requests {
			text-align: right;
			font-size: 0.8rem;
			padding-bottom: 0.25em;

			span {
				display: inline-block;
				width: 3rem;
			}
		}

		.state {
			font-size: 0.8rem;
			text-align: center;

			.standby {
				color: var(--color-cyan);
				padding: 0.25em;
			}
			.active {
				color: var(--color-success);
				padding: 0.25em;
			}

			.error {
				color: var(--color-error);
				padding: 0.25em;
			}

			.initializing {
				color: var(--color-blue);
				font-style: italic;
				padding: 0.25em;
			}
		}
	}

	.sensors {
		display: flex;
		flex-direction: row;
		flex-wrap: none;
		overflow-x: scroll;
		justify-content: flex-start;
		align-items: flex-start;
		margin-top: 1rem;
		gap: 1rem;
		padding-left: 1rem;
		height: calc(100% - 2.75rem);
		.sensor {
			height: 100%;
		}

		.control {
			text-align: center;
			margin-left: auto;
			display: flex;
			flex-direction: column;
			justify-content: center;
			align-items: flex-end;
			justify-self: flex-end;

			.button {
				font-size: 0.9rem;
				width: 6rem;

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
	}

	border: 1px solid var(--color-border);
	padding: 0.5rem;
	min-width: 40%;
}
</style>
