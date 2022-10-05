<script lang="ts">
import type { NodeDefinition } from '@/datastructures/definition';
import { defineComponent, type PropType } from 'vue';

export default defineComponent({
	props: {
		definition: {
			type: Object as PropType<NodeDefinition>,
			required: true,
		},
	},
	emits: ['selected'],
	computed: {
		takes_input(): boolean {
			return this.definition.input_type !== '';
		},
		makes_output(): boolean {
			return this.definition.output_type !== '';
		},
	},
});
</script>

<template>
	<div class="node-listing">
		<div class="header">
			<span class="name">{{ definition.human_name }}</span>
			<span class="input" v-if="takes_input">
				input: {{ definition.input_type }}
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
	gap: 1em;

	.header {
		display: grid;
		grid-template-columns: 1fr max-content;
		grid-template-rows: 1fr 1fr;
		grid-template-areas:
			'name input'
			'name output';

		.name {
			font-weight: bold;
			font-size: 1.4em;
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
	}
}
</style>
