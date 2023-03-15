<script lang="ts" setup>
import Database, { Table } from "@/database";
import type {
	MissionConfiguration,
	MissionMetadata,
} from "@/datastructures/configuration";
import { LogSeverity, type MissionLogEntry } from "@/stores/logs";
import { usePayloadStore } from "@/stores/payload";
import type { Nullable } from "@/utility_types";
import { type PropType, computed, ref, type Ref, watchEffect } from "vue";

const props = defineProps({
	entry: {
		type: Object as PropType<MissionLogEntry>,
		required: true,
	},
});

const severity_class = computed(() => {
	switch (props.entry.severity) {
		case LogSeverity.INFO:
			return "info";
		case LogSeverity.WARN:
			return "warn";
		case LogSeverity.DANGER:
			return "fail";
	}
});

const message = computed(() => props.entry.message.join(" "));

const timestamp = computed(
	() =>
		`${props.entry.timestamp
			.getHours()
			.toString()
			.padStart(2, "0")}:${props.entry.timestamp
			.getMinutes()
			.toString()
			.padStart(2, "0")}:${props.entry.timestamp
			.getSeconds()
			.toString()
			.padStart(2, "0")}:${props.entry.timestamp
			.getMilliseconds()
			.toString()
			.padStart(3, "0")}`
);

const database: Ref<Nullable<Database>> = ref(null);
const mission = ref(props.entry.mission);

const payloadStore = usePayloadStore();

Database.get_database().then((db) => (database.value = db));

watchEffect(() => {
	if (props.entry.mission === "unknown") {
		mission.value = "unknown";
	}
	if (database.value === null) {
		mission.value = props.entry.mission;
	}
	if (payloadStore.payload?.config?.uuid === props.entry.mission) {
		mission.value = payloadStore.payload.config.name;
	}
	try {
		database
			.value!.get_by_index<MissionMetadata>(
				Table.MissionMetadata,
				"uuid",
				props.entry.mission
			)
			.then(([metadata]) => {
				mission.value = metadata.name;
			});
	} catch {
		mission.value = props.entry.mission;
	}
});

// const mission = computed(async () => {
// 	if (props.entry.mission === "unknown") {
// 		return "unknown";
// 	}
// 	if (database.value === null) {
// 		return props.entry.mission;
// 	}
// 	if (payloadStore.payload?.config?.uuid === props.entry.mission) {
// 		return payloadStore.payload.config.name;
// 	}
// 	try {
// 		const metadata = await database.value.get_by_index<MissionMetadata>(
// 			Table.MissionMetadata,
// 			"uuid",
// 			props.entry.mission
// 		);
// 		return metadata[0].name;
// 	} catch {
// 		return props.entry.mission;
// 	}
// });
</script>

<template>
	<div class="log-entry" :class="severity_class">
		<span class="timestamp">{{ timestamp }}</span>
		<div class="message">
			<span class="line"
				>[ {{ severity_class?.toUpperCase() }} ] {{ message }}</span
			>
		</div>
		<span class="mission">{{ mission }}</span>
	</div>
</template>

<style lang="scss" scoped>
.log-entry {
	display: flex;
	align-items: center;
	gap: 1rem;
	font-family: monospace;

	.mission {
		user-select: none;
		flex-shrink: 0;
	}

	.message {
		display: flex;
		flex-grow: 1;
	}

	&.warn {
		color: var(--color-yellow);
	}

	&.fail {
		color: var(--color-red);
	}
}
</style>
