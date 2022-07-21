<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import type { Payload } from '@/datastructures/status';
import Computer from '../Computer.vue';

export default defineComponent({
	props: {
		payload: {
			type: Object as PropType<Payload>,
		},
	},
	components: {
		Computer,
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
	</div>
</template>

<style lang="scss" scoped>
.mission-overview {
	display: grid;
	grid-template-columns: [payload-computer] 1fr [copilot-computer] 1fr;
	grid-template-rows: [computers] 3fr [sensors] 2fr [coprocessors] 2fr;
	grid-template-areas:
		'payload-computer copilot-computer'
		'sensors sensors'
		'coprocessors coprocessors';
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
}
</style>
