<script lang="ts">
import type { MissionMetadata } from '@/datastructures/configuration';
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
				label: 'Edit',
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
					this.$emit('edit', this.metadata);
					break;
				case 1:
					this.$emit('delete', this.metadata);
					break;
			}
		},
	},
	emits: ['open', 'edit', 'delete'],
});
</script>

<template>
	<div
		class="list-entry"
		@click.right.stop="openContextMenu"
		@click="$emit('open', metadata)"
	>
		<div class="name">{{ metadata.name }}</div>
		<div class="description">{{ description }}</div>
	</div>
</template>
