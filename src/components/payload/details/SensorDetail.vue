<script lang="ts">
import type { Sensor } from '@/datastructures/status/sensor';
import { defineComponent, type PropType } from 'vue';
import NodeDetail from './NodeDetail.vue';

export default defineComponent({
	props: {
		sensor: {
			type: Object as PropType<Sensor>,
			required: true,
		},
	},
	components: { NodeDetail },
});
</script>

<template>
	<div class="sensor-detail">
		<div class="header">
			<span class="name">
				{{ sensor.name }}
			</span>
		</div>
		<div class="nodes">
			<NodeDetail
				class="node"
				v-for="node in sensor.nodes"
				:key="node.name"
				:node="node"
			/>
		</div>
	</div>
</template>

<style scoped lang="scss">
.sensor-detail {
	.header {
		.name {
			text-align: left;
			font-weight: bold;
			font-size: 1.1rem;
		}
	}

	.nodes {
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

		.node {
			height: 100%;
		}
	}

	border: 1px solid var(--color-border);
	padding: 0.5rem;
	min-width: 40%;
}
</style>
