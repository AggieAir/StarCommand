<template>
	<div class="settings-view">
		<div class="header">StarCommand Settings</div>
		<template
			v-for="(field, element_key) in settings_definitions"
			:key="element_key"
		>
			<IntegerField
				v-if="field.type === ConfigEntryType.INTEGER"
				:definition="field"
				:configuration="settings"
				v-model="(settings[field.name] as number)"
			/>
			<FloatField
				v-if="field.type === ConfigEntryType.FLOAT"
				:definition="field"
				:configuration="settings"
				v-model="(settings[field.name] as number)"
			/>
			<TextField
				v-if="field.type === ConfigEntryType.STRING"
				:definition="field"
				:configuration="settings"
				v-model="(settings[field.name] as string)"
			/>
			<EnumInput
				v-if="field.type === ConfigEntryType.ENUM"
				:definition="field"
				:configuration="settings"
				v-model="(settings[field.name] as number)"
			/>
			<BooleanInput
				v-if="field.type === ConfigEntryType.BOOLEAN"
				:definition="field"
				v-model="(settings[field.name] as boolean)"
			/>
		</template>
		<!-- <div class="contents">
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
		</Button> -->
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
import {
	ConfigEntryType,
	type ConfigEntryDefinition,
	type StarCommandSettingDefinition,
} from '@/datastructures/definition';
import { useSettingsStore } from '@/stores/settings';
import type { ConfigEntries } from '@/datastructures/configuration';
import FloatField from '@/components/fields/FloatField.vue';
import EnumInput from '@/components/fields/EnumInput.vue';
import BooleanInput from '@/components/fields/BooleanInput.vue';

export default defineComponent({
	components: {
		TextField,
		IntegerField,
		FieldInput,
		Button,
		FloatField,
		EnumInput,
		BooleanInput,
	},
	data: () => {
		const result = {
			telemetry_address: useDatalink().telemetry_address ?? '',
			telemetry_port: useDatalink().telemetry_port ?? '',
			extra_settings: [
				{
					name: 'monitor.config_autodetection',
					human_name: 'Watch for Mission Change',
					description:
						'Watch payload heartbeats for changes in mission config, and prompt to load the new mission.',
					type: ConfigEntryType.BOOLEAN,
					required: false,
					default: true,
				},
			] as ConfigEntryDefinition[],
			extra_values: [] as (string | boolean | number)[],
		};
		result.extra_values = result.extra_settings.map((setting) => {
			const default_value = (() => {
				if (setting.default !== undefined) {
					return setting.default;
				}
				switch (setting.type) {
					case ConfigEntryType.BOOLEAN:
						return false;
					case ConfigEntryType.FLOAT:
						return 0.0;
					case ConfigEntryType.INTEGER:
						return 0;
					case ConfigEntryType.STRING:
						return '';
					case ConfigEntryType.ENUM:
						return 0;
					case ConfigEntryType.LINKED:
						throw 'Cannot use linked config entries in settings';
				}
			})();
			return localStorage.getItem(setting.name) ?? default_value;
		});
		return result;
	},
	computed: {
		settings_definitions(): Readonly<StarCommandSettingDefinition[]> {
			return useSettingsStore().definitions;
		},
		settings(): ConfigEntries<string | number | boolean | undefined> {
			return useSettingsStore().settings;
		},
		ConfigEntryType() {
			return ConfigEntryType;
		},
	},
	methods: {},
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
