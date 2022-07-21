<script lang="ts">
import { defineComponent } from 'vue';
import { Computer } from '@/datastructures/status';
import MeterVertical from '@/components/widgets/MeterVertical.vue';

export default defineComponent({
	props: {
		computer: {
			type: Computer,
			required: true,
		},
	},
	components: {
		MeterVertical,
	},
});
</script>

<template>
	<div class="computer-cpu">
		<span class="computer-cpu-header">CPU usage per core</span>
		<div class="computer-cpu-detail">
			<div class="cpu-meter" v-for="(cpu, idx) in computer.cpus">
				<MeterVertical :data="cpu" />
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
