import type {
	ComputerHeartbeat,
	Heartbeat,
	HeartbeatType,
	NodeHeartbeat,
	PayloadHeartbeat,
} from './status_input';
import { BarObject } from './rendering';
import type {
	MissionConfiguration,
	NodeConfiguration,
	SensorConfiguration,
	CaptureGroupConfiguration,
} from './configuration';
import type { NodeDefinition, NodeErrorDefinition } from './definition';

export enum Status {
	WAITING = -2,
	ABNORMAL = -1,
	OK = 0,
	WARNING = 1,
	ERROR = 2,
	FATAL = 3,
	OFFLINE = 4,
	NEVER_ONLINE = 5,
}

export enum PayloadState {
	OFFLINE,
	INITIALIZE,
	STANDBY,
	CAPTURE,
	SHUTDOWN,
}

export enum CaptureGroupState {
	OFFLINE,
	STANDBY,
	CAPTURE,
	SHUTDOWN,
}

export enum NodeState {
	OFFLINE,
	STANDBY,
	RUNNING,
}

class ErrorAccumulator {
	private accumulator: Status = Status.WAITING;

	set severity(val: Status) {
		if (val > this.accumulator) {
			this.accumulator = val;
		}
	}

	get severity() {
		return this.accumulator;
	}
}

export class Storage {
	size: number = 0;
	used: number = 0;
	warn_level: number = 0.8;
	crit_level: number = 0.9;

	private _bar_obj: BarObject | undefined;

	get free() {
		return this.size - this.used;
	}

	get used_perc() {
		return this.used / this.size;
	}

	get free_perc() {
		return this.free / this.size;
	}

	get is_high() {
		return this.used_perc > this.warn_level;
	}

	get is_critical() {
		return this.used_perc > this.crit_level;
	}

	get bar_obj() {
		if (this._bar_obj === undefined) {
			this._bar_obj = new BarObject(0, 1);
		}
		this._bar_obj.high = this.crit_level;
		this._bar_obj.low = this.warn_level;
		this._bar_obj.value = this.used_perc;

		return this._bar_obj;
	}
}

type MountList = { [mount: string]: Storage };

export class Computer {
	name: string;
	timestamp: number | undefined;
	uptime: number | undefined;

	private _cpus: number[] = [];
	private _cpu_bar_obj: BarObject = new BarObject(0, 1);
	private _memory: Storage | undefined;
	private _swap: Storage | undefined;
	private _disks: MountList | undefined;
	private _disk_bar_obj: BarObject = new BarObject(0, 1);
	private _critical_mount: string | undefined;
	private _status_cache: Status | null = null;

	constructor(name: string) {
		this.name = name;
	}

	get cpu_avg() {
		let sum = 0;
		this._cpus.forEach((cpu) => {
			sum += cpu;
		});
		this._cpu_bar_obj.value = sum / this._cpus.length;
		return this._cpu_bar_obj;
	}

	get disk_avg() {
		let sum = 0;
		let max = 0;
		for (const mount in this._disks) {
			let disk = this._disks[mount];
			sum += disk.used;
			max += disk.size;
		}
		this._disk_bar_obj.value = sum / max;
		return this._disk_bar_obj;
	}

	get disks() {
		if (this._disks === undefined) {
			return {};
		}
		return this._disks;
	}

	get memory() {
		if (this._memory === undefined) {
			return new BarObject(0, 1);
		}
		return this._memory.bar_obj;
	}

	get swap() {
		if (this._swap === undefined) {
			return new BarObject(0, 1);
		}
		return this._swap.bar_obj;
	}

	get last_update() {
		if (this.timestamp === undefined) {
			return undefined;
		}
		return Math.round((Date.now() - this.timestamp) / 1000 - 0.5);
	}

	get status() {
		const last_update = this.last_update;
		if (last_update === undefined) {
			return Status.NEVER_ONLINE;
		}
		if (this._status_cache !== null && last_update < 5) {
			return this._status_cache;
		} else if (last_update >= 5 && last_update < 10) {
			return Status.WARNING;
		} else if (last_update >= 10) {
			return Status.OFFLINE;
		}

		let result = new ErrorAccumulator();
		result.severity = Status.OK;

		// Disks
		for (const mount in this._disks) {
			const disk = this._disks[mount];
			if (disk.is_critical && mount === this._critical_mount) {
				result.severity = Status.FATAL;
			} else if (disk.is_critical) {
				result.severity = Status.ERROR;
			} else if (disk.is_high && mount === this._critical_mount) {
				result.severity = Status.ERROR;
			} else if (disk.is_high) {
				result.severity = Status.WARNING;
			}
		}

		// Memory
		if (this._memory?.is_critical) {
			result.severity = Status.ERROR;
		} else if (this._memory?.is_high) {
			result.severity = Status.WARNING;
		}

		// Swap
		if (this._swap?.is_high) {
			result.severity = Status.ERROR;
		}

		// Update cache
		this._status_cache = result.severity;
		return result.severity;
	}

	get online() {
		return this.timestamp !== undefined;
	}

	parse_update(incoming_data: ComputerHeartbeat) {
		// Initialization
		if (this.timestamp === undefined) {
			this._memory = new Storage();
			this._swap = new Storage();
			this._disks = {};
		}

		// Push updates -- all objects are initialized at this point, so cast them when
		// necessary
		this._cpus = incoming_data.cpu_usage;
		(this._memory as Storage).used = incoming_data.memory[0];
		(this._memory as Storage).size = incoming_data.memory[1];
		(this._swap as Storage).used = incoming_data.swap[0];
		(this._swap as Storage).size = incoming_data.swap[1];
		this.uptime = incoming_data.uptime;
		this.timestamp = Date.now();
		incoming_data.mounts.forEach((mount: string, index: number) => {
			const disk_arr = incoming_data.disks[index];
			let disk_obj = (this._disks as MountList)[mount];
			if (disk_obj === undefined) {
				disk_obj = new Storage();
				disk_obj.size = disk_arr[1];
				(this._disks as MountList)[mount] = disk_obj;
			}
			disk_obj.used = disk_arr[0];
			disk_obj.size = disk_arr[1];
		});
		// Purge status cache
		this._status_cache = null;
	}
}

export class DataNode {
	name: string;
	private _errors: number = 0; // 8-bit bitmask
	status = Status.OFFLINE;
	state = NodeState.OFFLINE;
	private _datapoints = {
		total: 0,
		failed: 0,
	};
	private definition: NodeDefinition | undefined;
	private config: NodeConfiguration | undefined;

	constructor(config: NodeConfiguration | string) {
		if (typeof config === 'string') {
			this.name = config;
			return;
		}
		this.name = config.name!;
		this.config = config;
		this.definition = config.definition;
	}

	get is_defined(): boolean {
		return this.definition !== undefined && this.config !== undefined;
	}

	get errors(): NodeErrorDefinition[] | number {
		if (!this.is_defined) {
			return this._errors;
		}
		let result: NodeErrorDefinition[] = [];
		this.definition!.errors.forEach((error, index) => {
			if (((1 << index) & this._errors) != 0) {
				result.push(error);
			}
		});
		return result;
	}

	parse_update(msg: NodeHeartbeat) {
		let old_errors = this._errors;
		this._errors = msg.errors;
		this.state = msg.state as NodeState;
		this._datapoints.total = msg.datapoints_received;
		this._datapoints.failed = msg.datapoints_failed;
		// Update status
		if (this.status === Status.OFFLINE || old_errors != msg.errors) {
			let new_status = new ErrorAccumulator();
			if (this.is_defined) {
				(this.errors as NodeErrorDefinition[]).forEach((error) => {
					new_status.severity = error.set_status;
				});
				if ((this.errors as NodeErrorDefinition[]).length === 0) {
					new_status.severity = Status.OK;
				}
			} else if (this.errors != 0) {
				new_status.severity = Status.ERROR; // If we don't have a definition, treat any error as ERROR severity
			} else {
				new_status.severity = Status.OK;
			}
			this.status = new_status.severity;
		}
	}

	get datapoints() {
		return {
			total: this._datapoints.total,
			failed: this._datapoints.failed,
			suceeded: this._datapoints.total - this._datapoints.failed,
		};
	}
}

export class Sensor {
	name: string;
	nodes: DataNode[] = [];

	private config: SensorConfiguration | undefined;

	constructor(config: SensorConfiguration | string) {
		if (typeof config === 'string') {
			this.name = config;
			return;
		}
		this.name = config.name!;
		this.config = config;
		config.nodes.forEach((node) => {
			this.nodes.push(new DataNode(node));
		});
	}

	get state() {
		if (this.nodes.length == 0) {
			return NodeState.OFFLINE;
		}
		return this.nodes[0].state;
	}

	get node_dict() {
		let result: { [name: string]: DataNode } = {};
		this.nodes.forEach((node) => {
			result[node.name] = node;
		});
		return result;
	}

	get status() {
		let result = new ErrorAccumulator();
		this.nodes.forEach((node) => {
			result.severity = node.status;
		});
		return result.severity;
	}
}

export class CaptureGroup {
	name: string;
	sensors: { [name: string]: Sensor } = {};
	cadence: number | null;
	state: CaptureGroupState = CaptureGroupState.OFFLINE;
	private _status: Status | null = null;

	constructor(config: CaptureGroupConfiguration | string) {
		if (typeof config === 'string') {
			this.name = config;
			this.cadence = null;
			return;
		}

		this.name = config.name!;
		this.cadence = config.cadence!;
		config.sensors.forEach((sensor) => {
			this.sensors[sensor.name!] = new Sensor(sensor);
		});
	}

	get status() {
		if (this._status !== null) {
			return this._status;
		}
		const result = new ErrorAccumulator();
		// @ts-ignore: For some reason, typescript does not acknowledge Object.values
		Object.values(this.sensors).forEach((sensor: Sensor) => {
			result.severity = sensor.status;
		});
		this._status = result.severity;
		return result.severity;
	}

	clear_status() {
		this._status = null;
	}
}

export class Payload {
	state = PayloadState.OFFLINE;
	payload_computer: Computer;
	copilot_computer: Computer | null;
	capture_groups: { [name: string]: CaptureGroup } = {};

	constructor(public config?: MissionConfiguration) {
		if (config === undefined) {
			this.payload_computer = new Computer('Payload');
			this.copilot_computer = new Computer('Copilot');
			return;
		}
		this.payload_computer = new Computer(config.payload!);
		if (config.aircraft!.copilot_installed) {
			this.copilot_computer = new Computer(`${config.aircraft!.name} Copilot`);
		} else {
			this.copilot_computer = null;
		}

		config.capture_groups.forEach((capture_group) => {
			this.capture_groups[capture_group.name!] = new CaptureGroup(
				capture_group
			);
		});
	}

	parse_update(update: PayloadHeartbeat) {
		this.state = update.state;
		update.capture_groups.forEach((cg, index) => {
			if (this.capture_groups[cg] === undefined) {
				this.capture_groups[cg] = new CaptureGroup(cg);
			}
			this.capture_groups[cg].state = update.capture_group_states[index];
		});
	}

	handle_update(update: Heartbeat, type: HeartbeatType, origin: string) {
		switch (type) {
			case 'payload':
				this.parse_update(update as PayloadHeartbeat);
				break;
			case 'computer':
				this.handle_computer_update(update as ComputerHeartbeat, origin);
				break;
			case 'node':
				this.handle_node_update(update as NodeHeartbeat, origin);
				break;
			default:
				throw 'Invalid Heartbeat Type';
				break;
		}
	}

	private handle_computer_update(update: ComputerHeartbeat, origin: string) {
		let origin_components = origin.split('/');
		let hostname = origin_components[2];
		if (
			hostname == this.payload_computer.name ||
			hostname.includes('APL') ||
			hostname.includes('apl')
		) {
			this.payload_computer.parse_update(update);
		} else if (this.copilot_computer !== null) {
			this.copilot_computer.parse_update(update);
		} else {
			console.log(`--- WARNING ---
  Heartbeat from unknown computer ${hostname} received
  Origin path: ${origin}
  Heartbeat contents: ${update}
--- END WARNING ---`);
		}
	}

	private handle_node_update(update: NodeHeartbeat, origin: string) {
		let origin_components = origin.split('/');
		let capture_group: string | CaptureGroup = origin_components[3];
		let sensor: string | Sensor = origin_components[4];
		let node: string | DataNode = origin_components[5];

		if (this.capture_groups[capture_group] === undefined) {
			// This will only happen if a node is part of an untracked capture group,
			// as the control heartbeats should report any capture groups that don't exist
			// in the config file we are referencing. We still want to be able to track
			// them, even if in a perfect world they didn't exist. Use of this functionality
			// is not and never will be supported, but it is easy to add.
			this.capture_groups[capture_group] = new CaptureGroup(capture_group);
		}
		capture_group = this.capture_groups[capture_group];

		if (capture_group.sensors[sensor] === undefined) {
			// This can happen if the config file used on the ground doesn't match
			// what was uploaded to the aircraft, such as if the status monitor is
			// loaded without a config. This is *unsupported*, but we do want to make
			// it possible.
			capture_group.sensors[sensor] = new Sensor(sensor);
		}
		sensor = capture_group.sensors[sensor];

		if (sensor.node_dict[node] === undefined) {
			// This will happen at the same time as if a sensor is undefined. As
			// such, it is also unsupported.
			sensor.nodes.push(new DataNode(node));
		}
		node = sensor.node_dict[node];

		node.parse_update(update);
		capture_group.clear_status();
	}
}
