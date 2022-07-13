
export type ComputerHeartbeat = {
  cpu_count: number
  cpu_usage: number[]
  memory: number[]
  swap: number[]
  mounts: string[]
  disks: number[][]
  write_target: string | null
  uptime: number
}

export type NodeHeartbeat = {
  state: number
  errors: number
  datapoints_received: number
  datapoints_failed: number
}

export type PayloadHeartbeat = {
  state: number
  capture_groups: string[]
  capture_group_states: number[]
}

export type Heartbeat = ComputerHeartbeat | NodeHeartbeat | PayloadHeartbeat
export type HeartbeatType = "payload" | "computer" | "node"