import React, { useState } from 'react';
import { useAuth } from '@/lib/authClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, LogOut, Loader2, Eye, EyeOff, Lock, Shield } from 'lucide-react';

export const AuthWidget: React.FC = () => {
  const { user, session, loading, error, signInWithMagicLink, signInWithGoogle, signOut } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // TODO: Handle magic link sign in
  const handleMagicLinkSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    
    setIsSubmitting(true);
    try {
      await signInWithMagicLink(email);
      // TODO: Show success message
    } catch (error) {
      // Error is handled by useAuth hook
    } finally {
      setIsSubmitting(false);
    }
  };

  // TODO: Handle Google sign in
  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      // Error is handled by useAuth hook
    } finally {
      setIsSubmitting(false);
    }
  };

  // TODO: Handle sign out
  const handleSignOut = async () => {
    setIsSubmitting(true);
    try {
      await signOut();
    } catch (error) {
      // Error is handled by useAuth hook
    } finally {
      setIsSubmitting(false);
    }
  };

  // TODO: Show loading state
  if (loading) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Loading...</span>
        </CardContent>
      </Card>
    );
  }

  // TODO: Show authenticated state
  if (user && session) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2 text-green-600" />
            Welcome, {user.name || user.email}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-gray-600">
            <p>Email: {user.email}</p>
            {user.role && <p>Role: {user.role}</p>}
          </div>
          <Button onClick={handleSignOut} disabled={isSubmitting} variant="outline" className="w-full">
            <LogOut className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Signing out...' : 'Sign Out'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // TODO: Show sign in form
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <CardTitle className="text-xl font-bold">Medical Professional Login</CardTitle>
          <div className="flex space-x-2">
            <div className="flex items-center px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
              <Shield className="h-3 w-3 mr-1" />
              Secure Medical Platform
            </div>
            <div className="flex items-center px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
              <Lock className="h-3 w-3 mr-1" />
              SSL Encrypted
            </div>
          </div>
        </div>
        <p className="text-sm text-gray-600">Access your secure medical documentation platform</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">{error}</div>
        )}
        
        <form onSubmit={handleMagicLinkSignIn} className="space-y-4">
          <div>
            <Label htmlFor="email" className="text-sm font-medium">Medical Professional Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="doctor@hospital.ca"
              required
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="password" className="text-sm font-medium">Secure Password</Label>
            <div className="relative mt-1">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your secure password"
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </button>
            </div>
          </div>
          
          <div className="flex items-center">
            <input
              id="remember-me"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <Label htmlFor="remember-me" className="ml-2 text-sm text-gray-700">
              Remember me on this trusted device
            </Label>
          </div>
          
          <Button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-700">
            <Lock className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Signing in...' : 'Secure Login'}
          </Button>
        </form>
        
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-gray-500">OR</span>
          </div>
        </div>
        
        <Button onClick={handleGoogleSignIn} disabled={isSubmitting} variant="outline" className="w-full">
          <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {isSubmitting ? 'Signing in...' : 'Continue with Gmail'}
        </Button>
      </CardContent>
    </Card>
  );
};
