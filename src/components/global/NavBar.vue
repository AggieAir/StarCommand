<template>
	<div class="navbar">
		<RouterLink
			class="nav-link"
			v-for="({ target, text }, index) in linked_routes"
			:to="target"
			:key="index"
		>
			{{ text }}
		</RouterLink>
	</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
	data: () => ({
		linked_routes: [
			{
				target: { name: 'home' },
				text: 'Payload Status',
			},
			{
				target: { name: 'payload-config' },
				text: 'Payload Settings',
			},
			{
				target: { name: 'load' },
				text: 'Load Config',
			},
			{
				target: { name: 'database' },
				text: 'Database',
			},
			{
				target: { name: 'logs' },
				text: 'Logs',
			},
			{
				target: { name: 'settings' },
				text: 'Settings',
			},
		],
	}),
});
</script>

<style scoped>
.navbar {
	display: flex;
	justify-content: flex-start;
	align-items: center;
	background-color: var(--color-background-soft);
	z-index: var(--z-index-statusbar);
}
.navbar .nav-link {
	margin-right: 10px;
	color: var(--color-text-soft);
	display: block;
	padding: 5px 10px;
}

.navbar .nav-link:hover {
	background-color: var(--color-background-mute);
}
</style>
