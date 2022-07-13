<template>
	<div class="overlay">
		<div class="modal">
			<slot />
		</div>
	</div>
</template>

<style scoped>
.overlay {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	background-color: rgba(0, 0, 0, 0.5);
	z-index: var(--z-index-overlay);
	display: flex;
	justify-content: center;
	align-items: center;
}

.overlay .modal {
	z-index: var(--z-index-modal);
	padding: 10px;
	background-color: var(--color-background);
}
</style>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({});
</script>
