import { defineStore } from 'pinia';

export interface AlertButton {
	label: string;
	dangerous?: boolean;
}

export interface AlertDef {
	title: string;
	message: string;
	buttons: AlertButton[];
}

export const useAlert = defineStore({
	id: 'alert',
	state: () => ({
		is_open: false,
		data: {
			title: 'Debug',
			message: "You shouldn't see this unless you're debugging",
			buttons: [],
		} as AlertDef,
		resolve: null as ((index: number | null) => void) | null,
	}),
	actions: {
		async open(data: AlertDef): Promise<number | null> {
			return new Promise((resolve) => {
				this.data = data;
				this.resolve = resolve;
				this.is_open = true;
			});
		},
		close(selection?: number) {
			this.is_open = false;
			this.resolve?.(selection ?? null);
		},
	},
});

export class Alert implements AlertDef {
	public title: string;
	public message: string;
	public buttons: AlertButton[];

	constructor(
		title: string | AlertDef,
		message?: string,
		buttons?: AlertButton[]
	) {
		if (typeof title === 'string') {
			this.title = title;
			if (!message) {
				throw new Error('Missing message');
			}
			this.message = message;
			this.buttons = buttons ?? [];
		} else {
			this.title = title.title;
			this.message = title.message;
			this.buttons = title.buttons;
		}
	}

	async show(): Promise<number | null> {
		return useAlert().open(this);
	}
}
