<script lang="ts">
import type { Sensor } from '@/datastructures/status/sensor';
import { defineComponent, type PropType } from 'vue';
import LED from '@/components/widgets/LED.vue';
import NodeDataField from '../sensors/NodeDataField.vue';
import { Status } from '@/datastructures/status/status_enum';

export default defineComponent({
	props: {
		sensor: {
			type: Object as PropType<Sensor>,
			required: true,
		},
	},
	components: {
		LED,
		NodeDataField,
	},
	computed: {
		led_color() {
			switch (this.sensor.status_code) {
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
		sensor_node() {
			return this.sensor.nodes[0];
		},
		failures() {
			return this.sensor.nodes.reduce(
				(acc, node) => acc + node.state.failures,
				0
			);
		},
		led_blink() {
			return (
				this.sensor.status_code === Status.ERROR ||
				this.sensor.status_code === Status.INITIALIZING
			);
		},
	},
});
</script>

<template>
	<div class="sensor-overview">
		<div class="header">
			<span>{{ sensor.name }}</span>
			<LED small :[led_color]="true" class="sensor-led" :blink="led_blink" />
		</div>
		<div class="overview">
			<div class="detail">
				<span class="label">Failures</span>
				<span class="value">{{ failures }}</span>
			</div>
			<NodeDataField
				v-for="field in sensor_node.state.data"
				:key="field.definition.name"
				:data-field="field"
			/>
		</div>
	</div>
</template>

<style scoped lang="scss">
.sensor-overview {
	.header {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 0.25rem;
		font-size: 1rem;
		font-weight: bold;

		width: 150px;
	}

	.overview {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		overflow-y: scroll;
		padding: 0.25rem;
		font-size: 0.8rem;

		width: 150px;

		.detail {
			display: flex;
			.label {
				&::after {
					content: ':';
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
