<script setup lang="ts">
import { LogSeverity, useLogging } from "@/stores/logs";
import { usePayloadStore } from "@/stores/payload";
import { computed, ref, reactive } from "vue";
import MissionLogEntry from "./MissionLogEntry.vue";
import Button from "./widgets/Button.vue";

const logging = useLogging();
const payloadStore = usePayloadStore();

const missionOnly = ref(false);

const logLevels = reactive({
	debug: false,
	info: true,
	warn: true,
	error: true,
});

// Using mutating variables is more efficient than computed values
// because we only have to run over the mission logs once.
const logCounts = reactive({
	debug: 0,
	info: 0,
	warn: 0,
	error: 0,
});

const entries = computed(() => {
	// Reset log counts
	logCounts.debug = 0;
	logCounts.info = 0;
	logCounts.warn = 0;
	logCounts.error = 0;

	return logging.flightLogs.filter(({ severity, mission }) => {
		const showMission = !(
			missionOnly.value &&
			mission !== (payloadStore.payload?.config?.uuid ?? "unknown")
		);
		if (!showMission) return false;
		switch (severity) {
			case LogSeverity.DEBUG:
				logCounts.debug++;
				return logLevels.debug && showMission;
			case LogSeverity.INFO:
				logCounts.info++;
				return logLevels.info && showMission;
			case LogSeverity.WARN:
				logCounts.warn++;
				return logLevels.warn && showMission;
			case LogSeverity.DANGER:
				logCounts.error++;
				return logLevels.error && showMission;
			default:
				return false;
		}
	});
});
</script>

<template>
	<div class="logs">
		<div class="header">
			<span class="title">Mission Logs</span>
			<Button
				class="selector"
				:class="{ active: logLevels.error }"
				@click="logLevels.error = !logLevels.error"
			>
				Failure ({{ logCounts.error }})
			</Button>
			<Button
				class="selector"
				:class="{ active: logLevels.warn }"
				@click="logLevels.warn = !logLevels.warn"
			>
				Warning ({{ logCounts.warn }})
			</Button>
			<Button
				class="selector"
				:class="{ active: logLevels.info }"
				@click="logLevels.info = !logLevels.info"
			>
				Info ({{ logCounts.info }})
			</Button>
			<Button
				class="selector"
				:class="{ active: logLevels.debug }"
				@click="logLevels.debug = !logLevels.debug"
			>
				Debug ({{ logCounts.debug }})
			</Button>
		</div>
		<div class="entries">
			<MissionLogEntry v-for="entry in entries" :entry="entry" />
		</div>
	</div>
</template>

<style scoped lang="scss">
.logs {
	min-width: 60rem;
	width: 60rem;

	.header {
		display: flex;
		align-items: flex-end;
		gap: 0.5rem;
		user-select: none;

		.title {
			font-size: 1.5rem;
			font-weight: bold;
			flex-grow: 1;
		}

		.selector {
			padding: 0.25em 0.75em;
			padding-top: 0.1em;
			font-size: 0.85em;
			border-radius: 0.5em;

			&.active {
				background-color: var(--color-background-soft);
			}

			&:hover {
				background-color: var(--color-background-mute);
			}
		}

		border-bottom: 1px solid var(--color-border);
		padding-bottom: 0.5rem;
		margin-bottom: 0.5rem;
	}

	.entries {
		max-height: 40rem;
		height: 40rem;
		overflow-y: scroll;
		background-color: var(--color-background-soft);
		padding: 0.5rem;
	}
}
</style>
