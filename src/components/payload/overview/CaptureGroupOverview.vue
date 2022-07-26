<script lang="ts">
import type { CaptureGroup } from '@/datastructures/status/capture_group';
import { defineComponent, type PropType } from 'vue';
import SensorOverview from './SensorOverview.vue';
import Button from '../../widgets/Button.vue';

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
			console.warn(`Undefined state: ${state}`);
			if (state < 0) {
				return 'Error'; // < 0
			} else if (state < 10) {
				return 'Initializing'; // 0-9
			} else if (state < 12) {
				return 'Running'; // 10, 11
			} else {
				return 'Standby'; // 12-127
			}
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
		activate() {},
		deactivate() {},
	},
});
</script>

<template>
	<div class="capture-group-overview">
		<div class="header">
			<span class="name">
				{{ capture_group.name }}
			</span>
			<div class="buttons">
				<Button
					v-if="standby"
					class="activate"
					:content="state"
					@click="activate"
				/>
				<Button
					v-if="active"
					class="deactivate"
					:content="state"
					@click="deactivate"
				/>
				<div v-if="error" class="error">{{ state }}</div>
				<div v-if="initializing" class="initializing">{{ state }}</div>
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

		.buttons {
			font-size: 0.8rem;
			text-align: center;

			.activate {
				&::after {
					content: attr(content);
					color: var(--color-cyan);
				}

				&:hover::after {
					content: 'Activate';
					color: var(--color-success);
				}
			}
			.deactivate {
				&::after {
					content: attr(content);
					color: var(--color-success);
				}
				&:hover::after {
					content: 'Deactivate';
					color: var(--color-error);
				}
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

		.sensor {
			height: 100%;
		}
	}

	border: 1px solid var(--color-border);
	padding: 0.5rem;
	min-width: 40%;
}
</style>
