<script setup lang="ts">
import {
	ConfigEntryType,
	type ConfigEntryDefinition,
} from '@/datastructures/definition';
import { settingsDefinitions as getSettingsDefinitions } from '@/datastructures/device_config';
import { useDeviceStore } from '@/stores/devices';
import type { Nullable } from '@/utility_types';
import { computed, ref, watchEffect, type PropType, type Ref } from 'vue';
import IntegerField from '../fields/IntegerField.vue';
import FloatField from '../fields/FloatField.vue';
import TextField from '../fields/TextField.vue';
import EnumInput from '../fields/EnumInput.vue';
import BooleanInput from '../fields/BooleanInput.vue';
import Button from '../widgets/Button.vue';
import { useNotifications } from '@/stores/notifications';
import { Notification, NotificationUrgency } from '@/notification';

const props = defineProps({
	humanName: {
		type: String,
		required: true,
	},
	name: {
		type: String as PropType<'payload' | 'copilot' | 'ground'>,
		required: true,
	},
	canBeHybrid: Boolean,
});

const devices = useDeviceStore();

const settingsDefinitions: Ref<Nullable<ConfigEntryDefinition[]>> = ref(null);

watchEffect(async () => {
	if (devices.activeDevice === null) {
		return null;
	}
	if (
		devices.activeDevice.computer_type !== props.name &&
		(!props.canBeHybrid || devices.activeDevice.computer_type !== 'hybrid')
	) {
		return null;
	}
	settingsDefinitions.value = await getSettingsDefinitions[props.name](
		devices.activeDevice
	);
});

const loading_mode_tables = {
	from: { upload: 0, boot: 1, start: 2 } as { [key: string]: number },
	to: ['upload', 'boot', 'start'],
};

const config_tables = computed(() => {
	const missions = settingsDefinitions.value?.find(
		(check) => check.name === 'config_to_load'
	);
	if (missions === undefined) {
		return undefined;
	}
	return {
		to: missions.choices! as string[],
		from: missions.choices!.reduce<{ [key: string]: number }>(
			(acc, mission, index) => {
				acc[mission] = index;
				return acc;
			},
			{}
		),
	};
});

const config = computed(() => {
	const settings = devices.activeDevice?.settings[props.name] ?? null;
	if (settings === null) {
		return { config: null };
	}
	// Only need to proxy payload settings
	if (props.name !== 'payload') {
		return { config: settings };
	}
	// Proxy around the settings object so we can translate the enums on the fly
	return {
		config: new Proxy(settings, {
			get(target, prop) {
				if (prop === 'config_loading_mode') {
					return loading_mode_tables.from[target[prop]];
				} else if (prop === 'config_to_load') {
					return config_tables.value?.from[target[prop]];
				} else if (typeof prop === 'string') {
					return target[prop];
				}
			},
			set(target, prop, value) {
				if (prop === 'config_loading_mode') {
					target[prop] = loading_mode_tables.to[value];
					return true;
				} else if (prop === 'config_to_load') {
					target[prop] = config_tables.value?.to[value];
					return true;
				} else if (prop in target) {
					target[prop as string] = value;
					return true;
				} else {
					return false;
				}
			},
		}),
	};
});

const notifications = useNotifications();

function save() {
	const success = doSave();
	if (success) {
		notifications.show(
			new Notification(
				'Save Successful',
				`${props.humanName} settings were saved successfully`,
				NotificationUrgency.LOW,
				undefined,
				10
			)
		);
	}
}

function doSave() {
	switch (props.name) {
		case 'copilot':
			return devices.activeDevice?.saveCopilotSettings();
		case 'ground':
			return devices.activeDevice?.saveGroundSettings();
		case 'payload':
			return devices.activeDevice?.savePayloadSettings();
	}
}
</script>

<template>
	<div class="device-settings-editor" v-if="config.config !== null">
		<div class="header">{{ props.humanName }}</div>
		<template
			v-if="settingsDefinitions !== null"
			v-for="(field, element_key) in settingsDefinitions"
			:key="element_key"
		>
			<IntegerField
				v-if="field.type === ConfigEntryType.INTEGER"
				:definition="field"
				:configuration="config.config"
				v-model="config.config[field.name] as number"
			/>
			<FloatField
				v-else-if="field.type === ConfigEntryType.FLOAT"
				:definition="field"
				:configuration="config.config"
				v-model="(config.config[field.name] as number)"
			/>
			<TextField
				v-else-if="field.type === ConfigEntryType.STRING"
				:definition="field"
				:configuration="config.config"
				v-model="(config.config[field.name] as string)"
			/>
			<EnumInput
				v-else-if="field.type === ConfigEntryType.ENUM"
				:definition="field"
				:configuration="config.config"
				v-model="(config.config[field.name] as number)"
			/>
			<BooleanInput
				v-else-if="field.type === ConfigEntryType.BOOLEAN"
				:definition="field"
				:configuration="config.config"
				v-model="(config.config[field.name] as boolean)"
			/>
		</template>
		<Button @click="save()">Save Changes</Button>
	</div>
</template>
