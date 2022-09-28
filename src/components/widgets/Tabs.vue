<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import Tab from './Tab.vue';

export default defineComponent({
	props: {
		tabs: {
			type: Array as PropType<TabDefinition[]>,
			required: true,
		},
		bottom: {
			type: Boolean,
			default: false,
		},
	},
	data: () => ({
		selected: 0,
	}),
	computed: {
		tab_count() {
			return this.tabs.length;
		},
	},
	methods: {
		select(id: number) {
			this.selected = id % this.tab_count;
			this.$emit('tab:select', this.tabs[this.selected].name);
		},
		increment() {
			const new_selected = this.selected + 1;
			this.selected = new_selected % this.tab_count;
		},
		decrement() {
			const new_selected = this.selected - 1;
			this.selected = new_selected % this.tab_count;
		},
	},
	emits: {
		'tab:select': (_: string) => true,
		'click:right': (_: string) => true,
		'click:middle': (_: string) => true,
	},
	components: { Tab },
});

export interface TabDefinition {
	name: string;
	text: string;
}
</script>

<template>
	<div class="tabbox">
		<div class="tab-header" :class="bottom ? 'bottom' : ''">
			<div
				v-for="({ name, text }, idx) in tabs"
				:key="name"
				:class="{ selected: selected === idx }"
				@click.stop="
					select(idx);
					$emit('tab:select', name);
				"
				@click.right.stop.prevent="$emit('click:right', name)"
				@click.middle.stop="$emit('click:middle', name)"
			>
				{{ text }}
			</div>
		</div>
		<div class="tab">
			<Tab
				v-for="({ name }, idx) in tabs"
				:key="name"
				:selected="selected === idx"
			>
				<slot :name="name"></slot>
			</Tab>
		</div>
	</div>
</template>

<style lang="scss" scoped>
@import '@/assets/base.scss';
.tabbox {
	display: flex;
	flex-direction: column;
	.tab-header {
		display: flex;
		flex-direction: row;
		justify-content: space-around;
		align-items: center;
		user-select: none;

		&.bottom {
			order: 100;
		}

		div {
			cursor: pointer;
			flex-grow: 1;
			padding: 0.25rem;
			text-align: center;

			&.selected {
				background-color: var(--color-background-soft);
			}

			&:hover {
				background-color: var(--color-background-mute);
			}
		}
	}

	.tab {
		position: relative;
		overflow-y: scroll;
		border: 2px solid var(--color-background-soft);
	}
}
</style>
