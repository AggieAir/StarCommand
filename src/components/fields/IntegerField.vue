<script lang="ts">
import {
	check_constraint,
	type ConfigEntries,
	type MissionConfiguration,
} from '@/datastructures/configuration';
import type { ConfigEntryDefinition } from '@/datastructures/definition';
import { useConfigStore } from '@/stores/config';
import { defineComponent, type PropType } from 'vue';

export default defineComponent({
	props: {
		modelValue: {
			type: [Number, String],
		},
		definition: {
			type: Object as PropType<ConfigEntryDefinition>,
			required: true,
		},
		configuration: {
			type: Object as PropType<
				ConfigEntries<string | number | boolean | undefined>
			>,
			required: false,
		},
	},
	data: () => ({
		error: null as string | null,
		value: null as string | null,
	}),
	computed: {
		valid() {
			return this.error === null;
		},
	},
	expose: ['valid'],
	methods: {
		validate(value: string | number): {
			value: undefined | number;
			valid: boolean;
		} {
			this.error = null;

			if (this.definition.required && value === '') {
				this.error = 'This field is required.';
				return { value: undefined, valid: false };
			}
			const num =
				typeof value === 'number' ? Math.floor(value) : parseInt(value);
			if (isNaN(num) && value !== '') {
				this.error = 'This field must be a number.';
				return { value: undefined, valid: false };
			}
			const mission_config = useConfigStore().config ?? undefined;
			const result = this.definition.constraints?.reduce(
				(acc, constraint) => {
					const result = check_constraint(
						num,
						constraint,
						mission_config,
						this.configuration
					);
					return {
						valid: result && acc.valid,
						msg: result ? acc.msg : acc.msg + constraint.alert + '\n',
					};
				},
				{ msg: '', valid: true }
			);
			if (!(result?.valid ?? true)) {
				// If result is undefined, the above expression will evaluate to !true == false and this code will not run.
				this.error = result!.msg ?? 'Unknown error.';
			}
			return {
				valid: result?.valid ?? true,
				value: result?.valid ?? true ? num : undefined,
			};
		},
		on_update(event: Event) {
			const value = this.value;
			const { value: num } = this.validate(value ?? '');
			if (num !== undefined) {
				this.value = num.toString();
			}
			this.$emit('update:modelValue', num);
		},
	},
	watch: {
		modelValue: {
			handler(value) {
				this.validate(value); // Update the error variable
				this.value = value;
			},
			immediate: true,
		},
	},
	emits: ['update:modelValue'],
});
</script>

<template>
	<div class="integer-field" @click.stop :title="definition.description">
		<span class="label">{{ definition.human_name }}</span>
		<span class="required" v-if="definition.required">*</span>
		<input
			type="text"
			@change="on_update"
			v-model="value"
			:title="error ?? undefined"
			:class="{ error: error !== null }"
			ref="input"
		/>
	</div>
</template>

<style lang="scss" scoped>
.integer-field {
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

	input {
		background-color: var(--color-background-soft);
		border: none;
		color: var(--color-text);
		text-align: right;
		appearance: textfield;
		flex: 0 1 14rem;

		&:hover {
			background-color: var(--color-background-mute);
		}

		&.error:not(:focus) {
			background-color: var(--color-error);
		}

		&.error:focus {
			color: var(--color-error);
		}
	}

	.required {
		color: var(--color-error);
	}
}
</style>
