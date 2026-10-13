import {
  CoolBoxNotification,
  CoolBoxService,
  CoolBoxState,
  CoolingStatus,
  Listener,
  NotificationKind,
  OperatingMode,
  TARGET_MAX,
  TARGET_MIN,
} from './types';

const AMBIENT = 25;
const TICK_MS = 1000;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const round1 = (v: number) => Math.round(v * 10) / 10;

const minutesAgo = (m: number) => Date.now() - m * 60_000;

function seedNotifications(): CoolBoxNotification[] {
  return [
    { id: 's1', kind: 'target', category: 'system', title: 'Nhiệt độ đã ổn định', detail: '10°C', at: minutesAgo(12), read: false },
    { id: 's2', kind: 'cooling-on', category: 'system', title: 'Peltier đã bật', detail: 'Làm lạnh bắt đầu', at: minutesAgo(25), read: false },
    { id: 's3', kind: 'wifi-on', category: 'system', title: 'Wi-Fi đã kết nối', detail: 'CoolBox', at: minutesAgo(60), read: true },
    { id: 's4', kind: 'warm', category: 'alert', title: 'Nhiệt độ tăng nhẹ', detail: '11.5°C', at: minutesAgo(180), read: true },
    { id: 's5', kind: 'cooling-on', category: 'system', title: 'Làm lạnh trở lại', detail: '10°C', at: minutesAgo(300), read: true },
  ];
}

function deriveStatus(s: Pick<CoolBoxState, 'peltierOn' | 'currentTemperature' | 'targetTemperature'>): CoolingStatus {
  if (!s.peltierOn) return 'off';
  return s.currentTemperature - s.targetTemperature > 0.25 ? 'cooling' : 'reached';
}

/**
 * Simulated ESP32. Temperature follows a small thermal model instead of jumping:
 * Peltier cooling vs. heat leaking in from ambient, with the fan improving heat
 * rejection. In auto mode a proportional controller modulates cooling power.
 */
export class MockCoolBoxService implements CoolBoxService {
  private state: CoolBoxState;
  private listeners = new Set<Listener>();
  private timer: ReturnType<typeof setInterval> | null = null;
  private idCounter = 100;
  private lastStatus: CoolingStatus;

  constructor() {
    const base = {
      currentTemperature: 10.2,
      targetTemperature: 10,
      peltierOn: true,
    };
    const status = deriveStatus(base);
    this.state = {
      ...base,
      fanOn: true,
      fanSpeed: 82,
      coolingPower: 68,
      wifiConnected: true,
      autoMode: true,
      selectedMode: 'auto',
      notifications: seedNotifications(),
      status,
    };
    this.lastStatus = status;
  }

  getState = () => this.state;

  subscribe = (listener: Listener) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  start() {
    if (this.timer) return;
    this.timer = setInterval(() => this.tick(), TICK_MS);
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  // ---- commands -----------------------------------------------------------

  setTargetTemperature(value: number) {
    const target = clamp(round1(value), TARGET_MIN, TARGET_MAX);
    this.commit({ targetTemperature: target });
  }

  setPeltier(on: boolean) {
    if (on === this.state.peltierOn) return;
    this.commit({ peltierOn: on, coolingPower: on ? Math.max(this.state.coolingPower, 40) : 0 });
    this.pushNotification(
      on ? 'cooling-on' : 'cooling-off',
      on ? 'Peltier đã bật' : 'Làm lạnh đã dừng',
      on ? 'Làm lạnh bắt đầu' : 'Peltier đã tắt',
    );
  }

  setFan(on: boolean) {
    this.commit({ fanOn: on });
  }

  setFanSpeed(value: number) {
    const speed = Math.round(clamp(value, 0, 100));
    this.commit({ fanSpeed: speed, fanOn: speed > 0 });
  }

  setAutoMode(on: boolean) {
    this.commit({ autoMode: on });
  }

  setMode(mode: OperatingMode) {
    // Operating modes shape how aggressively the controller behaves.
    const patch: Partial<CoolBoxState> = { selectedMode: mode, autoMode: true };
    if (mode === 'fast') patch.fanSpeed = 100;
    if (mode === 'eco') patch.fanSpeed = Math.min(this.state.fanSpeed, 45);
    if (mode === 'auto') patch.fanSpeed = Math.max(this.state.fanSpeed, 60);
    this.commit(patch);
  }

  setWifi(connected: boolean) {
    if (connected === this.state.wifiConnected) return;
    this.commit({ wifiConnected: connected });
    this.pushNotification(
      connected ? 'wifi-on' : 'wifi-off',
      connected ? 'Wi-Fi đã kết nối' : 'Wi-Fi mất kết nối',
      connected ? 'CoolBox' : 'Đang thử kết nối lại',
      connected ? 'system' : 'alert',
    );
  }

  markNotificationsRead() {
    if (this.state.notifications.every((n) => n.read)) return;
    this.commit({ notifications: this.state.notifications.map((n) => (n.read ? n : { ...n, read: true })) });
  }

  // ---- simulation ---------------------------------------------------------

  private tick() {
    const s = this.state;
    const diff = s.currentTemperature - s.targetTemperature;

    // Desired cooling power
    let wantedPower = 0;
    if (s.peltierOn) {
      if (s.autoMode) {
        wantedPower = diff <= -0.15 ? 0 : 38 + diff * 60;
        if (s.selectedMode === 'fast') wantedPower += 28;
        if (s.selectedMode === 'eco') wantedPower = Math.min(wantedPower, 55) * 0.85;
      } else {
        wantedPower = s.coolingPower > 0 ? s.coolingPower : 68;
      }
      wantedPower = clamp(wantedPower, 0, 100);
    }

    // Power ramps instead of snapping, like real hardware.
    const power = s.coolingPower + (wantedPower - s.coolingPower) * 0.35;

    const fanBoost = s.fanOn ? 1 + s.fanSpeed / 250 : 0.8;
    const cooling = (power / 100) * 0.075 * fanBoost;
    const leak = (AMBIENT - s.currentTemperature) * 0.0017;
    const jitter = (Math.random() - 0.5) * 0.004;
    const nextTemp = clamp(s.currentTemperature + leak - cooling + jitter, 2, AMBIENT);

    const next: Partial<CoolBoxState> = {
      currentTemperature: Math.round(nextTemp * 100) / 100,
      coolingPower: Math.round(power * 10) / 10,
    };
    this.commit(next);

    const status = this.state.status;
    if (status !== this.lastStatus) {
      if (status === 'reached') this.pushNotification('target', 'Đã đạt nhiệt độ mục tiêu', `${this.state.targetTemperature}°C`);
      if (status === 'cooling' && this.lastStatus !== 'off') this.pushNotification('cooling-on', 'Làm lạnh trở lại', `${this.state.targetTemperature}°C`);
      this.lastStatus = status;
    }
  }

  private pushNotification(
    kind: NotificationKind,
    title: string,
    detail: string,
    category: CoolBoxNotification['category'] = 'system',
  ) {
    const n: CoolBoxNotification = {
      id: `n${this.idCounter++}`,
      kind,
      category,
      title,
      detail,
      at: Date.now(),
      read: false,
    };
    this.commit({ notifications: [n, ...this.state.notifications].slice(0, 30) });
    this.lastStatus = this.state.status;
  }

  private commit(patch: Partial<CoolBoxState>) {
    const merged = { ...this.state, ...patch };
    merged.status = deriveStatus(merged);
    this.state = merged;
    this.listeners.forEach((l) => l());
  }
}
