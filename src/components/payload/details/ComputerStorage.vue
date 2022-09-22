<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import type { Computer, Storage } from '@/datastructures/status/computer';
import ComputerMountPoint from '@/components/payload/details/ComputerMountPoint.vue';

export default defineComponent({
	props: {
		computer: {
			type: Object as PropType<Readonly<Computer>>,
			required: true,
		},
	},
	components: {
		ComputerMountPoint,
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
	},
});
</script>

<template>
	<div class="computer-storage">
		<ComputerMountPoint
			v-for="[disk, mountpoint] in disks"
			:key="mountpoint"
			:disk="disk"
			:mountpoint="mountpoint"
		/>
	</div>
</template>
