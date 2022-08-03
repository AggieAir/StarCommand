/**
 * This is a set of computer parameters that are used to configure basic
 * functionality of the control node running on the computer. Most of these
 * values cannot be changed in the UI, and those that can will require
 * a restart of the control node.
 */
export interface ComputerDefinition {
	/**
	 * The name of the computer. This is used to identify the computer in the UI.
	 *
	 * The hostname of the computer, rather than this field, is used in the ROS
	 * namespace, so this field can include characters that are not allowed in
	 * hostnames or ROS namespaces. It is meant to be a human-readable name.
	 */
	name: string;
	/**
	 * The role the computer plays in the STARDOS network. This is used to
	 * determine what mode the Control node will run in.
	 *
	 * While this is configurable in the UI, it is not recommended to change
	 * it unless you know what you're doing.
	 */
	role: ComputerRole;
	/**
	 * What payload this computer is installed in, if any. This is mostly just
	 * for bookkeeping purposes.
	 */
	payload?: string;
	/**
	 * What aircraft this computer is connected to, if any. This is used to
	 * determine the top-level namespace the computer should place itself in.
	 *
	 * This is configurable in the UI, but will require the control node to
	 * reinitialize all of its publishers and subscribers.
	 *
	 * Configuration services are not affected by this setting, as they will exist
	 * in a top-level computer namespace along with the control node.
	 */
	aircraft?: string;
	/**
	 * Whether this is the primary computer of its type in its system. Each
	 * system must have exactly one primary computer of each relevant type.
	 *
	 * Note that a HYBRID-role computer is considered both a payload and a
	 * copilot, so if it is marked as primary, it fills both roles.
	 *
	 * Aircraft must have primary copilot and payload computers, but they can
	 * both be the same computer as in the case of a HYBRID-role computer.
	 *
	 * A ground station system must have a single primary GCS computer.
	 */
	primary: boolean;
}

/**
 * What role the computer plays in the STARDOS network. This is used to
 * determine what mode the Control node on the computer will run in.
 */
export enum ComputerRole {
	/**
	 * The computer is a payload computer. This means it has sensors connected
	 * to it, and will be used to collect, process, and store data.
	 *
	 * By convention, AggieAir payload computers are named for the payload they
	 * are installed in.
	 */
	PAYLOAD = 'payload',
	/**
	 * The computer is a copilot computer. This means it has a direct UART connection
	 * to the autopilot, and facilitates communication between the autopilot and
	 * the payload computer. It is also responsible for creating flight logs.
	 *
	 * By convention, AggieAir copilot computers are named for the aircraft they
	 * are installed in. For example, the copilot computer for the AggieAir
	 * aircraft "Phoenix" is named "Phoenix Copilot", with the hostname
	 * "phoenix-copilot".
	 */
	COPILOT = 'copilot',
	/**
	 * The computer is a ground station computer. This means it has a network connection
	 * to the ground-side telemetry radio, and runs ground station software such as StarCommand.
	 * A primary GCS computer is also responsible for facilitating communication
	 * between ground station software and the telemetry radio.
	 */
	GCS = 'gcs',
	/**
	 * The computer is a hybrid computer. This means it has sensors connected to it,
	 * as well as a direct UART connection to the autopilot. It handles the functions
	 * of both a payload and a copilot computer.
	 *
	 * By convention, AggieAir hybrid computers are named for the payload they are
	 * installed in, rather than the aircraft.
	 */
	HYBRID = 'hybrid',
}

export interface Package {
	name: string;
	version: string;
	repository: string;
	path: string;
}

export interface PayloadParameters {
	/**
	 * The UUID of the persistent mission config. This option is ignored in
	 * the WAIT_FOR_UPLOAD mode.
	 *
	 * The special value of 'last' refers to the most recently uploaded mission,
	 * and can be used in conjunction with the LOAD_ON_START mode to fully emulate
	 * the startup behavior of AggieCap3 in STARDOS.
	 */
	config: string;
	/**
	 * The startup mode of the payload, as described in the PayloadStartupMode enum.
	 */
	mode: PayloadStartupMode;
	/**
	 * Whether the payload should automatically update its config parameter to 'last' when
	 * a new mission is uploaded.
	 */
	update_config: boolean;
	/**
	 * Require that the payload computer's system date match the configured mission date.
	 * This is a safety measure to prevent the payload from accidentally starting an old
	 * mission.
	 */
	require_date: boolean;
	/**
	 * A list of STARDOS packages installed on the computer. This cannot be edited directly,
	 * but will be used by the STARDOS package manager that will eventually exist in StarCommand.
	 * For right now, this field will not exist.
	 */
	//installed_packages: Package[];
}

/**
 * How the payload will load mission configs.
 */
export enum PayloadStartupMode {
	/**
	 * The payload will wait for a mission config to be manually uploaded.
	 * This is the default, preferred mode.
	 *
	 * Each time the payload is restarted, a new mission config will need
	 * to be uploaded before the payload will start. This is preferred as
	 * it will help ensure that the payload is not accidentally started
	 * with an old mission config.
	 *
	 * In this mode, the payload will boot into the WAITING_FOR_CONFIG state.
	 */
	WAIT_FOR_UPLOAD = 'wait',
	/**
	 * The payload will load a mission config stored in the payload's
	 * persistent storage when it boots. In the event that the specified
	 * mission config does not exist, or is invalid this mode behaves the same as
	 * WAIT_FOR_UPLOAD.
	 *
	 * This mode is useful for missions that will run without a ground
	 * station computer, however it is not recommended for missions that
	 * have such a computer. It can also be useful for scenarios where
	 * the payload may lose power or be restarted during a mission.
	 *
	 * In this mode, the payload will boot into the READY_FOR_MISSION_START state,
	 * unless the mission config is invalid.
	 */
	LOAD_ON_BOOT = 'load',
	/**
	 * The payload will load a mission config stored in the payload's
	 * persistent storage when it receives a mission start command. In the
	 * event that the specified mission config does not exist, or is invalid,
	 * the payload will enter an error state.
	 *
	 * This mode will make a STARDOS payload behave similar to AggieCap3. It
	 * has similar use cases to LOAD_ON_BOOT, but as the config is not loaded
	 * on boot, it allows additional options to be configured before the mission
	 * without the need to restart the payload.
	 *
	 * In this mode, the payload will boot into the READY_FOR_MISSION_START state
	 * regardless of the presence of a valid mission config, as the mission config
	 * is not loaded until the mission start command is received.
	 */
	LOAD_ON_START = 'load-start',
}
