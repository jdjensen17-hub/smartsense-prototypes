// A1 — role check. Matching is exact; a near miss is only a hint.

import { useNavigate, useSearchParams } from 'react-router-dom';
import { Check, Info, TriangleAlert } from 'lucide-react';
import { ToastHost } from '@/components/api-keys/toast';
import { useApiKeyDeepLinks } from '@/components/api-keys/deepLinks';
import {
  Banner,
  Button,
  Code,
  Crumbs,
  PageHead,
  Pill,
  SupportBanner,
  TableCard,
  Th,
} from '@/components/api-keys/ui';
import { C } from '@/components/api-keys/tokens';
import { ORG, ORG_ROLES, TASK_TYPES, nearMissRole, useApiKeys } from '@/data/apiKeys';

export default function ApiKeyRoleCheckPage() {
  const navigate = useNavigate();
  const state = useApiKeys();
  const [params] = useSearchParams();
  useApiKeyDeepLinks();

  const roles = params.get('state') === 'noroles' ? [] : ORG_ROLES;
  const rows = TASK_TYPES.map((taskType) => {
    if (!taskType.role) return { taskType, match: null, near: null };
    const match = roles.includes(taskType.role);
    return { taskType, match, near: match ? null : nearMissRole(taskType.role, roles) };
  });

  return (
    <div>
      <Crumbs items={[{ label: 'Settings' }, { label: 'API Keys', to: '/admin/api-keys' }, { label: 'Role check' }]} />
      <PageHead
        title="Role check"
        subtitle="Each Task type suggests a role. If your organization has a role with exactly that name, that role gets the Task. If not, everyone at the location sees it."
        actions={
          <>
            <Button onClick={() => navigate('/admin/roles')}>Manage roles</Button>
            <Button disabled title="Coming soon">Map roles</Button>
          </>
        }
      />

      <div className="flex flex-col gap-3.5">
        <SupportBanner viewAs={state.viewAs} orgName={ORG.name} />
        {roles.length === 0 && (
          <Banner tone="warn" icon={<TriangleAlert size={17} strokeWidth={1.8} color={C.warnText} />}>
            Your organization has no roles set up, so everyone at the location will see each Task.
          </Banner>
        )}

        <TableCard>
          <table className="w-full text-sm">
            <thead style={{ borderBottom: `1px solid ${C.border}` }}>
              <tr>
                <Th width="26%">Task type</Th>
                <Th width="18%">Suggested role</Th>
                <Th width="32%">Match in your organization</Th>
                <Th>Who will see the Task</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ taskType, match, near }) => (
                <tr key={taskType.key} style={{ borderTop: `1px solid ${C.border}` }}>
                  <td className="px-3.5 py-2.5">
                    <span className="block font-semibold" style={{ color: C.text }}>{taskType.label}</span>
                    <span className="mt-0.5 block"><Code>{taskType.key}</Code></span>
                  </td>
                  <td className="px-3.5 py-2.5" style={{ color: taskType.role ? C.text2 : C.text3 }}>{taskType.role ?? 'None'}</td>
                  <td className="px-3.5 py-2.5">
                    {match === null ? (
                      <span style={{ color: C.text3 }}>No role suggested</span>
                    ) : match ? (
                      <Pill tone="active"><Check size={12} strokeWidth={2.2} />Exact match</Pill>
                    ) : (
                      <>
                        <Pill tone="revoked">No match</Pill>
                        {near && (
                          <span className="mt-1.5 flex items-start gap-1 text-xs" style={{ color: C.warnText }}>
                            <TriangleAlert size={13} strokeWidth={1.8} className="mt-0.5 flex-shrink-0" />
                            Close to &quot;{near}&quot;, but names must match exactly.
                          </span>
                        )}
                      </>
                    )}
                  </td>
                  <td className="px-3.5 py-2.5" style={{ color: C.text2 }}>
                    {match ? <><b style={{ color: C.text }}>{taskType.role}</b> at the location</> : 'Everyone at the location'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableCard>

        <p className="flex items-start gap-1.5 text-xs" style={{ color: C.text2 }}>
          <Info size={13} strokeWidth={1.8} className="mt-0.5 flex-shrink-0" />
          Senders can also include their own role name. The same exact-match rule applies.
        </p>
      </div>
      <ToastHost />
    </div>
  );
}
