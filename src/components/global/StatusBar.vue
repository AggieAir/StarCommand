<template>
	<div class="status-bar">
		<div>Server address: {{ server_address }}</div>
		<div>Link status: {{ link_status }}</div>
	</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
	computed: {
		server_address(): string {
			return this.$store.state.server_address;
		},
		link_status(): string {
			return this.$store.state.link_status;
		},
	},
});
</script>
