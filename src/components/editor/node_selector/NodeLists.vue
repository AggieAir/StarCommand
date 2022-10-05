<script lang="ts">
import Database, { Table } from '@/database';
import type { NodeDefinition } from '@/datastructures/definition';
import { defineComponent } from 'vue';
import Tabs from '../../widgets/Tabs.vue';
import NodeList from './NodeList.vue';

export default defineComponent({
	data: () => ({
		definitions: null as NodeDefinition[] | null,
		tabs: [
			{
				name: 'sources',
				text: 'Sensors',
			},
			{
				name: 'processors',
				text: 'Processors',
			},
			{
				name: 'sinks',
				text: 'Sinks',
			},
		],
	}),
	methods: {
		async load_definitions() {
			const db = await Database.get_database();
			this.definitions = await db.get_all<NodeDefinition>(Table.NodeDefinition);
		},
	},
	mounted() {
		this.load_definitions();
	},
	computed: {
		sources(): NodeDefinition[] | undefined {
			return this.definitions?.filter((node) => node.input_type === '');
		},
		sinks(): NodeDefinition[] | undefined {
			return this.definitions?.filter((node) => node.output_type === '');
		},
		processors(): NodeDefinition[] | undefined {
			return this.definitions?.filter(
				(node) => node.input_type !== '' && node.output_type !== ''
			);
		},
	},
	components: { Tabs, NodeList },
});
</script>

<template>
	<Tabs class="node-lists" :tabs="tabs">
		<template #sources>
			<NodeList v-if="sources" :nodes="sources" />
			<div v-else class="empty">Loading...</div>
		</template>
		<template #processors>
			<NodeList v-if="processors" :nodes="processors" />
			<div v-else class="empty">Loading...</div>
		</template>
		<template #sinks>
			<NodeList v-if="sinks" :nodes="sinks" />
			<div v-else class="empty">Loading...</div>
		</template>
	</Tabs>
</template>

<style lang="scss" scoped>
.node-lists {
	.empty {
		color: var(--color-border-hover);
		font-style: italic;
	}
}
</style>
