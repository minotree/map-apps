import React, { useState } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonInput,
  IonButton,
  IonLabel,
  IonItem,
  IonLoading,
  IonToast,
} from '@ionic/react';
import { signIn } from '../services/authService';
import './Login.css';

interface LoginProps {
  onLoginSuccess: () => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleLogin = async () => {
    setLoading(true);
    try {
      await signIn(email, password);
      setToastMessage('로그인 성공');
      onLoginSuccess();
    } catch (error) {
      console.error('로그인 실패:', error);
      setToastMessage('이메일 또는 비밀번호가 올바르지 않습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>로그인</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <IonLoading isOpen={loading} message="로그인 중..." />
        <IonToast
          isOpen={!!toastMessage}
          message={toastMessage || ''}
          duration={2000}
          onDidDismiss={() => setToastMessage(null)}
        />

        <div className="login-container">
          <IonItem className="login-item login-field">
            <IonLabel position="floating" color="medium">이메일</IonLabel>
            <IonInput
              type="email"
              value={email}
              onIonChange={(e) => setEmail(e.detail.value || '')}
              className="login-input"
            />
          </IonItem>

          <IonItem className="login-item login-field">
            <IonLabel position="floating" color="medium">비밀번호</IonLabel>
            <IonInput
              type="password"
              value={password}
              onIonChange={(e) => setPassword(e.detail.value || '')}
              className="login-input"
            />
          </IonItem>

          <IonButton
            expand="block"
            color="primary"
            onClick={handleLogin}
            className="login-button"
          >
            로그인
          </IonButton>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Login;

