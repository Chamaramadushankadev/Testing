import React from 'react';
import { Chrome, Zap, Target, CheckSquare, StickyNote, Video, Mail, BarChart3 } from 'lucide-react';
import { useFirebaseAuth } from '../../hooks/useFirebaseAuth';
import { useState } from 'react';

export const LoginScreen: React.FC = () => {
  const { signInWithGoogle, signInWithEmailPassword, registerWithEmailPassword, loading, error, clearError } = useFirebaseAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleGoogleSignIn = async () => {
    clearError();
    await signInWithGoogle();
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    await signInWithEmailPassword(email, password);
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    await registerWithEmailPassword(name, email, password);
  };

  const features = [
    { icon: Target, title: 'Goals & Objectives', description: 'Track and achieve your goals with AI-powered insights' },
    { icon: CheckSquare, title: 'Smart Task Management', description: 'Organize tasks with intelligent prioritization' },
    { icon: StickyNote, title: 'Knowledge Base', description: 'Capture and organize your ideas and notes' },
    { icon: Video, title: 'AI Script Generator', description: 'Generate YouTube scripts with AI assistance' },
    { icon: Mail, title: 'Cold Email Marketing', description: 'Automate your outreach campaigns' },
    { icon: BarChart3, title: 'Analytics & Reports', description: 'Track your productivity and performance' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900">
      <div className="flex min-h-screen">
        {/* Left Side - Branding & Features */}
       <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-purple-700 p-12 text-white flex-col justify-between">
  <div>
    <div className="flex items-center space-x-3 mb-8">
      <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
        <Zap className="w-7 h-7 text-white" />
      </div>
      <div>
        <h1 className="text-2xl font-bold">Nexa Pro</h1>
        <p className="text-blue-100">Your AI-Powered Workspace</p>
      </div>
    </div>

    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold mb-4">
          Supercharge Your Productivity with AI
        </h2>
        <p className="text-xl text-blue-100 leading-relaxed">
          The all-in-one platform that combines goal tracking, task management,
          content creation, and marketing automation in one beautiful interface.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <div
              key={index}
              className="flex items-start space-x-3 p-4 bg-white/10 rounded-lg backdrop-blur-sm"
            >
              <Icon className="w-6 h-6 text-blue-200 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-white">{feature.title}</h3>
                <p className="text-sm text-blue-100 mt-1">{feature.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  </div>

  <div className="text-center">
    <p className="text-blue-200 text-sm">
      Join thousands of productive professionals
    </p>
  </div>
</div>


        {/* Right Side - Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 dark:bg-gray-900">
          <div className="w-full max-w-md">
            {/* Mobile Logo */}
            <div className="lg:hidden text-center mb-8">
              <div className="flex items-center justify-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-700 rounded-xl flex items-center justify-center">
                  <Zap className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Nexa Pro</h1>
                  <p className="text-gray-600">Your AI-Powered Workspace</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {isSignUp ? 'Create Account' : 'Welcome Back'}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  {isSignUp ? 'Sign up to start using Nexa Pro' : 'Sign in to access your productivity dashboard'}
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
                </div>
              )}

              <form onSubmit={isSignUp ? handleEmailSignUp : handleEmailSignIn} className="space-y-4 mb-6">
                {isSignUp && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl px-6 py-4 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Processing...' : isSignUp ? 'Create Account' : 'Sign In'}
                </button>
              </form>
              
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">Or continue with</span>
                </div>
              </div>

              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full flex items-center justify-center space-x-3 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-xl px-6 py-4 text-gray-700 dark:text-white font-semibold hover:bg-gray-50 dark:hover:bg-gray-600 hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-400 border-t-transparent" />
                ) : (
                  <Chrome className="w-5 h-5 text-red-500 dark:text-red-400" />
                )}
                <span>{loading ? 'Signing in...' : 'Continue with Google'}</span>
              </button>

              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium"
                >
                  {isSignUp ? 'Already have an account? Sign in' : 'Need an account? Sign up'}
                </button>
              </div>

              <div className="mt-8 text-center text-xs">
                <p className="text-gray-500 dark:text-gray-400">
                  By signing in, you agree to our{' '}
                  <a href="#" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="#" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium">
                    Privacy Policy
                  </a>
                </p>
              </div>
            </div>

            {/* Mobile Features Preview */}
            <div className="lg:hidden mt-8">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Everything you need to be productive
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  AI-powered tools for modern professionals
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {features.slice(0, 4).map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <div key={index} className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                      <Icon className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                      <h4 className="font-medium text-gray-900 dark:text-white text-sm">{feature.title}</h4>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};