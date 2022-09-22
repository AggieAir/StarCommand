<script lang="ts">
import type { Storage } from '@/datastructures/status/computer';
import { defineComponent, type PropType } from 'vue';
import Meter from '@/components/widgets/Meter.vue';

export default defineComponent({
	props: {
		disk: {
			type: Object as PropType<Readonly<Storage>>,
			required: true,
		},
		mountpoint: {
			type: String,
			required: true,
		},
	},
	components: {
		Meter,
	},
	methods: {
		make_human_readable(value: number): [string, number] {
			// Data is received in megabytes (2^20)
			const origin_unit = 20;
			// Extract the magnitude of the given value, that's what we want to convert it to
			const target_unit = (() => {
				if (value === 0) {
					return 20;
				}
				return Math.floor((Math.log2(value) + 20) / 10) * 10;
			})();
			const result = (value * 2 ** origin_unit) / 2 ** target_unit;
			// Return the human-readable value, as well as the magnitude to display.
			return [result.toPrecision(4), target_unit];
		},
		magnitude_to_string(magnitude: number): string {
			switch (magnitude) {
				case 20:
					return 'MB';
				case 30:
					return 'GB';
				case 40:
					return 'TB';
				case 50:
					return 'PB';
				default:
					// throw new Error(`Magnitude of ${magnitude} is not valid`);
					return '??';
			}
		},
	},
	computed: {
		storage() {
			const [value, value_magnitude] = this.make_human_readable(this.disk.used);
			const [max, max_magnitude] = this.make_human_readable(this.disk.size);
			return {
				value,
				value_unit: this.magnitude_to_string(value_magnitude),
				max,
				max_unit: this.magnitude_to_string(max_magnitude),
			};
		},
		name() {
			switch (this.mountpoint) {
				case '/':
					return 'root';
				case '/opt/stardos/data':
					return 'dataset';
				case '/opt/stardos/tmp':
					return 'temporary storage';
				default:
					return this.mountpoint;
			}
		},
	},
});
</script>

<template>
	<div class="computer-mount-point">
		<div class="header">Storage: {{ name }}</div>
		<div class="details">
			<span class="label">Storage available:</span>
			<span>{{ storage.max }} {{ storage.max_unit }}</span>
			<span class="label">Storage in use:</span>
			<span>{{ storage.value }} {{ storage.value_unit }}</span>
		</div>
		<div class="meter">
			<Meter :data="disk.bar_object" />
		</div>
	</div>
</template>

<style lang="scss" scoped>
.computer-mount-point {
	.header {
		font-weight: bold;
		font-size: 1.2rem;
		padding: 0.25rem 1rem;
	}

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
}
</style>
