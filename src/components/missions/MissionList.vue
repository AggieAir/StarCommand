<script lang="ts">
import type { MissionMetadata } from '@/datastructures/configuration';
import { defineComponent, type PropType } from 'vue';
import MissionListEntry from './MissionListEntry.vue';

export default defineComponent({
	props: {
		missions: {
			type: Array as PropType<MissionMetadata[]>,
			required: true,
		},
		startOpen: {
			type: Boolean,
			default: false,
		},
	},
	data() {
		return {
			expanded: this.startOpen,
		};
	},
	methods: {
		toggle() {
			this.expanded = !this.expanded;
		},
	},
	components: { MissionListEntry },
	emits: ['open'],
});
</script>

<template>
	<div class="mission-list">
		<div class="header" @click.stop="toggle">
			<slot> Mission List </slot>
		</div>
		<div v-if="missions.length > 0 && expanded" class="body">
			<MissionListEntry
				@open="$emit('open', $event)"
				v-for="mission in missions"
				:key="mission.uuid"
				:metadata="mission"
			/>
		</div>
		<div v-else-if="expanded" class="body">
			<div class="empty">No mission configurations found.</div>
		</div>
	</div>
</template>

<style lang="scss" scoped>
.mission-list {
	display: flex;
	flex-direction: column;
	margin-top: 1rem;
	margin-bottom: 0.5rem;

	.header {
		font-size: 1.2rem;
		font-weight: bold;
	}

	.body {
		display: flex;
		flex-direction: column;
		flex-grow: 1;
		overflow-y: auto;
	}
}
</style>
