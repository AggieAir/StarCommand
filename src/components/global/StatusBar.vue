<template>
	<div class="status-bar">
		<div class="comms" :class="{ online: telem_connected || config_connected }">
			Server address: {{ server_address }}
		</div>
		<div v-if="estop_enabled" class="warning">
			Mission abort is enabled. Read all prompts.
		</div>
		<div class="comms" :class="{ online: telem_connected || config_connected }">
			Link status: {{ link_status }}
		</div>
	</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { useDatalink } from '@/stores/datalink';
import { usePayloadStore } from '@/stores/payload';

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
		estop_enabled() {
			return usePayloadStore().allow_estop;
		},
	},
});
</script>

<style lang="scss" scoped>
.status-bar {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 5px;
	background-color: var(--color-background-soft);
	z-index: var(--z-index-statusbar);

	.comms {
		&.online {
			color: var(--color-success);
		}

		&:not(.online) {
			color: var(--color-error);
		}
	}

	.warning {
		color: var(--color-error);
		font-weight: bold;
	}
}

.status-bar .comms.online {
	color: var(--color-success);
}

.status-bar .comms.offline {
	color: var(--color-error);
}
</style>
