<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import type { Computer } from '@/datastructures/status/computer';

export default defineComponent({
	props: {
		temperatures: {
			type: Object as PropType<Readonly<Map<string, number>>>,
			required: true,
		},
	},
});
</script>

<template>
	<div class="temperature-entries">
		<div class="entry" v-for="[label, reading] in temperatures">
			<span class="label">{{ label }}:</span>
			<span>{{reading.toFixed(2)}} &deg;C</span>
		</div>
		<!--<span class="exit-button">X</span>-->
	</div>
</template>

<style lang="scss" scoped>
.temperature-entries {
	display: flex;
	flex-direction: column;

	.entry {
		display: flex;
		flex-direction: row;
		justify-content: space-between;

		padding: 0.25rem 1rem;

		:not(.label) {
			text-align: right;
			justify-self: end;
			margin-left: 1em;
		}
	}

	.exit-button {
		top: 1px;
		right: 0.75rem;
		font-size: 0.75rem;
		color: var(--color-red);
	}
}
</style>
