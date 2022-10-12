<script lang="ts">
import Database, { import_file, Table } from '@/database';
import type { MissionMetadata } from '@/datastructures/configuration';
import { Alert, useAlert } from '@/stores/alert';
import { useConfigStore } from '@/stores/config';
import { Prompt } from '@/stores/prompt';
import { defineComponent } from 'vue';
import Button from '../components/widgets/Button.vue';
import MissionList from '../components/missions/MissionList.vue';

// Magic values are bad, so even though these are well-known numbers, this should help
// keep the logic more transparent
const MSEC_SEC = 1000;
const SEC_MIN = 60;
const EPOCH = '1970-01-01';

export default defineComponent({
	data: () => ({
		missions: [] as MissionMetadata[],
		loaded: false,
	}),
	mounted() {
		this.load_missions();
	},
	methods: {
		async load_missions() {
			this.loaded = false;
			const db = await Database.get_database();
			const missions = await db.get_all<MissionMetadata>(Table.MissionMetadata);
			this.missions = [...missions].sort((a, b) => {
				if (a.date < b.date) return 1;
				if (a.date > b.date) return -1;
				return 0;
			});
			this.loaded = true;
		},
		today() {
			const now = new Date();
			const tz_offset = now.getTimezoneOffset();
			// Get today's date in ISO format, in the local timezone.
			return new Date(now.getTime() - tz_offset * SEC_MIN * MSEC_SEC)
				.toISOString()
				.split('T')[0];
		},
		async load(metadata: MissionMetadata) {
			if (metadata.date < this.today()) {
				const result = await useAlert().open({
					title: 'Old Mission Configuration',
					message:
						'This config is for a past mission. Would you like to make a copy before editing it?',
					buttons: [
						{
							label: 'Yes, make a copy',
						},
						{
							label: 'No, edit directly',
							dangerous: true,
						},
					],
				});
				switch (result) {
					case 0:
						const new_uuid = await useConfigStore().clone_config(metadata.uuid);
						this.$router.push({
							name: 'edit-config',
							params: {
								uuid: new_uuid,
							},
						});
						break;
					case 1:
						this.$router.push({
							name: 'edit-config',
							params: {
								uuid: metadata.uuid,
							},
						});
				}
			} else {
				this.$router.push({
					name: 'edit-config',
					params: {
						uuid: metadata.uuid,
					},
				});
			}
		},
		new_config() {
			this.$router.push({
				name: 'new-config',
			});
		},
	},
	components: { Button, MissionList },
});
</script>

<template>
	<div class="config-loader">
		<div class="header">Select a Config to Edit</div>
		<Button @click="new_config">Create a New Config</Button>
		<MissionList v-if="loaded" :missions="missions" @open="load" startOpen />
	</div>
</template>

<style scoped lang="scss">
.config-loader {
	width: 300px;
	text-align: center;
	user-select: none;

	.header {
		font-size: 1.5rem;
		margin-bottom: 0.75rem;
		font-weight: bold;

		&::after {
			content: '';
			display: block;
			border-bottom: 1px solid var(--color-border);
			width: 8rem;
			margin: 0 auto;
			margin-top: 0.25rem;
		}
	}

	.button {
		font-size: 1rem;
		padding: 0.5rem;
		border: 1px solid var(--color-border);
		width: 80%;
		margin: 0 auto;

		&:hover {
			background-color: var(--color-background-soft);
			border-color: var(--color-border-hover);
		}
	}
}
</style>
