import Database, { Table } from '@/database';
import type { IncomingMessage } from '@/datalink';
import type { MissionConfiguration } from '@/datastructures/configuration';
import {
	DeviceEditor,
	type CopilotSettings,
	type Device,
	type DeviceList,
	type DeviceType,
	type GroundSettings,
	type PayloadSettings,
} from '@/datastructures/device_config';
import { Notification, NotificationUrgency } from '@/notification';
import type { Nullable, Optional } from '@/utility_types';
import { defineStore } from 'pinia';
import { computed, reactive, ref, unref, type Ref } from 'vue';
import { useDatalink } from './datalink';
import { useNotifications } from './notifications';

export const useDeviceStore = defineStore('devices', () => {
	/**
	 * Dictionary mapping known device hostnames to their details objects
	 */
	const devices: Ref<DeviceList> = ref({});
	const activeDevice: Ref<Nullable<DeviceEditor>> = ref(null);

	// We don't want the active device to be easily manipulated
	// externally, so we'll return this instead.
	const activeDeviceGetter = computed(() => {
		return activeDevice.value;
	});

	/**
	 * List of device hostnames
	 */
	const deviceNames = computed(() => {
		return Object.keys(devices.value);
	});

	/**
	 * Load a discovered device for editing.
	 * @param device The hostname of the device to edit.
	 */
	function edit(device: string) {
		if (devices.value[device] !== undefined) {
			activeDevice.value = new DeviceEditor(devices.value[device]);
		} else {
			throw 'Given device does not exist';
		}
	}

	/**
	 * Close the editor, nulling the active device
	 */
	function closeEditor() {
		activeDevice.value = null;
	}

	/**
	 * Attempts a manual connection to the specified device.
	 *
	 * The returned device reference is stored in the activeDevice
	 * @param ip The IP address of the device to connect to.
	 * @returns a reference to the device, or null if connection failed.
	 */
	async function addDevice(ip: string): Promise<Nullable<Device>> {
		try {
			const response = await fetch(`http://${ip}:4207/api/type`);
			const data = await response.json();
			activeDevice.value = new DeviceEditor({
				ips: [ip],
				computer_type: data.type,
			});
			return activeDevice.value;
		} catch {
			return null;
		}
	}

	/**
	 * Retrieve the list of stored missions from the given device
	 *
	 * This is used to produce a list of missions to select. While all
	 * devices store missions they receive on disk, only a payload needs
	 * to be able to load them automatically. Thus, the endpoint this
	 * uses is only available on payload and payload/copilot hybrid devices.
	 * @param device Device to fetch missions from. Must be a payload or hybrid.
	 * @returns A promise to return a list of mission names, aliases, or UUIDs
	 * @throws an error if the device is not a payload or payload/copilot hybrid.
	 */
	async function fetchMissions(device: Device): Promise<string[]> {
		if (
			device.computer_type !== 'payload' &&
			device.computer_type !== 'hybrid'
		) {
			throw 'Device is not a payload, so it cannot list stored missions';
		}
		const response = await fetch(`http://${device.ips[0]}:4207/api/missions`);
		const mission_uuids: string[] = await response.json();
		mission_uuids.sort((a, b) => {
			if (a == 'latest') {
				return -1;
			}
			if (b == 'latest') {
				return 1;
			}
			return a.localeCompare(b);
		});
		const db = await Database.get_database();
		const mission_names = await Promise.all(
			mission_uuids.map(async (uuid) => {
				try {
					const mission = await db.get<MissionConfiguration>(
						Table.MissionConfiguration,
						uuid
					);
					return mission.name;
				} catch {
					return uuid;
				}
			})
		);
		device.missions = mission_names;
		return mission_names;
	}

	// Bind the device update function to the datalink
	const datalink = useDatalink();
	datalink.bind_telemetry_callback((msg: IncomingMessage) => {
		switch (msg.type) {
			case 'computer_discovered':
				devices.value[msg.hostname] = {
					ips: msg.ips,
					computer_type: msg.computer_type,
				};
				break;
			case 'computer_removed':
				delete devices.value[msg.hostname];
				break;
		}
	});

	return {
		devices,
		activeDevice: activeDeviceGetter,
		deviceNames,
		addDevice,
		fetchMissions,
		edit,
		closeEditor,
	};
});
