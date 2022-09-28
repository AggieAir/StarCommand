<script setup lang="ts">
import { usePrompt } from '@/stores/prompt';
import { ref, computed } from 'vue';
import Modal from './Modal.vue';
import FieldInput from '../fields/FieldInput.vue';
import Button from './Button.vue';

const prompt = usePrompt();

const text = ref('');

const type = computed;

function submit() {
	const result = text.value;
	text.value = '';
	prompt.close(result);
}
</script>

<template>
	<Modal v-if="prompt.is_open">
		<div class="prompt">
			<span class="header">{{ prompt.data.title }}</span>
			<span class="message">{{ prompt.data.message }}</span>
			<FieldInput
				class="input"
				v-model="text"
				size="26"
				@keyup.enter="submit()"
			/>
			<Button @click="submit()">Submit</Button>
		</div>
	</Modal>
</template>

<style lang="scss" scoped>
.prompt {
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

	.input {
		font-size: 1.1rem;
		text-align: left;
		margin-bottom: 1rem;
	}

	.button {
		color: var(--color-green);
	}
}
</style>
