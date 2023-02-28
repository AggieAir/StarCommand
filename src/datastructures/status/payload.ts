import Database, { Table } from '@/database';
import { Alert, useAlert } from '@/stores/alert';
import { useDatalink } from '@/stores/datalink';
import { usePayloadStore } from '@/stores/payload';
import type { MissionConfiguration } from '../configuration';
import { CaptureGroup } from './capture_group';
import { Computer } from './computer';
import {
	message_is_capture_group_heartbeat,
	message_is_computer_status,
	message_is_copilot_heartbeat,
	message_is_node_heartbeat,
	message_is_payload_heartbeat,
	type Heartbeat,
	type IncomingStatusMessage,
	type PayloadHeartbeat,
	type ProcessingNodeHeartbeatMsg,
} from './heartbeats';
import type { ProcessingNode } from './node';

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
	WAITING_FOR_CONFIG = 13,
	/**
	 * Configuration has been parsed and the control node is waiting for
	 * the mission start command.
	 */
	READY_FOR_MISSION_START = 14,
	/**
	 * Mission is running but no capture groups are active (in a capture state).
	 */
	STANDBY = 12,
	/**
	 * Mission is complete, ready for shutdown. Functionally identical to
	 * WAITING_FOR_CONFIG, but semantically different.
	 */
	READY_FOR_SHUTDOWN = 15,

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
	/**
	 * The payload's operating system is in an unrecoverable state and the
	 * payload computer must be rebooted.
	 */
	ERROR_REBOOT_REQUIRED = -128,
}

export class Payload {
	private _state = PayloadState.CONTROL_INIT;

	private uuids_to_ignore: string[] = [];
	private _external_control: boolean = false;

	public get external_control(): boolean {
		return this._external_control;
	}

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

	public get state_string(): string {
		switch (this._state) {
			case PayloadState.CONTROL_INIT:
				return 'Payload software initializing...';
			case PayloadState.CONFIG_INIT:
				return 'Parsing mission configuration...';
			case PayloadState.SENSOR_INIT:
				return 'Initializing mission...';
			case PayloadState.SENSOR_SHUTDOWN:
				return 'Waiting for mission shutdown...';
			case PayloadState.CONTROL_SHUTDOWN:
				return 'Payload shutting down...';
			case PayloadState.CAPTURING:
				return 'Collecting data';
			case PayloadState.WAITING_FOR_CONFIG:
				return 'Waiting for config upload';
			case PayloadState.READY_FOR_MISSION_START:
				return 'Ready for mission start';
			case PayloadState.READY_FOR_SHUTDOWN:
				return 'Safe to power off';
			case PayloadState.STANDBY:
				return 'Standby';
			case PayloadState.ERROR_NODE_FAILURE:
				return 'Node failure';
			case PayloadState.ERROR_SOFTWARE_INCOMPATIBLE:
				return 'Incompatible software in mission configuration';
			case PayloadState.ERROR_DISK_SPACE:
				return 'Disk is full, cannot store data';
			case PayloadState.ERROR_MEMORY:
				return 'Memory is full, cannot operate';
			case PayloadState.ERROR_REBOOT_REQUIRED:
				return 'Payload computer reboot is required';
			default:
				return 'Unknown state';
		}
	}

	public constructor(private _config?: MissionConfiguration) {
		// With lack of config, assume both computers exist.
		if (!_config) {
			this._payload_computer = new Computer('Payload');
			this._copilot_computer = new Computer('Copilot');
			return;
		}
		this._payload_computer = new Computer(_config.payload);
		if (
			_config.aircraft?.has_copilot ??
			(_config.aircraft as any)?.has_copilot
		) {
			this._copilot_computer = new Computer(
				`${_config.aircraft!.name} Copilot`
			);
		}

		this._capture_groups = new Map(
			_config.capture_groups.map((capture_group) => [
				capture_group.name,
				CaptureGroup.from_config(capture_group),
			])
		);
	}

	private find_node(
		message: ProcessingNodeHeartbeatMsg
	): ProcessingNode | undefined {
		let group = this._capture_groups.get(message.capture_group);
		let sensor = group?.sensors.get(message.sensor);
		let node = sensor?.nodes.find(
			(node) => node.name.replaceAll('-', '_') === message.node
		);
		return node;
	}

	public handle_message(message: IncomingStatusMessage): void {
		if (message_is_capture_group_heartbeat(message)) {
			this._capture_groups
				.get(message.capture_group)
				?.parse_heartbeat(message.payload);
		} else if (message_is_node_heartbeat(message)) {
			const node = this.find_node(message);
			if (node === undefined) {
				console.error(
					`Received message for unknown node ${message.system}/${message.computer}/${message.capture_group}/${message.sensor}/${message.node}`
				);
				return;
			}
			node.parse_heartbeat(message.payload);
		} else if (message_is_computer_status(message)) {
			if (message.computer.includes('copilot')) {
				this._copilot_computer?.parse_heartbeat(message.payload);
			} else {
				this._payload_computer.parse_heartbeat(message.payload);
			}
		} else if (message_is_payload_heartbeat(message)) {
			this.parse_heartbeat(message.payload as any as PayloadHeartbeat);
		} else if (message_is_copilot_heartbeat(message)) {
			// Do nothing
		} else {
			console.error(`Unknown message type: ${JSON.stringify(message)}`);
		}
	}

	private async parse_heartbeat(message: PayloadHeartbeat) {
		if (message.mission_uuid !== this._config?.uuid) {
			// First check to see if we've seen it before
			const idx = this.uuids_to_ignore.findIndex(
				(uuid) => uuid === message.mission_uuid
			);
			if (idx !== -1) {
				console.debug(`Payload's mission is ignored (index ${idx})`);
				// Update payload state anyways, the control node's heartbeats are always valid.
				this._state = message.state;
				return;
			}
			console.log(
				`New mission ${message.mission_uuid} detected, requesting load. Existing mission: ${this.config?.uuid}`
			);
			const db = await Database.get_database();
			// Check to see if it exists in DB first
			const config = await (async () => {
				try {
					return await db.get<MissionConfiguration>(
						Table.MissionConfiguration,
						message.mission_uuid
					);
				} catch {
					console.warn('Mission is unknown, flagging');
					this.uuids_to_ignore.push(message.mission_uuid);
					return;
				}
			})();

			if (config !== undefined) {
				const result = await new Alert(
					'Payload is running a different mission',
					'Would you like to load the mission the payload is running?',
					[{ label: 'Yes' }, { label: 'No' }]
				).show();
				if (result === 0) {
					usePayloadStore().initialize(config, false);
					return;
				} else {
					// Add to ignore list
					this.uuids_to_ignore.push(message.mission_uuid);
				}
			}
		}
		this._state = message.state;
		// External control bit. Indicates that the mission is being controlled by some external device
		// (usually a switch) and that software commands for start and end mission will be ignored.
		// Mission abort should still function.
		this._external_control = (message.errors & (0b1 << 31)) !== 0;
	}

	public start_mission(): void {
		useDatalink().send_command({
			type: 'control',
			target: '/start_mission',
			protocol: 'ros',
			payload: '',
		});
	}

	public end_mission(): void {
		useDatalink().send_command({
			type: 'control',
			target: `/end_mission`,
			protocol: 'ros',
			payload: '',
		});
	}

	public abort_mission(): void {
		useDatalink().send_command({
			type: 'control',
			target: '/end_mission',
			protocol: 'ros',
			payload: JSON.stringify({
				options: 'abort',
			}),
		});
	}

	public activate(capture_group: string): void {
		useDatalink().send_command({
			type: 'control',
			target: `/${this.config?.aircraft?.name.toLowerCase() ?? 'aircraft'}/${
				this.payload_computer.name
			}/${capture_group}/activate`,
			protocol: 'ros',
			payload: '',
		});
	}

	public deactivate(capture_group: string): void {
		useDatalink().send_command({
			type: 'control',
			target: `/${this.config?.aircraft?.name.toLowerCase() ?? 'aircraft'}/${
				this.payload_computer.name
			}/${capture_group}/deactivate`,
			protocol: 'ros',
			payload: '',
		});
	}
}
