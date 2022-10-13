<script lang="ts">
import { LogSeverity, type LogEntry } from '@/stores/logs';
import { defineComponent, type PropType } from 'vue';

export default defineComponent({
	props: {
		entry: {
			type: Object as PropType<LogEntry>,
			required: true,
		},
	},
	computed: {
		severity_class() {
			switch (this.entry.severity) {
				case LogSeverity.DEBUG:
					return 'debug';
				case LogSeverity.INFO:
					return 'info';
				case LogSeverity.WARN:
					return 'warn';
				case LogSeverity.ERROR:
					return 'error';
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
				this.entry.stack_trace[0].location?.split('?');
			if (path_to_file?.slice(0, 8) === 'debugger') {
				others = path_to_file;
				path_to_file = 'console';
			}
			if (path_to_file === undefined || others === undefined) {
				return undefined;
			}
			const [_, line, column] = others.split(':');
			if (line === undefined || column === undefined) {
				return undefined;
			}
			const file_parts = path_to_file.split('/');
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
			return this.entry.message.join(' ');
		},
	},
});
</script>

<template>
	<div class="log-entry" :class="severity_class">
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
	justify-content: space-between;
	align-items: center;

	.origin {
		color: var(--color-text);
		user-select: none;
	}

	.message {
		display: flex;
		flex-direction: column;
	}

	&.warn {
		color: var(--color-yellow);
	}

	&.error {
		color: var(--color-red);
	}
}
</style>
