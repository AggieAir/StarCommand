<script lang="ts">
import type { ConfigEntryDefinition } from '@/datastructures/definition';
import { defineComponent, type PropType } from 'vue';

export default defineComponent({
	props: {
		modelValue: {
			type: Boolean,
		},
		definition: {
			type: Object as PropType<ConfigEntryDefinition>,
			required: true,
		},
	},
	data: () => ({
		valid: true,
	}),
	expose: ['valid'],
	methods: {
		toggle() {
			this.$emit('update:modelValue', !this.modelValue);
		},
	},
	computed: {
		title() {
			return this.modelValue ? 'true' : 'false';
		},
	},
});
</script>

<template>
	<div class="boolean-input-field" @click.stop>
		<span class="label" @click.stop="toggle" :title="definition.description">{{
			definition.human_name
		}}</span>
		<span
			class="input"
			:class="{ active: modelValue }"
			:title="title"
			@click.stop="toggle"
		/>
	</div>
</template>

<style lang="scss" scoped>
@import '@/assets/base.scss';
.boolean-input-field {
	display: flex;
	background-color: var(--color-background-soft);
	padding: 0.25rem;
	font-size: 0.8rem;
	align-content: center;

	.label {
		flex: 1 0 auto;
		text-align: left;
	}

	.input {
		background-color: var(--color-background-soft);
		flex: 0 0 1em;
		height: 1em;
		display: block;
		box-shadow: 0px 0px 2px 1px var(--color-red);
		user-select: none;

		&:hover {
			box-shadow: 0px 0px 2px 1px var(--color-green);
			background-color: rgba($color-error, 0.2);
		}

		&.active {
			background-color: var(--color-green);
			box-shadow: 0px 0px 2px 1px var(--color-green);

			&:hover {
				box-shadow: 0px 0px 2px 1px var(--color-red);
			}
		}
	}
}
</style>
