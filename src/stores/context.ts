import { defineStore } from 'pinia';

export interface ContextMenuOption {
	label: string; // The label of the option
	dangerous?: boolean; // If true, the option will be styled as a danger
}

export interface Position {
	x: number;
	y: number;
}

export const useContextMenu = defineStore({
	id: 'contextMenu',
	state: () => ({
		is_open: false,
		data: [] as ContextMenuOption[],
		position: { x: 0, y: 0 } as Position,
		resolve: null as ((index: number | null) => void) | null,
	}),
	actions: {
		async open(
			data: ContextMenuOption[],
			position: Position
		): Promise<number | null> {
			return new Promise((resolve) => {
				this.data = data;
				this.resolve = resolve;
				this.is_open = true;
				this.position = position;
			});
		},
		close(selection?: number) {
			this.is_open = false;
			this.resolve?.(selection ?? null);
		},
	},
});
