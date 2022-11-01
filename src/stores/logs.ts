import { defineStore } from 'pinia';

export enum LogSeverity {
	DEBUG,
	INFO,
	LOG,
	WARN,
	ERROR,
}

export interface LogEntry {
	severity: LogSeverity;
	message: string[];
	stack_trace: StackFrame[];
	timestamp: Date;
}

export interface StackFrame {
	function: string;
	location: string;
}

export const useLogStore = defineStore({
	id: 'logging',
	state: () => ({
		log_entries: [] as LogEntry[],
	}),
});

function parse_stack_trace(trace?: string) {
	if (!trace) {
		return [];
	}
	return trace
		.split('\n')
		.map<StackFrame>((frame) => {
			const [func, location] = frame.split('@');
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
	const store = useLogStore();
	return (...args: any[]) => {
		log_function(...args);
		const message = args.map<string>((arg) => {
			if (typeof arg === 'object') {
				return JSON.stringify(arg);
			}
			return arg;
		}, '');
		store.log_entries.push({
			severity,
			message,
			stack_trace: parse_stack_trace(new Error().stack),
			timestamp: new Date(Date.now()),
		});
	};
}

let logging_enabled = false;

// Polyfill the console log functions
export function enableLogging() {
	if (logging_enabled) {
		console.error(
			'Log functions have already been polyfilled, refusing to re-enable.'
		);
		return;
	}
	logging_enabled = true;
	console.debug = create_logger(console.debug, LogSeverity.DEBUG);
	console.log = create_logger(console.log, LogSeverity.LOG);
	console.info = create_logger(console.info, LogSeverity.INFO);
	console.warn = create_logger(console.warn, LogSeverity.WARN);
	console.error = create_logger(console.error, LogSeverity.ERROR);
}
