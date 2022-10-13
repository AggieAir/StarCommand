import { defineStore } from 'pinia';

export enum PromptType {
	STRING,
	DATE,
	NUMBER,
}

export interface PromptDef {
	title: string;
	message: string;
	type?: PromptType;
}

export const usePrompt = defineStore({
	id: 'prompt',
	state: () => ({
		is_open: false,
		data: {
			title: 'Debug',
			message: "You shouldn't see this unless you're debugging",
		} as PromptDef,
		resolve: null as ((value: string) => void) | null,
		reject: null as (() => void) | null,
	}),
	actions: {
		async open(data: PromptDef): Promise<string> {
			return new Promise((resolve, reject) => {
				this.data = data;
				this.resolve = resolve;
				this.reject = reject;
				this.is_open = true;
			});
		},
		close(value?: string) {
			this.is_open = false;
			if (value === undefined) {
				this.reject?.();
			} else {
				this.resolve?.(value);
			}
		},
	},
});

export class Prompt implements PromptDef {
	public title: string;
	public message: string;
	public type: PromptType;

	constructor(title: string | PromptDef, message?: string, type?: PromptType) {
		if (typeof title === 'string') {
			this.title = title;
			if (!message) {
				throw new Error('Missing message');
			}
			this.message = message;
			this.type = type ?? PromptType.STRING;
		} else {
			this.title = title.title;
			this.message = title.message;
			this.type = title.type ?? PromptType.STRING;
		}
	}

	async show(): Promise<string> {
		return usePrompt().open(this);
	}
}
