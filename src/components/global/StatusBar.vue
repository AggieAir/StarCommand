<template>
	<div :class="class_list">
		<div>Server address: {{ server_address }}</div>
		<div>Link status: {{ link_status }}</div>
	</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { useDatalink } from '@/stores/datalink';

export default defineComponent({
	setup() {
		const datalink = useDatalink();
		return { datalink };
	},
	computed: {
		server_address(): string {
			if (this.datalink.address === null) {
				return 'not configured';
			}
			return `${this.datalink.address}:${this.datalink.port}`;
		},
		connected(): boolean {
			return this.datalink.datalink.connected;
		},
		link_status(): string {
			return this.connected ? 'Online' : 'Offline';
		},
		class_list(): { [key: string]: boolean } {
			return {
				'status-bar': true,
				online: this.connected,
				offline: !this.connected,
			};
		},
	},
});
</script>

<style>
.status-bar {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 5px;
	background-color: var(--color-background-soft);
	z-index: var(--z-index-statusbar);
}

.status-bar.online {
	color: var(--color-success);
}

.status-bar.offline {
	color: var(--color-error);
}
</style>
