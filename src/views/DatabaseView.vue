<script lang="ts">
import Database, {
	create_multi_file,
	type DatabaseStoredObject,
	type ExportSingleFile,
	Table,
	import_file,
} from '@/database';
import { defineComponent } from 'vue';
import Tabs, { type TabDefinition } from '../components/widgets/Tabs.vue';
import DatabaseList from '../components/database/DatabaseList.vue';
import Button from '../components/widgets/Button.vue';
import { useNotifications } from '@/stores/notifications';
import { Notification, NotificationUrgency } from '@/notification';
import { Alert } from '@/stores/alert';

export default defineComponent({
	components: { Tabs, DatabaseList, Button },
	computed: {
		tables() {
			return Object.entries(Table);
		},
		tabs() {
			return Object.entries(Table).map<TabDefinition>(([text, name]) => ({
				text,
				name,
			}));
		},
	},
	data: () => ({
		selected_tab: null as Table | null,
		rerender: 0,
	}),
	methods: {
		async export_table() {
			if (!this.selected_tab) {
				throw new Error('No tab selected... Is the component mounted?');
			}
			const db = await Database.get_database();
			const table = await db.get_all<DatabaseStoredObject>(this.selected_tab);
			create_multi_file(
				table.map<ExportSingleFile>((obj) => ({
					type: this.selected_tab!,
					content: obj,
				}))
			);
		},
		select(table: string) {
			this.selected_tab = table as Table;
			console.log('Selected database table', table);
		},
		select_files() {
			(this.$refs.filepicker as HTMLInputElement).click();
		},
		async import_files() {
			const files = Array.from(
				(this.$refs.filepicker as HTMLInputElement).files ?? []
			);
			const db = await Database.get_database();
			await Promise.all(
				files.map(async (file) => {
					try {
						await import_file(file, db);
					} catch (e) {
						console.error('Failed to import file', file.name, '-', e);
						useNotifications().show(
							new Notification(
								'Failed to import file',
								`The file ${file.name} could not be imported. Please verify it is not corrupted.`,
								NotificationUrgency.HIGH
							)
						);
					}
				})
			);
			this.rerender++;
		},
	},
	mounted() {
		this.selected_tab = this.tables[0][1];
	},
	async beforeRouteEnter() {
		const skip = localStorage.getItem('database-dont-show-again');
		if (skip === 'true') {
			return true;
		}
		const result = await new Alert(
			'Danger Ahead!',
			'Directly manipulating the database can cause unexpected issues. Do not use this page unless you know what you are doing!',
			[
				{
					label: 'Go Back',
				},
				{
					label: 'Continue',
					dangerous: true,
				},
				{
					label: "Don't ask me again",
					dangerous: true,
				},
			]
		).show();
		switch (result) {
			case 0:
				return false;
			case 2:
				localStorage.setItem('database-dont-show-again', 'true');
			case 1:
				return true;
		}
	},
});
</script>

<template>
	<div class="database-view">
		<div class="header">Database Viewer</div>
		<Tabs :tabs="tabs" scrolling_tabbar @tab:select="select" :key="rerender">
			<template v-for="[_, table] in tables" :key="table" #[table]>
				<DatabaseList :table="table"> </DatabaseList>
			</template>
		</Tabs>
		<div class="buttonbox">
			<Button @click="export_table">Export Table</Button>
			<Button @click="select_files">Import File(s)</Button>
			<input
				type="file"
				style="display: none"
				ref="filepicker"
				@change="import_files"
				accept=".json"
				multiple
			/>
		</div>
	</div>
</template>

<style lang="scss" scoped>
.database-view {
	max-width: 60rem;
	.header {
		font-size: 1.3rem;
		font-weight: bold;
	}

	.buttonbox {
		display: flex;
		padding-top: 0.75rem;
		.button {
			flex-grow: 1;
			text-align: center;
			text-decoration: underline;
		}
	}
}
</style>
