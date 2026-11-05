import React from 'react';

interface State {
  error: Error | null;
}

export class AppErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('현장조사 화면 오류:', error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <main style={{ minHeight: '100vh', padding: 24, background: '#fff', color: '#111' }}>
        <h1 style={{ fontSize: 20 }}>화면을 불러오지 못했습니다.</h1>
        <p>앱을 완전히 닫았다 다시 열거나 아래 버튼으로 새로고침해 주세요.</p>
        <button type="button" onClick={() => window.location.reload()} style={{ padding: '10px 16px' }}>
          다시 불러오기
        </button>
      </main>
    );
  }
}
