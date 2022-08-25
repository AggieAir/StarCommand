<template>
	<input class="field-input" ref="input" @change="update" />
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
	props: ['modelValue'],
	emits: ['update:modelValue'],
	methods: {
		update(event: Event) {
			this.$emit(
				'update:modelValue',
				(event.target! as HTMLInputElement).value
			);
		},
	},
	watch: {
		modelValue: {
			handler(value: string) {
				(this.$refs.input as HTMLInputElement).value = value;
			},
		},
	},
	mounted() {
		(this.$refs.input as HTMLInputElement).value = this.modelValue;
	},
});
</script>

<style lang="scss" scoped>
.field-input {
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
</style>
