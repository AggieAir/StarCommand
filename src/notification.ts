import type { Nullable, Optional } from './utility_types';

export enum NotificationUrgency {
	LOW = 0,
	NORMAL = 1,
	HIGH = 2,
	CRITICAL = 3,
}

export enum DismissReason {
	TIMEOUT,
	USER_CLICK,
	USER_DISMISS,
}

export class Notification {
	private static id_counter = 0;
	public readonly id: number;
	public readonly timeout: Nullable<number>;

	public static readonly TIMEOUT_DEFAULTS = [
		0, // low
		5, // normal
		null, // high
		null, // critical
	];

	public constructor(
		public readonly title: string,
		public message: string,
		public urgency: NotificationUrgency,
		private readonly callback?: (reason: DismissReason) => void,
		timeout?: Nullable<number>, // in seconds
		manual_id?: number
	) {
		if (manual_id) {
			this.id = manual_id;
		} else {
			this.id = Notification.id_counter++;
		}

		if (timeout === undefined) {
			timeout = Notification.TIMEOUT_DEFAULTS[this.urgency];
		}
		this.timeout = timeout;
	}

	public dismiss(reason: DismissReason = DismissReason.USER_DISMISS): void {
		console.debug(`Notification ${this.id} dismissed (${reason})`);
		if (this.callback) {
			this.callback(reason);
		}
	}

	public click(): void {
		this.dismiss(DismissReason.USER_CLICK);
	}
}
