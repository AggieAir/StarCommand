<script lang="ts">
import Database, { Table } from '@/database';
import type { AircraftDefinition } from '@/datastructures/definition';
import { useConfigStore } from '@/stores/config';
import { defineComponent } from 'vue';
import FieldInput from '../fields/FieldInput.vue';

export default defineComponent({
	computed: {
		config() {
			return useConfigStore().config;
		},
		displayAltitude() {
			switch (this.altitudeUnits) {
				case 0:
					return this.config?.altitude;
				case 1:
					// Convert the meters stored in the config to feet
					return Math.round(this.config?.altitude ?? 0 * 3.28084);
			}
		},
		hasAircraft() {
			if (this.config?.aircraft === undefined) {
				return false;
			}
			return this.aircrafts?.every(
				(aircraft) => aircraft !== this.config?.aircraft
			);
		},
	},
	data: () => ({
		aircrafts: null as AircraftDefinition[] | null,
		altitudeUnits: 0,
	}),
	watch: {
		'config.aircraft': {
			handler() {
				console.count('config-aircraft-watcher-meta');
				this.hasAircraft = false;
			},
		},
	},
	async mounted() {
		const db = await Database.get_database();
		// Load aircraft definitions from database
		this.aircrafts = await db.get_all<AircraftDefinition>(
			Table.AircraftDefinition
		);
		// this.aircrafts = [
		// 	{
		// 		name: 'Phoenix',
		// 		platform: 'GreatBlue',
		// 		copilot_installed: true,
		// 		avionics: {
		// 			name: 'MAVLink',
		// 			description: 'MAVLink',
		// 			copilot_executables: [],
		// 		},
		// 	},
		// ];
	},
	methods: {
		fixAltitude(input: string) {
			const altValue = parseInt(input);
			switch (this.altitudeUnits) {
				case 0:
					this.config!.altitude = altValue;
					break;
				case 1:
					this.config!.altitude = Math.round(altValue / 3.28084);
					break;
			}
		},
	},
	components: { FieldInput },
});
</script>

<template>
	<div class="metadata-editor" v-if="config">
		<div class="entry">
			<span class="label">Aircraft</span>
			<select
				v-model="config.aircraft"
				:class="config.aircraft ? '' : 'offline'"
			>
				<option
					disabled
					:value="undefined"
					v-if="!config.aircraft && aircrafts && aircrafts.length > 0"
				>
					--
				</option>
				<option
					disabled
					:value="undefined"
					v-if="aircrafts && aircrafts.length === 0"
				>
					No aircraft in database
				</option>
				<option disabled :value="undefined" v-if="!aircrafts">
					Loading aircraft...
				</option>
				<option disabled :value="config.aircraft" v-if="hasAircraft">
					{{ config.aircraft!.name }} (from loaded config)
				</option>
				<option
					v-for="aircraft in aircrafts"
					:key="aircraft.name"
					:value="aircraft"
					@select="hasAircraft = false"
				>
					{{ aircraft.name }}
				</option>
			</select>
		</div>
		<div class="entry">
			<span class="label">Payload</span>
			<FieldInput v-model="config.payload" size="15" />
		</div>
		<div class="entry">
			<span class="label">Date</span>
			<FieldInput v-model="config.date" type="date" />
		</div>
		<div class="placeholder" />
		<div class="entry">
			<span class="label">Altitude</span>
			<span>
				<FieldInput v-model="config.altitude" type="number" size="5" />
				m
			</span>
		</div>
	</div>
</template>

<style lang="scss" scoped>
.metadata-editor {
	display: grid;
	grid-template-columns: 1fr 1fr 1fr;
	gap: 1.5rem;

	.entry {
		display: flex;
		justify-content: space-between;
		gap: 1rem;

		.label {
			&::after {
				content: ':';
			}
		}

		select {
			border: none;
			background-color: var(--color-background-soft);
			color: var(--color-text);
			text-align: right;

			&.offline {
				color: var(--color-border);
			}
		}
	}
}
</style>
