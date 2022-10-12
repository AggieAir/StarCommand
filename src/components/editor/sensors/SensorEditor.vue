<script lang="ts">
import { useConfigStore } from '@/stores/config';
import { defineComponent } from 'vue';
import FieldInput from '../../fields/FieldInput.vue';
import NodeEditor from './NodeEditor.vue';
import Button from '../../widgets/Button.vue';

export default defineComponent({
	props: {
		sensor: {
			type: String,
			required: true,
		},
		group: {
			type: String,
			required: true,
		},
	},
	computed: {
		config() {
			// We can safely assume that this sensor config exists, as the component
			// will be loaded dynamically based on the group and sensor values passed
			// to the component.
			return useConfigStore().get_sensor(this.group, this.sensor)!;
		},
		selected() {
			return useConfigStore().selected_sensor === this.config;
		},
	},
	data: () => ({
		selected_node: null as number | null,
	}),
	methods: {
		select() {
			useConfigStore().select_sensor(this.config);
		},
		select_node(index: number) {
			if (this.selected_node === index) {
				this.selected_node = null;
			} else {
				this.selected_node = index;
			}
		},
		remove() {
			const store = useConfigStore();
			store.remove_sensor(this.config, store.get_capture_group(this.group)!);
		},
	},
	components: { FieldInput, NodeEditor, Button },
});
</script>

<template>
	<div class="sensor-editor" :class="{ selected }" @click="select">
		<div class="header">
			<div class="name">
				<span>Sensor name:</span>
				<FieldInput v-model="config.name" />
			</div>
		</div>
		<div v-if="config.nodes.length === 0" class="empty">
			this sensor has no nodes yet
		</div>
		<NodeEditor
			v-for="(node, index) in config.nodes"
			:key="node.name"
			:node="node.name"
			:sensor="sensor"
			:group="group"
			@select="select_node(index)"
			:selected="selected_node == index"
		/>
		<Button class="remove" @click="remove">Remove sensor</Button>
	</div>
</template>

<style lang="scss" scoped>
.sensor-editor {
	flex: 0 0 auto;
	display: flex;
	flex-direction: column;
	padding: 9px;
	border: 1px solid var(--color-border);

	&.selected {
		border: 1px solid var(--color-blue);
	}

	.header {
		display: flex;
		margin-bottom: 10px;

		.name {
			text-align: left;
			flex-grow: 1;
		}
	}

	.remove {
		color: var(--color-red);
		margin-top: 0.5em;
	}

	.empty {
		color: var(--color-border-hover);
	}

	.button {
		text-align: center;
	}
}
</style>
