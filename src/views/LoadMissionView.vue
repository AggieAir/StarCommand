<script lang="ts">
import Database, { import_file, Table } from '@/database';
import type {
	MissionConfiguration,
	MissionMetadata,
} from '@/datastructures/configuration';
import { Notification, NotificationUrgency } from '@/notification';
import { Alert, useAlert } from '@/stores/alert';
import { useNotifications } from '@/stores/notifications';
import { usePayloadStore } from '@/stores/payload';
import { defineComponent } from 'vue';
import MissionList from '../components/missions/MissionList.vue';

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
				if (a.date < b.date) return -1;
				if (a.date > b.date) return 1;
				return 0;
			});
			this.loaded = true;
		},
		today() {
			const now = new Date();
			const tz_offset = now.getTimezoneOffset();
			// Get today's date in ISO format, in the local timezone.
			const today = new Date(now.getTime() - tz_offset * 60 * 1000)
				.toISOString()
				.split('T')[0];
			return today;
		},
		async import_file() {
			const file = (this.$refs.fileinput as HTMLInputElement).files?.[0];
			if (!file) return;
			try {
				await import_file(file, await Database.get_database());
				useNotifications().show(
					new Notification(
						'Success',
						'Successfully imported mission from file.',
						NotificationUrgency.LOW
					)
				);
			} catch (e) {
				useAlert().open(
					new Alert(
						'Error importing file',
						'The file could not be imported. This is likely due to a malformed file, but it could also be that the mission already exists.'
					)
				);
			}
		},
		select_file() {
			(this.$refs.fileinput as HTMLInputElement).click();
		},
		async load(metadata: MissionMetadata) {
			const db = await Database.get_database();
			const mission = await db.get<MissionConfiguration>(
				Table.MissionConfiguration,
				metadata.uuid
			);
			if (!mission) {
				useAlert().open(
					new Alert(
						'Error loading mission',
						'The requested mission does not exist in the database.'
					)
				);
				return;
			}
			usePayloadStore().initialize(mission);
		},
	},
	computed: {
		future_missions() {
			return this.missions.filter((mission) => mission.date > this.today());
		},
		past_missions() {
			return this.missions.filter((mission) => mission.date < this.today());
		},
		todays_missions() {
			return this.missions.filter((mission) => mission.date === this.today());
		},
	},
	components: { MissionList },
});
</script>

<template>
	<div class="mission-loader">
		<div class="header">Load a Mission</div>
		<div class="button" @click="select_file">Import a mission</div>
		<template v-if="loaded">
			<MissionList :missions="todays_missions" start-open @open="load">
				Today's Missions
			</MissionList>
			<MissionList :missions="future_missions" @open="load">
				Future Missions
			</MissionList>
			<MissionList :missions="past_missions" @open="load">
				Past Missions
			</MissionList>
		</template>
		<input
			type="file"
			ref="fileinput"
			@change="import_file"
			accept=".mission.json"
			style="display: none"
		/>
	</div>
</template>

<style scoped lang="scss">
.mission-loader {
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
		cursor: pointer;
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
