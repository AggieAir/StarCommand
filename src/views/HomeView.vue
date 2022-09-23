<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
	computed: {
		path() {
			return this.$route.fullPath;
		},
	},
});
</script>

<template>
	<div>Route {{ path }} is working...</div>
</template>
