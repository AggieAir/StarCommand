<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
	emits: ['click:right', 'click:middle', 'click'],
	data: () => ({
		hover: false,
	}),
	props: {
		hasHover: {
			type: Boolean,
			default: false,
		},
	},
});
</script>

<template>
	<div
		class="button"
		@click.stop="$emit('click')"
		@click.right.stop.prevent="$emit('click:right')"
		@click.middle.stop="$emit('click:middle')"
		@mouseenter="hover = true"
		@mouseleave="hover = false"
	>
		<slot v-if="hasHover || !hover" />
		<slot v-else name="hover" />
	</div>
</template>

<style lang="scss" scoped>
@import '@/assets/base.scss';

.button {
	cursor: pointer;
	padding: 0.25em;

	&:hover {
		background-color: var(--color-background-soft);
	}

	// This class will be set by the parent component if needed.
	&.dangerous {
		color: var(--color-error);
	}
}
</style>
