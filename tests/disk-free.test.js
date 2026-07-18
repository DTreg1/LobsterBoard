/**
 * disk-free widget tests.
 *
 * Guards the crash-relevant behavior: the headline is FREE space (GB), colored
 * by absolute remaining space (green > warnGB, amber, red <= critGB) — NOT by
 * percentage. On APFS the shared-container `available` is the true free space,
 * so a nearly-full disk with a healthy buffer must still read green.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const GREEN = '#3fb950', AMBER = '#d29922', RED = '#f85149';
let widget;

beforeAll(() => {
  globalThis.window = {};
  globalThis.renderIcon = (x) => '{' + x + '}';
  (0, eval)(readFileSync(join(process.cwd(), 'js', 'widgets', 'system.js'), 'utf8'));
  widget = globalThis.window.WIDGETS['disk-free'];
});

// Render the widget against a stats payload and read back what it would display.
function render(data, props = {}) {
  const p = { id: 'w1', server: 'local', path: '/', warnGB: 20, critGB: 10, ...props };
  const js = widget.generateJs(p);
  let cb;
  const onStats = (_s, fn) => { cb = fn; };
  const els = {};
  const document = { getElementById: (id) => els[id] || (els[id] = { textContent: '', style: {} }) };
  new Function('onStats', 'document', js)(onStats, document);
  cb(data);
  return {
    free: els['w1-free'] && els['w1-free'].textContent,
    color: els['w1-free'] && els['w1-free'].style.color,
    full: els['w1-pct'] && els['w1-pct'].textContent,
    ring: els['w1-ring'] && els['w1-ring'].style.stroke,
    sub: els['w1-sub'] && els['w1-sub'].textContent,
  };
}

const diskWith = (freeGB, sizeGB = 245) =>
  ({ disk: [{ mount: '/', size: sizeGB * 1e9, used: (sizeGB - freeGB) * 1e9, available: freeGB * 1e9, use: 30 }] });

describe('disk-free widget', () => {
  it('registers', () => {
    expect(widget).toBeTruthy();
    expect(widget.category).toBe('small');
  });

  it('shows a nearly-full disk as GREEN when the free buffer is healthy (the whole point)', () => {
    const r = render(diskWith(29));
    expect(r.free).toBe('29 GB');
    expect(r.color).toBe(GREEN);
    expect(r.ring).toBe(GREEN);
    expect(r.full).toBe('88%');      // 88% full, but green because 29 GB free
    expect(r.sub).toBe('free · of 245 GB');
  });

  it('turns AMBER between critGB and warnGB', () => {
    const r = render(diskWith(15));
    expect(r.free).toBe('15 GB');
    expect(r.color).toBe(AMBER);
  });

  it('turns RED at/under critGB, with one decimal for small values', () => {
    const r = render(diskWith(8));
    expect(r.free).toBe('8.0 GB');
    expect(r.color).toBe(RED);
  });

  it('respects custom thresholds', () => {
    expect(render(diskWith(25), { warnGB: 30, critGB: 15 }).color).toBe(AMBER);
    expect(render(diskWith(40), { warnGB: 30, critGB: 15 }).color).toBe(GREEN);
  });

  it('uses shared-container `available`, not size − used', () => {
    // used is tiny but the shared pool is nearly gone → must read red, not "lots free"
    const r = render({ disk: [{ mount: '/', size: 245e9, used: 5e9, available: 4e9 }] });
    expect(r.free).toBe('4.0 GB');
    expect(r.color).toBe(RED);
  });

  it('handles the offline state without crashing', () => {
    const r = render({ _offline: true });
    expect(r.free).toBe('offline');
  });
});
