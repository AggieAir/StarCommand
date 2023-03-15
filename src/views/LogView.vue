<script lang="ts">
import { LogSeverity, useLogging } from "@/stores/logs";
import { defineComponent } from "vue";
import LogEntry from "../components/ConsoleLogEntry.vue";
import Button from "../components/widgets/Button.vue";

export default defineComponent({
	computed: {
		log_entries() {
			return useLogging().log_entries.filter(({ severity }) => {
				switch (severity) {
					case LogSeverity.DEBUG:
						return this.debug;
					case LogSeverity.LOG:
						return this.log;
					case LogSeverity.INFO:
						return this.info;
					case LogSeverity.WARN:
						return this.warn;
					case LogSeverity.ERROR:
						return this.error;
					default:
						return true;
				}
			});
		},
		debug_entries() {
			return useLogging().log_entries.filter(
				({ severity }) => severity === LogSeverity.DEBUG
			);
		},
		level_log_entries() {
			return useLogging().log_entries.filter(
				({ severity }) => severity === LogSeverity.LOG
			);
		},
		info_entries() {
			return useLogging().log_entries.filter(
				({ severity }) => severity === LogSeverity.INFO
			);
		},
		warn_entries() {
			return useLogging().log_entries.filter(
				({ severity }) => severity === LogSeverity.WARN
			);
		},
		error_entries() {
			return useLogging().log_entries.filter(
				({ severity }) => severity === LogSeverity.ERROR
			);
		},
	},
	data: () => ({
		debug: false,
		log: false,
		info: true,
		warn: true,
		error: true,
	}),
	components: { LogEntry, Button },
});
</script>

<template>
	<div class="logs">
		<div class="header">
			<span class="title">Application Logs</span>
			<Button
				class="selector"
				:class="{ active: error }"
				@click="error = !error"
			>
				Error ({{ error_entries.length }})
			</Button>
			<Button class="selector" :class="{ active: warn }" @click="warn = !warn">
				Warning ({{ warn_entries.length }})
			</Button>
			<Button class="selector" :class="{ active: info }" @click="info = !info">
				Info ({{ info_entries.length }})
			</Button>
			<Button class="selector" :class="{ active: log }" @click="log = !log">
				Log ({{ level_log_entries.length }})
			</Button>
			<Button
				class="selector"
				:class="{ active: debug }"
				@click="debug = !debug"
			>
				Debug ({{ debug_entries.length }})
			</Button>
		</div>
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
