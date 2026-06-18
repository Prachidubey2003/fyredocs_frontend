import { useState } from 'react';
import { Building2, Check, ChevronsUpDown, Plus, User as UserIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { CreateNamedDialog } from '@/components/app/CreateNamedDialog';
import { useActiveOrg } from '@/components/app/ActiveOrgContext';
import { useCreateOrg } from '@/hooks/useOrgs';
import { toast } from '@/lib/toast';
import { cn } from '@/lib/utils';

/** Topbar control to switch between Personal scope and the user's orgs. */
export function OrgSwitcher() {
  const { activeOrgId, activeOrg, orgs, setActiveOrg } = useActiveOrg();
  const createOrg = useCreateOrg();
  const [dialog, setDialog] = useState(false);

  const label = activeOrg ? activeOrg.name : 'Personal';

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="max-w-[12rem] gap-1.5">
            {activeOrg ? <Building2 className="h-4 w-4 shrink-0" aria-hidden /> : <UserIcon className="h-4 w-4 shrink-0" aria-hidden />}
            <span className="truncate">{label}</span>
            <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-60">
          <DropdownMenuLabel>Workspace</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => setActiveOrg(null)}>
            <UserIcon className="mr-2 h-4 w-4" aria-hidden />
            <span className="flex-1">Personal</span>
            {activeOrgId === null && <Check className="h-4 w-4" aria-hidden />}
          </DropdownMenuItem>
          {orgs.length > 0 && <DropdownMenuSeparator />}
          {orgs.map((o) => (
            <DropdownMenuItem key={o.id} onClick={() => setActiveOrg(o.id)}>
              <Building2 className="mr-2 h-4 w-4" aria-hidden />
              <span className="flex-1 truncate">{o.name}</span>
              <Badge variant="outline" className={cn('mr-1 h-4 px-1 text-[10px]')}>{o.role}</Badge>
              {activeOrgId === o.id && <Check className="h-4 w-4" aria-hidden />}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setDialog(true)}>
            <Plus className="mr-2 h-4 w-4" aria-hidden />
            New organization
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CreateNamedDialog
        open={dialog}
        onOpenChange={setDialog}
        title="New organization"
        label="Organization name"
        placeholder="e.g. Acme Corp"
        submitting={createOrg.isPending}
        onSubmit={async (name) => {
          try {
            const org = await createOrg.mutateAsync(name);
            toast.success('Organization created');
            setActiveOrg(org.id);
            setDialog(false);
          } catch {
            toast.error('Could not create organization');
          }
        }}
      />
    </>
  );
}
