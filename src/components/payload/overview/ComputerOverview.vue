<script lang="ts">
import { defineComponent } from 'vue';
import { Computer } from '@/datastructures/status';
import Meter from '@/components/widgets/Meter.vue';

export default defineComponent({
	props: {
		computer: {
			type: Computer,
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
		<Meter :data="computer.cpu_avg" />
		<span class="label">RAM</span>
		<Meter :data="computer.memory.bar_obj" />
		<span class="label">Swap</span>
		<Meter :data="computer.swap.bar_obj" />
		<span class="label">Disk</span>
		<Meter :data="computer.disk_avg" />
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
