<script lang="ts">
import type { TabDefinition } from '@/components/widgets/Tabs.vue';
import { useConfigStore } from '@/stores/config';
import { defineComponent } from 'vue';
import type { onBeforeRouteUpdate } from 'vue-router';
import Tabs from '../../widgets/Tabs.vue';
import CaptureGroupEditor from './CaptureGroupEditor.vue';

export default defineComponent({
	computed: {
		capture_groups() {
			return useConfigStore().config?.capture_groups ?? [];
		},
		tabs(): TabDefinition[] {
			return [
				...(useConfigStore().config?.capture_groups.map<TabDefinition>(
					(group) => ({
						name: group.name,
						text: group.name,
					})
				) ?? []),
				{
					name: '__add',
					text: '+',
					just_emit: true,
				},
			];
		},
	},
	methods: {
		handle_select(selected: string) {
			if (selected === '__add') {
				const next_index = this.capture_groups.reduce((acc, group) => {
					const index = parseInt(
						group.name.slice(group.name.lastIndexOf('_') + 1)
					);
					if (isNaN(index)) {
						// This capture group isn't indexed, ignore
						return acc;
					} else if (index >= acc) {
						// This capture group index is the highest we've encountered, so
						// return one greater than it
						return index + 1;
					} else {
						// This is not the highest capture group index we've encountered,
						// so return the previous highest.
						return acc;
					}
				}, 0);
				useConfigStore().add_capture_group(`capture_group_${next_index}`);
			}
		},
		remove(selected: string) {
			if (selected !== '__add') {
				const group = this.capture_groups.find(
					(group) => group.name === selected
				);
				if (!group) {
					return;
				}
				useConfigStore().remove_capture_group(group);
			}
		},
	},
	components: { Tabs, CaptureGroupEditor },
});
</script>

<template>
	<Tabs
		:tabs="tabs"
		@tab:select="handle_select"
		@click:middle="remove"
		align_start
		scrolling_tabbar
	>
		<template
			v-for="(group, index) in capture_groups"
			:key="index"
			#[group.name]
		>
			<CaptureGroupEditor :group="group.name" />
		</template>
	</Tabs>
</template>
