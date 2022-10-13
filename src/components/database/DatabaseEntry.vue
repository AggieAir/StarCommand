<script lang="ts">
import Database, {
	export_stored_object,
	Table,
	type DatabaseStoredObject,
} from '@/database';
import { Notification, NotificationUrgency } from '@/notification';
import { Alert, useAlert } from '@/stores/alert';
import { useNotifications } from '@/stores/notifications';
import { defineComponent, type PropType } from 'vue';
import Button from '../widgets/Button.vue';

export default defineComponent({
	props: {
		entry: {
			type: Object as PropType<DatabaseStoredObject>,
			required: true,
		},
		table: {
			type: String as PropType<Table>,
			required: true,
		},
	},
	computed: {
		name() {
			if ('human_name' in this.entry) {
				return this.entry.human_name;
			} else {
				return this.entry.name;
			}
		},
		description() {
			if ('description' in this.entry) {
				return this.entry.description;
			} else if ('uuid' in this.entry) {
				return `${this.entry.uuid} - ${this.entry.date}`;
			} else if ('avionics' in this.entry) {
				return `${this.entry.avionics.name} avionics, copilot is${
					this.entry.has_copilot ? '' : ' not'
				} installed`;
			}
			return 'templates are currently unsupported';
		},
		key() {
			if (this.table === Table.MissionConfiguration && 'uuid' in this.entry) {
				return this.entry.uuid;
			} else {
				return this.entry.name;
			}
		},
	},
	methods: {
		export_entry() {
			export_stored_object(this.entry, this.table);
		},
		async delete_entry() {
			const result = await new Alert(
				`Delete ${this.name}?`,
				'Really delete this database entry? This cannot be undone.',
				[
					{
						label: 'No',
					},
					{
						label: 'Yes',
						dangerous: true,
					},
				]
			).show();
			if (result !== 1) {
				return;
			}
			const db = await Database.get_database();
			await db.delete(this.table, this.key);
			useNotifications().show(
				new Notification(
					'Entry deleted',
					`${this.name} was deleted from the database.`,
					NotificationUrgency.HIGH,
					undefined,
					5000
				)
			);
			this.$emit('reload');
		},
	},
	components: { Button },
	emits: ['reload'],
});
</script>

<template>
	<div class="database-entry">
		<div class="left-side">
			<span class="name">{{ name }}</span>
			<span class="description">{{ description }}</span>
		</div>
		<div class="right-side">
			<Button class="export" @click="export_entry">Export</Button>
			<Button class="delete" @click="delete_entry">Delete</Button>
		</div>
	</div>
</template>

<style lang="scss" scoped>
.database-entry {
	display: flex;
	justify-content: space-between;

	.left-side {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		.name {
			font-size: 1.1rem;
			font-weight: bold;
		}
		.description {
			font-size: 0.8rem;
			user-select: text;
		}
	}

	.right-side {
		display: flex;
		flex-direction: column;

		.delete {
			color: var(--color-red);
		}
	}
}
</style>
