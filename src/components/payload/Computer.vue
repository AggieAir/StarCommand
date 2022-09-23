<script lang="ts">
import type { Computer } from '@/datastructures/status/computer';
import { defineComponent, type PropType } from 'vue';
import LED from '@/components/widgets/LED.vue';
import Tabs from '../widgets/Tabs.vue';
import Tab from '../widgets/Tab.vue';
import ComputerOverview from './overview/ComputerOverview.vue';
import ComputerCPU from './details/computers/ComputerCPU.vue';
import ComputerMemory from './details/computers/ComputerMemory.vue';
import ComputerStorage from './details/computers/ComputerStorage.vue';
import { useContextMenu } from '@/stores/context';
import { Status } from '@/datastructures/status/status_enum';

export default defineComponent({
	props: {
		computer: {
			type: Object as PropType<Readonly<Computer>>,
		},
		role: {
			type: String,
			required: true,
		},
	},
	data: () => ({
		last_update: null as number | null,
		update_interval_id: null as number | null,
	}),
	computed: {
		exists() {
			return this.computer !== undefined;
		},
		online() {
			return !isNaN(this.computer?.uptime ?? NaN);
		},
		status() {
			return this.computer?.status_code ?? Status.OFFLINE;
		},
		uptime() {
			if (this.online) {
				return this.format_seconds(this.computer!.uptime ?? 0);
			} else {
				return 'no data';
			}
		},
		time_since_update() {
			if (this.last_update === null || isNaN(this.last_update)) {
				return 'never';
			} else {
				return this.format_seconds(Math.round(this.last_update / 1000 - 0.5));
			}
		},
		show_update() {
			if (this.last_update === null || isNaN(this.last_update)) {
				console.log('no update');
				return true;
			} else {
				// Show update if it's been more than 5 seconds since last update
				return this.last_update > 5000;
			}
		},
		led_color() {
			switch (this.status) {
				case Status.ONLINE:
				case Status.RUNNING:
					return 'green';
				case Status.OFFLINE:
					return 'off';
				case Status.ERROR:
					return 'red';
				case Status.STANDBY:
				case Status.INITIALIZING:
					return 'blue';
				default:
					return 'yellow';
			}
		},
		led_blink() {
			return (
				this.status === Status.ERROR || this.status === Status.INITIALIZING
			);
		},
	},
	methods: {
		format_seconds(seconds: number) {
			// Format in the form of [HH:]MM:SS
			const hours = Math.floor(seconds / 3600);
			const minutes = Math.floor((seconds % 3600) / 60);
			const seconds_left = seconds % 60;

			const minutes_str = minutes.toString().padStart(2, '0');
			const seconds_str = seconds_left.toString().padStart(2, '0');

			if (hours > 0) {
				return `${hours}:${minutes_str}:${seconds_str}`;
			} else {
				return `${minutes_str}:${seconds_str}`;
			}
		},
		update() {
			this.last_update = this.computer?.time_since_update ?? null;
		},
		testContextMenu(ev: MouseEvent) {
			const context_menu = useContextMenu();
			const menu = [
				{
					label: 'Test 1',
				},
				{
					label: 'Test 2',
				},
				{
					label: 'Test 3',
					dangerous: true,
				},
			];
			const position = {
				x: ev.clientX,
				y: ev.clientY,
			};
			context_menu.open(menu, position).then((id) => {
				console.log(`Selected ${id}`);
			});
		},
	},
	mounted() {
		this.update_interval_id = setInterval(this.update.bind(this), 500);
	},
	unmounted() {
		clearInterval(this.update_interval_id ?? 1);
	},
	components: {
		LED,
		Tabs,
		Tab,
		ComputerOverview,
		ComputerCPU,
		ComputerMemory,
		ComputerStorage,
	},
});
</script>

<template>
	<div
		class="computer"
		:class="{
			online: online ?? false,
			connected: computer === undefined,
		}"
	>
		<div class="header">
			<span class="title" v-text="computer?.name ?? role"></span>
			<LED medium :[led_color]="true" />
		</div>
		<div class="body" @click.right.stop.prevent="testContextMenu">
			<Tabs
				v-if="online"
				:bottom="true"
				:tabs="[
					{ name: 'overview', text: 'Overview' },
					{ name: 'cpu', text: 'CPU' },
					{ name: 'memory', text: 'Memory' },
					{ name: 'storage', text: 'Storage' },
				]"
			>
				<template #overview>
					<ComputerOverview class="detail-view" :computer="computer!" />
				</template>
				<template #cpu>
					<!-- <div class="detail-view">CPU tab</div> -->
					<ComputerCPU class="detail-view" :computer="computer!" />
				</template>
				<template #memory>
					<!-- <div class="detail-view">Memory tab</div> -->
					<ComputerMemory class="detail-view" :computer="computer!" />
				</template>
				<template #storage>
					<!-- <div class="detail-view">Storage tab</div> -->
					<ComputerStorage class="detail-view" :computer="computer!" />
				</template>
			</Tabs>
			<div v-else-if="computer" class="offline exists">
				<span>{{ computer.name }} is offline</span>
			</div>
			<div v-else class="offline">
				<span>{{ role }} system is not installed</span>
			</div>
		</div>
		<div class="footer" v-if="computer">
			<span>System uptime: {{ uptime }}</span>
			<span class="last-update" v-if="show_update">
				Last update: {{ time_since_update }}
			</span>
			<!-- Empty span to keep footer aligned -->
			<span v-else />
		</div>
		<div class="footer offline" v-else>
			<span>No data</span>
		</div>
	</div>
</template>

<style scoped lang="scss">
.computer {
	.header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.5rem;
		.title {
			font-size: 1.5rem;
			font-weight: bold;
		}
	}

	.body .detail-view {
		min-height: 7.5rem;
		max-height: 7.5rem;
		overflow-y: scroll;
	}

	.body .offline {
		min-height: 10.75rem;
		max-height: 10.75rem;
		height: 10.75rem;
		overflow-y: scroll;
	}

	.footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.5rem 3rem;

		.last-update {
			color: var(--color-error);
		}
	}

	.offline {
		color: var(--color-border);
	}

	div.offline:not(.footer) {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
		width: 100%;
		font-style: italic;
		font-size: 1.3rem;
		font-weight: bold;
		padding: 1rem;
	}
}
</style>
