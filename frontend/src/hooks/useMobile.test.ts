import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useIsMobile } from './useMobile';

function mockMatchMedia(matches: boolean) {
  return vi.fn().mockImplementation(() => ({
    matches,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
}

function setInnerWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: width });
}

beforeEach(() => {
  vi.stubGlobal('matchMedia', mockMatchMedia(false));
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe('useIsMobile', () => {
  it('returns false when innerWidth is above the 768 breakpoint', () => {
    setInnerWidth(1024);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });

  it('returns true when innerWidth is below the 768 breakpoint', () => {
    setInnerWidth(375);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });

  it('returns false when innerWidth is exactly 768 (boundary: < 768)', () => {
    setInnerWidth(768);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });

  it('registers a change event listener on mount', () => {
    setInnerWidth(1024);
    const addEventListenerMock = vi.fn();
    vi.stubGlobal('matchMedia', vi.fn().mockImplementation(() => ({
      matches: false,
      addEventListener: addEventListenerMock,
      removeEventListener: vi.fn(),
    })));

    renderHook(() => useIsMobile());
    expect(addEventListenerMock).toHaveBeenCalledWith('change', expect.any(Function));
  });

  it('removes the change event listener on unmount', () => {
    setInnerWidth(1024);
    const removeEventListenerMock = vi.fn();
    vi.stubGlobal('matchMedia', vi.fn().mockImplementation(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: removeEventListenerMock,
    })));

    const { unmount } = renderHook(() => useIsMobile());
    unmount();
    expect(removeEventListenerMock).toHaveBeenCalledWith('change', expect.any(Function));
  });
});
