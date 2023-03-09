import type { Heartbeat } from './datastructures/status_input';
import type { Optional } from './utility_types';
import type { IncomingStatusMessage } from './datastructures/status/heartbeats';
import type {
	ControlMessage,
	ParameterList,
	ParameterMessage,
	ParameterRequest,
	ParameterResponse,
} from './datastructures/status/control';
import type {
	DeviceAddedMessage,
	DeviceRemovedMessage,
} from './datastructures/device_config';

export type MessagePayload =
	| {
			[key: string]: any;
	  }
	| Heartbeat;

export type IncomingMessage =
	| IncomingStatusMessage
	| ParameterResponse
	| ParameterList
	| DeviceAddedMessage
	| DeviceRemovedMessage;
export type OutgoingMessage =
	| ParameterMessage
	| ControlMessage
	| ParameterRequest;

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

	// private validate_msg(msg: any): msg is IncomingStatusMessage {
	// 	return (
	// 		typeof msg === 'object' &&
	// 		typeof msg.data === 'object' &&
	// 		typeof msg.data.computer === 'string' &&
	// 		typeof msg.data.system === 'string' &&
	// 		(msg.data.topic === 'heartbeat' || msg.data.topic === 'system_status') &&
	// 		(!msg.data.node || typeof msg.data.node === 'string') &&
	// 		(!msg.data.sensor || typeof msg.data.sensor === 'string') &&
	// 		(!msg.data.capture_group || typeof msg.data.capture_group === 'number')
	// 	);
	// }

	private validate_msg(msg: any): msg is IncomingMessage {
		// TODO: implement
		return true;
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

	/**
	 * Sends a message to the server.
	 * @param msg Message to send
	 */
	public send(msg: OutgoingMessage): void {
		if (this.socket) {
			this.socket.send(JSON.stringify(msg));
		} else {
			throw new Error('Datalink not connected');
		}
	}

	/**
	 * Registers a message callback.
	 * @param filters Array of filters to apply to the callback
	 * @param callback Function to call when a message matches the filters
	 */
	public on(filters: MessageFilter[], callback: MessageCallback): void {
		this.callbacks.push({
			filters,
			callback,
		});
	}

	/**
	 * Register a function to be called when a connection is closed.
	 * @param callback Function to call when the connection is closed
	 */
	public on_close(callback: () => void): void {
		this.on_close_callbacks.push(callback);
	}

	/**
	 * Unregisters a close callback.
	 * @param callback Function to unregister
	 */
	public off_close(callback: () => void): void {
		this.on_close_callbacks = this.on_close_callbacks.filter(
			(c) => c !== callback
		);
	}

	/**
	 * Unregisters a message callback.
	 * @param callback Function to unregister
	 */
	public off(callback: MessageCallback): void {
		this.callbacks = this.callbacks.filter((cb) => cb.callback !== callback);
	}

	/**
	 * Waits for a message to be received and returns it.
	 * @param filters Filters to match against, as an array of type predicates.
	 * @param timeout Optional timeout in milliseconds.
	 * @returns A promise that resolves when a message matching the filters is received.
	 */
	public wait_for<T extends IncomingMessage>(
		filters: ((message: IncomingMessage) => message is T)[],
		timeout?: number
	): Promise<T> {
		return new Promise((resolve, reject) => {
			const callback = (msg: IncomingMessage) => {
				this.off(callback);
				// @ts-ignore: This callback is only called if the message passes the filters, so it is safe to cast
				resolve(msg);
			};
			this.on(filters, callback);
			if (timeout) {
				setTimeout(() => {
					this.off(callback);
					reject('timed out');
				}, timeout);
			}
		});
	}
}
