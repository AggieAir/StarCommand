<script lang="ts">
import {
	generate_uuid,
	type MissionConfiguration,
} from '@/datastructures/configuration';
import { Alert, useAlert } from '@/stores/alert';
import { useConfigStore } from '@/stores/config';
import { useNotifications } from '@/stores/notifications';
import { defineComponent } from 'vue';
import { onBeforeRouteLeave, onBeforeRouteUpdate } from 'vue-router';
import FieldInput from '../components/fields/FieldInput.vue';
import MissionMetadataEditor from '../components/editor/MissionMetadataEditor.vue';
import NodeLists from '../components/editor/node_selector/NodeLists.vue';

export default defineComponent({
	props: {
		uuid: {
			type: String,
		},
	},
	computed: {
		config(): MissionConfiguration | null {
			return useConfigStore().config;
		},
	},
	watch: {
		uuid: {
			handler(uuid?: string) {
				if (uuid === undefined) {
					useConfigStore().new_config();
				} else {
					useConfigStore().load_config(uuid);
				}
			},
		},
	},
	mounted() {
		if (this.uuid === undefined) {
			useConfigStore().new_config();
		} else {
			useConfigStore().load_config(this.uuid);
		}
	},
	methods: {
		async save() {
			await useConfigStore().save_config();
		},
		async prompt_for_save() {
			if (!useConfigStore().dirty) {
				return true;
			}
			const result = await new Alert(
				'Unsaved Changes',
				'This config has unsaved changes. Would you like to save them before leaving?',
				[
					{
						label: 'Yes',
					},
					{
						label: 'No',
						dangerous: true,
					},
					{
						label: 'Cancel',
					},
				]
			).show();
			if (result === 0) {
				this.save();
			}
			if (result === 2) {
				return false;
			}
			return true;
		},
		async rename(new_name: string) {
			if (!this.config) return;
			if (new_name === this.config?.name) {
				return;
			}
			const result = await new Alert(
				'Rename existing mission?',
				'Do you want to rename this mission, or create a copy with the new name?',
				[
					{
						label: 'Rename',
						dangerous: true,
					},
					{
						label: 'Copy',
					},
					{
						label: 'Cancel',
					},
				]
			).show();
			switch (result) {
				case 1:
					this.config.uuid = generate_uuid();
				// fallthrough
				case 0:
					this.config.name = new_name;
					break;
				case 2:
					// reload the displayed config name
					const tmp = this.config.name;
					this.config.name = '';
					// this is dumb, but it works.
					await new Promise<void>((resolve) => setTimeout(resolve, 10));
					this.config.name = tmp;
					break;
			}
		},
	},
	async beforeRouteLeave() {
		return await this.prompt_for_save();
	},
	async beforeRouteUpdate() {
		return await this.prompt_for_save();
	},
	components: { FieldInput, MissionMetadataEditor, NodeLists },
});
</script>

<template>
	<div class="config-editor-view" v-if="config">
		<div class="header">
			<FieldInput
				class="name"
				:modelValue="config.name"
				@update:modelValue="rename"
			/>
		</div>
		<MissionMetadataEditor />
		<NodeLists />
	</div>
</template>

<style lang="scss" scoped>
.config-editor-view {
	min-width: 60rem;
	.header {
		.name {
			text-align: center;
			font-size: 1.8rem;
		}
		display: flex;
		align-items: top;
		justify-content: center;
		grid-column: 1 / span 2;
	}

	.metadata-editor {
		grid-column: 1 / span 2;
	}

	display: grid;
	grid-template-columns: 1fr 3fr;
	gap: 1rem;
	user-select: none;
}
</style>
