<script lang="ts">
import { useContextMenu } from '@/stores/context';
import { defineComponent } from 'vue';

export default defineComponent({
	computed: {
		position() {
			const contextMenu = useContextMenu();
			return {
				top: `${contextMenu.position.y}px`,
				left: `${contextMenu.position.x}px`,
			};
		},
		is_open() {
			return useContextMenu().is_open;
		},
		data() {
			return useContextMenu().data;
		},
	},
	methods: {
		close(index?: number) {
			useContextMenu().close(index);
		},
	},
});
</script>

<template>
	<div
		class="context-inner-bg"
		v-if="is_open"
		@click.stop="close()"
		@click.right.stop.prevent="close()"
	>
		<div class="context-menu" :style="position">
			<div v-for="(item, index) in data" :key="index">
				<div
					class="context-menu-item"
					:class="{ dangerous: item.dangerous }"
					@click="close(index)"
				>
					{{ item.label }}
				</div>
			</div>
		</div>
	</div>
</template>

<style lang="scss" scoped>
@import '@/assets/base.scss';
.context-inner-bg {
	position: fixed;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	z-index: var(--z-index-contextmenu);

	.context-menu {
		display: flex;
		flex-direction: column;
		position: fixed;
		width: max-content;
		user-select: none;

		.context-menu-item {
			cursor: pointer;
			padding: 0.25rem 0.75rem;
			text-align: center;
			user-select: none;
			background-color: var(--color-background-soft);
			&:hover {
				background-color: var(--color-background-mute);
			}
			&.dangerous {
				color: var(--color-error);
			}
		}
	}
}
</style>
