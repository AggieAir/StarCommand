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

watch(deviceSelector, (newSelection) => {
	if (newSelection === null) {
		customConnection.value = false;
		devices.closeEditor();
	} else if (newSelection === undefined) {
		customConnection.value = true;
	} else {
		customConnection.value = false;
	}
});

watchEffect(() => {
	devices.activeDevice?.loadSettings();
});

const customConnectionIP = ref('');
watch(customConnectionIP, (newIP) => {
	devices.addDevice(newIP);
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
		<DeviceSettingsEditor name="payload" humanName="Payload" canBeHybrid />
		<DeviceSettingsEditor name="copilot" humanName="Copilot" canBeHybrid />
		<DeviceSettingsEditor name="ground" humanName="Ground Station" />
	</div>
</template>
