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
		<Button @click="save" :disabled="!telemetry_address || !telemetry_port"
			>Save</Button
		>
	</div>
</template>

<script lang="ts">
import { useDatalink } from '@/stores/datalink';
import { defineComponent } from 'vue';
import TextField from '../components/fields/TextField.vue';
import IntegerField from '../components/fields/IntegerField.vue';
import FieldInput from '../components/fields/FieldInput.vue';
import Button from '../components/widgets/Button.vue';

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

		&.disabled {
			color: var(--color-border);
		}
	}
}
</style>
