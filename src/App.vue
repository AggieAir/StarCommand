<script lang="ts">
import { defineComponent } from 'vue';
import Modal from './components/widgets/Modal.vue';
import StatusBar from './components/global/StatusBar.vue';
import NavBar from './components/global/NavBar.vue';
import NotificationList from './components/global/NotificationList.vue';
import { useDatalink } from './stores/datalink';

export default defineComponent({
	computed: {
		router_visible(): boolean {
			return this.$route.name !== 'home';
		},
	},
	components: { Modal, StatusBar, NavBar, NotificationList },
	mounted() {
		const datalink = useDatalink();
		datalink.connect();
	},
});
</script>

<template>
	<NotificationList />
	<nav>
		<NavBar />
	</nav>
	<div class="content">
		<main>
			<!-- <StatusMonitor /> -->
			<div class="placeholder"></div>
			<Modal v-if="router_visible">
				<RouterView />
			</Modal>
		</main>
	</div>
	<footer>
		<StatusBar />
	</footer>
</template>

<style>
@import '@/assets/base.css';
</style>

<style scoped>
main {
	position: fixed;
	top: calc(1em+10px);
	left: 0;
	width: 100%;
	min-height: calc(100% - 2em - 38px);
	overflow-y: scroll;
	border: 1px solid red;
}

footer {
	position: fixed;
	bottom: 0;
	left: 0;
	width: 100%;
	height: calc(1em+10px);
}
</style>
