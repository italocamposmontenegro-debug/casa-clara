// Casa Clara — Settings Page
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useHousehold } from '../../hooks/useHousehold';
import { useSubscription } from '../../hooks/useSubscription';
import { Card, Button, InputField, SelectField, AlertBanner, Modal, ConfirmDialog, UpgradePromptCard } from '../../components/ui';
import { supabase } from '../../lib/supabase';
import { MAX_HOUSEHOLD_MEMBERS, SPLIT_RULE_LABELS, type SplitRuleType } from '../../lib/constants';
import { Users, Home, Link as LinkIcon, PencilLine, UserMinus } from 'lucide-react';
import { validateEmail, validateHouseholdName, validateRequired } from '../../utils/validators';
import type { HouseholdMember } from '../../types/database';

interface PendingInvitationState {
  id: string;
  invited_email: string;
  expires_at: string;
  invitation_url: string;
}

export function SettingsPage() {
  const { profile } = useAuth();
  const { household, members, currentMember, refetch } = useHousehold();
  const { canWrite, hasFeature, getUpgradeCopy } = useSubscription();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState<'success' | 'danger'>('success');
  const [householdName, setHouseholdName] = useState(household?.name || '');
  const [splitRule, setSplitRule] = useState<SplitRuleType>(household?.split_rule_type ?? 'fifty_fifty');
  const [income, setIncome] = useState(String(currentMember?.monthly_income || ''));
  const [displayName, setDisplayName] = useState(currentMember?.display_name || '');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [pendingInvitation, setPendingInvitation] = useState<PendingInvitationState | null>(null);
  const [memberActionLoading, setMemberActionLoading] = useState(false);
  const [editingPartner, setEditingPartner] = useState<HouseholdMember | null>(null);
  const [editingPartnerName, setEditingPartnerName] = useState('');
  const [editingPartnerIncome, setEditingPartnerIncome] = useState('');
  const [removePartnerOpen, setRemovePartnerOpen] = useState(false);
  const isOwner = currentMember?.role === 'owner';
  const acceptedMembersCount = useMemo(
    () => members.filter((member) => member.invitation_status === 'accepted').length,
    [members],
  );
  const householdIsFull = acceptedMembersCount >= MAX_HOUSEHOLD_MEMBERS;
  const canManageSplitRule = hasFeature('split_manual');
  const splitUpgrade = getUpgradeCopy('split_manual');
  const canManageHouseholdSettings = isOwner;
  const partnerMember = useMemo(
    () => (isOwner
      ? members.find((member) => member.role === 'member' && member.invitation_status === 'accepted') ?? null
      : null),
    [isOwner, members],
  );

  async function saveSettings() {
    const displayNameCheck = validateRequired(displayName, 'Tu nombre visible');
    if (!displayNameCheck.valid) {
      setMsgType('danger');
      setMsg(displayNameCheck.error!);
      return;
    }

    if (canManageHouseholdSettings) {
      const householdCheck = validateHouseholdName(householdName);
      if (!householdCheck.valid) {
        setMsgType('danger');
        setMsg(householdCheck.error!);
        return;
      }
    }

    const parsedIncome = income.trim() === '' ? 0 : Number.parseInt(income, 10);
    if (!Number.isFinite(parsedIncome) || parsedIncome < 0) {
      setMsgType('danger');
      setMsg('Tu ingreso mensual debe ser un numero igual o mayor a 0.');
      return;
    }

    setSaving(true); setMsg('');
    try {
      const { error } = await supabase.functions.invoke('manage-household-settings', {
        body: {
          householdName: householdName.trim(),
          splitRule,
          displayName: displayName.trim(),
          monthlyIncome: parsedIncome,
        },
      });
      if (error) throw error;
      await refetch();
      setMsgType('success');
      setMsg('Cambios guardados correctamente.');
    } catch (error) {
      setMsgType('danger');
      setMsg(error instanceof Error ? error.message : 'No pudimos guardar la configuración.');
    }
    setSaving(false);
  }

  const loadInvitation = useCallback(async () => {
    if (!isOwner || !household) {
      setPendingInvitation(null);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('manage-invitation', {
        body: { action: 'get', baseUrl: window.location.origin },
      });

      if (error) throw error;
      setPendingInvitation(data?.pending_invitation ?? null);
    } catch (error) {
      setMsgType('danger');
      setMsg(error instanceof Error ? error.message : 'No pudimos cargar la invitación.');
    }
  }, [household, isOwner]);

  useEffect(() => {
    void loadInvitation();
  }, [loadInvitation]);

  async function copyInvitationLink() {
    if (!pendingInvitation?.invitation_url) return;

    try {
      await navigator.clipboard.writeText(pendingInvitation.invitation_url);
      setMsgType('success');
      setMsg('Enlace copiado. Ya puedes compartirlo con el nuevo miembro.');
    } catch {
      window.prompt('Copia este enlace para invitar al nuevo miembro:', pendingInvitation.invitation_url);
    }
  }

  async function createInvitation() {
    const emailCheck = validateEmail(inviteEmail);
    if (!emailCheck.valid) {
      setMsgType('danger');
      setMsg(emailCheck.error!);
      return;
    }

    setInviteLoading(true);
    setMsg('');

    try {
      const { data, error } = await supabase.functions.invoke('manage-invitation', {
        body: {
          action: 'create',
          invitedEmail: inviteEmail.trim().toLowerCase(),
          baseUrl: window.location.origin,
        },
      });

      if (error) throw error;
      setPendingInvitation(data.invitation);
      setInviteEmail('');
      setMsgType('success');
      setMsg('La invitación quedó lista. Ya puedes compartir el enlace manualmente.');
    } catch (error) {
      setMsgType('danger');
      setMsg(error instanceof Error ? error.message : 'No pudimos crear la invitación.');
    } finally {
      setInviteLoading(false);
    }
  }

  async function refreshInvitation() {
    if (!pendingInvitation) return;
    setInviteLoading(true);
    setMsg('');

    try {
      const { data, error } = await supabase.functions.invoke('manage-invitation', {
        body: {
          action: 'refresh',
          invitationId: pendingInvitation.id,
          baseUrl: window.location.origin,
        },
      });

      if (error) throw error;
      setPendingInvitation(data.invitation);
      setMsgType('success');
      setMsg('Generamos un enlace nuevo. Ya puedes compartirlo manualmente.');
    } catch (error) {
      setMsgType('danger');
      setMsg(error instanceof Error ? error.message : 'No pudimos renovar la invitación.');
    } finally {
      setInviteLoading(false);
    }
  }

  async function revokeInvitation() {
    if (!pendingInvitation) return;
    setInviteLoading(true);
    setMsg('');

    try {
      const { error } = await supabase.functions.invoke('manage-invitation', {
        body: {
          action: 'revoke',
          invitationId: pendingInvitation.id,
          baseUrl: window.location.origin,
        },
      });

      if (error) throw error;
      setPendingInvitation(null);
      setMsgType('success');
      setMsg('La invitación pendiente fue revocada.');
    } catch (error) {
      setMsgType('danger');
      setMsg(error instanceof Error ? error.message : 'No pudimos revocar la invitación.');
    } finally {
      setInviteLoading(false);
    }
  }

  function openPartnerEditor(member: HouseholdMember) {
    setEditingPartner(member);
    setEditingPartnerName(member.display_name);
    setEditingPartnerIncome(String(member.monthly_income || ''));
  }

  function closePartnerEditor() {
    if (memberActionLoading) return;
    setEditingPartner(null);
    setEditingPartnerName('');
    setEditingPartnerIncome('');
  }

  async function savePartnerChanges() {
    if (!editingPartner) return;

    const normalizedName = editingPartnerName.trim();
    const parsedIncome = editingPartnerIncome.trim() === '' ? 0 : Number.parseInt(editingPartnerIncome, 10);

    if (!normalizedName) {
      setMsgType('danger');
      setMsg('El nombre visible del miembro es obligatorio.');
      return;
    }

    if (!Number.isFinite(parsedIncome) || parsedIncome < 0) {
      setMsgType('danger');
      setMsg('El ingreso mensual debe ser un numero igual o mayor a 0.');
      return;
    }

    setMemberActionLoading(true);
    setMsg('');

    try {
      const { error } = await supabase.functions.invoke('manage-household-member', {
        body: {
          action: 'update',
          memberId: editingPartner.id,
          displayName: normalizedName,
          monthlyIncome: parsedIncome,
        },
      });

      if (error) throw error;
      await refetch();
      closePartnerEditor();
      setMsgType('success');
      setMsg('Actualizamos los datos del miembro.');
    } catch (error) {
      setMsgType('danger');
      setMsg(error instanceof Error ? error.message : 'No pudimos actualizar los datos del miembro.');
    } finally {
      setMemberActionLoading(false);
    }
  }

  async function removePartnerFromHousehold() {
    if (!partnerMember) return;

    setMemberActionLoading(true);
    setMsg('');

    try {
      const { error } = await supabase.functions.invoke('manage-household-member', {
        body: {
          action: 'remove',
          memberId: partnerMember.id,
        },
      });

      if (error) throw error;
      await refetch();
      await loadInvitation();
      closePartnerEditor();
      setRemovePartnerOpen(false);
      setMsgType('success');
      setMsg('El miembro salió del hogar. Sus movimientos históricos siguen guardados.');
    } catch (error) {
      setMsgType('danger');
      setMsg(error instanceof Error ? error.message : 'No pudimos quitar a este miembro del hogar.');
    } finally {
      setMemberActionLoading(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-text mb-6">Configuración</h1>

      <div className="space-y-6 max-w-2xl">
        {msg && <AlertBanner type={msgType} message={msg} onClose={() => setMsg('')} />}

        <Card>
          <div className="flex items-center gap-2 mb-4"><Home className="h-5 w-5 text-primary" /><h3 className="font-semibold text-text">Hogar</h3></div>
          <div className="space-y-4">
            <InputField label="Nombre del hogar" value={householdName} onChange={e => setHouseholdName(e.target.value)} disabled={!canManageHouseholdSettings} />
            {canManageSplitRule ? (
              <SelectField
                label="Regla de reparto"
                value={splitRule}
                onChange={(value) => setSplitRule(value as SplitRuleType)}
                options={Object.entries(SPLIT_RULE_LABELS).map(([value, label]) => ({
                  value,
                  label,
                }))} />
            ) : (
              <>
                <InputField label="Regla de reparto" value={SPLIT_RULE_LABELS.fifty_fifty} onChange={() => {}} readOnly />
                <UpgradePromptCard
                  badge={splitUpgrade.badge}
                  title={splitUpgrade.title}
                  description={splitUpgrade.description}
                  highlights={splitUpgrade.highlights}
                  actionLabel={splitUpgrade.actionLabel || 'Ver planes'}
                  onAction={() => navigate(splitUpgrade.route)}
                  compact
                />
              </>
            )}
            {!canManageHouseholdSettings && (
              <AlertBanner
                type="info"
                message="Solo el owner puede cambiar el nombre del hogar y la regla de reparto."
              />
            )}
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-4"><Users className="h-5 w-5 text-primary" /><h3 className="font-semibold text-text">Nuestro perfil</h3></div>
          <div className="space-y-4">
            <InputField label="Nombre visible" value={displayName} onChange={e => setDisplayName(e.target.value)} />
            <InputField label="Ingreso mensual (CLP)" type="number" value={income} onChange={e => setIncome(e.target.value)} />
            <InputField label="Email" value={profile?.email || ''} onChange={() => {}} disabled />
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-4"><Users className="h-5 w-5 text-primary" /><h3 className="font-semibold text-text">Miembros</h3></div>
          <ul className="space-y-2">
            {members.map(m => (
              <li key={m.id} className="flex items-center justify-between py-2 border-b border-border-light last:border-0">
                <div>
                  <p className="text-sm font-medium text-text">{m.display_name}</p>
                  <p className="text-xs text-text-muted">{m.email} · {m.role}</p>
                </div>
                {isOwner && m.role === 'member' && m.invitation_status === 'accepted' && (
                  <Button size="sm" variant="secondary" onClick={() => openPartnerEditor(m)}>
                    <PencilLine className="h-4 w-4" /> Editar
                  </Button>
                )}
              </li>
            ))}
          </ul>
          {isOwner && !partnerMember && (
            <p className="mt-4 text-xs text-text-muted">
              Una vez aceptada la invitación, podrás gestionar sus datos aquí.
            </p>
          )}
        </Card>

        {isOwner && (
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <LinkIcon className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-text">Invitar miembro nuevo</h3>
            </div>

            {pendingInvitation ? (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-text">{pendingInvitation.invited_email}</p>
                  <p className="text-xs text-text-muted">
                    Invitación pendiente hasta {new Date(pendingInvitation.expires_at).toLocaleDateString('es-CL')}. Comparte este enlace por el medio que prefieras.
                  </p>
                </div>
                <InputField label="Enlace de invitación" value={pendingInvitation.invitation_url} onChange={() => {}} readOnly />
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button onClick={copyInvitationLink}>
                    <LinkIcon className="h-4 w-4" /> Copiar enlace
                  </Button>
                  <Button variant="secondary" onClick={refreshInvitation} loading={inviteLoading}>
                    Renovar enlace
                  </Button>
                  <Button variant="ghost" onClick={revokeInvitation} loading={inviteLoading}>
                    Revocar
                  </Button>
                </div>
              </div>
            ) : householdIsFull ? (
              <p className="text-sm text-text-muted">
                Tu hogar ya tiene los {MAX_HOUSEHOLD_MEMBERS} miembros permitidos. Si más adelante quieres hacer un cambio, puedes gestionarlo desde la sección de miembros.
              </p>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-text-muted">
                  Genera un enlace para sumar a otra persona al hogar.
                </p>
                <InputField
                  label="Email"
                  type="email"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  placeholder="ej@email.com"
                />
                <Button onClick={createInvitation} loading={inviteLoading}>
                  Invitar
                </Button>
              </div>
            )}
          </Card>
        )}

        {canWrite && <Button onClick={saveSettings} loading={saving}>Guardar cambios</Button>}
      </div>

      <Modal open={!!editingPartner} onClose={closePartnerEditor} title="Editar miembro" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-text-muted">
            Ajusta el nombre visible o el ingreso mensual para mantener el reparto y los reportes al día.
          </p>
          <p className="text-xs text-text-muted">
            Si más adelante necesitas hacer un cambio en quién participa del hogar, también puedes resolverlo desde esta misma ventana.
          </p>
          <InputField
            label="Nombre visible"
            value={editingPartnerName}
            onChange={e => setEditingPartnerName(e.target.value)}
          />
          <InputField
            label="Ingreso mensual (CLP)"
            type="number"
            min="0"
            value={editingPartnerIncome}
            onChange={e => setEditingPartnerIncome(e.target.value)}
          />
          <div className="rounded-[1.2rem] border border-border bg-bg/70 px-4 py-4">
            <p className="text-sm font-medium text-text">Acceso al hogar</p>
            <p className="mt-1 text-xs leading-5 text-text-muted">
              Si esta persona ya no debe seguir usando el hogar, puedes quitar su acceso desde aquí. El historial compartido se mantendrá intacto.
            </p>
            <Button
              variant="ghost"
              className="mt-3 text-danger hover:bg-danger-bg"
              onClick={() => setRemovePartnerOpen(true)}
              disabled={memberActionLoading}
            >
              <UserMinus className="h-4 w-4" /> Quitar acceso
            </Button>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={closePartnerEditor}>
              Cancelar
            </Button>
            <Button onClick={savePartnerChanges} loading={memberActionLoading}>
              Guardar cambios
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={removePartnerOpen}
        onClose={() => !memberActionLoading && setRemovePartnerOpen(false)}
        onConfirm={removePartnerFromHousehold}
        title="Quitar acceso a este miembro"
        message="Esta persona dejará de ver el hogar desde su cuenta. El historial que ya existe seguirá guardado para mantener tu lectura del mes intacta."
        confirmLabel="Quitar acceso"
        loading={memberActionLoading}
      />
    </div>
  );
}
