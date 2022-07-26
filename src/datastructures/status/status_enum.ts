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
