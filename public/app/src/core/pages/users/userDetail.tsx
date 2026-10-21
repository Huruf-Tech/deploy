import React, { useMemo, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { 
  IconArrowLeft, 
  IconMail, 
  IconPhone, 
  IconShieldCheck, 
  IconMailCheck, 
  IconCalendar, 
  IconClock,
  IconBuilding
} from '@tabler/icons-react';
import { ThunderSDK } from 'thunder-sdk';

import { use } from '@/core/hooks/use';
import { cn } from '@/lib/utils';
import { formatDateForInput, getInitials, transformImage } from '@/core/lib/utils';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback, AvatarBadge } from '@/components/ui/avatar';
import { Empty, EmptyTitle, EmptyDescription, EmptyHeader } from '@/components/ui/empty';
import { UserDetailSkeleton } from './components/userDetailSkeleton';
import { Container } from '@/core/custom/Container';
import { getUsers } from '@/core/endpoints/user';


function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card rounded-3xl border border-border overflow-hidden shadow-sm">
      <div className="px-4 py-3 bg-muted/30 border-b border-border">
        <h3 className="text-sm font-medium text-foreground">{title}</h3>
      </div>
      <div className="divide-y divide-border">
        {children}
      </div>
    </div>
  );
}

function Row({ icon: Icon, label, value, valueClassName }: { icon: any; label: string; value: React.ReactNode; valueClassName?: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-2 transition-colors hover:bg-muted/10">
      <div className="flex items-center gap-3 text-muted-foreground">
        <Icon className="size-5" />
        <span className="text-sm font-medium">{label}</span>
      </div>
      <div className={cn("text-sm text-foreground", valueClassName)}>
        {value}
      </div>
    </div>
  );
}

export default function UserDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [tenants, setTenants] = useState<any[]>([]);

  const request = useMemo(() => {
    if (!id) return undefined;
    return getUsers({ 
      filters: { _id: { $in: [{ type: 'objectId', value: id }] } } 
    });
  }, [id]);

  const { data, isLoading } = use(request);
  const user = data?.results?.[0];

  useEffect(() => {
    if (!id || !user) return;
    try {
      ThunderSDK.users.getUserTenants({ params: { id } })
        .then((res: any) => setTenants(res?.results || res?.data || []))
        .catch(() => {});
    } catch {
      // getUserTenants may not be available
    }
  }, [id, user]);

  if (isLoading) {
    return <UserDetailSkeleton />;
  }

  if (!user) {
    return (
      <Container className="relative flex w-full flex-col gap-3">
        <Empty className="max-w-md">
          <EmptyHeader>
            <EmptyTitle>{t('User Not Found')}</EmptyTitle>
            <EmptyDescription>{t('The user you are looking for does not exist or has been removed.')}</EmptyDescription>
          </EmptyHeader>
          <Button variant="outline" onClick={() => navigate(-1)} className="mt-4 rounded-xl">
            {t('Go Back')}
          </Button>
        </Empty>
      </Container>
    );
  }

  return (
    <Container className="relative flex w-full flex-col gap-3">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-xl">
          <IconArrowLeft className="size-5" />
        </Button>
        <h1 className="text-xl font-semibold">{t('User Profile')}</h1>
      </div>

      {/* Hero Section */}
      <div className="bg-linear-to-br from-primary/10 via-primary/5 to-transparent rounded-3xl p-8 flex flex-col items-center text-center shadow-sm border border-border/50 relative overflow-hidden">
        <Avatar className="size-24 border-4 border-background shadow-md">
          <AvatarImage src={transformImage(user.image)} alt={user.name} />
          <AvatarFallback className="text-2xl">{getInitials(user.name)}</AvatarFallback>
          <AvatarBadge className={cn("size-5 border-2", (user as any).banned ? "bg-destructive" : "bg-green-500")} />
        </Avatar>
        
        <div className="mt-4 space-y-1">
          <h2 className="text-2xl font-bold">{user.name}</h2>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>

        <div className="flex items-center gap-2 mt-4">
          <Badge variant="secondary" className="rounded-full capitalize">
            {user.role}
          </Badge>
          {user.emailVerified && (
            <Badge variant="outline" className="rounded-full bg-green-500/10 text-green-600 border-green-500/20">
              {t('Verified')}
            </Badge>
          )}
          {(user as any).banned && (
            <Badge variant="destructive" className="rounded-full">
              {t('Banned')}
            </Badge>
          )}
        </div>


      </div>

      {/* Info Sections */}
      <div className="space-y-6">
        <Group title={t('Account Information')}>
          <Row 
            icon={IconMail} 
            label={t('Email Address')} 
            value={user.email} 
          />
          <Row 
            icon={IconPhone} 
            label={t('Phone Number')} 
            value={user.phoneNumber || <span className="text-muted-foreground italic">{t('Not provided')}</span>} 
          />
          <Row 
            icon={IconShieldCheck} 
            label={t('Role')} 
            value={
              <Badge variant="secondary" className="capitalize">
                {user.role}
              </Badge>
            } 
          />
          <Row 
            icon={IconMailCheck} 
            label={t('Email Verified')} 
            value={
              <span className={cn("font-medium", user.emailVerified ? "text-green-600" : "text-muted-foreground")}>
                {user.emailVerified ? t('Yes') : t('No')}
              </span>
            } 
          />
        </Group>

        <Group title={t('Activity')}>
          <Row 
            icon={IconCalendar} 
            label={t('Member Since')} 
            value={user.createdAt ? formatDateForInput(user.createdAt) : t('Unknown')} 
          />
          <Row 
            icon={IconClock} 
            label={t('Last Updated')} 
            value={user.updatedAt ? formatDateForInput(user.updatedAt) : t('Unknown')} 
          />
        </Group>

        {tenants.length > 0 && (
          <Group title={t('Tenants')}>
            {tenants.map(tenant => (
              <Row
                key={tenant._id}
                icon={IconBuilding}
                label={tenant.name || t('Tenant')}
                value={
                  <Badge variant="outline" className="text-xs">
                    {tenant._id}
                  </Badge>
                }
              />
            ))}
          </Group>
        )}
      </div>
    </Container>
  );
}
