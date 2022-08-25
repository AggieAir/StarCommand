<template>
	<div class="vmeter">
		<div class="fill" :style="fill_style"></div>
	</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { BarObject } from '@/datastructures/rendering';

export default defineComponent({
	props: {
		data: {
			type: BarObject,
			required: true,
		},
	},
	computed: {
		fill_style() {
			const { data } = this;
			const good = 'var(--color-success)';
			const warning = 'var(--color-warning)';
			const danger = 'var(--color-error)';
			const backgroundColor = (() => {
				if (data.value <= data.low) {
					return good;
				} else if (data.value > data.high || data.value >= data.max) {
					return danger;
				} else {
					return warning;
				}
			})();
			const height = `${(100 * data.value) / data.max}%`;
			return { backgroundColor, height };
		},
	},
});
</script>

<style scoped lang="scss">
.vmeter {
	background-color: var(--color-background-soft);
	border: 1px solid var(--color-background-soft);
	border-radius: 0.5rem;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: flex-end;
	clip-path: inset(0 0 0 0 round 0.5rem);

	.fill {
		// border-radius: calc(0.5rem - 1px);
		padding: 1px;
		width: 100%;
	}
}
</style>
