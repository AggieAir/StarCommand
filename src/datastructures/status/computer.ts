import { BarObject } from '../rendering';
import type { ComputerStatus } from './heartbeats';
import { Status } from './status_enum';

export class Storage {
	public size: number = 0;
	public used: number = 0;

	warn_level: number = 0.8;
	crit_level: number = 0.9;

	private _bar_object: BarObject = new BarObject(0, 1);

	public get free() {
		return this.size - this.used;
	}

	public get used_percent() {
		return this.used / this.size;
	}

	public get free_percent() {
		return this.free / this.size;
	}

	public get is_high() {
		return this.used_percent > this.warn_level;
	}

	public get is_critical(): boolean {
		return this.used_percent > this.crit_level;
	}

	public get bar_object(): Readonly<BarObject> {
		this._bar_object.high = this.crit_level;
		this._bar_object.low = this.warn_level;
		this._bar_object.value = this.used_percent;
		return this._bar_object;
	}
}

export class CPU {
	public usage: number[] = [];
	private _bar_object: BarObject = new BarObject(0, 1);

	public get cores(): number {
		return this.usage.length;
	}

	public get usage_percent(): number {
		return this.usage.reduce((a, b) => a + b, 0) / this.cores;
	}

	public get bar_object(): Readonly<BarObject> {
		this._bar_object.high = 225;
		this._bar_object.low = 200;
		this._bar_object.max = 255;
		this._bar_object.value = this.usage_percent;
		return this._bar_object;
	}
}

export class Computer {
	private _timestamp: number | null = null;

	private _cpus: CPU = new CPU();
	private _memory: Storage = new Storage();
	private _swap: Storage = new Storage();
	private _disks: Map<string, Storage> = new Map();
	private _uptime: number | null = null;

	private _status_code: Status = Status.OFFLINE;

	public constructor(public readonly name: string) {}

	public get cpus(): Readonly<CPU> {
		return this._cpus;
	}

	public get memory(): Readonly<Storage> {
		return this._memory;
	}

	public get swap(): Readonly<Storage> {
		return this._swap;
	}

	public get disks(): Readonly<Map<string, Storage>> {
		return this._disks;
	}

	public get uptime(): number | null {
		return this._uptime;
	}

	public get timestamp(): number | null {
		return this._timestamp;
	}

	public get time_since_update(): number {
		if (this._timestamp === null) {
			return NaN;
		}
		return Date.now() - this._timestamp;
	}

	public get status_code(): Status {
		return this._status_code;
	}

	public get main_disk(): Storage | null {
		return this.disks.get('/opt/stardos/data') ?? this.disks.get('/') ?? null;
	}

	public get online(): boolean {
		return this._status_code !== Status.OFFLINE;
	}

	public update_status_code(): Status {
		const update_time_status = (() => {
			if (this.time_since_update > 10000) {
				return Status.ERROR;
			}
			if (this.time_since_update > 5000) {
				return Status.WARNING;
			}
			if (this.timestamp === null) {
				return Status.OFFLINE;
			}
			return Status.ONLINE;
		})();

		const cpu_status = (() => {
			if (this.cpus.cores === 0) {
				return Status.ERROR;
			}
			if (this.cpus.usage_percent > 200) {
				return Status.WARNING;
			}
			if (this.cpus.usage.some((usage) => usage > 225)) {
				return Status.WARNING;
			}
			return Status.ONLINE;
		})();

		const memory_status = (() => {
			if (this.memory.is_high) {
				return Status.WARNING;
			}
			if (this.memory.is_critical) {
				return Status.ERROR;
			}
			return Status.ONLINE;
		})();

		const swap_status = (() => {
			if (this.swap.is_high) {
				return Status.WARNING;
			}
			if (this.swap.is_critical) {
				return Status.ERROR;
			}
			return Status.ONLINE;
		})();

		const disk_status = (() => {
			if (this.disks.size === 0) {
				return Status.ERROR;
			}
			if ([...this.disks.values()].some((disk) => disk.is_high)) {
				return Status.WARNING;
			}
			if ([...this.disks.values()].some((disk) => disk.is_critical)) {
				return Status.ERROR;
			}
			return Status.ONLINE;
		})();

		this._status_code = Math.max(
			update_time_status,
			cpu_status,
			memory_status,
			swap_status,
			disk_status
		);
		return this._status_code;
	}

	public parse_heartbeat(heartbeat: ComputerStatus): void {
		this._timestamp = Date.now();
		this._cpus.usage = [...heartbeat.cpu_usage];
		this._memory.size = heartbeat.memory[1];
		this._memory.used = heartbeat.memory[0];
		this._swap.size = heartbeat.swap[1];
		this._swap.used = heartbeat.swap[0];
		this._uptime = heartbeat.uptime;
		const disks = heartbeat.disks
			.map((component, index) => {
				if (index % 2 === 0) {
					return [component, heartbeat.disks[index + 1]];
				}
				return [];
			})
			.filter((component) => component.length === 2);
		disks.forEach(([disk_usage, disk_size], index) => {
			if (!this._disks.has(heartbeat.mounts[index])) {
				this._disks.set(heartbeat.mounts[index], new Storage());
			}
			// We know this is defined because we just defined it above.
			const disk = this._disks.get(heartbeat.mounts[index])!;
			disk.size = disk_size;
			disk.used = disk_usage;
		});
		this.update_status_code();
	}
}
