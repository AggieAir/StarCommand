<template>
	<div :class="class_list"></div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
	props: {
		small: {
			type: Boolean,
			default: false,
		},
		medium: {
			type: Boolean,
			default: false,
		},
		large: {
			type: Boolean,
			default: false,
		},
		green: {
			type: Boolean,
			default: false,
		},
		red: {
			type: Boolean,
			default: false,
		},
		yellow: {
			type: Boolean,
			default: false,
		},
		blue: {
			type: Boolean,
			default: false,
		},
		white: {
			type: Boolean,
			default: false,
		},
		off: {
			type: Boolean,
			default: false,
		},
	},
	computed: {
		class_list() {
			return {
				led: true,
				small: this.small,
				medium: this.medium,
				large: this.large,
				green: this.green,
				red: this.red,
				yellow: this.yellow,
				blue: this.blue,
				white: this.white,
				off: this.off,
			};
		},
	},
});
</script>

<style scoped lang="scss">
.led {
	position: relative;
	grid-column: led; // if relevant

	&.small {
		width: 1rem;
		height: calc(1rem / 3 * 2);
	}
	&.medium {
		width: 1.5rem;
		height: calc(1.5rem / 3 * 2);
	}
	&.large {
		width: 2rem;
		height: calc(2rem / 3 * 2);
	}

	&.green {
		background-color: var(--color-green);
	}

	&.red {
		background-color: var(--color-error);
	}

	&.yellow {
		background-color: var(--color-warning);
	}

	&.blue {
		background-color: var(--color-blue);
	}

	&.white {
		background-color: var(--color-background-soft);
	}

	&.off {
		background-color: var(--color-background-soft);
	}
}
</style>
