'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { Button } from '@/components/ui/button';
import { ListTodo, Zap, ShieldCheck, CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  if (loading || user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <ListTodo className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold">TaskFlow</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-secondary/40 via-background to-background" />
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28 lg:py-32">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/60 bg-background px-4 py-1.5 text-sm text-muted-foreground shadow-sm">
              <Zap className="h-3.5 w-3.5 text-primary" />
              Real-time task management
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Organize your work,
              <span className="block text-primary">one task at a time.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
              TaskFlow is a fast, secure task manager. Create, edit, and track your tasks
              with real-time sync and bank-grade security.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button size="lg" asChild>
                <Link href="/signup">
                  Get started free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/login">Sign in</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        <div className="grid gap-6 sm:grid-cols-3">
          {[
            {
              icon: Zap,
              title: 'Real-time updates',
              desc: 'Changes sync instantly across devices. No refresh needed.',
            },
            {
              icon: ShieldCheck,
              title: 'Secure & private',
              desc: 'Row Level Security ensures only you can access your tasks.',
            },
            {
              icon: CheckCircle2,
              title: 'Stay organized',
              desc: 'Track progress with statuses, priorities, and filters.',
            },
          ].map((f, i) => (
            <div
              key={i}
              className="rounded-xl border border-border/60 bg-card p-6 transition-shadow hover:shadow-md"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-border/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-6 sm:px-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ListTodo className="h-4 w-4" />
            TaskFlow
          </div>
          <p className="text-sm text-muted-foreground">Built with Next.js & Supabase</p>
        </div>
      </footer>
    </div>
  );
}
