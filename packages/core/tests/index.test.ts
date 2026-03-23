import { describe, it, expect } from 'vitest';
import { init, version } from '../src/index';

describe('ZMS Core Scaffolding', () => {
  it('should have a version defined', () => {
    expect(version).toBe('1.1.0-hardening');
  });

  it('should initialize correctly', () => {
    expect(init()).toBe(true);
  });
});
