import {
	check_constraint,
	type ConfigEntries,
} from "@/datastructures/configuration";
import {
	ConfigEntryType,
	type StarCommandSettingDefinition,
} from "@/datastructures/definition";
import { defineStore } from "pinia";

const settings: Readonly<StarCommandSettingDefinition[]> = [
	{
		name: "telemetry_address",
		human_name: "Telemetry Address",
		description: "Address of the StarCommand telemetry server",
		type: ConfigEntryType.STRING,
		default: "localhost",
		required: false,
		persistent: true,
	},
	{
		name: "telemetry_port",
		human_name: "Telemetry Port",
		description: "Port that the StarCommand telemetry server is listening on",
		type: ConfigEntryType.INTEGER,
		default: 8080,
		required: false,
		persistent: true,
	},
	{
		name: "control_override",
		human_name: "Enable Control Override",
		description:
			"Whether or not StarCommand will send payload commands that override pilot control",
		type: ConfigEntryType.BOOLEAN,
		default: false,
		required: false,
		persistent: true,
	},
	{
		name: "abort_enabled",
		human_name: "Enable Mission Abort",
		description:
			"Enables StarCommand's mission abort functionality. CAN LEAD TO DATA LOSS",
		type: ConfigEntryType.BOOLEAN,
		default: false,
		required: false,
		persistent: false,
	},
	{
		name: "save_console_logs",
		human_name: "Enable Application Logging",
		description:
			"Enables capturing of console logs and redirection to the logging manager. Can cause high memory usage.",
		type: ConfigEntryType.BOOLEAN,
		default: false,
		required: false,
		persistent: true,
	},
];

export const useSettingsStore = defineStore({
	id: "settings",
	state: () => ({
		definitions: settings,
		settings: new Proxy(
			{} as ConfigEntries<string | number | boolean | undefined>,
			{
				get(target, prop: string) {
					const definition = settings.find((setting) => setting.name === prop);
					if (definition === undefined) {
						return undefined;
					}
					if (!(prop in target)) {
						const stored = (() => {
							if (definition.persistent) {
								return localStorage.getItem(`settings.${prop}`);
							} else {
								return sessionStorage.getItem(`settings.${prop}`);
							}
						})();
						switch (definition.type) {
							case ConfigEntryType.BOOLEAN:
								target[prop] = stored === "true";
								break;
							case ConfigEntryType.ENUM: // fallthrough
							case ConfigEntryType.INTEGER:
								if (stored === null) {
									target[prop] = definition.default ?? 0;
								} else {
									target[prop] = parseInt(stored);
								}
								break;
							case ConfigEntryType.FLOAT:
								if (stored === null) {
									target[prop] = definition.default ?? 0;
								} else {
									target[prop] = parseFloat(stored);
								}
								break;
							case ConfigEntryType.STRING:
								if (stored === null) {
									target[prop] = definition.default ?? "";
								} else if (stored === "undefined") {
									target[prop] = undefined;
								} else {
									target[prop] = stored;
								}
						}
					}
					return target[prop];
					// } else if (definition.persistent) {
					// 	const stored = localStorage.getItem(`settings.${prop}`);
					// 	target[prop] = stored ?? definition.default;
					// } else {
					// 	const stored = sessionStorage.getItem(`settings.${prop}`);
					// 	target[prop] = stored ?? definition.default;
					// }
					// return target[prop];
				},
				set(target, prop: string, newValue): boolean {
					const definition = settings.find((setting) => setting.name === prop);
					if (definition === undefined) {
						// Setting is not defined, do not allow it to be set
						return false;
					}
					const [valid, value] = validate_setting(definition, newValue);
					if (valid) {
						target[prop] = value;
						if (definition.persistent) {
							localStorage.setItem(`settings.${prop}`, value?.toString() ?? "");
						} else {
							sessionStorage.setItem(
								`settings.${prop}`,
								value?.toString() ?? ""
							);
						}
					}
					return valid;
				},
			}
		),
	}),
});

function validate_setting(
	setting: StarCommandSettingDefinition,
	value: string | number | boolean | undefined
): [boolean, string | number | boolean | undefined] {
	// Booleans are always defined and can only be true or false.
	if (setting.type === ConfigEntryType.BOOLEAN) {
		return [true, value];
	}

	// Basic checks that are required for every non-boolean type
	if (setting.required && (value === "" || value === undefined)) {
		// An empty required setting is invalid
		return [false, undefined];
	} else if (value === "" || value === undefined) {
		// An empty non-required setting is valid
		return [true, value];
	}

	let result = value;

	// Type-specific checking
	switch (setting.type) {
		case ConfigEntryType.INTEGER:
			const int = typeof value === "number" ? value : parseInt(value as string);
			if (isNaN(int)) {
				// Must be a number
				return [false, undefined];
			}
			if (int !== Math.floor(int)) {
				// Must be an integer
				return [false, undefined];
			}
			result = int;
			break;
		case ConfigEntryType.FLOAT:
			const float =
				typeof value === "number" ? value : parseFloat(value as string);
			if (isNaN(float)) {
				// Must be a number
				return [false, undefined];
			}
			result = float;
			break;
	}
	const settingsStore = useSettingsStore();
	// Constraint validation
	const constraints =
		setting.constraints?.reduce<boolean>(
			(acc, constraint) =>
				acc &&
				check_constraint(value, constraint, undefined, settingsStore.settings),
			true
		) ?? true;
	return [constraints, constraints ? result : undefined];
}
