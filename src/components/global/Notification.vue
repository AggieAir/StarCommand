<template>
	<div
		class="notification"
		:class="urgency"
		@click.stop="select"
		@click.right.stop.prevent="dismiss"
	>
		<div class="title">{{ notification.title }}</div>
		<div class="message">{{ notification.message }}</div>
	</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import type { PropType } from 'vue';
import type { Notification } from '@/notification';
import { NotificationUrgency } from '@/notification';

export default defineComponent({
	props: {
		notification: {
			type: Object as PropType<Notification>,
			required: true,
		},
	},
	computed: {
		urgency(): string {
			switch (this.notification.urgency) {
				case NotificationUrgency.CRITICAL:
					return 'critical';
				case NotificationUrgency.HIGH:
					return 'high';
				case NotificationUrgency.LOW:
					return 'low';
				case NotificationUrgency.NORMAL:
					return 'normal';
				default:
					return 'normal';
			}
		},
	},
	methods: {
		select(): void {
			this.$emit('select', this.notification);
		},
		dismiss(): void {
			this.$emit('dismiss', this.notification);
		},
	},
	emits: ['select', 'dismiss'],
});
</script>

<style scoped lang="scss">
.notification {
	flex: 0 0 auto;
	padding: 5px;
	background-color: var(--color-background-soft);
	border: 1px solid var(--color-background-soft);

	text-align: center;

	.title {
		font-weight: bold;
	}
	.message {
		font-size: smaller;
	}
}

.notification.critical {
	border-color: var(--color-error);
	.title {
		color: var(--color-error);
	}
}

.notification.high {
	border-color: var(--color-error);

	.title {
		color: var(--color-error);
	}
}

.notification.low {
	border-color: var(--color-success);

	.title {
		color: var(--color-success);
	}
}

.notification.normal {
	border-color: var(--color-background);
}
</style>
