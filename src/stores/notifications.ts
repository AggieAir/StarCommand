import { defineStore } from 'pinia';
import type { Notification } from '../notification';

export const useNotifications = defineStore({
	id: 'notifications',
	state: () => ({
		notification_history: [] as Notification[],
		notification_queue: [] as Notification[],
	}),
	actions: {
		show(notification: Notification) {
			// Add notification to queue and history. If this notification has already been shown,
			// move it to the end of both the queue and history.
			const history_index = this.notification_history.findIndex(
				(n) => n.id === notification.id
			);
			if (history_index !== -1) {
				this.notification_history.splice(history_index, 1);
			}
			this.notification_history.push(notification);
			const queue_index = this.notification_queue.findIndex(
				(n) => n.id === notification.id
			);
			if (queue_index > -1) {
				this.notification_queue.splice(queue_index, 1);
			}
			this.notification_queue.push(notification);
			// Handle timeout
			if (notification.timeout) {
				setTimeout(() => {
					this.dismiss(notification.id);
				}, notification.timeout * 1000);
			}
		},
		dismiss(id: number) {
			const notification = this.notification_queue.find((n) => n.id === id);
			if (notification) {
				notification.dismiss();
				this.notification_queue = this.notification_queue.filter(
					(n) => n.id !== id
				);
			}
		},
		click(id: number) {
			const notification = this.notification_queue.find((n) => n.id === id);
			if (notification) {
				notification.click();
				this.notification_queue = this.notification_queue.filter(
					(n) => n.id !== id
				);
			}
		},
	},
});
