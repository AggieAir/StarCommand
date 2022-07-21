<script lang="ts">
import { Status, type Sensor } from '@/datastructures/status';
import { defineComponent, type PropType } from 'vue';
import LED from '@/components/widgets/LED.vue';
import NodeDataField from '../sensors/NodeDataField.vue';

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
			switch (this.sensor.status) {
				case Status.OK:
					return 'green';
				case Status.OFFLINE:
				case Status.NEVER_ONLINE:
					return 'off';
				case Status.ERROR:
				case Status.FATAL:
					return 'red';
				case Status.WAITING:
					return 'blue';
				default:
					return 'yellow';
			}
		},
		sensor_node() {
			return this.sensor.nodes[0];
		},
	},
});
</script>

<template>
	<div class="sensor-header">
		<span>{{ sensor.name }}</span>
		<LED small :[led_color]="true" class="sensor-led" />
	</div>
	<div class="sensor-overview">
		<span class="label">Capture requests</span>
		<span class="value">{{ sensor_node.datapoints.total }}</span>
		<span class="label">Capture failures</span>
		<span class="value">{{ sensor_node.datapoints.failed }}</span>
		<NodeDataField
			v-for="field in sensor_node.data"
			:key="field.definition.name"
			:data-field="field"
		/>
	</div>
</template>

<style scoped lang="scss">
.sensor-header {
	display: flex;
	flex-direction: row;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 0.25rem;
	font-size: 1rem;
	font-weight: bold;
}

.sensor-overview {
	display: grid;
	grid-template-columns: max-content 1fr;
	gap: 0.25rem;
	overflow-y: scroll;
	padding: 0.25rem;
	
}
</style>
