<script lang="ts">
import {
	check_constraint,
	type ConfigEntries,
	type MissionConfiguration,
} from '@/datastructures/configuration';
import type { ConfigEntryDefinition } from '@/datastructures/definition';
import { useConfigStore } from '@/stores/config';
import { defineComponent, type PropType } from 'vue';
import FieldInput from './FieldInput.vue';

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
	computed: {
		valid() {
			return this.error === null;
		},
	},
	expose: ['valid'],
	data: () => ({
		error: null as string | null,
		value: null as string | null,
	}),
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
			const num = typeof value === 'number' ? value : parseFloat(value);
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
			const { value } = event.target as HTMLInputElement;
			const { value: num } = this.validate(value);
			this.$emit('update:modelValue', num);
		},
	},
	emits: ['update:modelValue'],
	watch: {
		modelValue: {
			handler(value: number) {
				this.validate(value);
				this.value = value?.toString() ?? '';
			},
			immediate: true,
		},
	},
	components: { FieldInput },
});
</script>

<template>
	<div class="floating-point-field" @click.stop :title="definition.description">
		<span class="label">{{ definition.human_name }}</span>
		<span class="required" v-if="definition.required">*</span>
		<FieldInput
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
.floating-point-field {
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

	.field-input {
		flex: 0 1 14rem;
	}

	.required {
		color: var(--color-error);
	}
}
</style>
