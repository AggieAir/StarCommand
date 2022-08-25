<template>
	<div class="meter">
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
		},
	},
	computed: {
		fill_style() {
			const data = this.data ?? new BarObject(0, 1);
			const good = 'var(--color-success)';
			const warning = 'var(--color-warning)';
			const danger = 'var(--color-error)';
			const color = (() => {
				if (data.value <= data.low) {
					return good;
				} else if (data.value > data.high || data.value >= data.max) {
					return danger;
				} else {
					return warning;
				}
			})();
			const width = `${(100 * data.value) / data.max}%`;
			return {
				backgroundColor: color,
				width,
			};
		},
	},
});
</script>

<style scoped lang="scss">
.meter {
	width: 100%;
	height: 1rem;
	background-color: var(--color-background-soft);
	border: 1px solid var(--color-background-soft);
	border-radius: 0.5rem;
	clip-path: inset(1px round 0.5rem);
}

.fill {
	height: 100%;
	// border-radius: calc(0.5rem - 1px);
}
</style>
