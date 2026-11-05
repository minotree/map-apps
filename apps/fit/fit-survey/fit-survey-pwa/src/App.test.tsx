import React from 'react';
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import App from './App';
import { isAuthenticated } from './services/authService';

vi.mock('./services/authService', () => ({ isAuthenticated: vi.fn() }));
vi.mock('./components/Login', () => ({ default: () => <div>로그인 화면</div> }));
vi.mock('./pages/Home', () => ({ default: () => <div>조사 화면</div> }));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

test('세션이 있으면 조사 화면을 표시한다', async () => {
  vi.mocked(isAuthenticated).mockResolvedValue(true);
  render(<App />);
  expect(await screen.findByText('조사 화면')).toBeDefined();
});

test('세션이 없으면 로그인 화면을 표시한다', async () => {
  vi.mocked(isAuthenticated).mockResolvedValue(false);
  render(<App />);
  expect(await screen.findByText('로그인 화면')).toBeDefined();
});

test('인증 확인 실패 시 로딩에 머물지 않고 로그인 화면을 표시한다', async () => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.mocked(isAuthenticated).mockRejectedValue(new Error('connection failed'));
  render(<App />);
  expect(await screen.findByText('로그인 화면')).toBeDefined();
});

test('인증 확인이 멈추면 제한 시간 후 로그인 화면으로 복구한다', async () => {
  vi.useFakeTimers();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.mocked(isAuthenticated).mockImplementation(() => new Promise(() => {}));

  render(<App />);
  expect(screen.getByText('로그인 상태를 확인하고 있습니다.')).toBeDefined();

  await act(async () => {
    await vi.advanceTimersByTimeAsync(8_000);
  });

  expect(screen.getByText('로그인 화면')).toBeDefined();
  vi.useRealTimers();
});

