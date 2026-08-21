import React, { useState } from 'react';

const profileText = {
  admin: {
    title: 'Acesso Administrativo',
    subtitle: 'Faca login para acessar o painel administrativo e gerenciar o sistema hospitalar.',
    button: 'Entrar no Painel',
    helper: 'Controle operacional, beacons, mapas, usuarios e relatorios.',
  },
  reception: {
    title: 'Acesso Recepcao',
    subtitle: 'Faca login para acessar o sistema de atendimento e recepcao de pacientes.',
    button: 'Entrar no Sistema',
    helper: 'Atendimento, check-ins, chamados, mensagens e fluxo de pacientes.',
  },
};

export default function LoginForm({ profile, onSubmit, children }) {
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const content = profileText[profile];

  const submit = async (event) => {
    event.preventDefault();

    const nextErrors = {};
    if (!user.trim()) nextErrors.user = 'Informe seu e-mail ou usuario.';
    if (!password.trim()) nextErrors.password = 'Informe sua senha.';
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length) return;

    setLoading(true);
    try {
      await onSubmit({ email: user, password, role: profile });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="login-card" onSubmit={submit}>
      <div className="login-card-icon" aria-hidden="true">#</div>
      <header className="login-card-head">
        <h2>{content.title}</h2>
        <p>{content.subtitle}</p>
      </header>

      {children}

      <p className="login-profile-helper">{content.helper}</p>

      <label className={`field ${errors.user ? 'invalid' : ''}`}>
        <span>E-mail ou Usuario</span>
        <div className="input-shell">
          <i aria-hidden="true">@</i>
          <input
            value={user}
            onChange={(event) => setUser(event.target.value)}
            placeholder="Digite seu e-mail ou usuario"
            autoComplete="username"
          />
        </div>
        {errors.user ? <small>{errors.user}</small> : null}
      </label>

      <label className={`field ${errors.password ? 'invalid' : ''}`}>
        <span>Senha</span>
        <div className="input-shell">
          <i aria-hidden="true">[]</i>
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Digite sua senha"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
          />
          <button type="button" onClick={() => setShowPassword((current) => !current)}>
            {showPassword ? 'Ocultar' : 'Ver'}
          </button>
        </div>
        {errors.password ? <small>{errors.password}</small> : null}
      </label>

      <div className="form-options">
        <label className="remember">
          <input
            type="checkbox"
            checked={remember}
            onChange={(event) => setRemember(event.target.checked)}
          />
          Lembrar-me
        </label>
        <button type="button">Esqueceu sua senha?</button>
      </div>

      <button className="login-submit" type="submit" disabled={loading}>
        {loading ? 'Entrando...' : content.button}
      </button>

      <div className="login-divider"><span>ou continue com</span></div>
      <button className="sso-button" type="button">Login com SSO Hospitalar</button>

      <footer className="login-security">
        <strong>Acesso restrito e monitorado</strong>
        <span>Todos os dados sao protegidos com criptografia.</span>
      </footer>
    </form>
  );
}
