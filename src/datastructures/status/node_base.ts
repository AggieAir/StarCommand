import type {
	NodeDataFieldDefinition,
	NodeErrorDefinition,
	NodeStateDefinition,
} from '../definition';
import type { Heartbeat } from './heartbeats';
import { Status } from './status_enum';
import * as States from './state';

/**
 * The overall state of a node, as reported by its heartbeats.
 */
export interface NodeState {
	/**
	 * The state integer of the node.
	 */
	state: number;
	/**
	 * The warning bits set, extracted from a bitmask into an array of booleans.
	 * The index of the array corresponds to the bit number.
	 */
	warnings: boolean[];
	/**
	 * The number of requests the node has received.
	 */
	requests: number;
	/**
	 * The number of requests the node has failed to complete.
	 */
	failures: number;
	/**
	 * The node-specific heartbeat data (if any), decoded.
	 * If no definition exists for the node, this will be an empty array
	 * regardless of any data in the heartbeat.
	 */
	data: NodeDataField[];
}

export function parse_data_field(
	definition: NodeDataFieldDefinition,
	data: ArrayBuffer,
	offset: number
): number | boolean | string {
	switch (definition.type) {
		case 'uint8':
			return new Uint8Array(data, offset, 1)[0];
		case 'uint16':
			return new Uint16Array(data, offset, 1)[0];
		case 'uint32':
			return new Uint32Array(data, offset, 1)[0];
		case 'uint64':
			const uint64 = new Uint32Array(data, offset, 2);
			return uint64[0] << (32 + uint64[1]);
		case 'int8':
			return new Int8Array(data, offset, 1)[0];
		case 'int16':
			return new Int16Array(data, offset, 1)[0];
		case 'int32':
			return new Int32Array(data, offset, 1)[0];
		case 'int64':
			const int64 = new Int32Array(data, offset, 2);
			return int64[0] << (32 + int64[1]);
		case 'float':
			return new Float32Array(data, offset, 1)[0];
		case 'double':
			return new Float64Array(data, offset, 1)[0];
		case 'string':
			return new TextDecoder().decode(
				new Uint8Array(data, offset, definition.size)
			);
		case 'enum':
			const enum_definition = definition.enum_definition;
			if (enum_definition === undefined) {
				throw new Error('Enum definition not found');
			}
			return enum_definition[new Uint8Array(data, offset, 1)[0]];
		default:
			throw new Error(`Unknown data field type: ${definition.type}`);
	}
}

/**
 * A parsed data field for a STARDOS node.
 */
export interface NodeDataField {
	definition: NodeDataFieldDefinition;
	value: string | number | boolean;
}

/**
 * Definition fields that all nodes must have.
 */
export interface Definition {
	errors: NodeErrorDefinition[];
	states: { [key: number]: NodeStateDefinition };
	data_fields: NodeDataFieldDefinition[];
}

export interface Configuration<DefinitionType extends Definition> {
	definition: DefinitionType;
	name: string;
}

export abstract class StardosNode<
	ConfigType extends Configuration<DefinitionType>,
	DefinitionType extends Definition
> {
	protected config?: ConfigType;
	protected _definition?: DefinitionType;

	public get definition(): Readonly<DefinitionType> | undefined {
		return this._definition;
	}

	public get configured(): boolean {
		return this.config !== undefined;
	}

	public get defined(): boolean {
		return this._definition !== undefined;
	}

	private _name: string;

	public get name(): string {
		return this._name;
	}

	private _timestamp: number | null = null;

	private _state: NodeState = {
		state: -1,
		warnings: new Array(24).fill(false),
		requests: 0,
		failures: 0,
		data: [],
	};

	/**
	 * Instantiates a status monitor for a node on mission configuration load.
	 * @param config The config object for the node.
	 */
	public static from_config<
		Subclass extends StardosNode<ConfigType, DefinitionType>,
		ConfigType extends Configuration<DefinitionType>,
		DefinitionType extends Definition
	>(config: ConfigType): Subclass {
		// @ts-ignore: This will never be called on the abstract class
		const node = new this(config.name);

		node.config = config;
		node.parse_config(config);

		return node;
	}

	/**
	 * Called when creating from a configuration, after the config object has been stored.
	 * Should perform any parsing or other initialization.
	 * This is _not_ called during transient instantiation from a heartbeat. For general initialization,
	 * use the constructor.
	 */
	protected abstract parse_config(config: ConfigType): void;

	/**
	 * Instantiates a status monitor for a node on receiving a heartbeat for an unconfigured node
	 * @param name The name of the node as reported by the heartbeat.
	 */
	public static from_heartbeat<
		Subclass extends StardosNode<ConfigType, DefinitionType>,
		ConfigType extends Configuration<DefinitionType>,
		DefinitionType extends Definition
	>(name: string): Subclass {
		// @ts-ignore: This will never be called on the abstract class
		const node = new this(name);

		return node;
	}

	public get state(): Readonly<NodeState> {
		return this._state;
	}

	protected constructor(name: string) {
		this._name = name;
	}

	private _online: boolean = false;

	public get online(): boolean {
		return this._online;
	}

	private _status_code: Status = Status.OFFLINE;

	public get status_code(): Status {
		return this._status_code;
	}

	/**
	 * The last time the node was heard from.
	 */
	public get timestamp(): number | null {
		return this._timestamp;
	}

	public get time_since_heard(): number {
		if (this._timestamp === null) {
			return NaN;
		}
		return Date.now() - this._timestamp;
	}

	public update_status_code(): Status {
		// The status code when only considering time since the last heartbeat.
		const update_time_status = (() => {
			if (this.time_since_heard > 10000) {
				return Status.ERROR;
			}
			if (this.time_since_heard > 5000) {
				return Status.WARNING;
			}
			if (this.timestamp === null) {
				return Status.OFFLINE;
			}
			return Status.ONLINE;
		})();

		// The status code when only considering the warning bits.
		const warnings_status = (() => {
			if (this.error_bit_set()) {
				return Status.ERROR;
			}
			if (this.warning_bit_set()) {
				return Status.WARNING;
			}
			return Status.ONLINE;
		})();

		// The status code when only considering the node state.
		const state_status = (() => {
			if (States.is_error_state(this.state.state)) {
				return Status.ERROR;
			}
			if (States.is_init_state(this.state.state)) {
				return Status.INITIALIZING;
			}
			if (States.is_standby_state(this.state.state)) {
				return Status.STANDBY;
			}
			if (States.is_running_state(this.state.state)) {
				return Status.RUNNING;
			}
			console.warn(`Unknown state: ${this.state.state}`);
			return Status.ONLINE;
		})();

		// Get the highest status code.
		this._status_code = Math.max(
			update_time_status,
			warnings_status,
			state_status
		);
		return this._status_code;
	}

	get errors(): number[] | NodeErrorDefinition[] {
		const set_bits = this.state.warnings
			.map((bit, index) => (bit ? index : -1))
			.filter((x) => x >= 0);
		if (!this._definition) {
			return set_bits;
		}
		return (
			set_bits
				.map((bit) => this._definition!.errors[bit])
				// Assume every undefined bit is an error.
				.filter((x) => x?.set_status ?? Status.ERROR === Status.ERROR)
		);
	}

	get warnings(): NodeErrorDefinition[] {
		if (!this._definition) {
			// We are assuming that every undefined bit is an error, so we can just return an empty array.
			return [];
		}
		return this.state.warnings
			.map((bit, index) => (bit ? index : -1))
			.filter((x) => x >= 0)
			.map((bit) => this._definition!.errors[bit])
			.filter((x) => x?.set_status === Status.WARNING);
	}

	public error_bit_set(): boolean {
		const set_bits = this.state.warnings
			.map((bit, index) => (bit ? index : -1))
			.filter((x) => x >= 0);
		if (!this._definition) {
			return set_bits.length > 0;
		}
		return set_bits.some(
			(bit) =>
				this._definition!.errors[bit]?.set_status ??
				Status.ERROR === Status.ERROR
		);
	}

	public warning_bit_set(): boolean {
		return this.state.warnings
			.map((bit, index) => (bit ? index : -1))
			.filter((x) => x >= 0)
			.some(
				(bit) => this._definition!.errors[bit]?.set_status === Status.WARNING
			);
	}

	public parse_heartbeat(heartbeat: Heartbeat) {
		this._state.state = heartbeat.state;
		const warning_num = heartbeat.warnings.reduce((acc, x, idx) => {
			return (acc + x) << (idx * 8);
		}, 0);
		this._state.warnings = (() => {
			const bits = ([] as boolean[])
				.fill(false, 0, 32)
				.map((_, idx) => (warning_num & (1 << idx)) > 0);
			return bits;
		})();
		this._state.requests = heartbeat.requests;
		this._state.failures = heartbeat.failures;
		this._state.data = this.parse_data(heartbeat.data);
		this.update_status_code();
		this._online = true;
		this._timestamp = Date.now();
	}

	protected parse_data(data: ArrayBuffer): NodeDataField[] {
		if (!this._definition) {
			return [];
		}
		const fields = this._definition.data_fields;
		let offset = 0;
		return fields.map((field) => {
			offset += field.size;
			try {
				const value = parse_data_field(field, data, offset);
				return { definition: field, value };
			} catch (e) {
				console.error(e);
				return { definition: field, value: 'error decoding data' };
			}
		});
	}
}
