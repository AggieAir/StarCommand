<script lang="ts">
import {
	check_constraint,
	type ConfigEntries,
	type MissionConfiguration,
} from '@/datastructures/configuration';
import type { ConfigEntryDefinition } from '@/datastructures/definition';
import { useConfigStore } from '@/stores/config';
import { defineComponent, type PropType } from 'vue';

// TextField unique identifier. This is used to link an optional datalist
// element with predefined choices to the input element.
let uid = 0;

export default defineComponent({
	props: {
		modelValue: {
			type: String,
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
		// Used to link the input to a datalist element.
		id: `text-field-${uid++}`,
	}),
	methods: {
		validate(value: string): {
			value: undefined | string;
			valid: boolean;
		} {
			this.error = null;

			if (this.definition.required && value === '') {
				this.error = 'This field is required.';
				return { value: undefined, valid: false };
			}
			const mission_config = useConfigStore().config ?? undefined;
			const result = this.definition.constraints?.reduce(
				(acc, constraint) => {
					const result = check_constraint(
						value,
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
				value: result?.valid ?? true ? value : undefined,
			};
		},
		on_update(event: Event) {
			const { value } = event.target as HTMLInputElement;
			const { value: num } = this.validate(value);
			this.$emit('update:modelValue', num);
		},
	},
	watch: {
		modelValue: {
			handler(value: string) {
				this.validate(value); // This will update the error message.
				(this.$refs.input as HTMLInputElement).value = value;
			},
			immediate: true,
		},
	},
	emits: ['update:modelValue'],
});
</script>

<template>
	<div class="text-field" @click.stop :title="definition.description">
		<span class="label">{{ definition.human_name }}</span>
		<span class="required" v-if="definition.required">*</span>
		<input
			type="text"
			@change="on_update"
			:title="error ?? undefined"
			:class="{ error: error !== null }"
			:list="id"
			ref="input"
		/>
		<datalist v-if="definition.choices" :id="id">
			<option
				v-for="(choice, idx) in definition.choices"
				:value="choice"
				:key="idx"
			/>
		</datalist>
	</div>
</template>

<style lang="scss" scoped>
.text-field {
	display: flex;
	background-color: var(--color-background-soft);
	padding: 0.25rem;
	font-size: 0.8rem;
	align-content: center;

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
