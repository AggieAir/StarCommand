import Database, { Table } from '@/database';
import { Notification, NotificationUrgency } from '@/notification';
import { useDeviceStore } from '@/stores/devices';
import { useNotifications } from '@/stores/notifications';
import type { Nullable } from '@/utility_types';
import type { MissionConfiguration } from './configuration';
import {
	ConfigEntryType,
	ConstraintRelation,
	ConstraintSeverity,
	ConstraintType,
	type ConfigEntryDefinition,
} from './definition';

export type DeviceType = 'payload' | 'copilot' | 'ground' | 'hybrid';

export interface DeviceAddedMessage {
	type: 'computer_discovered';
	hostname: string;
	computer_type: DeviceType;
	ips: string[];
}

export interface DeviceRemovedMessage {
	type: 'computer_removed';
	hostname: string;
	computer_type: DeviceType;
}

export interface Device {
	ips: string[];
	computer_type: DeviceType;
	missions?: string[];
}

export type DeviceList = { [hostname: string]: Device };

export enum ConfigLoadingMode {
	WAIT_FOR_UPLOAD = 'upload',
	LOAD_ON_BOOT = 'boot',
	LOAD_ON_START = 'start',
}

export enum LogLevel {
	DEBUG = 'debug',
	INFO = 'info',
	WARN = 'warn',
	ERROR = 'error',
	FATAL = 'fatal',
}

export interface PayloadSettings {
	aircraft: string;
	config_loading_mode: ConfigLoadingMode;
	config_to_load: string;
	enforce_date: boolean;
	allow_pilot_control: boolean;
	/**
	 * To make the type checker happy. Don't abuse this.
	 */
	[key: string]: any;
}

export interface CopilotSettings {
	mavlink_url: string;
	log_level: LogLevel;
	/**
	 * To make the type checker happy. Don't abuse this.
	 */
	[key: string]: any;
}

export interface GroundSettings {
	mavlink_url: string;
	/**
	 * To make the type checker happy. Don't abuse this.
	 */
	[key: string]: any;
}

export const settingsDefinitions = {
	payload: async (payload: DeviceEditor): Promise<ConfigEntryDefinition[]> => [
		{
			name: 'aircraft',
			human_name: 'Aircraft',
			description: 'The aircraft the payload is currently installed in',
			required: true,
			type: ConfigEntryType.STRING,
		},
		{
			name: 'config_loading_mode',
			human_name: 'Mission Auto-Load Mode',
			description: 'How missions should be loaded when the payload boots up',
			required: true,
			type: ConfigEntryType.ENUM,
			choices: [
				'Require a mission upload',
				'Load specified mission at boot',
				'Load specified mission when starting',
			],
		},
		{
			name: 'config_to_load',
			human_name: 'Mission to Auto-Load',
			description: 'What mission should be loaded automatically',
			choices: payload.missions ?? (await payload.fetchMissions()),
			type: ConfigEntryType.ENUM,
			required: true,
		},
		{
			name: 'enforce_date',
			human_name: 'Enforce Mission Date',
			description:
				'Whether or not this payload should enforce date checks when parsing mission configs',
			required: true,
			type: ConfigEntryType.BOOLEAN,
		},
		{
			name: 'allow_pilot_control',
			human_name: 'Enable Payload Switch',
			description: 'Whether or not to enable the payload switch on the remote',
			required: true,
			type: ConfigEntryType.BOOLEAN,
		},
	],
	copilot: async (copilot: Device): Promise<ConfigEntryDefinition[]> => [
		{
			name: 'mavlink_url',
			human_name: 'MAVLink Connection URI',
			description: "Where the copilot's datalink should connect to",
			required: true,
			type: ConfigEntryType.STRING,
			constraints: [
				// {
				// 	type: ConstraintType.STATIC,
				// 	relation: ConstraintRelation.MATCHES,
				// 	alert: 'Must be a valid MAVLink connection URI',
				// 	severity: ConstraintSeverity.ERROR,
				// 	value:
				// 		'(?:(tcp|udp)://((?:(?:25[0-5]|2[0-4]d|[01]?dd?).){3}(?:25[0-5]|2[0-4]d|[01]?dd?)):(d{1,5}))|(?:serial://(/dev/tty[A-Z]+d+):(d+))',
				// },
			],
		},
	],
	ground: async (ground: Device): Promise<ConfigEntryDefinition[]> => [
		{
			name: 'mavlink_url',
			human_name: 'MAVLink Connection URI',
			description: "Where the copilot's datalink should connect to",
			required: true,
			type: ConfigEntryType.STRING,
			constraints: [
				// {
				// 	type: ConstraintType.STATIC,
				// 	relation: ConstraintRelation.MATCHES,
				// 	alert: 'Must be a valid MAVLink connection URI',
				// 	severity: ConstraintSeverity.ERROR,
				// 	value:
				// 		'(?:(tcp|udp)://((?:(?:25[0-5]|2[0-4]d|[01]?dd?).){3}(?:25[0-5]|2[0-4]d|[01]?dd?)):(d{1,5}))|(?:serial://(/dev/tty[A-Z]+d+):(d+))',
				// },
			],
		},
	],
};

function connectionError(store: any) {
	store.show(
		new Notification(
			'Connection Failure',
			'Could not connect to device settings server. This is probably a software issue.',
			NotificationUrgency.HIGH
		)
	);
}

function deviceMismatchError(store: any, type: string) {
	store.show(
		new Notification(
			'Device Mismatch Error',
			`Cannot request ${type} settings from a non-${type}. This is probably a software issue.`,
			NotificationUrgency.HIGH
		)
	);
}

async function saveSettings(
	settings: PayloadSettings | CopilotSettings | GroundSettings,
	uri: string
) {
	return fetch(uri, {
		method: 'PATCH',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(settings),
	}).then((response) => response.json());
}

export class DeviceEditor implements Device {
	public readonly computer_type: DeviceType;
	public readonly ips: string[];
	private _missions?: string[] | undefined;

	public get missions(): string[] | undefined {
		return this._missions;
	}

	public settings: {
		payload: Nullable<PayloadSettings>;
		copilot: Nullable<CopilotSettings>;
		ground: Nullable<GroundSettings>;
	} = {
		payload: null,
		copilot: null,
		ground: null,
	};

	readonly notifications = useNotifications();

	public constructor({ computer_type, ips }: Device) {
		this.computer_type = computer_type;
		this.ips = ips;
	}

	async loadSettings() {
		switch (this.computer_type) {
			case 'payload':
				this.fetchPayloadSettings();
				break;
			case 'copilot':
				this.fetchCopilotSettings();
				break;
			case 'hybrid':
				this.fetchPayloadSettings().then(this.fetchCopilotSettings.bind(this));
				break;
			case 'ground':
				this.fetchGroundSettings();
		}
	}

	async fetchPayloadSettings() {
		if (this.computer_type !== 'payload' && this.computer_type !== 'hybrid') {
			deviceMismatchError(this.notifications, 'payload');
			return false;
		}
		return fetch(`http://${this.ips[0]}:4207/api/settings/payload`)
			.then((response) => response.json())
			.then((data) => {
				this.settings.payload = data;
			})
			.then(() => true)
			.catch((error) => {
				console.error(error);
				connectionError(this.notifications);
				return false;
			});
	}

	async fetchCopilotSettings() {
		if (this.computer_type !== 'copilot' && this.computer_type !== 'hybrid') {
			deviceMismatchError(this.notifications, 'copilot');
			return false;
		}
		return fetch(`http://${this.ips[0]}:4207/api/settings/copilot`)
			.then((response) => response.json())
			.then((data) => (this.settings.copilot = data))
			.then(() => true)
			.catch((error) => {
				console.error(error);
				connectionError(this.notifications);
				return false;
			});
	}

	async fetchGroundSettings() {
		if (this.computer_type !== 'ground') {
			deviceMismatchError(this.notifications, 'ground station');
			return false;
		}
		return fetch(`http://${this.ips[0]}:4207/api/settings/ground`)
			.then((response) => response.json())
			.then((data) => (this.settings.ground = data))
			.then(() => true)
			.catch((error) => {
				console.error(error);
				connectionError(this.notifications);
				return false;
			});
	}

	async savePayloadSettings() {
		if (
			(this.computer_type !== 'payload' && this.computer_type !== 'hybrid') ||
			this.settings.payload === null
		) {
			deviceMismatchError(this.notifications, 'payload');
			return false;
		}
		const { success, settings: newSettings } = await saveSettings(
			this.settings.payload,
			`http://${this.ips[0]}:4207/api/settings/payload`
		);
		if (success) {
			this.settings.payload = newSettings;
		}
		return success;
	}

	async saveCopilotSettings() {
		if (
			(this.computer_type !== 'copilot' && this.computer_type !== 'hybrid') ||
			this.settings.copilot === null
		) {
			deviceMismatchError(this.notifications, 'copilot');
			return false;
		}
		const { success, settings: newSettings } = await saveSettings(
			this.settings.copilot,
			`http://${this.ips[0]}:4207/api/settings/copilot`
		);
		if (success) {
			this.settings.copilot = newSettings;
		}
		return success;
	}

	async saveGroundSettings() {
		if (this.computer_type !== 'ground' || this.settings.ground === null) {
			deviceMismatchError(this.notifications, 'ground station');
			return false;
		}
		const { success, settings: newSettings } = await saveSettings(
			this.settings.ground,
			`http://${this.ips[0]}:4207/api/settings/ground`
		);
		if (success) {
			this.settings.ground = newSettings;
		}
		return success;
	}

	async fetchMissions(): Promise<string[]> {
		if (this.computer_type !== 'payload' && this.computer_type !== 'hybrid') {
			throw 'Device is not a payload, so it cannot list stored missions';
		}
		const response = await fetch(`http://${this.ips[0]}:4207/api/missions`);
		const mission_uuids: string[] = await response.json();
		mission_uuids.sort((a, b) => {
			if (a == 'latest') {
				return -1;
			}
			if (b == 'latest') {
				return 1;
			}
			return a.localeCompare(b);
		});
		if (mission_uuids.length === 0) {
			mission_uuids.push('latest');
		}
		const db = await Database.get_database();
		const mission_names = await Promise.all(
			mission_uuids.map(async (uuid) => {
				try {
					const mission = await db.get<MissionConfiguration>(
						Table.MissionConfiguration,
						uuid
					);
					return mission.name;
				} catch {
					return uuid;
				}
			})
		);
		this._missions = mission_names;
		return mission_names;
	}
}
