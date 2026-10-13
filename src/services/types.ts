export type OperatingMode = 'auto' | 'fast' | 'eco';

export type CoolingStatus = 'cooling' | 'reached' | 'off';

export type NotificationKind =
  | 'target'
  | 'cooling-on'
  | 'cooling-off'
  | 'wifi-on'
  | 'wifi-off'
  | 'warm'
  | 'system';

export interface CoolBoxNotification {
  id: string;
  kind: NotificationKind;
  category: 'system' | 'alert';
  title: string;
  detail: string;
  /** epoch ms */
  at: number;
  read: boolean;
}

export interface CoolBoxState {
  currentTemperature: number;
  targetTemperature: number;
  peltierOn: boolean;
  fanOn: boolean;
  /** 0-100 */
  fanSpeed: number;
  /** 0-100 */
  coolingPower: number;
  wifiConnected: boolean;
  autoMode: boolean;
  selectedMode: OperatingMode;
  notifications: CoolBoxNotification[];
  /** derived by the service so every screen shows the same status */
  status: CoolingStatus;
}

export type Listener = () => void;

/**
 * Transport-agnostic contract between the UI and the fridge.
 *
 * The UI only ever talks to this interface. A real ESP32 backend (REST polling,
 * WebSocket or MQTT) implements the same shape: push state snapshots to
 * listeners, and translate the setters into device commands.
 */
export interface CoolBoxService {
  getState(): CoolBoxState;
  subscribe(listener: Listener): () => void;
  start(): void;
  stop(): void;

  setTargetTemperature(value: number): void;
  setPeltier(on: boolean): void;
  setFan(on: boolean): void;
  setFanSpeed(value: number): void;
  setAutoMode(on: boolean): void;
  setMode(mode: OperatingMode): void;
  setWifi(connected: boolean): void;
  markNotificationsRead(): void;
}

export const TARGET_MIN = 2;
export const TARGET_MAX = 20;
