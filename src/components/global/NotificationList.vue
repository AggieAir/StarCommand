<template>
	<div class="notification-list">
		<NotificationComponent
			v-for="notification in notifications"
			:key="notification.id"
			:notification="notification"
			@select="select"
			@dismiss="dismiss"
		/>
	</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { mapState } from 'pinia';
import { useNotifications } from '@/stores/notifications';
import NotificationComponent from './Notification.vue';
import type { Notification } from '@/notification';

export default defineComponent({
	setup() {
		const notificationStore = useNotifications();
		return { notificationStore };
	},
	computed: {
		...mapState(useNotifications, {
			notifications: 'notification_queue',
		}),
	},
	methods: {
		select(notification: Notification): void {
			this.notificationStore.click(notification.id);
		},
		dismiss(notification: Notification): void {
			this.notificationStore.dismiss(notification.id);
		},
	},
	components: {
		NotificationComponent,
	},
});
</script>

<style lang="scss">
.notification-list {
	position: fixed;
	bottom: 20px;
	width: 500px;
	left: calc(50% - 250px);
	display: flex;
	flex-direction: column;
	z-index: var(--z-index-notification);
}
</style>
