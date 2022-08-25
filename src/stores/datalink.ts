import type { IncomingMessage, OutgoingMessage } from '@/datalink';
import { defineStore } from 'pinia';
import { useNotifications } from './notifications';
import {
	DismissReason,
	Notification,
	NotificationUrgency,
} from '@/notification';
import router from '@/router';
import type {
	ConfigResponse,
	ControlMessage,
	ParameterList,
	ParameterResponse,
} from '@/datastructures/status/control';
import type { MissionConfiguration } from '@/datastructures/configuration';

// Pull address and port from local storage.
const telemetry_address = localStorage.getItem('telemetry_address');
const telemetry_port = localStorage.getItem('telemetry_port');
const config_address = localStorage.getItem('config_address');
const config_port = localStorage.getItem('config_port');

const telemetry_no_addr_notif = new Notification(
	'Telemetry server address not set.',
	'StarCommand needs a separate server process in order to receive telemetry from the payload. Click here to set the address for this server.',
	NotificationUrgency.CRITICAL,
	(reason) => {
		if (reason === DismissReason.USER_CLICK) {
			router.push({ name: 'settings' });
		}
	}
);

const config_no_addr_notif = new Notification(
	'Configuration server address not set.',
	'StarCommand needs a separate server process in order to configure the payload. Click here to set the address for this server.',
	NotificationUrgency.CRITICAL,
	(reason) => {
		if (reason === DismissReason.USER_CLICK) {
			router.push({ name: 'settings' });
		}
	}
);

const telemetry_offline_notif = new Notification(
	'Telemetry server is offline.',
	'The payload telemetry server is offline. Please check your connection and try again.',
	NotificationUrgency.CRITICAL,
	(reason) => {
		if (reason === DismissReason.USER_CLICK) {
			router.push({ name: 'settings' });
		}
	}
);

const config_offline_notif = new Notification(
	'Configuration server is offline.',
	'The payload configuration server is offline. Please check your connection and try again.',
	NotificationUrgency.CRITICAL,
	(reason) => {
		if (reason === DismissReason.USER_CLICK) {
			router.push({ name: 'settings' });
		}
	}
);

const online_notification = new Notification(
	'Communication servers are online.',
	'StarCommand can now communicate with the payload.',
	NotificationUrgency.LOW
);

const create_connection = (address: string | null, port: string | null) => {
	if (!address || !port) {
		return undefined;
	}
	try {
		return new WebSocket(`ws://${address}:${port}`);
	} catch (e) {
		console.error(e);
		return undefined;
	}
};

export interface ComputerConnection {
	/**
	 * The name of the computer.
	 */
	name: string;
	/**
	 * The STARDOS system the computer is located within.
	 */
	system: string;
}

export const useDatalink = defineStore({
	id: 'datalink',
	state: () => {
		return {
			/**
			 * The address of the telemetry radio communication server.
			 */
			telemetry_address,
			/**
			 * The port of the telemetry radio communication server.
			 */
			telemetry_port,
			/**
			 * The address of the configuration server that talks directly to the
			 * payload.
			 */
			config_address,
			/**
			 * The port of the configuration server that talks directly to the
			 * payload.
			 */
			config_port,
			/**
			 * If the telemetry radio communication server is online.
			 */
			telemetry_connected: false,
			/**
			 * If the configuration server is online.
			 */
			config_connected: false,
			/**
			 * The websocket connection to the telemetry radio communication server.
			 */
			telemetry_connection: undefined as WebSocket | undefined,
			/**
			 * The websocket connection to the configuration server.
			 */
			config_connection: undefined as WebSocket | undefined,
			/**
			 * Telemetry callback functions.
			 */
			telemetry_callbacks: [] as ((msg: IncomingMessage) => void)[],
			/**
			 * Configuration waiting callbacks.
			 */
			config_callbacks: [] as ((msg: IncomingMessage) => void)[],
			/**
			 * A list of connected computers.
			 */
			connected_computers: [] as ComputerConnection[],
		};
	},
	actions: {
		/**
		 * Attempt to open connections to the telemetry radio communication server and
		 * the configuration server using the stored addresses. These should be set
		 * before calling this action when changing the addresses. This commits any
		 * changes in addresses to local storage.
		 */
		connect() {
			if (this.telemetry_connected) {
				this.disconnect_telemetry();
			}
			if (this.config_connected) {
				this.disconnect_config();
			}
			if (!this.telemetry_address || !this.telemetry_port) {
				useNotifications().show(telemetry_no_addr_notif);
				return;
			}
			// if (!this.config_address || !this.config_port) {
			// 	useNotifications().show(config_no_addr_notif);
			// 	return;
			// }

			this.telemetry_connection = create_connection(
				this.telemetry_address,
				this.telemetry_port
			);
			// this.config_connection = create_connection(
			// 	this.config_address,
			// 	this.config_port
			// );

			this.telemetry_connection?.addEventListener('open', () => {
				this.telemetry_connected = true;
				if (this.config_connected) {
					useNotifications().show(online_notification);
				}
			});
			this.telemetry_connection?.addEventListener('close', () => {
				this.telemetry_connected = false;
			});
			this.telemetry_connection?.addEventListener('error', () => {
				this.telemetry_connected = false;
				useNotifications().show(telemetry_offline_notif);
			});
			this.telemetry_connection?.addEventListener('message', (msg) => {
				const content = JSON.parse(msg.data, (key, value) => {
					if (key === 'data') {
						return new Uint8Array(value);
					}
					return value;
				});
				this.telemetry_callbacks.forEach((callback) => callback(content));
			});

			return;

			this.config_connection?.addEventListener('open', () => {
				this.config_connected = true;
				if (this.telemetry_connected) {
					useNotifications().show(online_notification);
				}
			});
			this.config_connection?.addEventListener('close', () => {
				this.config_connected = false;
			});
			this.config_connection?.addEventListener('error', () => {
				this.config_connected = false;
				useNotifications().show(config_offline_notif);
			});
			this.config_connection?.addEventListener('message', (msg) => {
				const content = JSON.parse(msg.data);
				if (content.type === 'discovery') {
					this.connected_computers = content.computers;
				} else {
					this.config_callbacks.forEach((callback) => callback(content));
				}
			});
		},
		disconnect_telemetry() {
			if (this.telemetry_connection) {
				this.telemetry_connection.close();
			}
		},
		disconnect_config() {
			if (this.config_connection) {
				this.config_connection.close();
			}
		},
		/**
		 * Sends a command to the payload.
		 * @param command The command to send to the payload.
		 */
		send_command(command: ControlMessage) {
			if (!this.telemetry_connected) {
				console.error('Telemetry server is offline, cannot send command.');
				return;
			}
			this.telemetry_connection?.send(JSON.stringify(command));
		},
		/**
		 * Bind a callback function to be called when a message is received from the
		 * telemetry radio communication server.
		 * @param callback A function to call when a message is received from the
		 * telemetry radio communication server.
		 */
		bind_telemetry_callback(callback: (msg: IncomingMessage) => void) {
			this.telemetry_callbacks.push(callback);
		},
		/**
		 * Unbind a callback function from being called when a message is received
		 * from the telemetry radio communication server.
		 * @param callback The function to unbind.
		 */
		unbind_telemetry_callback(callback: (msg: IncomingMessage) => void) {
			this.telemetry_callbacks = this.telemetry_callbacks.filter(
				(c) => c !== callback
			);
		},
		async upload_config(config: MissionConfiguration) {
			if (!this.config_connected) {
				console.error('Config server is offline, cannot upload config.');
				return;
			}
			return new Promise<void>((resolve) => {
				config = { ...config };
				// Remove the definitions from the config, replacing them with the
				// names of the definitions. They will be loaded from persistent
				// storage when the config is loaded.
				config.capture_groups = config.capture_groups.map((group) => {
					group = { ...group };
					group.definition = group.definition.name as any;
					group.sensors = group.sensors.map((sensor) => {
						sensor = { ...sensor };
						sensor.nodes = sensor.nodes.map((node) => {
							node = { ...node };
							node.definition = node.definition.name as any;
							return node;
						});
						return sensor;
					});
					return group;
				});
				const msg: ControlMessage = {
					type: 'control',
					protocol: 'ros',
					payload: JSON.stringify(config),
					target: '/set_config',
				};
				this.telemetry_connection?.send(JSON.stringify(msg));
				resolve();
			});
		},
		// 	async set_parameter(computer: string, name: string, value: any) {
		// 		if (!this.config_connected) {
		// 			console.error('Config server is offline, cannot set parameter.');
		// 			return;
		// 		}
		// 		return new Promise<ParameterResponse>((resolve) => {
		// 			const msg = {
		// 				type: 'set-parameter',
		// 				computer,
		// 				name,
		// 				value: JSON.stringify(value),
		// 			};
		// 			this.config_connection?.send(JSON.stringify(msg));
		// 			const config_callback = (msg: any) => {
		// 				if (msg.type === 'parameter-response') {
		// 					this.config_callbacks = this.config_callbacks.filter(
		// 						(c) => c !== config_callback
		// 					);
		// 					resolve(msg);
		// 				}
		// 			};
		// 			this.config_callbacks.push(config_callback);
		// 		});
		// 	},
		// 	async get_parameters(computer: string) {
		// 		if (!this.config_connected) {
		// 			console.error('Config server is offline, cannot get parameters.');
		// 			return;
		// 		}
		// 		return new Promise<ParameterList>((resolve) => {
		// 			const msg = {
		// 				type: 'parameter-request',
		// 				computer,
		// 			};
		// 			this.config_connection?.send(JSON.stringify(msg));
		// 			const config_callback = (msg: any) => {
		// 				if (msg.type === 'parameter-list') {
		// 					this.config_callbacks = this.config_callbacks.filter(
		// 						(c) => c !== config_callback
		// 					);
		// 					resolve(msg);
		// 				}
		// 			};
		// 			this.config_callbacks.push(config_callback);
		// 		});
		// 	},
		// 	refresh_systems() {
		// 		const msg = {
		// 			type: 'refresh',
		// 		};
		// 		this.config_connection?.send(JSON.stringify(msg));
		// 	},
	},
});
