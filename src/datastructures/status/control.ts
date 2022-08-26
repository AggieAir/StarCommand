import type { MissionConfiguration } from '../configuration';

export interface ControlMessage {
	/**
	 * The data contained in the message. This will be placed in the ROS message's
	 * options field.
	 */
	payload: string;
	/**
	 * The fully-qualified ROS topic to publish the message to.
	 */
	target: string;
	/**
	 * Used to differentiate this interface from other sent messages.
	 */
	type: 'control';
	/**
	 * How the message should be sent. Note that in both cases, the message will
	 * be sent as a ROS message, this field is only used to determine which ROS
	 * domain to send the message to.
	 *
	 * ROS messages are sent directly over the network. This is used for
	 * configuration uploads and other large messages that shouldn't be
	 * sent over the telemetry radio.
	 *
	 * MAVLink messages are sent over the telemetry radio. This is used for
	 * anything that needs to reach the payload while the payload is in the
	 * air, but is heavily bandwidth-limited.
	 */
	protocol: 'ros';
}

export interface ParameterMessage {
	/**
	 * The payload to change a parameter on.
	 */
	payload: string;
	/**
	 * The payload parameter to change.
	 */
	parameter: string;
	/**
	 * The value to set the parameter to, encoded in JSON.
	 *
	 * Typically this will be a simple value, but encoding as JSON is a good
	 * idea to ensure that the value is serialized properly.
	 */
	value: string;
	/**
	 * Used to differentiate this interface from other sent messages.
	 */
	type: 'set-parameter';
	/**
	 * How the message should be sent.
	 *
	 * Note that this message invokes a ROS action, which cannot be sent over
	 * the telemetry radio. Paylaod parameters should never be changed mid-flight
	 * anyways, so this is not a concern.
	 *
	 * Actions are used instead of services because we don't want the datalink server
	 * to have to wait for the payload to respond to the action.
	 */
	protocol: 'ros';
}

export interface ParameterResponse {
	payload: string;
	parameter: string;
	value: string;
	success: boolean;
	type: 'parameter-response';
}

/**
 * A service call to get a list of all parameters.
 */
export interface ParameterRequest {
	/**
	 * The payload to get the parameters from.
	 */
	payload: string;
	type: 'parameter-request';
	/**
	 * How the message should be sent.
	 *
	 * Note that this message invokes a ROS action, which cannot be sent over
	 * the telemetry radio. Payload parameters are never changed mid-flight, and
	 * StarCommand will be capable of caching payload parameters, so this is not
	 * a concern.
	 *
	 * Actions are used instead of services because we don't want the datalink server
	 * to have to wait for the payload to respond to the request.
	 */
	protocol: 'ros';
}

/**
 * The response to a parameter request.
 */
export interface ParameterList {
	/**
	 * The payload that the parameters are for.
	 */
	payload: string;
	/**
	 * A list of parameter names.
	 */
	parameters: string[];
	/**
	 * A list of parameter values, each encoded in JSON.
	 */
	values: string[];
	/**
	 * Used to differentiate this interface from other received messages.
	 */
	type: 'parameter-list';
}

export interface UploadConfig {
	/**
	 * The payload to upload a configuration to.
	 */
	payload: string;
	/**
	 * The mission configuration to upload.
	 *
	 * This will have all definition fields removed and replaced with the
	 * name of the definition in order to save space. This is done by the
	 * datalink store, so it is not necessary to do it prior to sending.
	 */
	config: MissionConfiguration;
	/**
	 * Whether to save the configuration to the payload's persistent storage.
	 *
	 * When a configuration is saved, the 'last' symlink will be updated to point
	 * to the newly saved configuration. Configurations are saved to the payload's
	 * /opt/stardos/config directory, and are named for the mission UUID ($uuid.mission.json).
	 *
	 * If this flag is used in conjunction with the validate flag, the configuration
	 * will be validated before saving. If the validation fails, the configuration
	 * will not be saved.
	 */
	save: boolean;
	/**
	 * Whether to validate the configuration before saving. If this is false,
	 * an invalid configuration may be saved to the payload's persistent storage
	 * and loaded later.
	 */
	validate: boolean;
	/**
	 * Whether to load the configuration immediately. If this is true, the payload
	 * will immediately load the configuration, replacing any pre-loaded mission.
	 *
	 * This implies the validate flag. If it fails validation, the payload will not
	 * load the configuration.
	 */
	load: boolean;
	/**
	 * Used to differentiate this interface from other sent messages.
	 */
	type: 'upload-config';
	/**
	 * How the message should be sent.
	 *
	 * Note that this message invokes a ROS service, which cannot be sent over
	 * the telemetry radio. A configuration upload is too large to be sent over
	 * the telemetry radio anyways, so this is not a concern.
	 */
	protocol: 'ros';
}

export interface ConfigResponse {
	/**
	 * The payload that processed the configuration.
	 */
	payload: string;
	/**
	 * An error message if any step of the upload or processing failed.
	 */
	error?: string;
	/**
	 * Whether the configuration was successfully saved to the payload's persistent storage.
	 *
	 * If this is false, the configuration was not saved. This can happen if the
	 * configuration failed requested validation, or if the save flag was not set.
	 */
	saved: boolean;
	/**
	 * Whether the configuration successfully passed on-board validation.
	 *
	 * There are a number of reasons why this could fail. A configuration uploaded
	 * from StarCommand is guaranteed to be structurally valid, but if it references
	 * nodes that are not available on the payload, the payload will reject it at
	 * this point. Thus, it is possible for a configuration to be valid on some
	 * payloads but not others. This is also why the option to save a configuration
	 * without validating it is available, as the software necessary to run the
	 * mission may be installed later.
	 *
	 * This will also be false if the validate and load flags were not set.
	 */
	validated: boolean;
	/**
	 * Whether the configuration was successfully loaded into active use.
	 *
	 * This will be false if the load flag was not set, or if the configuration
	 * failed validation as described above. If a configuration passes validation,
	 * loading it will succeed unless another mission is currently active.
	 */
	loaded: boolean;
	type: 'config-response';
}
