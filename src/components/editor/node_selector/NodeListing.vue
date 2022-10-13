<script lang="ts">
import type { NodeDefinition } from '@/datastructures/definition';
import { useConfigStore } from '@/stores/config';
import { defineComponent, type PropType } from 'vue';

export default defineComponent({
	props: {
		definition: {
			type: Object as PropType<NodeDefinition>,
			required: true,
		},
	},
	computed: {
		takes_input(): boolean {
			return this.definition.input_type !== '';
		},
		makes_output(): boolean {
			return this.definition.output_type !== '';
		},
	},
	methods: {
		add_to_sensor() {
			const store = useConfigStore();
			if (!store.selected_sensor) {
				return;
			}
			store.add_node(this.definition, store.selected_sensor);
		},
	},
});
</script>

<template>
	<div class="node-listing" @click="add_to_sensor">
		<div class="header">
			<span class="name">{{ definition.human_name }}</span>
			<span class="input">
				input: {{ takes_input ? definition.input_type : 'none' }}
			</span>
			<span class="output" v-if="makes_output">
				output: {{ definition.output_type }}
			</span>
		</div>
		<div class="description">
			{{ definition.description }}
		</div>
	</div>
</template>

<style lang="scss" scoped>
.node-listing {
	display: flex;
	flex-direction: column;
	font-size: 0.8rem;
	gap: 0.25em;
	// padding: 0.25rem;

	&:not(:last-child)::after {
		content: '';
		border-bottom: 1px solid var(--color-border);
		width: 80%;
		margin: 0 auto;
		margin-top: 0.5rem;
	}

	&:hover {
		background-color: var(--color-background-soft);
	}

	.header {
		display: grid;
		grid-template-columns: 1fr max-content;
		grid-template-rows: 1fr 1fr;
		grid-template-areas:
			'name input'
			'name output';

		align-items: center;

		.name {
			font-weight: bold;
			font-size: 1.2em;
			grid-area: name;
		}

		.input {
			font-size: 0.7em;
			grid-area: input;
		}

		.output {
			font-size: 0.7em;
			grid-area: output;
		}
	}

	.description {
		word-wrap: break-word;
		position: relative;
		width: auto;
		overflow-x: hidden;
	}
}
</style>
