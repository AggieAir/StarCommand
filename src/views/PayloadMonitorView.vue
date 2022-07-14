<template></template>

<script lang="ts">
import { usePayloadStore } from '@/stores/payload';
import { mapState } from 'pinia';
import { defineComponent } from 'vue';

export default defineComponent({
	computed: {
		...mapState(usePayloadStore, ['payload', 'config']),
	},
});
</script>
