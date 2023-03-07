/**
 *
 */
export enum Status {
	/**
	 * A default status to fall back on when no other status makes sense.
	 * The UI should display this status in the same way as the RUNNING status.
	 */
	ONLINE,
	/**
	 * The monitored system is online and performing its duties.
	 */
	RUNNING,
	/**
	 * The monitored system is online and waiting for a command.
	 */
	STANDBY,
	/**
	 * The monitored system is initializing.
	 * This is a transient state.
	 */
	INITIALIZING,
	/**
	 * The monitored system is in a warning state.
	 * It likely needs attention, but is not critical.
	 */
	WARNING,
	/**
	 * The monitored system is in a critical state.
	 */
	ERROR,
	/**
	 * The monitored system is offline.
	 */
	OFFLINE,
}

export enum PayloadWarningBit {
	/**
	 *
	 */
	WARN_DISK = 0,
	WARN_SENSOR_OFFLINE = 1,
	WARN_CAPTURE_GROUP_OFFLINE = 2,
	WARN_NODE_OFFLINE = 3,
	WARN_RAMDISK_IN_USE = 4,
	WARN_DATASET_IN_USE = 5,
	/**
	 * Informational bit that indicates the payload is under the control
	 * of the pilot and will reject normal software control. Operator override
	 * mode can be enabled in settings, which will send "override" commands
	 * which the payload will always respond to.
	 */
	INFO_PILOT_CONTROL = 31,
}
