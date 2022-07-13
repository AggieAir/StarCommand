import { Datalink } from '@/datalink';
import { defineStore } from 'pinia';
import { useNotifications } from './notifications';
import {
	DismissReason,
	Notification,
	NotificationUrgency,
} from '@/notification';
import router from '@/router';

// Pull address and port from local storage.
const address = localStorage.getItem('datalink-address');
const port = (() => {
	const p = localStorage.getItem('datalink-port');
	if (p) {
		return parseInt(p);
	}
	return null;
})();

const no_address_notification = new Notification(
	'Communication server address not set.',
	'StarCommand needs a separate server process in order to communicate with the payload. Click here to set the address for this server.',
	NotificationUrgency.CRITICAL,
	(reason) => {
		if (reason === DismissReason.USER_CLICK) {
			router.push({ name: 'settings' });
		}
	}
);

const offline_notification = new Notification(
	'Communication server is offline.',
	'The server is offline. Please check your connection and try again.',
	NotificationUrgency.CRITICAL,
	(reason) => {
		if (reason === DismissReason.USER_CLICK) {
			router.push({ name: 'settings' });
		}
	}
);

const online_notification = new Notification(
	'Communication server is online.',
	'StarCommand is now communicating with the local ROS network.',
	NotificationUrgency.LOW
);

const connection_failed_notification = new Notification(
	'Connection to communication server failed.',
	'The server is offline. Please check your connection and try again.',
	NotificationUrgency.HIGH,
	undefined,
	30
);

export const useDatalink = defineStore({
	id: 'datalink',
	state: () => {
		const result = {
			address,
			port,
			datalink: Datalink.get_link(),
		};

		return result;
	},
	actions: {
		async connect(address?: string, port?: number) {
			return new Promise<void>((resolve, reject) => {
				const notifications = useNotifications();
				if (this.datalink) {
					this.datalink.disconnect();
				}
				if (!address || !port) {
					notifications.show(no_address_notification);
					resolve();
					return;
				}
				this.address = address;
				this.port = port;
				this.datalink
					.connect(this.address, this.port)
					.then(() => {
						notifications.show(online_notification);
						resolve();
					})
					.catch(() => {
						notifications.show(offline_notification);
						reject();
					});
			});
		},
	},
});
