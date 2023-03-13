<script lang="ts">
import { defineComponent } from 'vue';
import Modal from './components/widgets/Modal.vue';
import StatusBar from './components/global/StatusBar.vue';
import NavBar from './components/global/NavBar.vue';
import NotificationList from './components/global/NotificationList.vue';
import { useDatalink } from './stores/datalink';
import Database from './database';
import PayloadMonitorView from './views/PayloadMonitorView.vue';
import ContextMenu from './components/widgets/ContextMenu.vue';
import { useContextMenu } from './stores/context';
import AlertBox from './components/widgets/AlertBox.vue';
import PromptBox from './components/widgets/PromptBox.vue';
import { back } from './pagetree';
import { useConfigStore } from './stores/config';
import { enableLogging } from './stores/logs';
import { useDeviceStore } from './stores/devices';

export default defineComponent({
	computed: {
		router_visible(): boolean {
			return this.$route.name !== 'home';
		},
		current_config() {
			return useConfigStore().config;
		},
	},
	watch: {
		current_config: {
			handler() {
				const store = useConfigStore();
				if (store.just_loaded) {
					// Don't mark as dirty immediately after a load.
					store.just_loaded = false;
					return;
				}
				useConfigStore().dirty = true;
				console.log('Flagging config as dirty');
			},
			deep: true,
		},
	},
	data: () => ({}),
	components: {
		Modal,
		StatusBar,
		NavBar,
		NotificationList,
		PayloadMonitorView,
		ContextMenu,
		AlertBox,
		PromptBox,
	},
	mounted() {
		// Initialize the device store before the datalink
		const devices = useDeviceStore();
		// Connect to the datalink server.
		const datalink = useDatalink();
		datalink.connect();

		// Force initialization of the database.
		Database.get_database();

		// Block default context menu.
		document.addEventListener('contextmenu', (e) => {
			e.preventDefault();
			return false;
		});

		// Bind esc to close context menu or modal.
		document.addEventListener('keydown', (e) => {
			if (e.key === 'Escape') {
				const contextMenu = useContextMenu();
				if (contextMenu.is_open) {
					contextMenu.close();
				} else {
					back(this.$router);
				}
			}
		});
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
			<PayloadMonitorView />
			<Modal v-if="router_visible">
				<RouterView />
			</Modal>
			<AlertBox />
			<PromptBox />
		</main>
	</div>
	<footer>
		<StatusBar />
	</footer>
	<ContextMenu />
</template>

<style lang="scss">
@import '@/assets/base.scss';
</style>

<style scoped>
main {
	position: fixed;
	top: calc(1em+10px);
	left: 0;
	width: 100%;
	height: calc(100% - 2em - 38px);
	overflow-y: scroll;
	z-index: 0;
}

footer {
	position: fixed;
	bottom: 0;
	left: 0;
	width: 100%;
	height: calc(1em+10px);
}
</style>
