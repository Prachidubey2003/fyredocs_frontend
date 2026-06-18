import { useState, type FormEvent } from 'react';
import { Helmet } from 'react-helmet-async';
import { format } from 'date-fns';
import { Building2, UserPlus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { EmptyState } from '@/components/common/EmptyState';
import { TableSkeleton } from '@/components/common/LoadingState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { useActiveOrg } from '@/components/app/ActiveOrgContext';
import { useMembers, useAddMember, useUpdateMemberRole, useRemoveMember } from '@/hooks/useOrgs';
import { canManageMembers, type ApiMember, type OrgRole } from '@/lib/orgsApi';
import { useAuth } from '@/auth/useAuth';
import { toast } from '@/lib/toast';

const ASSIGNABLE: OrgRole[] = ['admin', 'editor', 'viewer'];

function shortId(id: string): string {
  return id.length > 12 ? `${id.slice(0, 8)}…${id.slice(-4)}` : id;
}

const MembersPage = () => {
  const { activeOrg, activeOrgId } = useActiveOrg();
  const { user } = useAuth();
  const orgId = activeOrgId ?? '';

  const { data: members = [], isLoading } = useMembers(activeOrgId ?? undefined);
  const addMember = useAddMember(orgId);
  const updateRole = useUpdateMemberRole(orgId);
  const removeMember = useRemoveMember(orgId);

  const canManage = !!activeOrg && canManageMembers(activeOrg.role);

  const [addOpen, setAddOpen] = useState(false);
  const [newUserId, setNewUserId] = useState('');
  const [newRole, setNewRole] = useState<OrgRole>('editor');
  const [toRemove, setToRemove] = useState<ApiMember | null>(null);

  if (!activeOrgId) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <Helmet><title>Members — Fyredocs</title></Helmet>
        <AdminPageHeader title="Members" description="Manage who can access an organization." />
        <EmptyState
          icon={Building2}
          title="No organization selected"
          description="Pick or create an organization from the workspace switcher in the top bar to manage its members."
        />
      </div>
    );
  }

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    const id = newUserId.trim();
    if (!id) return;
    try {
      await addMember.mutateAsync({ userId: id, role: newRole });
      toast.success('Member added');
      setAddOpen(false);
      setNewUserId('');
      setNewRole('editor');
    } catch {
      toast.error('Could not add member', 'Check the user ID and your permissions.');
    }
  };

  const handleRoleChange = async (m: ApiMember, role: OrgRole) => {
    try {
      await updateRole.mutateAsync({ userId: m.userId, role });
      toast.success('Role updated');
    } catch {
      toast.error('Could not update role');
    }
  };

  const handleRemove = async (m: ApiMember) => {
    try {
      await removeMember.mutateAsync(m.userId);
      toast.success('Member removed');
    } catch {
      toast.error('Could not remove member');
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <Helmet><title>Members — Fyredocs</title></Helmet>
      <AdminPageHeader
        title="Members"
        description={`People with access to ${activeOrg?.name ?? 'this organization'}.`}
        actions={
          canManage ? (
            <Button size="sm" onClick={() => setAddOpen(true)}>
              <UserPlus className="h-4 w-4" aria-hidden />
              Add member
            </Button>
          ) : undefined
        }
      />

      <Card>
        <CardHeader className="p-4 pb-2">
          <h3 className="text-sm font-medium">{members.length} member{members.length === 1 ? '' : 's'}</h3>
        </CardHeader>
        <CardContent className="p-4 pt-2">
          {isLoading ? (
            <TableSkeleton rows={4} />
          ) : (
            <ul className="divide-y">
              {members.map((m) => {
                const isOwner = m.role === 'owner';
                const isSelf = user?.id === m.userId;
                return (
                  <li key={m.id} className="flex items-center gap-3 py-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold">
                      {m.userId.charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-mono text-sm">
                        {shortId(m.userId)} {isSelf && <span className="text-muted-foreground">(you)</span>}
                      </p>
                      <p className="text-caption text-muted-foreground">Joined {format(new Date(m.createdAt), 'd MMM yyyy')}</p>
                    </div>
                    {canManage && !isOwner ? (
                      <Select value={m.role} onValueChange={(v) => handleRoleChange(m, v as OrgRole)}>
                        <SelectTrigger className="h-8 w-28" aria-label="Member role">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ASSIGNABLE.map((r) => (
                            <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant={isOwner ? 'default' : 'outline'} className="capitalize">{m.role}</Badge>
                    )}
                    {canManage && !isOwner && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        aria-label="Remove member"
                        onClick={() => setToRemove(m)}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden />
                      </Button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-sm">
          <form onSubmit={handleAdd}>
            <DialogHeader>
              <DialogTitle>Add member</DialogTitle>
              <DialogDescription>Add a user to {activeOrg?.name} by their user ID.</DialogDescription>
            </DialogHeader>
            <div className="mt-4 space-y-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">User ID</label>
                <Input value={newUserId} onChange={(e) => setNewUserId(e.target.value)} placeholder="UUID" autoFocus className="font-mono" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Role</label>
                <Select value={newRole} onValueChange={(v) => setNewRole(v as OrgRole)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ASSIGNABLE.map((r) => (
                      <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="mt-5">
              <Button type="button" variant="ghost" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={addMember.isPending || !newUserId.trim()}>Add</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={toRemove != null}
        onOpenChange={(open) => { if (!open) setToRemove(null); }}
        title="Remove member?"
        description={`${toRemove ? shortId(toRemove.userId) : 'This member'} will lose access to ${activeOrg?.name}.`}
        confirmLabel="Remove"
        tone="destructive"
        onConfirm={() => {
          if (toRemove) void handleRemove(toRemove);
          setToRemove(null);
        }}
      />
    </div>
  );
};

export default MembersPage;
