<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import type { Payload } from '@/datastructures/status/payload';
import Computer from '../Computer.vue';
import CaptureGroupOverview from './CaptureGroupOverview.vue';

export default defineComponent({
	props: {
		payload: {
			type: Object as PropType<Payload>,
		},
	},
	components: {
		Computer,
		CaptureGroupOverview,
	},
});
</script>

<template>
	<div class="mission-overview">
		<Computer
			:computer="payload?.payload_computer"
			role="Payload"
			class="payload-computer"
		/>
		<Computer
			:computer="payload?.copilot_computer ?? undefined"
			role="Copilot"
			class="copilot-computer"
		/>
		<div class="capture-groups">
			<CaptureGroupOverview
				v-for="[name, capture_group] in payload?.capture_groups ?? []"
				:key="name"
				:capture_group="capture_group"
			/>
		</div>
	</div>
</template>

<style lang="scss" scoped>
$fr1: 5.9rem;

.mission-overview {
	display: grid;
	grid-template-columns: [payload-computer] 1fr [copilot-computer] 1fr;
	grid-template-rows: [computers] calc($fr1 * 3) [sensors] calc($fr1 * 2); // [coprocessors] calc(
	// 	$fr1 * 2
	// );
	grid-template-areas:
		'payload-computer copilot-computer'
		'sensors sensors';
	// 'coprocessors coprocessors';
	row-gap: 0.5rem;
	column-gap: 1rem;
	align-items: center;
	justify-content: center;

	.payload-computer {
		grid-area: payload-computer;
	}

	.copilot-computer {
		grid-area: copilot-computer;
	}

	.capture-groups {
		grid-area: sensors;
		display: flex;
		flex-direction: row;
		flex-wrap: none;
		overflow-x: scroll;
		justify-content: flex-start;
		align-items: flex-start;
		gap: 1rem;
		height: 100%;
		div {
			height: 100%;
			flex-grow: 1;
		}
	}
}
</style>
