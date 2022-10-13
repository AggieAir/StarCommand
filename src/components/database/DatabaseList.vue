<script lang="ts">
import type { DatabaseStoredObject, Table } from '@/database';
import Database from '@/database';
import { defineComponent, type PropType } from 'vue';
import DatabaseEntry from './DatabaseEntry.vue';

export default defineComponent({
	props: {
		table: {
			type: String as PropType<Table>,
			required: true,
		},
	},
	data: () => ({
		entries: [] as DatabaseStoredObject[],
	}),
	components: { DatabaseEntry },
	async mounted() {
		await this.load_entries();
	},
	methods: {
		async load_entries() {
			const db = await Database.get_database();
			this.entries = await db.get_all<DatabaseStoredObject>(this.table);
		},
	},
});
</script>

<template>
	<div class="database-list">
		<!-- <div class="header"><slot /></div> -->
		<div class="entries">
			<DatabaseEntry
				v-for="(entry, id) in entries"
				:key="id"
				:entry="entry"
				:table="table"
				@reload="load_entries"
			/>
			<template v-if="entries.length === 0">
				<div class="spacer" />
				<div class="empty">No database entries exist in this table</div>
				<div class="spacer" />
			</template>
		</div>
	</div>
</template>

<style lang="scss" scoped>
.database-list {
	.header {
		font-size: 1.3rem;
		font-weight: bold;
		text-align: center;
	}

	.entries {
		min-height: 40rem;
		max-height: 40rem;
		overflow-y: scroll;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;

		.spacer {
			flex-grow: 1;
		}

		.empty {
			align-self: center;
			color: var(--color-border);
			font-size: 1.2rem;
			font-weight: bold;
		}
	}
}
</style>
