<script lang="ts">
import type { ProcessingNode } from '@/datastructures/status/node';
import { defineComponent, type PropType } from 'vue';
import LED from '@/components/widgets/LED.vue';
import NodeDataField from '../sensors/NodeDataField.vue';
import { Status } from '@/datastructures/status/status_enum';

export default defineComponent({
	props: {
		node: {
			type: Object as PropType<ProcessingNode>,
			required: true,
		},
	},
	components: {
		LED,
		NodeDataField,
	},
	computed: {
		led_color() {
			switch (this.node.status_code) {
				case Status.ONLINE:
				case Status.RUNNING:
					return 'green';
				case Status.OFFLINE:
					return 'off';
				case Status.ERROR:
					return 'red';
				case Status.STANDBY:
				case Status.INITIALIZING:
					return 'blue';
				default:
					return 'yellow';
			}
		},
		led_blink() {
			return (
				this.node.status_code === Status.ERROR ||
				this.node.status_code === Status.INITIALIZING
			);
		},
		standby() {
			return this.node.state.state >= 12;
		},
		error() {
			return this.node.state.state < 0;
		},
		initializing() {
			return this.node.state.state >= 0 && this.node.state.state < 10;
		},
		active() {
			return this.node.state.state >= 10 && this.node.state.state < 12;
		},
		state() {
			const state = this.node.state.state;
			const def = this.node.definition?.states?.[state];
			if (def) {
				return def;
			}
			if (state === -129) {
				return {
					name: 'Offline',
					description: 'Offline',
				};
			}
			console.warn(`Undefined state: ${state}`);
			if (this.error) {
				return {
					name: 'Error',
					description: 'Unknown error',
				};
			}
			if (this.initializing) {
				return {
					name: 'Initializing',
					description: 'Node is still initializing',
				};
			}
			if (this.active) {
				return {
					name: 'Running',
					description: 'Node is actively processing data',
				};
			}
			return {
				name: 'Standby',
				description: 'Node is waiting for data to process',
			};
		},
	},
});
</script>

<template>
	<div class="node-detail">
		<div class="header">
			<span>{{ node.name }}</span>
			<LED small :[led_color]="true" class="node-led" :blink="led_blink" />
		</div>
		<div class="details">
			<div class="detail">
				<span class="label">State</span>
				<span
					class="value"
					:title="state.description"
					:class="{ standby, active: active, error, initializing }"
					>{{ state.name }}</span
				>
			</div>
			<div class="detail">
				<span class="label">Requests</span>
				<span class="value">{{ node.state.requests }}</span>
			</div>
			<div class="detail">
				<span class="label">Failures</span>
				<span class="value">{{ node.state.failures }}</span>
			</div>
			<NodeDataField
				v-for="field in node.state.data"
				:key="field.definition.name"
				:data-field="field"
			/>
		</div>
	</div>
</template>

<style scoped lang="scss">
.node-detail {
	.header {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 0.25rem;
		font-size: 1rem;
		font-weight: bold;

		gap: 1rem;

		min-width: 150px;
	}

	.details {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		overflow-y: scroll;
		padding: 0.25rem;
		font-size: 0.8rem;

		min-width: 150px;

		.detail {
			display: flex;
			flex-direction: row;
			.label {
				&::after {
					content: ':';
				}

				&.active {
					color: var(--color);
				}
			}

			.value {
				flex-grow: 1;
				text-align: right;
			}
		}
	}
}
</style>
