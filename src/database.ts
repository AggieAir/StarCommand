import type {
	MissionConfiguration,
	MissionMetadata,
} from '@/datastructures/configuration';
import type {
	AircraftDefinition,
	AvionicsDefinition,
	CaptureTypeDefinition,
	CoprocessorDefinition,
	NodeDefinition,
} from '@/datastructures/definition';
import type {
	CaptureGroupTemplate,
	MissionTemplate,
	SensorTemplate,
} from '@/datastructures/template';

export enum Table {
	AircraftDefinition = 'aircraft_definition',
	AvionicsDefinition = 'avionics_definition',
	NodeDefinition = 'node_definition',
	MissionConfiguration = 'mission_configuration',
	MissionTemplate = 'mission_template',
	CaptureGroupTemplate = 'capture_group_template',
	SensorTemplate = 'sensor_template',
	CaptureTypeDefinition = 'capture_type_definition',
	CoprocessorDefinition = 'coprocessor_definition',
	MissionMetadata = 'mission_metadata',
}

export type DatabaseStoredObject =
	| AircraftDefinition
	| AvionicsDefinition
	| NodeDefinition
	| MissionConfiguration
	| CaptureGroupTemplate
	| MissionTemplate
	| SensorTemplate
	| CoprocessorDefinition
	| CaptureTypeDefinition
	| MissionMetadata;

export type ExportFile = ExportMultiFile | ExportSingleFile;

export type ExportMultiFile = {
	type: 'MultiFile';
	content: ExportSingleFile[];
};

export type ExportSingleFile = {
	type: Table;
	content: DatabaseStoredObject;
};

export const has_uuid = [Table.MissionConfiguration];

export function file_extension(type: Table): string {
	switch (type) {
		case Table.AircraftDefinition:
			return 'aircraft';
		case Table.AvionicsDefinition:
			return 'avionics';
		case Table.NodeDefinition:
			return 'node';
		case Table.MissionConfiguration:
			return 'mission';
		case Table.CaptureGroupTemplate:
			return 'capturegroup.template';
		case Table.MissionTemplate:
			return 'mission.template';
		case Table.SensorTemplate:
			return 'sensor.template';
		case Table.CoprocessorDefinition:
			return 'coprocessor';
		case Table.CaptureTypeDefinition:
			return 'capturetype';
		case Table.MissionMetadata:
			return 'mission.metadata';
	}
}

export function export_stored_object(
	object: DatabaseStoredObject,
	type: Table
) {
	let result = JSON.stringify({
		content: object,
		type: type,
	});

	const element = document.createElement('a');
	element.setAttribute(
		'href',
		'data:text/json;charset=utf-8,' + encodeURIComponent(result)
	);
	element.setAttribute(
		'download',
		`${object.name}.${file_extension(type)}.json`
	);

	element.style.display = 'none';
	document.body.appendChild(element);

	element.click();

	document.body.removeChild(element);
}

export async function import_file(
	file: File,
	database: Database
): Promise<void | void[]> {
	return new Promise<string>((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = (event) => resolve(event.target?.result as string);
		reader.onerror = (event) => reject(event);
		reader.readAsText(file);
	})
		.then(
			(data) =>
				new Promise<ExportFile>((resolve, reject) => {
					try {
						resolve(JSON.parse(data));
					} catch (e) {
						reject(e);
					}
				})
		)
		.then((obj) => database.save_from_file(obj));
}

export async function parse_file(file: File): Promise<ExportFile> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = (event) =>
			resolve(JSON.parse(event.target?.result as string));
		reader.onerror = (event) => reject(event);
		reader.readAsText(file);
	});
}

export function create_multi_file(objects: ExportSingleFile[]) {
	let result = JSON.stringify({
		type: 'MultiFile',
		content: objects,
	});

	const element = document.createElement('a');
	element.setAttribute(
		'href',
		'data:text/json;charset=utf-8,' + encodeURIComponent(result)
	);
	element.setAttribute('download', 'export.stardos.json');

	element.style.display = 'none';
	document.body.appendChild(element);

	element.click();

	document.body.removeChild(element);
}

function deproxy<DataType>(proxy: DataType): DataType {
	return JSON.parse(JSON.stringify(proxy));
}

export default class Database {
	private database: IDBDatabase | null = null;
	private static database: Database | null = null;

	private on_open: Promise<Database>;
	private opened!: (value: Database) => void;

	public static get_database(): Promise<Database> {
		if (this.database === null) {
			this.database = new Database();
		}
		return this.database.on_open;
	}

	get is_ready() {
		return this.database !== null;
	}

	private upgrade_to_version = [
		(db: IDBDatabase) => {
			console.log('Initializing starcommand database version 1');

			// Create object stores
			const object_stores = {
				// Definitions
				aircraft: db.createObjectStore(Table.AircraftDefinition, {
					keyPath: 'name',
				}),
				avionics: db.createObjectStore(Table.AvionicsDefinition, {
					keyPath: 'name',
				}),
				node: db.createObjectStore(Table.NodeDefinition, { keyPath: 'name' }),
				capture_type: db.createObjectStore(Table.CaptureTypeDefinition, {
					keyPath: 'name',
				}),
				coprocessor: db.createObjectStore(Table.CoprocessorDefinition, {
					keyPath: 'name',
				}),
				// Configurations
				mission: db.createObjectStore(Table.MissionConfiguration, {
					keyPath: 'uuid',
				}),
				// Templates
				mission_template: db.createObjectStore(Table.MissionTemplate, {
					keyPath: 'name',
				}),
				capture_group_template: db.createObjectStore(
					Table.CaptureGroupTemplate,
					{ keyPath: 'name' }
				),
				sensor_template: db.createObjectStore(Table.SensorTemplate, {
					keyPath: 'name',
				}),
			};
		},
		(db: IDBDatabase) => {
			console.log('Updating starcommand database version 1 to version 2');
			const object_stores = {
				mission_metadata: db.createObjectStore(Table.MissionMetadata, {
					keyPath: 'name',
				}),
			};

			const indices = {
				mission_metadata: {
					uuid: object_stores.mission_metadata.createIndex('uuid', 'uuid', {
						unique: true,
					}),
					name: object_stores.mission_metadata.createIndex('name', 'name', {
						unique: true,
					}),
					date: object_stores.mission_metadata.createIndex('date', 'date', {
						unique: false,
					}),
					payload: object_stores.mission_metadata.createIndex(
						'payload',
						'payload',
						{ unique: false }
					),
					aircraft: object_stores.mission_metadata.createIndex(
						'aircraft',
						'aircraft',
						{ unique: false }
					),
				},
			};
		},
	];

	private constructor() {
		this.on_open = new Promise((resolve) => {
			this.opened = resolve;
		});
		const request = window.indexedDB.open(
			'starcommand-dev',
			this.upgrade_to_version.length
		);
		let that = this;
		request.onupgradeneeded = (event: any) => {
			const db: IDBDatabase = event.target.result;
			that.upgrade_to_version
				.slice(event.oldVersion)
				.forEach((handler) => handler(db));
		};
		request.onsuccess = (event: any) => {
			that.database = event.target.result as IDBDatabase;
			that.database.onerror = (event: any) =>
				that.default_error_handler(event.target.errorCode);
			that.opened(that);
		};
	}

	private default_error_handler(error_code: string) {
		console.error(error_code);
	}

	private get_object_store(
		table: Table,
		accessmode: 'readonly' | 'readwrite' = 'readonly'
	) {
		const transaction = this.database?.transaction([table], accessmode);
		return transaction!.objectStore(table);
	}

	async save_from_file(object: ExportFile): Promise<void> {
		if (object.type === 'MultiFile') {
			const that = this;
			const promises: Promise<void>[] = object.content.map((subobj) =>
				that.save_from_file(subobj)
			) as Promise<void>[];
			return Promise.all(promises).then();
		}
		if (object.type === Table.MissionConfiguration) {
			const data = object.content as MissionConfiguration;
			const metadata: MissionMetadata = {
				name: data.name,
				date: data.date ?? '',
				payload: data.payload ?? '',
				aircraft: data.aircraft?.name ?? '',
				uuid: data.uuid!,
				issues: undefined,
				uploadable: undefined,
			};
			// Clobber any older versions of this same mission
			await this.clobber(Table.MissionMetadata, metadata);
			data.capture_groups = data.capture_groups.map((cg) => {
				if ('type' in cg) {
					// @ts-ignore this is a conversion from the old format
					cg.definition = cg.type;
					// @ts-ignore this is a conversion from the old format
					delete cg.type;
				}
				return cg;
			});
			return this.clobber(Table.MissionConfiguration, data);
		}
		return this.clobber(object.type, object.content);
	}

	save<DataType>(table: Table, data: DataType): Promise<void> {
		return new Promise((resolve, reject) => {
			const request = this.get_object_store(table, 'readwrite').add(
				deproxy(data)
			);
			request.onsuccess = () => resolve();
			request.onerror = (event) => reject(event);
		});
	}

	clobber<DataType>(table: Table, data: DataType): Promise<void> {
		return new Promise((resolve, reject) => {
			const request = this.get_object_store(table, 'readwrite').put(
				deproxy(data)
			);
			request.onsuccess = () => resolve();
			request.onerror = (event) => reject(event);
		});
	}

	save_list<DataType>(table: Table, data: DataType[]): Promise<void[]> {
		const object_store = this.get_object_store(table, 'readwrite');
		const promises: Promise<void>[] = deproxy(data).map<Promise<void>>(
			(datum) => {
				return new Promise((resolve, reject) => {
					const request = object_store.add(datum);
					request.onsuccess = () => resolve();
					request.onerror = (event) => reject(event);
				});
			}
		);
		return Promise.all(promises);
	}

	clobber_list<DataType>(table: Table, data: DataType[]): Promise<void[]> {
		const promises: Promise<void>[] = deproxy(data).map<Promise<void>>(
			(datum) => {
				return new Promise((resolve, reject) => {
					const object_store = this.get_object_store(table, 'readwrite');
					const request = object_store.put(datum);
					request.onsuccess = () => resolve();
					request.onerror = (event) => reject(event);
				});
			}
		);
		return Promise.all(promises);
	}

	delete(table: Table, key: string): Promise<void> {
		return new Promise((resolve, reject) => {
			const request = this.get_object_store(table, 'readwrite').delete(key);
			request.onsuccess = () => resolve();
			request.onerror = (event) => reject(event);
		});
	}

	get<DataType>(table: Table, key: string): Promise<DataType> {
		return new Promise((resolve, reject) => {
			const request = this.get_object_store(table).get(key);
			// @ts-ignore - this is a valid response
			request.onsuccess = (event: Event & { target: { result: DataType } }) =>
				resolve(event.target.result);
			request.onerror = (event) => reject(event);
		});
	}

	get_all<DataType>(table: Table): Promise<DataType[]> {
		return new Promise((resolve, reject) => {
			const request = this.get_object_store(table).getAll();
			// @ts-ignore - this is a valid response
			request.onsuccess = (event: Event & { target: { result: DataType[] } }) =>
				resolve(event.target.result);
			request.onerror = (event) => reject(event);
		});
	}

	get_by_index<DataType>(table: Table, index_name: string, key: string): Promise<DataType[]> {
		return new Promise((resolve, reject) => {
			const index = this.get_object_store(table).index(index_name);
			const request = index.getAll(key);
			request.onsuccess = () => resolve(request.result);
			request.onerror = (event) => reject(event);
		})
	}
}
