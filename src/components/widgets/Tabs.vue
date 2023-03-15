<script lang="ts">
import { defineComponent, type PropType } from "vue";
import Tab from "./Tab.vue";

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
		align_start: {
			type: Boolean,
			default: false,
		},
		scrolling_tabbar: {
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
			console.debug(`selected tab ${id}`);
			if (!this.tabs[id].just_emit) {
				this.selected = id;
			}
			console.debug(`emitting event tab:select("${this.tabs[id].name}")`);
			this.$emit("tab:select", this.tabs[id].name);
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
	watch: {
		tabs: {
			handler() {
				if (this.tabs[this.selected]?.just_emit) {
					// No selecting the only tab
					this.selected = -1;
				} else if (this.selected === -1) {
					this.selected = this.tabs.findIndex(({ just_emit }) => !just_emit);
				}
			},
			immediate: true,
		},
	},
	emits: {
		"tab:select": (_: string) => true,
		"click:right": (_: string) => true,
		"click:middle": (_: string) => true,
	},
	components: { Tab },
});

export interface TabDefinition {
	/**
	 * The name to refer to this tab with in code.
	 */
	name: string;
	/**
	 * The text that will be displayed on the tab
	 */
	text: string;
	/**
	 * Just emit a 'select' event when this tab is clicked, don't show anything else.
	 */
	just_emit?: boolean;
}
</script>

<template>
	<div class="tabbox">
		<div class="tab-header" :class="{ bottom, align_start, scrolling_tabbar }">
			<div
				v-for="({ name, text }, idx) in tabs"
				:key="name"
				:class="{ selected: selected === idx }"
				@click.stop="select(idx)"
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
@import "@/assets/base.scss";
.tabbox {
	display: flex;
	flex-direction: column;
	justify-content: space-between;

	.tab-contents {
		flex-grow: 1;
	}
	.tab-header {
		display: flex;
		flex-direction: row;
		justify-content: space-around;
		align-items: center;
		user-select: none;

		&.align_start {
			justify-content: flex-start;
			div {
				flex-grow: 0;
			}
		}

		&.scrolling_tabbar {
			flex-wrap: wrap;
		}

		&.bottom {
			order: 100;
		}

		div {
			cursor: pointer;
			flex-grow: 1;
			padding: 0.25rem 0.5rem;
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
		flex-grow: 1;
		border: 2px solid var(--color-background-soft);
	}
}
</style>
