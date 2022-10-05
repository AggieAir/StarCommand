<script lang="ts">
import type { NodeDefinition } from '@/datastructures/definition';
import { defineComponent, type PropType } from 'vue';
import NodeListing from './NodeListing.vue';

export default defineComponent({
	props: {
		nodes: {
			type: Array as PropType<NodeDefinition[]>,
			required: true,
		},
	},
	components: { NodeListing },
});
</script>

<template>
	<div class="node-list">
		<NodeListing v-for="node in nodes" :key="node.name" :definition="node" />
		<div class="empty" v-if="nodes.length === 0">
			No nodes of this type in database
		</div>
	</div>
</template>

<style lang="scss" scoped>
.node-list {
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
	height: 30rem;
	overflow-y: scroll;

	.empty {
		color: var(--color-border-hover);
		font-style: italic;
	}
}
</style>
