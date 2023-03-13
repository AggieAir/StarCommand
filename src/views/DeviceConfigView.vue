<script setup lang="ts">
import DeviceSettingsEditor from '@/components/device_editor/DeviceSettingsEditor.vue';
import FieldInput from '@/components/fields/FieldInput.vue';
import { useDeviceStore } from '@/stores/devices';
import type { Nullable } from '@/utility_types';
import {
	computed,
	onBeforeUnmount,
	ref,
	watch,
	watchEffect,
	type ComputedRef,
	type Ref,
} from 'vue';

const devices = useDeviceStore();

const deviceType = computed(() => {
	if (devices.activeDevice !== null) {
		switch (devices.activeDevice.computer_type) {
			case 'payload': // fallthrough
			case 'hybrid':
				return 'Payload';
			case 'copilot':
				return 'Copilot';
			case 'ground':
				return 'Ground Station';
			default:
				return 'Device';
		}
	}
	return 'Device';
});

const customConnection = ref(false);

/**
 * Used by the device selector. Null and undefined are sentinel values for
 * "no selection" and "custom entry" respectively.
 */
const deviceSelector: Ref<string | null | undefined> = ref(null);

watchEffect(() => {
	if (deviceSelector.value === null) {
		customConnection.value = false;
		devices.closeEditor();
	} else if (deviceSelector.value === undefined) {
		customConnection.value = true;
		devices.closeEditor();
	} else {
		customConnection.value = false;
		devices.edit(deviceSelector.value);
	}
});

const customConnectionIP = ref('');
watch(customConnectionIP, async () => {
	if (customConnectionIP.value !== '') {
		await devices.addDevice(customConnectionIP.value);
		devices.activeDevice?.loadSettings() ??
			console.warn('Device was not loaded');
	}
});

onBeforeUnmount(() => {
	devices.closeEditor();
});
</script>

<template>
	<div class="device-editor">
		<div class="header">Settings Editor for Connected {{ deviceType }}</div>
		<div class="device-selector">
			<span class="label">Select Device to Edit:</span>
			<select v-model="deviceSelector">
				<option :value="null" v-if="deviceSelector === null" disabled>
					Please select a device...
				</option>
				<option
					v-for="device in devices.deviceNames"
					:key="device"
					:value="device"
				>
					{{ device }}
				</option>
				<option :value="undefined">Manually Connect to Device</option>
			</select>
		</div>
		<div class="device-connector" v-if="customConnection">
			<span class="label">Device IP:</span>
			<FieldInput v-model="customConnectionIP" autoFocus />
		</div>
		<div class="no-editor" v-if="devices.activeDevice === null">
			<div>Please select a device to edit.</div>
		</div>
		<div class="settings">
			<DeviceSettingsEditor name="payload" humanName="Payload" canBeHybrid />
			<DeviceSettingsEditor name="copilot" humanName="Copilot" canBeHybrid />
			<DeviceSettingsEditor name="ground" humanName="Ground Station" />
		</div>
	</div>
</template>

<style scoped lang="scss">
.device-editor {
	display: flex;
	flex-direction: column;
	width: 30rem;
	.header {
		font-size: 1.5rem;
		font-weight: bold;
		align-self: center;
	}

	.device-selector,
	.device-connector {
		display: flex;
		justify-content: space-between;
	}

	.device-connector {
		width: calc(100% - 2rem);
		align-self: center;
		input {
			width: 12rem;
		}
	}

	select {
		background-color: var(--color-background-soft);
		border: none;
		color: var(--color-text);
		width: 13rem;
		&:hover {
			background-color: var(--color-background-mute);
		}
	}

	.no-editor {
		color: var(--color-background-mute);
		display: flex;
		justify-content: center;
		padding: 2rem;
		font-size: 1.2rem;
		font-style: italic;
	}
}
</style>
