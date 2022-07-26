import type { MissionConfiguration } from '../configuration';
import { CaptureGroup } from './capture_group';
import { Computer } from './computer';
import {
	message_is_capture_group_heartbeat,
	message_is_computer_status,
	message_is_node_heartbeat,
	message_is_payload_heartbeat,
	type Heartbeat,
	type IncomingMessage,
} from './heartbeats';

/**
 * An enum representing the overall state of the payload.
 * This is state as reported by control nodes. All of the control
 * nodes should report the same state, but the reported payload state
 * will be from the payload computer's control node.
 */
export enum PayloadState {
	/**
	 * The control node is initializing.
	 */
	CONTROL_INIT = 0,
	/**
	 * The control node is parsing the mission configuration.
	 */
	CONFIG_INIT = 1,
	/**
	 * The control node is starting the mission and waiting for
	 * subprocesses to report ready.
	 */
	SENSOR_INIT = 2,
	/**
	 * The control node is ending the mission and is waiting for
	 * subprocesses to exit. This may take time.
	 */
	SENSOR_SHUTDOWN = 3,
	/**
	 * The control node is shutting down.
	 */
	CONTROL_SHUTDOWN = 4,
	/**
	 * At least one capture group reports that it is active (in a capture state).
	 */
	CAPTURING = 10,
	/**
	 * Control node is waiting to be configured. This is the default state.
	 */
	WAITING_FOR_CONFIG = 12,
	/**
	 * Configuration has been parsed and the control node is waiting for
	 * the mission start command.
	 */
	READY_FOR_MISSION_START = 13,
	/**
	 * Mission is running but no capture groups are active (in a capture state).
	 */
	STANDBY = 14,

	/*
	/////////\\\\\\\\\
	|| ERROR STATES ||
	\\\\\\\\\/////////
	*/

	/**
	 * A node has crashed or failed to start. This is a fatal error.
	 */
	ERROR_NODE_FAILURE = -1,
	/**
	 * The payload does not have the necessary software installed.
	 */
	ERROR_SOFTWARE_INCOMPATIBLE = -2,
	/**
	 * The payload has run out of storage space.
	 */
	ERROR_DISK_SPACE = -3,
	/**
	 * The payload has run out of transient storage space.
	 */
	ERROR_MEMORY = -4,
}

export class Payload {
	private _state = PayloadState.CONTROL_INIT;

	public get state(): number {
		return this._state;
	}

	private _payload_computer: Computer;

	public get payload_computer(): Readonly<Computer> {
		return this._payload_computer;
	}

	private _copilot_computer?: Computer;

	public get copilot_computer(): Readonly<Computer> | undefined {
		return this._copilot_computer;
	}

	private _capture_groups: Map<string, CaptureGroup> = new Map();

	public get capture_groups(): Readonly<Map<string, CaptureGroup>> {
		return this._capture_groups;
	}

	public get config(): Readonly<MissionConfiguration> | undefined {
		return this._config;
	}

	public constructor(private _config?: MissionConfiguration) {
		// With lack of config, assume both computers exist.
		if (!_config) {
			this._payload_computer = new Computer('Payload');
			this._copilot_computer = new Computer('Copilot');
			return;
		}
		this._payload_computer = new Computer(_config.payload);
		if (_config.aircraft?.copilot_installed) {
			this._copilot_computer = new Computer(`${_config.aircraft.name} Copilot`);
		}

		this._capture_groups = new Map(
			_config.capture_groups.map((capture_group) => [
				capture_group.name,
				CaptureGroup.from_config(capture_group),
			])
		);
	}

	public handle_message(message: IncomingMessage): void {
		if (message_is_capture_group_heartbeat(message)) {
			this._capture_groups
				.get(message.capture_group)
				?.parse_heartbeat(message.data);
		} else if (message_is_node_heartbeat(message)) {
			this._capture_groups
				.get(message.capture_group)
				?.sensors.get(message.sensor)
				?.nodes.find((node) => node.name === message.node)
				?.parse_heartbeat(message.data);
		} else if (message_is_computer_status(message)) {
			if (
				message.computer === this.payload_computer.name ||
				message.computer.includes('APL')
			) {
				this._payload_computer.parse_heartbeat(message.data);
			} else {
				this._copilot_computer?.parse_heartbeat(message.data);
			}
		} else if (message_is_payload_heartbeat(message)) {
			this.parse_heartbeat(message.data);
		} else {
			console.error(`Unknown message type: ${message}`);
		}
	}

	private parse_heartbeat(message: Heartbeat): void {
		this._state = message.state;
	}
}
