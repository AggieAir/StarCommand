<script lang="ts">
import Database, { export_stored_object, Table } from '@/database';
import type {
	MissionConfiguration,
	MissionMetadata,
} from '@/datastructures/configuration';
import { Alert, useAlert } from '@/stores/alert';
import { useContextMenu } from '@/stores/context';
import { defineComponent, type PropType } from 'vue';

export default defineComponent({
	props: {
		metadata: {
			type: Object as PropType<MissionMetadata>,
			required: true,
		},
	},
	data: () => ({
		context_menu_data: [
			{
				label: 'Export',
			},
			{
				label: 'Delete',
				dangerous: true,
			},
		],
	}),
	computed: {
		description() {
			return `${this.metadata.date} | ${this.metadata.aircraft} | ${this.metadata.payload}`;
		},
	},
	methods: {
		async openContextMenu(event: MouseEvent) {
			const context_menu = useContextMenu();
			const position = {
				x: event.clientX,
				y: event.clientY,
			};
			const result = await context_menu.open(this.context_menu_data, position);
			switch (result) {
				case 0:
					const db = await Database.get_database();
					export_stored_object(
						await db.get<MissionConfiguration>(
							Table.MissionConfiguration,
							this.metadata.uuid
						),
						Table.MissionConfiguration
					);
					break;
				case 1:
					const response = await new Alert(
						`Delete ${this.metadata.name}?`,
						'Really delete this config? This operation is irreversible.',
						[
							{
								label: 'No',
							},
							{
								label: 'Yes',
								dangerous: true,
							},
						]
					).show();
					if (response === 1) {
						const db = await Database.get_database();
						await db.delete(Table.MissionMetadata, this.metadata.name);
						await db.delete(Table.MissionConfiguration, this.metadata.uuid);
						this.$emit('reload');
					}
					break;
			}
		},
	},
	emits: ['open', 'reload'],
});
</script>

<template>
	<div
		class="list-entry"
		@click.right.stop.prevent="openContextMenu"
		@click="$emit('open', metadata)"
		:title="description"
	>
		<div class="name">{{ metadata.name }}</div>
		<div class="description">{{ description }}</div>
	</div>
</template>

<style scoped lang="scss">
.list-entry {
	cursor: pointer;
	padding: 0.5rem;
	text-align: left;

	.name {
		font-weight: bold;
	}

	.description {
		font-size: 0.8rem;
		font-weight: lighter;
		padding-left: 1em;
	}
}
</style>
