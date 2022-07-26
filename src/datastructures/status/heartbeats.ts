/**
 * A heartbeat message from a STARDOS node.
 * This is as close to the ROS message definition as JavaScript can get.
 */
export interface Heartbeat {
	/**
	 * An 8-bit integer representing the node's state.
	 */
	state: number;
	/**
	 * A 24-bit bitmask representing the node's warnings, extracted into an array of booleans.
	 */
	warnings: boolean[];
	/**
	 * A 16-bit integer representing the number of requests the node has received.
	 * This is incremented each time a request is sent to the node. In some extreme
	 * cases, this may overflow, however it is unlikely as missions usually only run
	 * for a few hours.
	 */
	requests: number;
	/**
	 * A 16-bit integer representing the number of requests the node has failed to complete.
	 * This is incremented each time a request fails to complete.
	 */
	failures: number;
	/**
	 * 64 bits of data, for use by the node.
	 * Individual fields are defined by the node's definition.
	 */
	data: ArrayBuffer;
}

export interface ComputerStatus {
	cpu_count: number;
	cpu_usage: number[];
	memory: number[];
	swap: number[];
	mounts: string[];
	disks: number[][];
	uptime: number;
}

export interface IncomingMessage {
	/**
	 * The data contained in the message.
	 */
	data: Heartbeat | ComputerStatus;
	/**
	 * The processing node that sent the message, extracted from the ROS topic.
	 * If the node is not a processing node or coprocessor, this will be null.
	 */
	node?: string;
	/**
	 * The sensor the node is in, extracted from the ROS topic.
	 * If the node is not a processing node, this will be null.
	 */
	sensor?: string;
	/**
	 * The capture group the node is in, extracted from the ROS topic.
	 * If the node is not a processing node or a capture group, this will be null.
	 */
	capture_group?: string;
	/**
	 * The computer the node is on, extracted from the ROS topic.
	 */
	computer: string;
	/**
	 * The STARDOS system the node is in, extracted from the ROS topic.
	 */
	system: string;
	/**
	 * The ROS topic the message was received on, not including the namespace.
	 * For heartbeats, this will be 'heartbeat'.
	 * For computer status, this will be 'system_status'.
	 */
	topic: 'heartbeat' | 'system_status';
}

export type ProcessingNodeHeartbeatMsg = Required<
	IncomingMessage & {
		data: Heartbeat;
		topic: 'heartbeat';
	}
>;
export type CaptureGroupHeartbeatMsg = Required<
	Omit<IncomingMessage, 'node' | 'sensor'> & {
		data: Heartbeat;
		topic: 'heartbeat';
	}
>;
export type CoprocessorHeartbeatMsg = Required<
	Omit<IncomingMessage, 'sensor' | 'capture_group'> & {
		data: Heartbeat;
		topic: 'heartbeat';
	}
>;
export type PayloadHeartbeatMsg = Required<
	Omit<IncomingMessage, 'node' | 'sensor' | 'capture_group'> & {
		data: Heartbeat;
		topic: 'heartbeat';
	}
>;
export type ComputerStatusMsg = Required<
	Omit<IncomingMessage, 'node' | 'sensor' | 'capture_group'> & {
		data: ComputerStatus;
		topic: 'system_status';
	}
>;

export function message_is_node_heartbeat(
	message: IncomingMessage
): message is ProcessingNodeHeartbeatMsg {
	return (
		message.node !== undefined &&
		message.sensor === undefined &&
		message.capture_group === undefined &&
		message.topic === 'heartbeat'
	);
}

export function message_is_capture_group_heartbeat(
	message: IncomingMessage
): message is CaptureGroupHeartbeatMsg {
	return (
		message.node === undefined &&
		message.sensor === undefined &&
		message.capture_group !== undefined &&
		message.topic === 'heartbeat'
	);
}

export function message_is_coprocessor_heartbeat(
	message: IncomingMessage
): message is CoprocessorHeartbeatMsg {
	return (
		message.node !== undefined &&
		message.sensor === undefined &&
		message.capture_group === undefined &&
		message.topic === 'heartbeat'
	);
}

export function message_is_payload_heartbeat(
	message: IncomingMessage
): message is PayloadHeartbeatMsg {
	return (
		message.node === undefined &&
		message.sensor === undefined &&
		message.capture_group === undefined &&
		message.topic === 'heartbeat'
	);
}

export function message_is_computer_status(
	message: IncomingMessage
): message is ComputerStatusMsg {
	return (
		message.node === undefined &&
		message.sensor === undefined &&
		message.capture_group === undefined &&
		message.topic === 'system_status'
	);
}
