<script setup lang="ts">
import MissionLogs from "@/components/MissionLogs.vue";
import Tabs, { type TabDefinition } from "@/components/widgets/Tabs.vue";
import { useSettingsStore } from "@/stores/settings";
import LogView from "./LogView.vue";

const tabs: TabDefinition[] = [
	{
		name: "mission",
		text: "Mission Logs",
	},
	{
		name: "console",
		text: "Application Logs",
	},
];

const settings = useSettingsStore().settings;
</script>

<template>
	<div class="logManager">
		<Tabs v-if="settings.save_console_logs" :tabs="tabs" bottom>
			<template #console>
				<LogView />
			</template>
			<template #mission>
				<MissionLogs />
			</template>
		</Tabs>
		<MissionLogs v-else />
	</div>
</template>
