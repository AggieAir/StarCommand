<script lang="ts">
import { LogSeverity, type ConsoleLogEntry } from "@/stores/logs";
import { defineComponent, type PropType } from "vue";

export default defineComponent({
	props: {
		entry: {
			type: Object as PropType<ConsoleLogEntry>,
			required: true,
		},
	},
	computed: {
		severity_class() {
			switch (this.entry.severity) {
				case LogSeverity.DEBUG:
					return "debug";
				case LogSeverity.INFO:
					return "info";
				case LogSeverity.WARN:
					return "warn";
				case LogSeverity.ERROR:
					return "error";
			}
		},
		origin() {
			if (this.entry.stack_trace[0] === undefined) {
				return undefined;
			}
			const func = this.entry.stack_trace[0].function;
			if (func === undefined) {
				return undefined;
			}
			let [path_to_file, others] =
				this.entry.stack_trace[0].location?.split("?");
			if (path_to_file?.slice(0, 8) === "debugger") {
				others = path_to_file;
				path_to_file = "console";
			}
			let _, line, column;
			if (others === undefined) {
				[path_to_file, line, column] =
					this.entry.stack_trace[0].location?.split(/(?<=[^/]\/[^/]+):(?=\d+)/);
				if (
					path_to_file === undefined ||
					line === undefined ||
					column === undefined
				) {
					return undefined;
				}
				const file_parts = path_to_file.split("/");
				if (file_parts.length === 0) {
					return undefined;
				}
				const filename = file_parts?.[file_parts.length - 1];
				return [
					`${func} in ${filename}:${line}:${column}`,
					this.entry.stack_trace[0].location,
				];
			}
			if (path_to_file === undefined || others === undefined) {
				return undefined;
			}
			[_, line, column] = others.split(":");
			if (line === undefined || column === undefined) {
				return undefined;
			}
			const file_parts = path_to_file.split("/");
			if (file_parts.length === 0) {
				return undefined;
			}
			const filename = file_parts?.[file_parts.length - 1];
			return [
				`${func} in ${filename}:${line}:${column}`,
				this.entry.stack_trace[0].location,
			];
		},
		message() {
			return this.entry.message.join(" ");
		},
		timestamp() {
			function pad(value: number): string {
				if (value < 10) {
					return `0${value}`;
				}
				return `${value}`;
			}
			function padMs(value: number): string {
				if (value < 10) {
					return `00${value}`;
				}
				if (value < 100) {
					return `0${value}`;
				}
				return `${value}`;
			}
			return `${pad(this.entry.timestamp.getHours())}:${pad(
				this.entry.timestamp.getMinutes()
			)}:${pad(this.entry.timestamp.getSeconds())}.${padMs(
				this.entry.timestamp.getMilliseconds()
			)}`;
		},
	},
});
</script>

<template>
	<div class="log-entry" :class="severity_class">
		<span class="timestamp">{{ timestamp }}</span>
		<div class="message">
			<span class="line">{{ message }}</span>
		</div>
		<a
			v-if="origin !== undefined"
			target="blank"
			class="origin"
			:href="origin[1]"
		>
			{{ origin[0] }}
		</a>
		<span v-else class="origin">unknown location</span>
	</div>
</template>

<style lang="scss" scoped>
.log-entry {
	display: flex;
	align-items: center;
	gap: 1rem;
	font-family: monospace;

	.timestamp {
		user-select: none;
	}

	.origin {
		color: var(--color-text);
		user-select: none;
		flex-shrink: 0;
	}

	.message {
		display: flex;
		flex-direction: column;
		flex-grow: 1;
	}

	&.warn {
		color: var(--color-yellow);
	}

	&.error {
		color: var(--color-red);
	}
}
</style>
