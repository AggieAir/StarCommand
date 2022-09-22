<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import type { Computer, Storage } from '@/datastructures/status/computer';
import ComputerMountPoint from '@/components/payload/details/ComputerMountPoint.vue';
import Tabs from '@/components/widgets/Tabs.vue';

export default defineComponent({
	props: {
		computer: {
			type: Object as PropType<Readonly<Computer>>,
			required: true,
		},
	},
	components: {
		ComputerMountPoint,
		Tabs,
	},
	computed: {
		disks() {
			const root = this.computer.disks.get('/opt/stardos/data')?.size;
			const result: [Storage, string][] = [];
			this.computer.disks.forEach((disk, mountpoint) => {
				// Exclude any that are the same size as root (so the same disk)
				if (mountpoint !== '/opt/stardos/data' && disk.size === root) {
					return;
				}
				result.push([disk, mountpoint]);
			});
			return result;
		},
		tabs() {
			return this.disks.map(([disk, mountpoint]) => ({
				name: mountpoint,
				text: this.path_to_name(mountpoint),
			}));
		},
	},
	methods: {
		path_to_name(path: string): string {
			switch (path) {
				case '/':
					return 'Root';
				case '/opt/stardos/data':
					return 'Data';
				case '/opt/stardos/tmp':
					return 'Temp Storage';
				default:
					return path;
			}
		},
	},
});
</script>

<template>
	<div class="computer-storage">
		<Tabs :tabs="tabs" class="storage-tabs">
			<template
				v-for="[disk, mountpoint] in disks"
				:key="mountpoint"
				#[mountpoint]
			>
				<ComputerMountPoint :disk="disk" :mountpoint="mountpoint" />
			</template>
		</Tabs>
	</div>
</template>

<style lang="scss" scoped>
.computer-storage {
	.storage-tabs {
		height: 100%;

		>>> * .tab-content {
			border: none;
		}
	}
}
</style>
