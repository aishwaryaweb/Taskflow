'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle2, ListTodo, Zap, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

export default function SignupPage() {
  const { signUp } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; confirm?: string }>({});

  const validate = () => {
    const e: typeof errors = {};
    if (!email) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Enter a valid email address';
    if (!password) e.password = 'Password is required';
    else if (password.length < 6) e.password = 'Password must be at least 6 characters';
    if (password !== confirmPassword) e.confirm = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    const { error } = await signUp(email.trim(), password);
    setLoading(false);
    if (error) {
      toast.error(error);
    } else {
      toast.success('Account created! Welcome to TaskFlow.');
      router.push('/dashboard');
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex items-center justify-center px-6 py-12">
        <Card className="w-full max-w-md animate-in-fade border-border/60 shadow-lg">
          <CardHeader className="space-y-1">
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <ListTodo className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-semibold">TaskFlow</span>
            </div>
            <CardTitle className="text-2xl">Create your account</CardTitle>
            <CardDescription>Start organizing your work in seconds.</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={!!errors.email}
                />
                {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={!!errors.password}
                />
                {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">Confirm password</Label>
                <Input
                  id="confirm"
                  type="password"
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  aria-invalid={!!errors.confirm}
                />
                {errors.confirm && <p className="text-sm text-destructive">{errors.confirm}</p>}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Create account
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link href="/login" className="font-medium text-primary hover:underline">
                  Sign in
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>

      <div className="hidden flex-col justify-center bg-gradient-to-br from-primary to-blue-700 px-12 lg:flex">
        <div className="max-w-md text-primary-foreground">
          <h2 className="text-3xl font-bold tracking-tight">Stay on top of everything.</h2>
          <p className="mt-3 text-lg text-primary-foreground/80">
            TaskFlow keeps your tasks organized, prioritized, and in sync across all your devices in real time.
          </p>
          <ul className="mt-8 space-y-4">
            {[
              { icon: Zap, text: 'Real-time updates — changes appear instantly' },
              { icon: ShieldCheck, text: 'Secure, private — only you see your tasks' },
              { icon: CheckCircle2, text: 'Track progress with statuses and priorities' },
            ].map((f, i) => (
              <li key={i} className="flex items-center gap-3">
                <f.icon className="h-5 w-5 shrink-0" />
                <span>{f.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
