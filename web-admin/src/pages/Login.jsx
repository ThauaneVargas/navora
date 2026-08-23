import React, { useState } from 'react';
import BrandPanel from '../components/Login/BrandPanel.jsx';
import LoginForm from '../components/Login/LoginForm.jsx';
import ProfileSwitch from '../components/Login/ProfileSwitch.jsx';
import NavoraBrand from '../components/branding/NavoraBrand.jsx';
import '../styles/login.css';

export default function LoginPage({ onLogin, toast }) {
  const [profile, setProfile] = useState('admin');

  return (
    <main className="navora-login-page">
      {toast ? <div className={`toast login-toast ${toast.type}`}>{toast.message}</div> : null}
      <div className="mobile-login-brand"><NavoraBrand variant="mobile-login" showRole={false} /></div>
      <section className="login-layout">
        <BrandPanel />
        <div className="login-card-wrap">
          <LoginForm profile={profile} onSubmit={onLogin}>
            <ProfileSwitch value={profile} onChange={setProfile} />
          </LoginForm>
        </div>
      </section>
    </main>
  );
}
