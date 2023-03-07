<script lang="ts">
import { PayloadState } from '@/datastructures/status/payload';
import { useAlert } from '@/stores/alert';
import { usePayloadStore } from '@/stores/payload';
import { useSettingsStore } from '@/stores/settings';
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
		external_control() {
			return usePayloadStore().payload?.external_control;
		},
		safe_to_stop() {
			const state = usePayloadStore().payload?.state;
			const estop_allowed = usePayloadStore().allow_estop;
			switch (state) {
				case PayloadState.STANDBY:
					return true;
				case PayloadState.CAPTURING:
					return estop_allowed; // Allow us to do a safe shutdown even while capture is ongoing if abort is enabled.
				default:
					return false;
			}
		},
		running() {
			const state = usePayloadStore().payload?.state;
			switch (state) {
				case PayloadState.STANDBY: // fallthrough
				case PayloadState.CAPTURING: // fallthrough
				case PayloadState.SENSOR_INIT: // fallthrough
				case PayloadState.SENSOR_SHUTDOWN:
					return true;
				default:
					return false;
			}
		},
		show_estop() {
			const estop_allowed = usePayloadStore().allow_estop;
			return (
				estop_allowed &&
				(!this.safe_to_stop || this.external_control) &&
				this.can_abort
			);
		},
		can_abort() {
			const state = usePayloadStore().payload?.state;
			switch (state) {
				// Abort doesn't make sense in these contexts, as a mission is not running during any of these states.
				// Don't show the abort button in these states.
				case PayloadState.CONFIG_INIT: // fallthrough
				case PayloadState.CONTROL_SHUTDOWN: // fallthrough
				case PayloadState.WAITING_FOR_CONFIG: // fallthrough
				case PayloadState.READY_FOR_MISSION_START: // fallthrough
				case PayloadState.READY_FOR_SHUTDOWN:
					return false;
				default:
					return true;
			}
		},
		external_control_override() {
			return useSettingsStore().settings.control_override;
		},
		can_control() {
			return this.external_control || this.external_control_override;
		},
		start_mission_title() {
			if (this.external_control && !this.can_control) {
				return 'Payload is under pilot control. Software controls are offline.';
			}
			if (this.running) {
				return 'Mission is already running';
			}
			if (!this.ready) {
				return 'Payload is not ready to start';
			}
		},
		end_mission_title() {
			if (this.external_control && !this.can_control) {
				return 'Payload is under pilot control. Software controls are offline.';
			}
			if (!this.running) {
				return 'Mission is not running';
			}
			if (
				usePayloadStore().payload?.state === PayloadState.CAPTURING &&
				!this.safe_to_stop
			) {
				return 'Payload is collecting data. Please shut down all capture groups before ending mission.';
			}
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
		async estop() {
			if (!usePayloadStore().allow_estop) {
				console.error(
					'Mission abort was attempted without enabling in settings. Refusing to comply.'
				);
				return;
			}
			const result = await useAlert().open({
				title: 'Abort Mission',
				message:
					'Are you sure you want to abort the mission? Any unsaved data will be lost!',
				buttons: [
					{
						label: 'Cancel',
					},
					{
						label: 'Abort Mission',
						dangerous: true,
					},
				],
			});
			if (result === 1) {
				usePayloadStore().payload?.abort_mission();
			}
		},
	},
});
</script>

<template>
	<div class="payload-control-box">
		<Button
			class="start"
			@click="start"
			:disabled="!ready || !can_control"
			:title="start_mission_title"
		>
			Start Mission
		</Button>
		<Button class="stop" @click="estop" v-if="show_estop">
			Abort Mission
		</Button>
		<Button
			class="stop"
			@click="stop"
			:disabled="!safe_to_stop || !can_control"
			:title="end_mission_title"
			v-else
		>
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
