<script setup lang="ts">
import { useAlert } from '@/stores/alert';
import { computed } from 'vue';
import Modal from './Modal.vue';

const alert = useAlert();

const no_buttons = computed(() => {
	return alert.data.buttons.length === 0;
});
</script>

<template>
	<Modal v-if="alert.is_open">
		<div class="alert">
			<span class="header">{{ alert.data.title }}</span>
			<span class="message">{{ alert.data.message }}</span>
			<div class="buttons">
				<div
					class="button"
					v-for="(button, index) in alert.data.buttons"
					:class="{ dangerous: button.dangerous }"
					:key="index"
					@click="alert.close(index)"
				>
					{{ button.label }}
				</div>
				<div class="button" v-if="no_buttons" @click="alert.close()">OK</div>
			</div>
		</div>
	</Modal>
</template>

<style lang="scss" scoped>
.alert {
	padding: 0.5rem;
	text-align: center;
	max-width: 400px;

	.header {
		font-size: 1.3rem;
		font-weight: bold;
		margin-bottom: 0.5rem;
		display: block;
	}

	.message {
		font-size: 0.9rem;
		margin-bottom: 1rem;
		display: block;
	}

	.buttons {
		user-select: none;
		display: flex;

		.button {
			flex-grow: 1;
			padding: 0.25rem;

			&:hover {
				background-color: var(--color-background-soft);
			}

			&.dangerous {
				color: var(--color-error);
			}
		}
	}
}
</style>
