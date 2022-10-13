import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';

const router = createRouter({
	history: createWebHistory(import.meta.env.BASE_URL),
	routes: [
		{
			path: '/',
			name: 'home',
			component: HomeView,
		},
		{
			path: '/load_mission',
			name: 'load',
			component: () => import('../views/LoadMissionView.vue'),
			// component: HomeView,
		},
		{
			path: '/config',
			name: 'config',
			component: () => import('../views/SelectConfigView.vue'),
		},
		{
			path: '/config/new',
			name: 'new-config',
			component: () => import('../views/EditConfigView.vue'),
		},
		{
			path: '/config/edit/:uuid',
			name: 'edit-config',
			props: true,
			component: () => import('../views/EditConfigView.vue'),
		},
		{
			path: '/settings',
			name: 'settings',
			component: () => import('../views/SettingsView.vue'),
			// component: HomeView,
		},
		{
			path: '/database',
			name: 'database',
			// component: () => import('../views/DatabaseView.vue')
			component: HomeView,
		},
		{
			path: '/logs',
			name: 'logs',
			component: () => import('../views/LogView.vue'),
		},
	],
});

export default router;
