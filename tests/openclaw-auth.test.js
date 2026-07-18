/**
 * OpenClaw auth-status mapping tests.
 *
 * Guards the /api/auth widget derivation after OpenClaw 2026.7.x moved auth
 * profiles from auth-profiles.json into the agent SQLite DB and changed the
 * subscription profile `type` from "token" to "oauth". The widget must show
 * "Max" (mode "Monthly") for an OAuth/claude-cli login and "API" for an api_key.
 */

import { describe, it, expect } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { deriveAnthropicAuthMode } = require('../server/routes/system.cjs');

describe('deriveAnthropicAuthMode', () => {
  it('maps an OAuth (claude-cli) anthropic profile to Monthly/Max', () => {
    const profiles = {
      'anthropic:claude-cli': { type: 'oauth', provider: 'claude-cli' },
      'openai:default': { type: 'api_key', provider: 'openai' },
    };
    const { mode, primary } = deriveAnthropicAuthMode(profiles, []);
    expect(mode).toBe('Monthly');
    expect(primary).toBe('anthropic:claude-cli');
  });

  it('maps an api_key anthropic profile to API', () => {
    const profiles = { 'anthropic:default': { type: 'api_key', provider: 'anthropic' } };
    expect(deriveAnthropicAuthMode(profiles, []).mode).toBe('API');
  });

  it('still treats the legacy "token" type as Monthly', () => {
    const profiles = { 'anthropic:default': { type: 'token' } };
    expect(deriveAnthropicAuthMode(profiles, []).mode).toBe('Monthly');
  });

  it('honors an explicit anthropic order when choosing the primary profile', () => {
    const profiles = {
      'anthropic:claude-cli': { type: 'oauth' },
      'anthropic:work-key': { type: 'api_key' },
    };
    expect(deriveAnthropicAuthMode(profiles, ['anthropic:work-key']).primary).toBe('anthropic:work-key');
    expect(deriveAnthropicAuthMode(profiles, ['anthropic:work-key']).mode).toBe('API');
  });

  it('normalizes a bare order id into an anthropic:<id> key', () => {
    const profiles = { 'anthropic:claude-cli': { type: 'oauth' } };
    expect(deriveAnthropicAuthMode(profiles, ['claude-cli']).primary).toBe('anthropic:claude-cli');
  });

  it('returns unknown when there is no anthropic profile or no profiles at all', () => {
    expect(deriveAnthropicAuthMode({ 'openai:default': { type: 'api_key' } }, []).mode).toBe('unknown');
    expect(deriveAnthropicAuthMode(null, []).mode).toBe('unknown');
    expect(deriveAnthropicAuthMode({}, []).mode).toBe('unknown');
  });
});
