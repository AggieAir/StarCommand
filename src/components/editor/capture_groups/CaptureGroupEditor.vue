<script lang="ts">
import type { CaptureGroupConfiguration } from '@/datastructures/configuration';
import { useConfigStore } from '@/stores/config';
import { defineComponent, type PropType } from 'vue';
import CaptureGroupConfig from './CaptureGroupConfig.vue';
import SensorEditor from '../sensors/SensorEditor.vue';
import Button from '../../widgets/Button.vue';

export default defineComponent({
	props: {
		group: {
			type: String,
			required: true,
		},
	},
	computed: {
		config() {
			return useConfigStore().get_capture_group(this.group)!;
		},
	},
	methods: {
		add_sensor() {
			useConfigStore().add_sensor('new_sensor', this.config);
		},
		delete_group() {
			useConfigStore().remove_capture_group(this.config);
		},
	},
	components: { CaptureGroupConfig, SensorEditor, Button },
});
</script>

<template>
	<div class="capture-group-editor">
		<div class="header">
			Capture Group
			<input type="text" v-model.lazy.trim="config.name" ref="name" />
		</div>
		<CaptureGroupConfig :group="group" />
		<SensorEditor
			v-for="(sensor, index) in config.sensors"
			:key="index"
			:sensor="sensor.name"
			:group="group"
		/>
		<Button class="add" @click="add_sensor"> Add new sensor </Button>
		<Button class="delete" @click="delete_group">
			Remove this capture group
		</Button>
	</div>
</template>

<style lang="scss" scoped>
.capture-group-editor {
	display: flex;
	flex-direction: column;
	gap: 1rem;
	padding: 1.5rem;
	overflow-y: scroll;
	max-height: 30rem;
	overflow-x: hidden;

	.header {
		text-align: center;
		font-size: 1.3em;
		font-weight: bold;
	}

	input {
		appearance: textfield;
		font-family: monospace;
		font-size: 1.2em;
		text-align: left;
		padding-top: 0.5rem;
		background-color: transparent;
		color: var(--color-text);
		border: none;
	}

	.add {
		color: var(--color-green);
	}

	.delete {
		color: var(--color-red);
	}

	.button {
		text-align: center;
	}
}
</style>
