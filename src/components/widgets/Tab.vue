<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
	props: {
		selected: {
			type: Boolean,
			default: false,
		},
		render_hidden: {
			type: Boolean,
			default: false,
		},
	},
});
</script>

<template>
	<div class="tab-content" v-if="selected || render_hidden" :v-show="selected">
		<slot></slot>
	</div>
</template>

<style lang="scss">
@import '@/assets/base.scss';

.tab-content {
	padding: 0.5rem;
	border: 2px solid var(--color-background-soft);
}
</style>
