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
			if (this.datalink.telemetry_address === null) {
				return 'not configured';
			}
			return `${this.datalink.telemetry_address}:${this.datalink.telemetry_port}`;
		},
		telem_connected(): boolean {
			return this.datalink.telemetry_connected;
		},
		config_connected(): boolean {
			return this.datalink.config_connected;
		},
		link_status(): string {
			if (this.telem_connected && this.config_connected) {
				return 'connected';
			}
			if (this.telem_connected || this.config_connected) {
				return 'connected';
			}
			return 'disconnected';
		},
		class_list(): { [key: string]: boolean } {
			return {
				'status-bar': true,
				// online: this.telem_connected && this.config_connected,
				online: this.telem_connected || this.config_connected,
				offline: !this.telem_connected && !this.config_connected,
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
