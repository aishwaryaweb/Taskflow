'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase, type Task, type TaskStatus, type TaskPriority } from '@/lib/supabase/client';
import { useAuth } from '@/components/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Pencil, Trash2, Loader2, ListTodo, Circle, Clock, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

const STATUS_META: Record<TaskStatus, { label: string; icon: typeof Circle; color: string }> = {
  todo: { label: 'To Do', icon: Circle, color: 'bg-slate-400' },
  in_progress: { label: 'In Progress', icon: Clock, color: 'bg-blue-500' },
  done: { label: 'Done', icon: CheckCircle2, color: 'bg-green-500' },
};

const PRIORITY_META: Record<TaskPriority, { label: string; variant: 'secondary' | 'default' | 'destructive' }> = {
  low: { label: 'Low', variant: 'secondary' },
  medium: { label: 'Medium', variant: 'default' },
  high: { label: 'High', variant: 'destructive' },
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | TaskStatus>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', status: 'todo' as TaskStatus, priority: 'medium' as TaskPriority });
  const [formError, setFormError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to load tasks.');
    } else {
      setTasks(data ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('tasks-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setTasks((prev) => {
            if (prev.some((t) => t.id === (payload.new as Task).id)) return prev;
            return [payload.new as Task, ...prev];
          });
        } else if (payload.eventType === 'UPDATE') {
          setTasks((prev) => prev.map((t) => (t.id === (payload.new as Task).id ? (payload.new as Task) : t)));
        } else if (payload.eventType === 'DELETE') {
          setTasks((prev) => prev.filter((t) => t.id !== (payload.old as Task).id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ title: '', description: '', status: 'todo', priority: 'medium' });
    setFormError(null);
    setDialogOpen(true);
  };

  const openEdit = (task: Task) => {
    setEditing(task);
    setForm({ title: task.title, description: task.description ?? '', status: task.status, priority: task.priority });
    setFormError(null);
    setDialogOpen(true);
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!form.title.trim()) {
      setFormError('Title is required');
      return;
    }
    if (form.title.trim().length > 200) {
      setFormError('Title must be 200 characters or less');
      return;
    }
    setSubmitting(true);

    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      status: form.status,
      priority: form.priority,
    };

    if (editing) {
      const { error } = await supabase.from('tasks').update(payload).eq('id', editing.id);
      if (error) {
        toast.error('Failed to update task.');
      } else {
        toast.success('Task updated.');
        setDialogOpen(false);
      }
    } else {
      const { error } = await supabase.from('tasks').insert(payload);
      if (error) {
        toast.error('Failed to create task.');
      } else {
        toast.success('Task created.');
        setDialogOpen(false);
      }
    }
    setSubmitting(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase.from('tasks').delete().eq('id', deleteTarget.id);
    if (error) {
      toast.error('Failed to delete task.');
    } else {
      toast.success('Task deleted.');
    }
    setDeleteTarget(null);
  };

  const filtered = filter === 'all' ? tasks : tasks.filter((t) => t.status === filter);
  const counts = {
    all: tasks.length,
    todo: tasks.filter((t) => t.status === 'todo').length,
    in_progress: tasks.filter((t) => t.status === 'in_progress').length,
    done: tasks.filter((t) => t.status === 'done').length,
  };

  const filterOptions: { value: 'all' | TaskStatus; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'todo', label: 'To Do' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'done', label: 'Done' },
  ];

  return (
    <div className="animate-in-fade space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Your Tasks</h1>
          <p className="mt-1 text-muted-foreground">
            Welcome back, {user?.email}. Manage your work below.
          </p>
        </div>
        <Button onClick={openCreate} className="sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          New Task
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {filterOptions.map((opt) => {
          const active = filter === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background text-muted-foreground hover:bg-secondary'
              }`}
            >
              {opt.label}
              <span className={`rounded-full px-1.5 text-xs ${active ? 'bg-primary-foreground/20' : 'bg-muted'}`}>
                {counts[opt.value]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Task list */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
              <ListTodo className="h-7 w-7 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">
              {filter === 'all' ? 'No tasks yet' : `No ${filter.replace('_', ' ')} tasks`}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Create your first task to get started.
            </p>
            <Button onClick={openCreate} className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              New Task
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((task) => {
            const sm = STATUS_META[task.status];
            const pm = PRIORITY_META[task.priority];
            return (
              <Card key={task.id} className="group flex flex-col transition-shadow hover:shadow-md">
                <CardHeader className="space-y-2 pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold leading-tight">{task.title}</h3>
                    <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(task)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(task)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  {task.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{task.description}</p>
                  )}
                </CardHeader>
                <CardContent className="mt-auto flex items-center justify-between pt-0">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                      <sm.icon className={`h-3 w-3 ${sm.color === 'bg-blue-500' ? 'text-blue-500' : sm.color === 'bg-green-500' ? 'text-green-500' : 'text-slate-400'}`} />
                      {sm.label}
                    </span>
                  </div>
                  <Badge variant={pm.variant}>{pm.label}</Badge>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Task' : 'New Task'}</DialogTitle>
            <DialogDescription>
              {editing ? 'Update the details of your task.' : 'Fill in the details to create a new task.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="What needs to be done?"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  maxLength={200}
                />
                {formError && <p className="text-sm text-destructive">{formError}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Add more detail (optional)"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as TaskStatus })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todo">To Do</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="done">Done</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v as TaskPriority })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {editing ? 'Save changes' : 'Create task'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this task?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &ldquo;{deleteTarget?.title}&rdquo;. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
