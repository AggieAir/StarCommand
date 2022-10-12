<script lang="ts">
import Database, { Table } from '@/database';
import type { ConfigEntries } from '@/datastructures/configuration';
import {
	ConfigEntryType,
	type CaptureTypeDefinition,
} from '@/datastructures/definition';
import { useConfigStore } from '@/stores/config';
import { defineComponent } from 'vue';
import IntegerField from '../../fields/IntegerField.vue';
import FloatField from '../../fields/FloatField.vue';
import TextField from '../../fields/TextField.vue';
import EnumInput from '../../fields/EnumInput.vue';
import BooleanInput from '../../fields/BooleanInput.vue';

export default defineComponent({
	props: {
		group: {
			type: String,
			required: true,
		},
	},
	data() {
		return {
			capture_modes: null as CaptureTypeDefinition[] | null,
			component_refs: [] as { valid: boolean }[],
			ConfigEntryType,
		};
	},
	async mounted() {
		const db = await Database.get_database();
		this.capture_modes = await db.get_all<CaptureTypeDefinition>(
			Table.CaptureTypeDefinition
		);
	},
	methods: {
		store_editor_ref(component: any, index: number) {
			this.component_refs[index] = component;
		},
	},
	computed: {
		config() {
			return useConfigStore().get_capture_group(this.group);
		},
		hasDefinition() {
			if (this.config?.definition === undefined) {
				return false;
			}
			return this.capture_modes?.every(
				(definition) => definition !== this.config?.definition
			);
		},
	},
	watch: {
		'config.definition': {
			handler(new_definition: CaptureTypeDefinition) {
				if (!this.config) {
					return;
				}
				this.config.config =
					new_definition?.config_entries.reduce<
						ConfigEntries<string | number | boolean>
					>((acc, def) => {
						if (def.default) {
							acc[def.name] = def.default;
						} else {
							switch (def.type) {
								case ConfigEntryType.BOOLEAN:
									acc[def.name] = false;
									break;
								default:
									acc[def.name] = '';
							}
						}
						return acc;
					}, {}) ?? {};
			},
		},
	},
	components: {
		IntegerField,
		FloatField,
		TextField,
		EnumInput,
		BooleanInput,
	},
});
</script>

<template>
	<div class="capture-group-settings" v-if="config">
		<select v-model="config.definition" title="Capture mode of this group">
			<option disabled :value="undefined">Select a capture mode</option>
			<option disabled :value="config.definition" v-if="hasDefinition">
				{{ config.definition!.human_name }} (from loaded config)
			</option>
			<option disabled :value="null" v-if="capture_modes === null">
				loading modes, stand by...
			</option>
			<option
				v-else
				v-for="mode in capture_modes"
				:key="mode.name"
				:value="mode"
				:title="mode.description"
			>
				{{ mode.human_name }}
			</option>
		</select>
		<div class="description" v-if="config.definition !== undefined">
			{{ config.definition.description }}
		</div>
		<div class="unselected" v-else>Please select a capture mode</div>
		<div class="empty" v-if="config.definition?.config_entries.length === 0">
			This capture mode does not need additional configuration
		</div>
		<template
			v-else-if="config.definition !== undefined"
			v-for="(field, index) in config.definition.config_entries"
			:key="index"
		>
			<IntegerField
				v-if="field.type === ConfigEntryType.INTEGER"
				:definition="field"
				:config="config.config"
				v-model="(config.config![field.name] as number)"
				:ref="(el) => store_editor_ref(el, index)"
			/>
			<FloatField
				v-else-if="field.type === ConfigEntryType.FLOAT"
				:definition="field"
				:config="config.config"
				v-model="(config.config![field.name] as number)"
				:ref="(el) => store_editor_ref(el, index)"
			/>
			<TextField
				v-else-if="field.type === ConfigEntryType.STRING"
				:definition="field"
				:config="config.config"
				v-model="(config.config![field.name] as string)"
				:ref="(el) => store_editor_ref(el, index)"
			/>
			<EnumInput
				v-else-if="field.type === ConfigEntryType.ENUM"
				:definition="field"
				:config="config.config"
				v-model="(config.config![field.name] as number)"
				:ref="(el) => store_editor_ref(el, index)"
			/>
			<BooleanInput
				v-else-if="field.type === ConfigEntryType.BOOLEAN"
				:definition="field"
				:config="config.config"
				v-model="(config.config![field.name] as boolean)"
				:ref="(el) => store_editor_ref(el, index)"
			/>
		</template>
	</div>
</template>

<style lang="scss" scoped>
.capture-group-settings {
	> select {
		margin: auto;
		background-color: var(--color-background-soft);
		border: none;
		color: var(--color-text);

		&:hover {
			background-color: var(--color-background-mute);
		}
	}

	.unselected {
		padding: calc(50px - 1em) 0;
		color: var(--color-border-hover);
	}

	.description {
		padding: 10px 20px;
		font-size: 0.8rem;
		text-align: left;
	}

	.empty {
		color: var(--color-border-hover);
	}
}
</style>
