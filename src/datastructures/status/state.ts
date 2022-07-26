export type NodeState = number;

export function is_state(state: number): state is NodeState {
	return state >= -128 && state <= 127;
}

export function is_error_state(state: NodeState): boolean {
	return state < 0;
}

export function is_init_state(state: NodeState): boolean {
	return state >= 0 && state < 10;
}

export function is_running_state(state: NodeState): boolean {
	return state === 10 || state === 11;
}

export function is_standby_state(state: NodeState): boolean {
	return state >= 12;
}

/**
 * Checks to see if the state is the offline state.
 * @param state The state to check.
 * @returns True if the state is the defined 'offline' state.
 */
export function is_offline_state(state: NodeState): boolean {
	return state === -1;
}
