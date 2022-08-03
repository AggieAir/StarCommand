<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
	emits: ['click:right', 'click:middle', 'click'],
	data: () => ({
		hover: false,
	}),
	props: {
		disabled: {
			type: Boolean,
			default: false,
		},
	},
});
</script>

<template>
	<div
		:class="disabled ? 'button disabled' : 'button'"
		@click.stop="disabled ? null : $emit('click')"
		@click.right.stop.prevent="disabled ? null : $emit('click:right')"
		@click.middle.stop="disabled ? null : $emit('click:middle')"
	>
		<slot />
	</div>
</template>

<style lang="scss" scoped>
@import '@/assets/base.scss';

.button {
	cursor: pointer;
	padding: 0.25em;

	&:hover:not(.disabled) {
		background-color: var(--color-background-soft);
	}

	// This class will be set by the parent component if needed.
	&.dangerous {
		color: var(--color-error);
	}

	&.disabled {
		cursor: not-allowed;
	}
}
</style>
