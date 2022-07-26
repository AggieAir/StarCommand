<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import type { Computer } from '@/datastructures/status/computer';
import Meter from '@/components/widgets/Meter.vue';

export default defineComponent({
	props: {
		computer: {
			type: Object as PropType<Readonly<Computer>>,
			required: true,
		},
	},
	components: {
		Meter,
	},
});
</script>

<template>
	<div class="computer-overview">
		<span class="label">CPU</span>
		<Meter :data="computer.cpus.bar_object" />
		<span class="label">RAM</span>
		<Meter :data="computer.memory.bar_object" />
		<span class="label">Swap</span>
		<Meter :data="computer.swap.bar_object" />
		<span class="label">Disk</span>
		<Meter :data="computer.main_disk?.bar_object" />
	</div>
</template>

<style lang="scss" scoped>
.computer-overview {
	display: grid;
	grid-template-columns: [label] max-content [bar] 1fr;
	row-gap: 0.5rem;
	column-gap: 1rem;
	align-items: center;
	justify-content: center;

	.label {
		text-align: right;
		justify-self: end;

		&::after {
			content: ':';
		}
	}
}
</style>
