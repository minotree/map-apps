import React, { useState, useEffect } from 'react';
import { IonApp, IonLoading, IonToast } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import Login from './components/Login';
import Home from './pages/Home';
import { isAuthenticated } from './services/authService';
import '@ionic/react/css/ionic.bundle.css';
import './theme/variables.css';

const App: React.FC = () => {
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthenticatedUser, setIsAuthenticatedUser] = useState(false);
  const [authError, setAuthError] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const auth = await isAuthenticated();
        setIsAuthenticatedUser(auth);
      } catch (error) {
        console.error('인증 확인 실패:', error);
        setAuthError(true);
      } finally {
        setAuthChecked(true);
      }
    };

    checkAuth();
  }, []);

  if (!authChecked) {
    return (
      <IonApp>
        <IonLoading isOpen={true} message="인증 확인 중..." />
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
        message="로그인 상태를 확인하지 못했습니다. 연결을 확인하고 다시 로그인해 주세요."
        duration={5000}
        onDidDismiss={() => setAuthError(false)}
      />
    </IonApp>
  );
};

export default App;

