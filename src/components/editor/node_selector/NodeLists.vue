<script lang="ts">
import Database, { import_file, Table } from '@/database';
import type { NodeDefinition } from '@/datastructures/definition';
import { defineComponent } from 'vue';
import Tabs from '../../widgets/Tabs.vue';
import NodeList from './NodeList.vue';
import Button from '../../widgets/Button.vue';
import { useNotifications } from '@/stores/notifications';
import { Notification, NotificationUrgency } from '@/notification';

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
		find_files() {
			(this.$refs.filepicker as HTMLInputElement).click();
		},
		async import_files() {
			const files = Array.from(
				(this.$refs.filepicker as HTMLInputElement).files ?? []
			);
			const db = await Database.get_database();
			await Promise.all(
				files.map(async (file) => {
					try {
						await import_file(file, db);
					} catch (e) {
						console.error(`Failed to import file ${file.name}: ${e}`);
						useNotifications().show(
							new Notification(
								'Failed to import file',
								`The file ${file.name} could not be imported. Please verify it is not corrupted.`,
								NotificationUrgency.HIGH
							)
						);
					}
				})
			);
			await this.load_definitions();
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
	components: { Tabs, NodeList, Button },
});
</script>

<template>
	<div class="node-lists">
		<Tabs :tabs="tabs">
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
		<Button @click="find_files">Import Definition</Button>
		<input
			style="display: none"
			type="file"
			ref="filepicker"
			@change="import_files"
			accept=".json"
			multiple
		/>
	</div>
</template>

<style lang="scss" scoped>
.node-lists {
	.empty {
		color: var(--color-border-hover);
		font-style: italic;
	}
}
</style>
