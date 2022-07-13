import type { Status } from "./status"

export enum ConfigEntryType {
  INTEGER,
  FLOAT,
  STRING,
  ENUM,
  BOOLEAN,
  LINKED
}

export enum ConstraintType {
  STATIC,
  LINKED,
  CONFIG_LINKED
}

export enum ConstraintRelation {
  EQUALS = "==",
  LESS_THAN = "<",
  GREATER_THAN = ">",
  LESS_EQUALS = "<=",
  GREATER_EQUALS = ">=",
  MATCHES = "~="
}

// Only error-level constraint failures will prevent config upload. Any failed constraint will
// alter the title of the editor field to inform the user of the failure. Notice-level
// constraints can be used to provide details for each option in an enum, for example,
// as they will not have any other cosmetic differences.
export enum ConstraintSeverity {
  NOTICE,
  WARNING,
  ERROR
}

export type ConfigEntryDefinition = {
  name: string;
  human_name: string;
  description: string;
  type: ConfigEntryType;
  units: string | undefined; // String to be rendered after the field, intended for a unit annotation
  choices: any[] | undefined;
  constraints: ConfigEntryConstraint[] | undefined;
  placeholder: string | undefined;
  default: string | number | boolean | undefined;
  required: boolean;
}

export type ConfigEntryConstraint = {
  type: ConstraintType;
  relation: ConstraintRelation;
  alert: string;
  severity: ConstraintSeverity;
  offset: number | undefined;
  invert: true | undefined;
} & ({
  type: ConstraintType.LINKED | ConstraintType.CONFIG_LINKED;
  target: string;
} | {
  type: ConstraintType.STATIC;
  value: string | number | boolean;
})

// type ConfigEntryDefinitionTest = {
//   name: string;
//   description: string;
//   type: ConfigEntryType;
//   min_limit: number | undefined;
//   max_limit: number | undefined;
//   choices: any[] | undefined;
//   linked: number | undefined;
//   pattern: string | undefined;
//   pattern_fail_msg: string | undefined;
//   placeholder: string | undefined;
//   default: string | number | boolean | undefined;
//   required: boolean;
// }

export type NodeErrorDefinition = {
  name: string;
  description: string;
  set_status: Status;
}

export type NodeDefinition = {
  name: string;
  human_name: string;
  description: string;
  executable: string;
  input_type: string;
  output_type: string;
  requires: string | undefined; // Coprocessor required by the node
  config_entries: ConfigEntryDefinition[];
  errors: NodeErrorDefinition[];
}

// External data processors which do not neatly fit into the
// default data flow of STARDOS but which need to run concurrently
// with STARDOS. Only one instance of each coprocessor should exist
// in a config.
export type CoprocessorDefinition = {
  name: string,
  human_name: string,
  description: string,
  executable: string,
  input_type: string,
  config_entries: ConfigEntryDefinition[],
  errors: NodeErrorDefinition[]
}

export type CaptureTypeDefinition = {
  name: string,
  human_name: string,
  description: string,
  executable: string,
  config_entries: ConfigEntryDefinition[]
}

export type AvionicsDefinition = {
  name: string;
  description: string;
  copilot_executables: string[];
}

export type AircraftDefinition = {
  name: string;
  platform: string;
  avionics: AvionicsDefinition;
  copilot_installed: boolean;
}

export type DatabaseDefinition = AircraftDefinition | AvionicsDefinition | NodeDefinition;