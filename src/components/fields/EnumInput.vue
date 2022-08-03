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
