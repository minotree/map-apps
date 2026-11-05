import React, { useEffect, useState } from 'react';
import { IonApp, IonToast } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import Login from './components/Login';
import Home from './pages/Home';
import { isAuthenticated } from './services/authService';
import '@ionic/react/css/ionic.bundle.css';
import './theme/variables.css';

export const AUTH_CHECK_TIMEOUT_MS = 8_000;

async function checkAuthenticationWithTimeout() {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      isAuthenticated(),
      new Promise<never>((_, reject) => {
        timeoutId = setTimeout(
          () => reject(new Error('인증 상태 확인 시간이 초과되었습니다.')),
          AUTH_CHECK_TIMEOUT_MS,
        );
      }),
    ]);
  } finally {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
  }
}

const App: React.FC = () => {
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthenticatedUser, setIsAuthenticatedUser] = useState(false);
  const [authError, setAuthError] = useState(false);

  useEffect(() => {
    let active = true;

    const checkAuth = async () => {
      try {
        const authenticated = await checkAuthenticationWithTimeout();
        if (active) {
          setIsAuthenticatedUser(authenticated);
        }
      } catch (error) {
        console.error('인증 확인 실패:', error);
        if (active) {
          setAuthError(true);
        }
      } finally {
        if (active) {
          setAuthChecked(true);
        }
      }
    };

    void checkAuth();

    return () => {
      active = false;
    };
  }, []);

  if (!authChecked) {
    return (
      <IonApp>
        <main className="ion-padding ion-text-center" aria-live="polite">
          <p>로그인 상태를 확인하고 있습니다.</p>
        </main>
      </IonApp>
    );
  }

  return (
    <IonApp>
      <IonReactRouter>
        {isAuthenticatedUser ? <Home /> : <Login onLoginSuccess={() => setIsAuthenticatedUser(true)} />}
      </IonReactRouter>
      <IonToast
        isOpen={authError}
        message="로그인 상태를 확인하지 못했습니다. 다시 로그인해 주세요."
        duration={5000}
        onDidDismiss={() => setAuthError(false)}
      />
    </IonApp>
  );
};

export default App;
