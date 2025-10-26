import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Mail, X, Loader2 } from 'lucide-react';
import LanguageSwitcher from '../components/LanguageSwitcher';

export default function Dashboard() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [showVerificationBanner, setShowVerificationBanner] = useState(true);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleResendVerification = async () => {
    if (!user?.email) return;

    setResending(true);
    setResendMessage('');

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/auth/resend-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: user.email }),
      });

      const data = await response.json();

      if (response.ok) {
        setResendMessage(t('auth.verificationSent'));
      } else {
        setResendMessage(data.error || t('auth.resendFailed'));
      }
    } catch (error) {
      setResendMessage(t('auth.resendError'));
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Aerocheck</h1>
            </div>
            <div className="flex items-center space-x-4">
              <LanguageSwitcher />
              <span className="text-sm text-gray-700">
                {user?.firstName} {user?.lastName}
              </span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {t('common.logout')}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Email Verification Banner */}
      {user && !user.emailVerified && showVerificationBanner && (
        <div className="bg-yellow-50 border-b border-yellow-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between flex-wrap">
              <div className="flex items-center flex-1">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mr-3" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-800">
                    {t('auth.emailNotVerified')}
                  </p>
                  <p className="text-xs text-yellow-700 mt-1">
                    {t('auth.verifyEmailPrompt')}
                  </p>
                  {resendMessage && (
                    <p className="text-xs mt-1 text-green-700 font-medium">
                      {resendMessage}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2 mt-2 sm:mt-0">
                <button
                  onClick={handleResendVerification}
                  disabled={resending}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-yellow-800 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resending ? (
                    <>
                      <Loader2 className="animate-spin h-3 w-3 mr-1" />
                      {t('common.sending')}
                    </>
                  ) : (
                    <>
                      <Mail className="h-3 w-3 mr-1" />
                      {t('auth.resendVerification')}
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowVerificationBanner(false)}
                  className="inline-flex items-center p-1.5 text-yellow-600 hover:bg-yellow-100 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {t('auth.welcome')}
            </h2>
            <p className="text-gray-600 mb-4">
              {t('auth.loggedInAs')} {user?.email}
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <h3 className="text-sm font-medium text-blue-900 mb-2">
                {t('common.userInformation')}
              </h3>
              <dl className="text-sm text-blue-700 space-y-1">
                <div>
                  <dt className="inline font-semibold">{t('common.id')}:</dt>
                  <dd className="inline ml-2">{user?.id}</dd>
                </div>
                <div>
                  <dt className="inline font-semibold">{t('common.email')}:</dt>
                  <dd className="inline ml-2">{user?.email}</dd>
                </div>
                <div>
                  <dt className="inline font-semibold">{t('common.name')}:</dt>
                  <dd className="inline ml-2">
                    {user?.firstName} {user?.lastName}
                  </dd>
                </div>
                <div>
                  <dt className="inline font-semibold">{t('common.emailStatus')}:</dt>
                  <dd className="inline ml-2">
                    {user?.emailVerified ? t('auth.verified') : t('auth.notVerified')}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
