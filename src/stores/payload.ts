import type { MissionConfiguration } from "@/datastructures/configuration";
import type { IncomingStatusMessage } from "@/datastructures/status/heartbeats";
import { Payload, PayloadState } from "@/datastructures/status/payload";
import { Notification, NotificationUrgency } from "@/notification";
import { defineStore } from "pinia";
import { useAlert } from "./alert";
import { useDatalink } from "./datalink";
import { useNotifications } from "./notifications";
import { useSettingsStore } from "./settings";

export const usePayloadStore = defineStore({
	id: "payload",
	state: () => {
		useDatalink().bind_telemetry_callback((msg) => {
			usePayloadStore().payload?.handle_message(msg as IncomingStatusMessage);
		});
		return {
			payload: null as Payload | null,
		};
	},
	getters: {
		config: (state) => {
			return state.payload?.config;
		},
		allow_estop() {
			return useSettingsStore().settings.abort_enabled;
		},
	},
	actions: {
		async initialize(
			config?: MissionConfiguration,
			manual_load: boolean = false
		) {
			const old_uuid = this.payload?.config?.uuid;
			if (config?.uuid) {
				localStorage.setItem("config_uuid", config.uuid);
			}
			if (config) {
				this.payload = new Payload(config);
				if (old_uuid != undefined) {
					this.payload.temporarily_ignore_uuid(old_uuid);
				}
				if (useDatalink().telemetry_connected && manual_load) {
					console.log("Uploading config");
					const result = await useAlert().open({
						title: "Upload?",
						message:
							"Would you like to upload this configuration to the payload?",
						buttons: [
							{
								label: "Yes",
							},
							{
								label: "No",
								dangerous: true,
							},
						],
					});
					console.log(result);
					if (result === 0) {
						config = { ...config };
						config.capture_groups = config.capture_groups.map((group) => {
							group = { ...group };
							(group as any).executable =
								group.definition?.executable ?? (group as any).type.executable;
							group.definition =
								(group.definition?.name as any) ?? (group as any).type.name;
							delete (group as any).type;
							group.sensors = group.sensors.map((sensor) => {
								sensor = { ...sensor };
								sensor.nodes = sensor.nodes.map((node) => {
									node = { ...node };
									node.definition = node.definition.name as any;
									return node;
								});
								return sensor;
							});
							return group;
						});
						useDatalink().send_command({
							type: "control",
							target: "/set_config",
							payload: JSON.stringify(config),
							protocol: "ros",
						});
					}
				} else if (manual_load) {
					console.log("cannot upload config");
					useNotifications().show(
						new Notification(
							"Cannot upload configuration",
							"You must be connected to the datalink to upload a configuration.",
							NotificationUrgency.HIGH,
							undefined,
							10
						)
					);
				}
			} else if (!config) {
				// TODO: get config from database
				this.payload = new Payload();
			}
		},
		timer_update() {
			// const payload_active = (() => {
			// 	switch (this.payload?.state) {
			// 		case PayloadState.CAPTURING:
			// 		case PayloadState.STANDBY:
			// 			return true;
			// 		default:
			// 			return false;
			// 	}
			// })();
			const payload_active =
				this.payload?.state === PayloadState.CAPTURING ||
				this.payload?.state === PayloadState.STANDBY;
			this.payload?.capture_groups.forEach((group) => {
				if (!payload_active && group.time_since_heard > 10000) {
					// If the mission is not running, assume nodes we haven't heard form are offline.
					group.mark_as_offline();
				}
				group.update_status_code();
				group.sensors.forEach((sensor) => {
					sensor.nodes.forEach((node) => {
						if (!payload_active && node.time_since_heard > 10000) {
							// If the mission is not running, assume nodes we haven't heard from are offline.
							node.mark_as_offline();
						}
						node.update_status_code();
					});
				});
			});
		},
	},
});

setInterval(() => {
	usePayloadStore().timer_update();
}, 500);
