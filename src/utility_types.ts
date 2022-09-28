export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type Dict<T> = { [key: string]: T };
export type ValueOf<T> = T[keyof T];

export type UUID = string;
