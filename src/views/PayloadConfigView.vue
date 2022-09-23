<script lang="ts">
import type { MissionConfiguration } from '@/datastructures/configuration';
import { useConfigStore } from '@/stores/config';
import { defineComponent } from 'vue';

export default defineComponent({
	props: {
		uuid: {
			type: String,
		},
	},
	computed: {
		config(): MissionConfiguration | null {
			return useConfigStore().config;
		},
	},
	watch: {
		uuid: {
			handler(uuid?: string) {
				if (uuid === undefined) {
					useConfigStore().new_config();
				} else {
					useConfigStore().load_config(uuid);
				}
			},
		},
	},
	mounted() {
		if (this.uuid === undefined) {
			useConfigStore().new_config();
		} else {
			useConfigStore().load_config(this.uuid);
		}
	},
});
</script>

<template>
	<h1>{{ config?.uuid }}</h1>
</template>
