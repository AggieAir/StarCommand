<script lang="ts">
import type { NodeConfiguration } from '@/datastructures/configuration';
import { useConfigStore, type ConfigStore } from '@/stores/config';
import { defineComponent } from 'vue';
import IntegerField from '../../fields/IntegerField.vue';
import FloatField from '../../fields/FloatField.vue';
import TextField from '../../fields/TextField.vue';
import EnumInput from '../../fields/EnumInput.vue';
import BooleanInput from '../../fields/BooleanInput.vue';
import { ConfigEntryType } from '@/datastructures/definition';
import Button from '../../widgets/Button.vue';

export default defineComponent({
	props: {
		/**
		 * The name of the node
		 */
		node: {
			type: String,
			required: true,
		},
		/**
		 * The name of the sensor this node is a part of
		 */
		sensor: {
			type: String,
			required: true,
		},
		/**
		 * The name of the capture group this node is a part of
		 */
		group: {
			type: String,
			required: true,
		},
		selected: {
			type: Boolean,
			required: true,
		},
	},
	data: () => ({
		editor_refs: [] as {
			valid: boolean;
		}[],
		ConfigEntryType,
	}),
	computed: {
		config(): NodeConfiguration | undefined {
			return useConfigStore().get_node(this.group, this.sensor, this.node)[0];
		},
		previous(): () => NodeConfiguration | undefined {
			return useConfigStore().get_node(this.group, this.sensor, this.node)[1];
		},
		next(): () => NodeConfiguration | undefined {
			return useConfigStore().get_node(this.group, this.sensor, this.node)[2];
		},
		config_state(): boolean[] {
			// return this.editor_refs.reduce((acc, { valid }) => acc && valid, true);
			if (!this.config) return [false];
			return useConfigStore().validate_node_config(this.config);
		},
		prev_state() {
			const prev = this.previous();
			if (prev === undefined && this.config?.definition.input_type !== '')
				return 1;
			if (prev === undefined || this.config?.definition.input_type === 'any')
				return 0;
			if (
				prev.definition.output_type === 'any' &&
				this.config?.definition.input_type !== 'any'
			)
				return 1;
			if (prev.definition.output_type !== this.config?.definition.input_type)
				return 2;
			return 0;
		},
		next_state() {
			const next = this.next();
			if (next === undefined && this.config?.definition.output_type !== '') {
				return 2;
			}
			if (next === undefined || next.definition.input_type === 'any') {
				return 0;
			}
			if (
				this.config?.definition.output_type === 'any' &&
				next.definition.input_type !== 'any'
			) {
				return 1;
			}
			if (this.config?.definition.output_type !== next.definition.input_type) {
				return 2;
			}
			return 0;
		},
		class_list() {
			return {
				selected: this.selected,
				'prev-good': this.prev_state === 0,
				'prev-warn': this.prev_state === 1,
				'prev-err': this.prev_state === 2,
				'next-good': this.next_state === 0,
				'next-warn': this.next_state === 1,
				'next-err': this.next_state === 2,
				'node-err': !this.config_state.reduce(
					(acc, valid) => valid && acc,
					true
				),
			};
		},
		no_config_entries(): boolean {
			return (
				this.config?.definition.config_entries.filter(
					({ type }) => type < ConfigEntryType.LINKED
				).length === 0
			);
		},
	},
	methods: {
		store_editor_ref(component: any) {
			console.count('storing-editor-ref');
			this.editor_refs.push(component);
		},
		promote() {
			const store: ConfigStore = useConfigStore();
			// If this method is invoked, the sensor and config definitely exist.
			store.promote_node(
				this.config!,
				store.get_sensor(this.group, this.sensor)!
			);
		},
		demote() {
			const store: ConfigStore = useConfigStore();
			store.demote_node(
				this.config!,
				store.get_sensor(this.group, this.sensor)!
			);
		},
		remove() {
			const store = useConfigStore();
			store.remove_node(
				this.config!,
				store.get_sensor(this.group, this.sensor)!
			);
		},
	},
	emits: ['select'],
	components: {
		IntegerField,
		FloatField,
		TextField,
		EnumInput,
		BooleanInput,
		Button,
	},
});
</script>

<template>
	<div
		:class="class_list"
		class="node-editor"
		:title="selected ? undefined : config?.definition.description"
		@click="$emit('select')"
		v-if="config"
	>
		<div
			:class="{
				summary: true,
				top: previous() === undefined,
				bottom: next() === undefined,
			}"
		>
			<div class="name">{{ config.human_name }}</div>
			<div class="buttonbox">
				<Button class="up" @click="promote">Promote</Button>
				<Button class="down" @click="demote">Demote</Button>
			</div>
			<!-- <div class="button up" @click.stop="promote">△</div> -->
			<!-- <div class="button down" @click.stop="demote">▽</div> -->
			<!-- <div class="button remove" @click.stop="remove">-</div> -->
		</div>
		<div class="config" v-if="selected">
			<div class="details">
				{{ config.definition.description }}
			</div>
			<div class="details" v-if="config.definition.input_type !== ''">
				input type: {{ config.definition.input_type }}
			</div>
			<template
				v-for="(field, element_key) in config.definition.config_entries"
				:key="element_key"
			>
				<IntegerField
					v-if="field.type === ConfigEntryType.INTEGER"
					:definition="field"
					:configuration="config.config"
					v-model="(config.config[field.name] as number)"
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
			<div class="empty" v-if="no_config_entries" @click.stop>
				This node does not need configuring
			</div>
			<div class="details" v-if="config.definition.output_type !== ''">
				output type: {{ config.definition.output_type }}
			</div>
			<Button class="remove" @click="remove">Remove</Button>
		</div>
	</div>
</template>

<style lang="scss" scoped>
@import '@/assets/base.scss';
.node-editor {
	background-color: var(--color-background-soft);
	border: 1px solid transparent;

	.summary {
		display: flex;
		padding: 5px;

		align-items: center;

		background-color: var(--color-background-soft);

		.name {
			flex-grow: 1;
			text-align: left;
		}
		.buttonbox {
			display: flex;
			flex-direction: row;
			.button {
				font-size: 0.8em;
				&:hover {
					background-color: var(--color-background-mute);
					&.up {
						color: var(--color-green);
					}

					&.down {
						color: var(--color-red);
					}
				}
			}
		}
	}

	.config {
		display: flex;
		flex-direction: column;
		// gap: 10px;
		padding: 5px;
		padding-bottom: 0;
		.details {
			text-align: left;
			font-size: 0.8rem;
			&:first-child {
				padding-bottom: 0.5rem;
			}

			&:last-child {
				padding-top: 0.5rem;
			}
		}

		.empty {
			text-align: left;
			font-size: 0.8rem;
			background-color: var(--color-background-soft);
			padding: 5px;
			font-style: italic;
		}

		.button {
			color: var(--color-red);
			text-align: center;

			background-color: var(--color-background-soft);
			padding: 0 1.5rem;
			width: min-content;
			margin: auto;
			margin-bottom: 5px;

			&:hover {
				background-color: var(--color-red);
				color: var(--color-text);
			}
		}
	}

	&.node-err {
		border-left-color: var(--color-red);
	}

	&.selected {
		border-color: var(--color-node-editor);
	}

	&.prev-err {
		border-top-color: var(--color-red);
	}

	&.prev-warn {
		border-top-color: var(--color-yellow);
	}

	&.next-err {
		border-bottom-color: var(--color-red);
	}

	&.next-warn {
		border-bottom-color: var(--color-yellow);
	}
}
</style>
