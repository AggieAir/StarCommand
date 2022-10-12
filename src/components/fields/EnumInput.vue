<script lang="ts">
import type { ConfigEntryDefinition } from '@/datastructures/definition';
import { defineComponent, type PropType } from 'vue';

export default defineComponent({
	props: {
		modelValue: {
			type: Number,
		},
		definition: {
			type: Object as PropType<ConfigEntryDefinition>,
			required: true,
		},
	},
	data: () => ({
		error: null as string | null,
	}),
	computed: {
		valid() {
			return this.error === null;
		},
	},
	expose: ['valid'],
	methods: {
		validate(value: string | number): undefined | number {
			this.error = null;

			if (this.definition.required && value === '') {
				this.error = 'This field is required.';
				return undefined;
			} else if (value === '') {
				return undefined;
			}

			const num = parseInt(value.toString());
			if (isNaN(num) || this.definition.choices?.[num] === undefined) {
				// Whatever this is, its a corrupted value. Set it to empty and re-run the above checks.
				// This should never happen, but handwritten config files can cause it.
				return this.validate('');
			}

			return num;
		},
		update(event: Event) {
			const { value } = event.target as HTMLInputElement;
			const result = this.validate(value);
			this.$emit('update:modelValue', result);
		},
	},
	emits: ['update:modelValue'],
});
</script>

<template>
	<div class="enum-input" @click.stop :title="definition.description">
		<span class="label">{{ definition.human_name }}</span>
		<span class="required" v-if="definition.required">*</span>
		<select
			@change="update"
			:value="modelValue"
			:title="error ?? undefined"
			:class="{ error: error !== null }"
		>
			<option
				v-for="choice, idx in definition.choices!"
				:value="idx"
				:key="idx"
			>
				{{ choice }}
			</option>
		</select>
	</div>
</template>

<style lang="scss" scoped>
.enum-input {
	display: flex;
	background-color: var(--color-background-soft);
	padding: 0.25rem;
	font-size: 0.8rem;
	align-content: center;
	gap: 0.5rem;

	.label {
		flex: 1 0 auto;
		text-align: left;
	}

	select {
		background-color: var(--color-background-soft);
		border: none;
		color: var(--color-text);
		text-align: right;
		flex: 0 1 14rem;

		&:hover {
			background-color: var(--color-background-mute);
		}

		&.error {
			background-color: var(--color-error);
		}
	}

	.required {
		color: var(--color-error);
	}
}
</style>
