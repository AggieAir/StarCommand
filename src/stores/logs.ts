import type { UUID } from "@/utility_types";
import { defineStore } from "pinia";
import { ref, type Ref } from "vue";
import { usePayloadStore } from "./payload";
import { useSettingsStore } from "./settings";

export enum LogSeverity {
	DEBUG,
	INFO,
	LOG,
	WARN,
	ERROR,
	DANGER,
}

export interface LogEntryBase {
	severity: LogSeverity;
	message: string[];
	timestamp: Date;
}

/**
 * An entry to the browser console log, made with the global `console` object.
 */
export interface ConsoleLogEntry extends LogEntryBase {
	stack_trace: StackFrame[];
}

/**
 * An entry to the STARDOS mission log, made with the `logging` store.
 */
export interface MissionLogEntry extends LogEntryBase {
	mission: UUID;
}

export interface StackFrame {
	function: string;
	location: string;
}

export const useLogging = defineStore("logging", () => {
	const log_entries: Ref<ConsoleLogEntry[]> = ref([]);

	const flightLogs: Ref<MissionLogEntry[]> = ref([]);

	const payloadStore = usePayloadStore();

	function log(severity: LogSeverity, ...message: string[]): void {
		const uuid = payloadStore.payload?.config?.uuid ?? "unknown";

		flightLogs.value.push({
			severity,
			message,
			timestamp: new Date(Date.now()),
			mission: uuid,
		});
	}

	const flight = {
		debug(...message: string[]) {
			log(LogSeverity.DEBUG, ...message);
		},
		info(...message: string[]) {
			log(LogSeverity.INFO, ...message);
		},
		warn(...message: string[]) {
			log(LogSeverity.WARN, ...message);
		},
		danger(...message: string[]) {
			log(LogSeverity.DANGER, ...message);
		},
	};

	return { log_entries, flightLogs, log, flight };
});

function parse_stack_trace(trace?: string) {
	if (!trace) {
		return [];
	}
	return trace
		.split("\n")
		.map<StackFrame>((frame) => {
			const [func, location] = frame.split("@");
			return {
				function: func,
				location,
			};
		})
		.slice(1);
}

function create_logger(
	log_function: (...args: any[]) => void,
	severity: LogSeverity
) {
	const store = useLogging();
	return (...args: any[]) => {
		log_function(...args);
		// Only save the logs if enabled in settings
		if (useSettingsStore().settings.save_console_logs) {
			const message = args.map<string>((arg) => {
				if (typeof arg === "object") {
					return JSON.stringify(arg);
				}
				return arg;
			}, "");
			store.log_entries.push({
				severity,
				message,
				stack_trace: parse_stack_trace(new Error().stack),
				timestamp: new Date(Date.now()),
			});
		}
	};
}

let logging_enabled = false;

// Polyfill the console log functions
export function enableLogging() {
	if (logging_enabled) {
		console.error(
			"Log functions have already been polyfilled, refusing to re-enable."
		);
		return;
	}
	logging_enabled = true;
	console.log = create_logger(console.log, LogSeverity.LOG);
	console.info = create_logger(console.info, LogSeverity.INFO);
	console.warn = create_logger(console.warn, LogSeverity.WARN);
	console.error = create_logger(console.error, LogSeverity.ERROR);
	(console as any).logger = useLogging();
}
