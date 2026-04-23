import React, { useState } from 'react';
import { Lock } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface LoginProps {
  onLogin: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const { theme } = useTheme();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('authToken', data.token);
        onLogin();
      } else {
        setError(data.message || 'Feil brukernavn eller passord');
      }
    } catch (err) {
      setError('En feil oppstod ved innlogging');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center px-4 transition-colors duration-500"
      style={{ 
        backgroundColor: theme.stone50,
        color: theme.textColorPrimary,
        fontFamily: theme.fontSans
      }}
    >
      <div 
        className="max-w-md w-full rounded-2xl shadow-sm border p-8"
        style={{
          backgroundColor: '#ffffff',
          borderColor: theme.stone200
        }}
      >
        <div className="flex flex-col items-center mb-8">
          <div 
            className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
            style={{ backgroundColor: theme.stone100 }}
          >
            <Lock className="w-6 h-6" style={{ color: theme.stone900 }} />
          </div>
          <h1 className="text-2xl font-serif font-black" style={{ color: theme.stone900 }}>Logg inn</h1>
          <p className="text-sm mt-2" style={{ color: theme.stone500 }}>Vennligst logg inn for å se fotooppdragene</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest mb-1" style={{ color: theme.stone500 }}>
              Brukernavn
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2"
              style={{ 
                borderColor: theme.stone200,
                color: theme.stone900,
                backgroundColor: '#ffffff'
              }}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest mb-1" style={{ color: theme.stone500 }}>
              Passord
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2"
              style={{ 
                borderColor: theme.stone200,
                color: theme.stone900,
                backgroundColor: '#ffffff'
              }}
              required
            />
          </div>

          {error && (
            <p className="text-sm p-3 rounded-lg" style={{ color: theme.statusCritical, backgroundColor: `${theme.statusCritical}15` }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl font-medium transition-colors disabled:opacity-50 mt-4"
            style={{ 
              backgroundColor: theme.stone900, 
              color: theme.textColorInverted 
            }}
          >
            {loading ? 'Logger inn...' : 'Logg inn'}
          </button>
        </form>
      </div>
    </div>
  );
};
