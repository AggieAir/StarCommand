<script lang="ts">
import { defineComponent } from 'vue';
import Button from './widgets/Button.vue';
import { useDatalink } from '@/stores/datalink';

export default defineComponent({
	methods: {
		sendCommand(cmd: number) {
			useDatalink().send_command({
				type: "control",
				target: "/mission_command",
				protocol: "ros",
				payload: cmd.toString(),
			})
		}
	},
	components: {
		Button
	}
});
</script>

<template>
	<div class="mission-commands-entries">
		<div class="entry" v-for="cmd in [1, 2, 3, 4, 5]">
			<Button
				class="cmdbutton"
				@click="sendCommand(cmd)"
			>
				Send User Command {{ cmd }}
			</Button>
		</div>
	</div>
</template>

<style lang="scss" scoped>
.mision-commands-entries {
	display: flex;
	flex-direction: column;

	.entry {
		display: flex;
		flex-direction: row;
		justify-content: space-between;

		padding: 0.25rem 1rem;

		:not(.label) {
			text-align: right;
			justify-self: end;
			margin-left: 1em;
		}
	}

	.exit-button {
		top: 1px;
		right: 0.75rem;
		font-size: 0.75rem;
		color: var(--color-red);
	}
}
</style>
