import { useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import { getSlackOAuthUrl } from '../services/slackService';

const Slack = (props) => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" {...props}>
    <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523 2.528 2.528 0 0 1-2.522-2.523 2.528 2.528 0 0 1 2.522-2.52h2.52v2.52zm1.261 0a2.528 2.528 0 0 1 2.52-2.52h5.043a2.528 2.528 0 0 1 2.522 2.52v5.042a2.528 2.528 0 0 1-2.522 2.52H8.823a2.528 2.528 0 0 1-2.52-2.52v-5.042zM8.823 5.043a2.528 2.528 0 0 1-2.52-2.52A2.528 2.528 0 0 1 8.823 0a2.528 2.528 0 0 1 2.52 2.522v2.52h-2.52zm0 1.261a2.528 2.528 0 0 1 2.52 2.52v5.043a2.528 2.528 0 0 1-2.52 2.522H3.782a2.528 2.528 0 0 1-2.52-2.522 2.528 2.528 0 0 1 2.52-2.52h5.041zm10.135 3.782a2.528 2.528 0 0 1 2.522-2.52 2.528 2.528 0 0 1 2.52 2.52 2.528 2.528 0 0 1-2.52 2.522h-2.522v-2.522zm-1.262 0a2.528 2.528 0 0 1-2.52 2.522H10.13a2.528 2.528 0 0 1-2.52-2.522V3.782a2.528 2.528 0 0 1 2.52-2.52h5.043a2.528 2.528 0 0 1 2.52 2.52v5.043zm-3.782 10.135a2.528 2.528 0 0 1 2.52 2.522 2.528 2.528 0 0 1-2.52 2.52 2.528 2.528 0 0 1-2.52-2.52v-2.522h2.52zm0-1.262a2.528 2.528 0 0 1-2.52-2.52v-5.043a2.528 2.528 0 0 1 2.52-2.522h5.043a2.528 2.528 0 0 1 2.52 2.522v5.043a2.528 2.528 0 0 1-2.52 2.52h-5.043z"/>
  </svg>
);

const Login = () => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSlackOAuthLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const response = await getSlackOAuthUrl();
      if (response.data && response.data.url) {
        window.location.href = response.data.url;
      } else {
        throw new Error('Failed to retrieve OAuth URL');
      }
    } catch (err) {
      setError('Failed to contact Slack OAuth provider. Check server configurations.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center p-6 relative overflow-hidden">
      {/* Decorative Pastel Background Art Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-teal-500/5 rounded-full blur-[160px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-indigo-500/5 rounded-full blur-[160px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-white border border-slate-100/80 rounded-3xl shadow-xl shadow-slate-200/50 p-8 z-10 text-center">
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-teal-50 text-teal-700 rounded-2xl mb-4 border border-teal-100">
            <span className="font-serif text-2xl font-bold tracking-tight">T</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 font-serif leading-tight">Talent Match</h1>
          <p className="text-[#5a7682] mt-1.5 text-xs font-semibold uppercase tracking-widest">Internal Project Hiring & Slack Integration</p>
        </div>

        {error && (
          <div className="mb-5 bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl text-center font-bold flex items-center justify-center gap-2">
            <ShieldAlert className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-4">
          <p className="text-xs text-slate-500 font-medium pb-2">
            Sign in securely using your corporate Slack workspace account.
          </p>

          {/* Slack OAuth Simulated Login */}
          <button
            onClick={handleSlackOAuthLogin}
            disabled={loading}
            className="w-full py-3.5 bg-white hover:bg-slate-50 border-2 border-slate-200 text-slate-800 rounded-xl text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-3 transition duration-150 cursor-pointer shadow-sm disabled:opacity-50"
          >
            <Slack className="text-[#e01e5a] w-5 h-5" />
            <span>{loading ? 'Connecting...' : 'Login via Slack OAuth'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
