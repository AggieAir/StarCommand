<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import type { Computer } from '@/datastructures/status/computer';
import MeterVertical from '@/components/widgets/MeterVertical.vue';
import { BarObject } from '@/datastructures/rendering';

export default defineComponent({
	props: {
		computer: {
			type: Object as PropType<Readonly<Computer>>,
			required: true,
		},
	},
	components: {
		MeterVertical,
	},
	computed: {
		bar_objects() {
			return this.computer.cpus.usage.map((usage) => {
				const obj = new BarObject(0, 100);
				obj.value = usage;
				return obj;
			});
		},
	},
});
</script>

<template>
	<div class="computer-cpu">
		<span class="computer-cpu-header">CPU usage per core</span>
		<div class="computer-cpu-detail">
			<div class="cpu-meter" v-for="(_, idx) in computer.cpus.usage">
				<MeterVertical :data="bar_objects[idx]" />
				<span class="label">#{{ idx }}</span>
			</div>
		</div>
	</div>
</template>

<style scoped lang="scss">
.computer-cpu-detail {
	display: flex;
	flex-direction: row;
	flex-wrap: wrap;
	justify-content: center;
	align-items: center;
	gap: 0.5rem;

	.cpu-meter {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		.vmeter {
			width: 2rem;
			height: 3rem;
		}
	}
}

.computer-cpu-header {
	text-align: center;
	font-size: 1.1rem;
	font-weight: bold;
	margin-bottom: 0.5rem;
	display: block;
}
</style>
