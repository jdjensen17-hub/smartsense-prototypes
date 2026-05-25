import styled from '@emotion/styled';
import colors from '@joltup/colors';
import { Icon } from '@/components/shared/Icon';
import { mdiMenuChunky, mdiChevronDown } from '@/icons/mdi';
import { SHELL_HEX } from '@/theme/shellHex';

// ── Status bar SVGs ──────────────────────────────────────────────────────────
function SignalIcon() {
  return (
    <svg width={17} height={11} viewBox="0 0 17 11" fill={colors.grey[900]}>
      <rect x={0}  y={7} width={3} height={4} rx={0.5} />
      <rect x={4}  y={5} width={3} height={6} rx={0.5} />
      <rect x={8}  y={3} width={3} height={8} rx={0.5} />
      <rect x={12} y={0} width={3} height={11} rx={0.5} />
    </svg>
  );
}
function WifiIcon() {
  return (
    <svg width={15} height={11} viewBox="0 0 15 11" fill={colors.grey[900]}>
      <path d="M7.5 11 L9.5 8.5 A2.5 2.5 0 0 0 5.5 8.5 Z" />
      <path d="M7.5 4 a6 6 0 0 1 4.24 1.76 l1.06 -1.06 a7.5 7.5 0 0 0 -10.6 0 l1.06 1.06 A6 6 0 0 1 7.5 4 z" />
      <path d="M7.5 0 a10.5 10.5 0 0 1 7.42 3.08 l-1.06 1.06 a9 9 0 0 0 -12.72 0 l-1.06 -1.06 A10.5 10.5 0 0 1 7.5 0 z" />
    </svg>
  );
}
function BatteryIcon() {
  return (
    <svg width={27} height={12} viewBox="0 0 27 12" fill="none">
      <rect x={0.5} y={0.5} width={22} height={11} rx={2.5} stroke={colors.grey[900]} opacity={0.5} />
      <rect x={24}  y={4}   width={2}  height={4}  rx={0.5} fill={colors.grey[900]} opacity={0.5} />
      <rect x={2}   y={2}   width={19} height={8}  rx={1.5} fill={colors.grey[900]} />
    </svg>
  );
}

// ── Mobile status bar (iOS-style) ────────────────────────────────────────────
const StatusBarRow = styled.div({
  label: 'mobile-status-bar',
  position: 'relative',
  height: '44px',
  backgroundColor: colors.white.white,
  color: colors.grey[900],
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0 24px 0 32px',
  flexShrink: 0,
});
const StatusBarTime = styled.span({
  label: 'mobile-status-bar-time',
  fontSize: '15px',
  fontWeight: 600,
  letterSpacing: '-0.2px',
});
const StatusBarIcons = styled.div({
  label: 'mobile-status-bar-icons',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
});

const DynamicIsland = styled.div({
  label: 'dynamic-island',
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '105px',
  height: '30px',
  borderRadius: '16px',
  backgroundColor: colors.grey[900],
  zIndex: 1,
});

export function MobileStatusBar() {
  return (
    <StatusBarRow>
      <StatusBarTime>9:41</StatusBarTime>
      <DynamicIsland />
      <StatusBarIcons>
        <SignalIcon />
        <WifiIcon />
        <BatteryIcon />
      </StatusBarIcons>
    </StatusBarRow>
  );
}

// ── App header (SmartSense ONE chrome) ──────────────────────────────────────
const AppHeaderBar = styled.div({
  label: 'app-header',
  height: '50px',
  backgroundColor: colors.white.white,
  borderBottom: `1px solid ${colors.grey[300]}`,
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '0 12px',
  flexShrink: 0,
});
const ChromeIconBtn = styled.button({
  label: 'app-header-icon-btn',
  width: '36px',
  height: '36px',
  borderRadius: '8px',
  border: 'none',
  background: 'transparent',
  color: '#35353B',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
});
const LocationBlock = styled.div({
  label: 'app-header-location',
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
  minWidth: 0,
  paddingLeft: '29px',
});
const LocationRow = styled.div({
  label: 'app-header-location-row',
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  color: '#35353B',
  fontSize: '13px',
  fontWeight: 400,
});
const LocationName = styled.span({
  label: 'app-header-location-name',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});
const SyncStatus = styled.span({
  label: 'app-header-sync',
  fontSize: '13px',
  color: '#35353B',
  fontWeight: 400,
});
const LogoutAvatarOval = styled.div({
  label: 'logout-avatar-oval',
  minHeight: '40px',
  borderRadius: '100px',
  border: `1px solid ${colors.grey[200]}`,
  backgroundColor: colors.white.white,
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexShrink: 0,
});
const LogoutInfo = styled.div({
  label: 'logout-info',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  marginLeft: '16px',
  marginRight: '16px',
});
const LogoutText = styled.span({
  label: 'logout-text',
  fontSize: '14px',
  fontWeight: 600,
  letterSpacing: '0.1px',
  lineHeight: '20px',
  // UA blue500 — see src/theme/shellHex.ts
  color: SHELL_HEX.listHeaderBlue,
});
const TimerText = styled.span({
  label: 'timer-text',
  fontSize: '14px',
  fontWeight: 600,
  letterSpacing: '0.1px',
  lineHeight: '20px',
  color: '#9BA0B0',
});
const AvatarFlush = styled.div({
  label: 'avatar-flush',
  width: '40px',
  height: '40px',
  borderRadius: '20px',
  backgroundColor: colors.grey[400],
  color: colors.white.white,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
  fontSize: '14px',
  fontWeight: 600,
  flexShrink: 0,
});

interface MobileAppHeaderProps {
  locationName?: string;
  syncStatus?: string;
  logoutTimer?: string;
  avatarInitials?: string;
}

export function MobileAppHeader({
  locationName = 'Discovery Lab 1',
  syncStatus = 'Synced 2 min ago',
  logoutTimer = '29:54',
  avatarInitials = 'JJ',
}: MobileAppHeaderProps) {
  return (
    <AppHeaderBar>
      <ChromeIconBtn aria-label="Menu">
        <Icon path={mdiMenuChunky} size={28} />
      </ChromeIconBtn>
      <LocationBlock>
        <LocationRow>
          <LocationName>{locationName}</LocationName>
          <Icon path={mdiChevronDown} size={14} color="#35353B" />
        </LocationRow>
        <SyncStatus>{syncStatus}</SyncStatus>
      </LocationBlock>
      <LogoutAvatarOval>
        <LogoutInfo>
          <LogoutText>Log out</LogoutText>
          <TimerText>{logoutTimer}</TimerText>
        </LogoutInfo>
        <AvatarFlush>{avatarInitials}</AvatarFlush>
      </LogoutAvatarOval>
    </AppHeaderBar>
  );
}

// ── Home indicator ───────────────────────────────────────────────────────────
const HomeIndicatorBox = styled.div<{ bg: string }>(({ bg }) => ({
  label: 'home-indicator',
  height: '34px',
  backgroundColor: bg,
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'center',
  paddingBottom: '8px',
  flexShrink: 0,
  '&::after': {
    content: '""',
    width: '134px',
    height: '5px',
    borderRadius: '3px',
    backgroundColor: '#181D1F',
  },
}));

export function MobileHomeIndicator({ background = colors.white.white }: { background?: string }) {
  return <HomeIndicatorBox bg={background} />;
}
