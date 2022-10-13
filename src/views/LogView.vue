<script lang="ts">
import { useLogStore } from '@/stores/logs';
import { defineComponent } from 'vue';
import LogEntry from '../components/LogEntry.vue';

export default defineComponent({
	computed: {
		log_entries: () => useLogStore().log_entries,
	},
	components: { LogEntry },
});
</script>

<template>
	<div class="logs">
		<h1>Logs</h1>
		<div class="entries">
			<LogEntry
				v-for="(entry, index) in log_entries"
				:key="index"
				:entry="entry"
			/>
		</div>
	</div>
</template>

<style lang="scss" scoped>
.logs {
	min-width: 60rem;
	width: 60rem;

	.entries {
		max-height: 40rem;
		overflow-y: scroll;
	}
}
</style>
