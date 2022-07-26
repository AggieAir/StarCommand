import type { Heartbeat } from './datastructures/status_input';
import type { Optional } from './utility_types';
import type { IncomingMessage } from './datastructures/status/heartbeats';

export type MessagePayload =
	| {
			[key: string]: any;
	  }
	| Heartbeat;

type MessageCallback = (msg: IncomingMessage) => void;
export type MessageFilter = (msg: IncomingMessage) => boolean;

type FilteredCallback = {
	filters: MessageFilter[];
	callback: MessageCallback;
};

export class Datalink {
	private socket?: WebSocket;
	private callbacks: FilteredCallback[] = [];

	private on_close_callbacks: (() => void)[] = [];

	private _address?: string;
	private _port?: number;
	private readonly beforeunload: (this: Datalink) => void;

	private static datalink = new Datalink();

	public get address(): Optional<string> {
		return this._address;
	}

	public get port(): Optional<number> {
		return this._port;
	}

	public get connected(): boolean {
		return this.socket !== undefined;
	}

	public static get_link(): Datalink {
		if (!Datalink.datalink) {
			Datalink.datalink = new Datalink();
		}
		return Datalink.datalink;
	}

	private constructor() {
		this.beforeunload = (() => {
			this.disconnect();
		}).bind(this) as (this: Datalink) => void;
	}

	public async connect(address: string, port: number) {
		return new Promise<void>((resolve, reject) => {
			this._address = address;
			this._port = port;
			this.socket = new WebSocket(`ws://${this._address}:${this._port}`);
			this.socket.onopen = () => {
				resolve();
			};
			this.socket.onerror = (err) => {
				reject(err);
			};
			const that = this;
			this.socket.onmessage = (data) => {
				that.on_recv(data);
			};
			this.socket.onclose = () => {
				this.socket = undefined;
				this._address = undefined;
				this._port = undefined;
				window.removeEventListener('beforeunload', this.beforeunload);
				this.on_close_callbacks.forEach((callback) => callback());
			};
			window.addEventListener('beforeunload', this.beforeunload);
		});
	}

	public disconnect(): void {
		if (this.socket) {
			this.socket.close();
		}
	}

	private validate_msg(msg: any): msg is IncomingMessage {
		return (
			typeof msg === 'object' &&
			typeof msg.data === 'object' &&
			typeof msg.data.computer === 'string' &&
			typeof msg.data.system === 'string' &&
			(msg.data.topic === 'heartbeat' || msg.data.topic === 'system_status') &&
			(!msg.data.node || typeof msg.data.node === 'string') &&
			(!msg.data.sensor || typeof msg.data.sensor === 'string') &&
			(!msg.data.capture_group || typeof msg.data.capture_group === 'number')
		);
	}

	private on_recv(data: MessageEvent<any>): void {
		const msg: unknown = JSON.parse(data.data, (key, value) => {
			if (key === 'data') {
				return new Uint8Array(value);
			} else {
				return value;
			}
		});
		if (this.validate_msg(msg)) {
			this.callbacks.forEach((callback) => {
				if (callback.filters.every((filter) => filter(msg))) {
					callback.callback(msg);
				}
			});
		}
	}

	public send(msg: IncomingMessage): void {
		if (this.socket) {
			this.socket.send(JSON.stringify(msg));
		} else {
			throw new Error('Datalink not connected');
		}
	}

	public on(filters: MessageFilter[], callback: MessageCallback): void {
		this.callbacks.push({
			filters,
			callback,
		});
	}

	public on_close(callback: () => void): void {
		this.on_close_callbacks.push(callback);
	}

	public off_close(callback: () => void): void {
		this.on_close_callbacks = this.on_close_callbacks.filter(
			(c) => c !== callback
		);
	}

	public off(callback: MessageCallback): void {
		this.callbacks = this.callbacks.filter((cb) => cb.callback !== callback);
	}

	public wait_for(filters: MessageFilter[]): Promise<IncomingMessage> {
		return new Promise((resolve) => {
			const callback = (msg: IncomingMessage) => {
				this.off(callback);
				resolve(msg);
			};
			this.on(filters, callback);
		});
	}
}
