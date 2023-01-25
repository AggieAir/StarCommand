<template>
	<div class="settings-view">
		<div class="header">StarCommand Settings</div>
		<div class="contents">
			<div class="setting">
				<span class="label">Telemetry Address</span>
				<FieldInput v-model="telemetry_address" size="15" />
			</div>
			<div class="setting">
				<span class="label">Telemetry Port</span>
				<FieldInput v-model="telemetry_port" size="5" />
			</div>
		</div>
		<Button @click="save" :disabled="!telemetry_address || !telemetry_port">
			Save
		</Button>
		<Button
			@click="enable_estop"
			:disabled="estop_enabled"
			class="abort"
			title="Allow StarCommand to issue a software abort command to the payload"
		>
			{{ estop_enabled ? 'Abort Enabled' : 'Enable Mission Abort' }}
		</Button>
	</div>
</template>

<script lang="ts">
import { useDatalink } from '@/stores/datalink';
import { defineComponent } from 'vue';
import TextField from '../components/fields/TextField.vue';
import IntegerField from '../components/fields/IntegerField.vue';
import FieldInput from '../components/fields/FieldInput.vue';
import Button from '../components/widgets/Button.vue';
import { useAlert } from '@/stores/alert';
import { usePayloadStore } from '@/stores/payload';

export default defineComponent({
	components: { TextField, IntegerField, FieldInput, Button },
	data: () => ({
		telemetry_address: useDatalink().telemetry_address ?? '',
		telemetry_port: useDatalink().telemetry_port ?? '',
	}),
	computed: {
		valid() {
			return this.telemetry_address.length > 0;
		},
		estop_enabled() {
			return usePayloadStore().allow_estop;
		},
	},
	methods: {
		save() {
			useDatalink().$patch({
				telemetry_address: this.telemetry_address,
				telemetry_port: this.telemetry_port,
			});
			useDatalink().connect();
			localStorage.setItem('telemetry_address', this.telemetry_address);
			localStorage.setItem('telemetry_port', this.telemetry_port);
			this.$router.push('/');
		},
		async enable_estop() {
			const result = await useAlert().open({
				title: 'Enable Mission Abort?',
				message:
					'Are you sure you want to enable mission abort functionality? Aborting a mission will result in the loss of any unsaved data and should only be done in testing. This requires abort functionality to be enabled on the payload as well. Payload resets in the field should be performed by power-cycling the payload. This setting will be disabled when StarCommand exits.',
				buttons: [
					{
						label: 'Cancel',
					},
					{
						label: 'Enable',
						dangerous: true,
					},
				],
			});
			if (result === 1) {
				usePayloadStore().enable_estop();
			}
		},
	},
});
</script>

<style lang="scss" scoped>
.settings-view {
	.header {
		font-size: 1.25rem;
		font-weight: bold;
		margin-bottom: 1rem;
		text-align: center;
	}

	.contents {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		margin-top: 1rem;

		.setting {
			display: flex;
			flex-direction: row;
			align-items: center;
			justify-content: space-between;
			gap: 0.5rem;
			width: 100%;

			.label::after {
				content: ':';
			}
		}
	}

	.button {
		text-align: center;
		margin-top: 1rem;
		color: var(--color-green);

		&.abort {
			color: var(--color-red);
		}
		&.disabled {
			color: var(--color-border);
		}
	}
}
</style>
