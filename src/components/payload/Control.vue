<script lang="ts">
import { PayloadState } from '@/datastructures/status/payload';
import { useAlert } from '@/stores/alert';
import { usePayloadStore } from '@/stores/payload';
import { defineComponent } from 'vue';
import Button from '../widgets/Button.vue';

export default defineComponent({
	components: { Button },
	computed: {
		ready() {
			return (
				usePayloadStore().payload?.state ===
				PayloadState.READY_FOR_MISSION_START
			);
		},
		safe_to_stop() {
			return usePayloadStore().payload?.state === PayloadState.STANDBY;
		},
	},
	methods: {
		start() {
			usePayloadStore().payload?.start_mission();
		},
		async stop() {
			const result = await useAlert().open({
				title: 'End Mission',
				message:
					'Are you sure you want to end the mission? This action may take a few minutes to complete.',
				buttons: [
					{
						label: 'Cancel',
					},
					{
						label: 'End Mission',
						dangerous: true,
					},
				],
			});
			if (result === 1) {
				usePayloadStore().payload?.end_mission();
			}
		},
	},
});
</script>

<template>
	<div class="payload-control-box">
		<Button class="start" @click="start" :disabled="!ready">
			Start Mission
		</Button>
		<Button class="stop" @click="stop" :disabled="!safe_to_stop">
			End Mission
		</Button>
	</div>
</template>

<style lang="scss" scoped>
.payload-control-box {
	display: flex;
	flex-direction: row;
	justify-content: space-between;
	align-items: center;
	padding: 0.5rem;
	font-size: 1.2rem;
	.button {
		flex-grow: 1;
		text-align: center;

		&.start {
			color: var(--color-green);
		}

		&.stop {
			color: var(--color-red);
		}

		&.disabled {
			color: var(--color-border);
		}
	}
}
</style>
