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
	computed: {
		memory() {
			const origin_unit = 'B';
			const target_unit = 'MB';
			const max = this.computer.memory.size;
			const used = this.computer.memory.used;

			return {
				max: Math.round(max * 100) / 100,
				value: Math.round(used * 100) / 100,
				unit: target_unit,
			};
		},
		swap() {
			const origin_unit = 'B';
			const target_unit = 'MB';
			const max = this.computer.swap.size;
			const used = this.computer.swap.used;

			return {
				max: Math.round(max * 100) / 100,
				value: Math.round(used * 100) / 100,
				unit: target_unit,
			};
		},
	},
});
</script>

<template>
	<div class="computer-memory">
		<div class="details">
			<span class="label">System memory installed:</span>
			<span>{{ `${memory.max} ${memory.unit}` }}</span>
			<span class="label">Swap available:</span>
			<span>{{ `${swap.max} ${swap.unit}` }}</span>
			<span class="label">System memory in use:</span>
			<span>{{ `${memory.value} ${memory.unit}` }}</span>
			<span class="label">Swap in use:</span>
			<span>{{ `${swap.value} ${swap.unit}` }}</span>
		</div>
		<div class="meters">
			<span class="label">RAM</span>
			<Meter :data="computer.memory.bar_object" />
			<span class="label">Swap</span>
			<Meter :data="computer.swap.bar_object" />
		</div>
	</div>
</template>

<style lang="scss" scoped>
.computer-memory {
	.details {
		display: grid;
		grid-template-columns: [label1] max-content [field1] 1fr [label2] max-content [field2] 1fr;
		gap: 0.5rem;
		column-gap: 2rem;
		padding: 0.25rem 1rem;

		:not(.label) {
			text-align: right;
			justify-self: end;
		}
	}

	.meters {
		display: grid;
		grid-template-columns: [label] max-content [bar] 1fr;
		gap: 0.5rem;
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
}
</style>
