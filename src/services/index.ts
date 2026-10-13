import { MockCoolBoxService } from './mockCoolBoxService';
import type { CoolBoxService } from './types';

/**
 * Single swap point for the device backend.
 * Replace MockCoolBoxService with an ESP32 REST / WebSocket / MQTT implementation
 * of CoolBoxService and nothing in the UI has to change.
 */
export const coolBox: CoolBoxService = new MockCoolBoxService();

export * from './types';
