<script lang="ts">
import { defineComponent, type PropType } from 'vue';

export default defineComponent({
	props: {
		tabs: {
			type: Array as PropType<{ name: string; text: string }[]>,
			required: true,
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
	emits: ['click:middle', 'click:right', 'tab:select'],
});
</script>

<template>
	<div class="tab-header">
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
	<slot
		v-for="({ name }, idx) in tabs"
		:key="name"
		:name="name"
		:selected="selected === idx"
	></slot>
</template>
