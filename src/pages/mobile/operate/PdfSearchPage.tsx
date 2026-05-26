import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import styled from '@emotion/styled';
import colors from '@joltup/colors';
import { Icon } from '@/components/shared/Icon';
import {
  mdiChevronDown,
  mdiArrowLeft,
  mdiClose,
  mdiMagnify,
  mdiDotsVertical,
} from '@/icons/mdi';
import { MobileStatusBar, MobileAppHeader, MobileHomeIndicator } from '@/components/mobile-shell';
import { SHELL_HEX } from '@/theme/shellHex';

// Page-local hex values — PDF-viewer chrome and phone-frame bezel
// used only by this prototype. Cross-file shell values come from
// @/theme/shellHex via the SHELL_HEX import above.
const PAGE_HEX = {
  viewerHeaderBg: '#3D4144',
  findBarBg: '#2a2a2a',
  pdfPageBg: '#E8E8E8',
  darkBezel: '#1C1C1C',
  highlight: '#FFEB3B',
  highlightCurrent: '#FF9800',
} as const;

// ── Document content (reconstructed from prior research thread) ──────────────
const DOCUMENT = {
  title: 'Store Closing Procedures',
  sections: [
    {
      title: '1. Pre-Close Walkthrough',
      paragraphs: [
        'Begin store closing thirty minutes before posted close time. Walk every aisle to identify customers still shopping and let them know closing is approaching. Pay special attention to the freezer aisles, restrooms, and the back stockroom.',
        'Restock front-end candy and gum displays. Spot-check refrigerated cases for product temperature. Any product reading above 41°F in the freezer or 38°F in dairy must be logged before the door is locked.',
      ],
    },
    {
      title: '2. Equipment Shutdown',
      paragraphs: [
        'Power down the front-end registers in sequence: bagger lights first, then printer, then terminal. Do not unplug any register hardware. Confirm the credit card terminals show the Closed screen before walking away.',
        'Turn off all display lighting except the overnight aisle and freezer compartment lights. Set the bakery oven cool-down cycle and verify the freezer door seals on all walk-in units.',
      ],
    },
    {
      title: '3. Cash Handling & Deposit',
      paragraphs: [
        'Each cashier closes out their own drawer. Count cash in the back office under camera coverage. Match the count against the register report — any variance above $2 must be documented and signed by the closing manager.',
        'Prepare the night deposit bag. Two associates must witness the deposit being sealed. Log the deposit in the cash log, then carry the bag to the safe immediately. Do not leave the deposit bag unattended at any point.',
      ],
    },
    {
      title: '4. Security & Lockup',
      paragraphs: [
        'Walk the perimeter inside the store. Confirm the back stockroom door is locked, the freezer is sealed, and the office door is closed. Check that the camera system is recording on the security monitor.',
        'Set the alarm using the closing manager code. Exit through the front door within sixty seconds of arming. Lock the front door deadbolt and the storefront gate. Confirm the alarm icon is solid red on the keypad before leaving the lot.',
      ],
    },
  ],
};

// ── Phone frame & screen ─────────────────────────────────────────────────────
// Logical viewport: iPhone 17 (402×874). Bezel adds 8px on every side.
// Visual scale: 0.85 — keeps the layout authentic to the device while shrinking
// the on-screen footprint so the frame fits a 1440×900 browser window.
const PHONE_SCALE = 0.85;
const PHONE_W = 402;
const PHONE_H = 874;
const PHONE_OUTER_W = PHONE_W + 16;
const PHONE_OUTER_H = PHONE_H + 16;

const PhoneFrameLayout = styled.div({
  label: 'phone-frame-layout',
  position: 'relative',
  width: `${PHONE_OUTER_W * PHONE_SCALE}px`,
  height: `${PHONE_OUTER_H * PHONE_SCALE}px`,
});

const PhoneFrame = styled.div({
  label: 'phone-frame',
  position: 'absolute',
  top: 0,
  left: 0,
  width: `${PHONE_W}px`,
  height: `${PHONE_H}px`,
  borderRadius: '55px',
  border: `8px solid ${PAGE_HEX.darkBezel}`,
  backgroundColor: PAGE_HEX.darkBezel,
  boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
  overflow: 'hidden',
  fontFamily: '"Open Sans", sans-serif',
  transform: `scale(${PHONE_SCALE})`,
  transformOrigin: 'top left',
});

const PhoneScreen = styled.div({
  label: 'phone-screen',
  position: 'relative',
  width: '100%',
  height: '100%',
  borderRadius: '47px',
  overflow: 'hidden',
  backgroundColor: colors.white.white,
  display: 'flex',
  flexDirection: 'column',
});

// ── List header (blue bar) ──────────────────────────────────────────────────
const ListHeaderBar = styled.div({
  label: 'list-header',
  height: '52px',
  backgroundColor: SHELL_HEX.listHeaderBlue,
  color: colors.white.white,
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '0 8px',
  flexShrink: 0,
});
const ListHeaderIconBtn = styled.button({
  label: 'list-header-icon-btn',
  width: '36px',
  height: '36px',
  borderRadius: '8px',
  border: 'none',
  background: 'transparent',
  color: colors.white.white,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  '&:hover': { backgroundColor: SHELL_HEX.translucentWhiteHover },
});
const ListHeaderTitle = styled.span({
  label: 'list-header-title',
  flex: 1,
  fontSize: '17px',
  fontWeight: 600,
});

function ListHeader() {
  return (
    <ListHeaderBar>
      <ListHeaderIconBtn aria-label="Back">
        <Icon path={mdiArrowLeft} size={22} />
      </ListHeaderIconBtn>
      <ListHeaderTitle>Info Library List</ListHeaderTitle>
      <ListHeaderIconBtn aria-label="More">
        <Icon path={mdiDotsVertical} size={22} />
      </ListHeaderIconBtn>
    </ListHeaderBar>
  );
}

// ── Meta bar ────────────────────────────────────────────────────────────────
const MetaRow = styled.div({
  label: 'meta-bar',
  display: 'flex',
  justifyContent: 'space-between',
  gap: '8px',
  padding: '10px 16px',
  borderBottom: `1px solid ${colors.grey[200]}`,
  backgroundColor: colors.grey[50],
  flexShrink: 0,
});
const MetaCell = styled.div({
  label: 'meta-cell',
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
  flex: 1,
});
const MetaLabel = styled.span({
  label: 'meta-label',
  fontSize: '10px',
  fontWeight: 700,
  color: '#6B7280',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
});
const MetaValue = styled.span({
  label: 'meta-value',
  fontSize: '12px',
  color: '#181D1F',
  fontWeight: 500,
});

function MetaBar() {
  return (
    <MetaRow>
      <MetaCell>
        <MetaLabel>Displayed</MetaLabel>
        <MetaValue>Today, 8:00 AM</MetaValue>
      </MetaCell>
      <MetaCell>
        <MetaLabel>Due by</MetaLabel>
        <MetaValue>Today, 10:00 PM</MetaValue>
      </MetaCell>
      <MetaCell>
        <MetaLabel>Expires</MetaLabel>
        <MetaValue>Tomorrow, 6:00 AM</MetaValue>
      </MetaCell>
    </MetaRow>
  );
}

// ── List content ────────────────────────────────────────────────────────────
const ListArea = styled.div({
  label: 'list-area',
  flex: 1,
  overflowY: 'auto',
  backgroundColor: colors.grey[50],
  padding: '12px',
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
});
const ListCard = styled.div({
  label: 'list-card',
  backgroundColor: colors.white.white,
  border: `1px solid ${colors.grey[200]}`,
  borderRadius: '8px',
  padding: '14px',
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
});
const ListCardTop = styled.div({
  label: 'list-card-top',
  display: 'flex',
  alignItems: 'flex-start',
  gap: '10px',
});
const QuestionText = styled.p({
  label: 'question-text',
  margin: 0,
  flex: 1,
  fontSize: '14px',
  lineHeight: '20px',
  color: '#181D1F',
});

const InfoBtn = styled.button({
  label: 'info-btn',
  width: '52px',
  height: '40px',
  borderRadius: '4px',
  border: 'none',
  backgroundColor: SHELL_HEX.listHeaderBlue,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  padding: 0,
});

const InfoBtnDot = styled.span({
  label: 'info-btn-dot',
  width: '20px',
  height: '20px',
  borderRadius: '50%',
  backgroundColor: colors.white.white,
  color: SHELL_HEX.listHeaderBlue,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '14px',
  fontWeight: 700,
  lineHeight: 1,
});

const ActionsRow = styled.div({
  label: 'actions-row',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
});
const YesNoToggle = styled.div({
  label: 'yes-no-toggle',
  flex: 1,
  display: 'flex',
  height: '40px',
  border: `1.5px solid ${SHELL_HEX.listHeaderBlue}`,
  borderRadius: '6px',
  overflow: 'hidden',
});

const YesNoOption = styled.button<{ isSelected: boolean; isRight?: boolean }>(
  ({ isSelected, isRight }) => ({
    label: 'yes-no-option',
    flex: 1,
    height: '100%',
    border: 'none',
    borderLeft: isRight ? `1.5px solid ${SHELL_HEX.listHeaderBlue}` : 'none',
    backgroundColor: isSelected ? SHELL_HEX.listHeaderBlue : 'transparent',
    color: isSelected ? colors.white.white : SHELL_HEX.listHeaderBlue,
    fontSize: '13px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    cursor: 'pointer',
    padding: 0,
  }),
);

const CompletionBanner = styled.div({
  label: 'completion-banner',
  width: '100%',
  backgroundColor: colors.blue[800],
  color: colors.white.white,
  fontSize: '12px',
  padding: '6px 10px',
  borderRadius: '4px',
});
const StatusChip = styled.span({
  label: 'status-chip',
  fontSize: '11px',
  fontWeight: 600,
  color: '#6B7280',
  backgroundColor: colors.grey[100],
  border: `1px solid ${colors.grey[300]}`,
  borderRadius: '12px',
  padding: '3px 10px',
  whiteSpace: 'nowrap',
});

const QUESTIONS = [
  'Have you completed the pre-close walkthrough and confirmed freezer/dairy temps are logged?',
  'Has the night deposit bag been sealed under camera coverage and logged before leaving the back office?',
];

function ListContent({ onOpenPdf }: { onOpenPdf: () => void }) {
  const [answers, setAnswers] = useState<Array<'yes' | 'no' | null>>(
    Array(QUESTIONS.length).fill(null),
  );
  const setAnswer = (i: number, ans: 'yes' | 'no') => {
    setAnswers(prev => prev.map((a, idx) => (idx === i ? ans : a)));
  };

  return (
    <ListArea>
      {QUESTIONS.map((q, i) => (
        <ListCard key={i}>
          <ListCardTop>
            <InfoBtn aria-label="Open reference" onClick={onOpenPdf}>
              <InfoBtnDot>i</InfoBtnDot>
            </InfoBtn>
            <QuestionText>{q}</QuestionText>
          </ListCardTop>
          <ActionsRow>
            <YesNoToggle>
              <YesNoOption isSelected={answers[i] === 'yes'} onClick={() => setAnswer(i, 'yes')}>
                Yes
              </YesNoOption>
              <YesNoOption isSelected={answers[i] === 'no'} isRight onClick={() => setAnswer(i, 'no')}>
                No
              </YesNoOption>
            </YesNoToggle>
            <StatusChip>Incomplete</StatusChip>
          </ActionsRow>
          {answers[i] === 'yes' && (
            <CompletionBanner>Jim Jensen - May 24, 2026 3:07 PM</CompletionBanner>
          )}
        </ListCard>
      ))}
    </ListArea>
  );
}

// ── Submit bar ──────────────────────────────────────────────────────────────
const SubmitRow = styled.div({
  label: 'submit-bar',
  padding: '10px 16px',
  borderTop: `1px solid ${colors.grey[200]}`,
  backgroundColor: colors.white.white,
  flexShrink: 0,
});
const SubmitBtn = styled.button({
  label: 'submit-btn',
  width: '100%',
  height: '48px',
  borderRadius: '28px',
  border: 'none',
  backgroundColor: colors.green[400],
  color: colors.white.white,
  fontSize: '14px',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  cursor: 'pointer',
});

function SubmitBar() {
  return (
    <SubmitRow>
      <SubmitBtn>Submit Items</SubmitBtn>
    </SubmitRow>
  );
}

// ── PDF viewer overlay ──────────────────────────────────────────────────────
const Overlay = styled.div<{ open: boolean }>(({ open }) => ({
  label: 'pdf-viewer-overlay',
  position: 'absolute',
  top: '44px', left: 0, right: 0, bottom: 0,
  backgroundColor: colors.white.white,
  display: 'flex',
  flexDirection: 'column',
  transform: open ? 'translateY(0)' : 'translateY(100%)',
  transition: 'transform 0.28s cubic-bezier(0.4,0,0.2,1)',
  zIndex: 10,
}));
const ViewerHeaderBar = styled.div({
  label: 'viewer-header',
  height: '52px',
  backgroundColor: PAGE_HEX.viewerHeaderBg,
  color: colors.white.white,
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '0 8px',
  flexShrink: 0,
});
const ViewerIconBtn = styled.button({
  label: 'viewer-icon-btn',
  width: '36px',
  height: '36px',
  borderRadius: '8px',
  border: 'none',
  background: 'transparent',
  color: colors.white.white,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  '&:hover': { backgroundColor: SHELL_HEX.translucentWhiteHover },
});
const ViewerTitle = styled.span({
  label: 'viewer-title',
  flex: 1,
  fontSize: '15px',
  fontWeight: 500,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});
const SearchInput = styled.input({
  label: 'viewer-search-input',
  flex: 1,
  height: '34px',
  border: 'none',
  outline: 'none',
  background: SHELL_HEX.translucentWhiteHover,
  color: colors.white.white,
  borderRadius: '8px',
  padding: '0 12px',
  fontSize: '14px',
  fontFamily: '"Open Sans", sans-serif',
  '&::placeholder': { color: 'rgba(255,255,255,0.6)' },
});

const PdfContent = styled.div({
  label: 'pdf-content',
  flex: 1,
  overflowY: 'auto',
  backgroundColor: PAGE_HEX.pdfPageBg,
  padding: '16px',
});
const PdfPage = styled.div({
  label: 'pdf-page',
  backgroundColor: colors.white.white,
  border: `1px solid ${colors.grey[300]}`,
  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  padding: '24px 20px',
  borderRadius: '2px',
});
const DocTitle = styled.h1({
  label: 'doc-title',
  margin: '0 0 16px',
  fontSize: '20px',
  fontWeight: 700,
  color: '#181D1F',
});
const SectionBlock = styled.section({
  label: 'pdf-section',
  marginBottom: '20px',
});
const SectionTitle = styled.h2({
  label: 'section-title',
  margin: '0 0 8px',
  fontSize: '15px',
  fontWeight: 700,
  color: '#181D1F',
});
const Paragraph = styled.p({
  label: 'pdf-paragraph',
  margin: '0 0 8px',
  fontSize: '14px',
  lineHeight: '22px',
  color: '#555555',
});
const Highlight = styled.span<{ isCurrent: boolean }>(({ isCurrent }) => ({
  label: 'pdf-highlight',
  backgroundColor: isCurrent ? PAGE_HEX.highlightCurrent : PAGE_HEX.highlight,
  color: isCurrent ? colors.white.white : '#181D1F',
  borderRadius: '2px',
  padding: '0 1px',
  scrollMarginTop: '60px',
  scrollMarginBottom: '80px',
}));

const FindBar = styled.div({
  label: 'find-bar',
  position: 'absolute',
  bottom: '50px',
  left: '50%',
  transform: 'translateX(-50%)',
  backgroundColor: PAGE_HEX.findBarBg,
  color: colors.white.white,
  borderRadius: '12px',
  padding: '8px 16px',
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  boxShadow: '0 6px 20px rgba(0,0,0,0.35)',
  zIndex: 20,
});
const FindBarLabel = styled.span({
  label: 'find-bar-label',
  fontSize: '12px',
  fontWeight: 700,
  letterSpacing: '0.06em',
});
const FindBarCount = styled.span({
  label: 'find-bar-count',
  fontSize: '13px',
  fontVariantNumeric: 'tabular-nums',
});
const FindBarDivider = styled.span({
  label: 'find-bar-divider',
  width: '1px',
  height: '16px',
  backgroundColor: 'rgba(255,255,255,0.25)',
});
const FindBarIconBtn = styled.button({
  label: 'find-bar-icon-btn',
  width: '28px',
  height: '28px',
  borderRadius: '6px',
  border: 'none',
  background: 'transparent',
  color: colors.white.white,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  '&:hover': { backgroundColor: SHELL_HEX.translucentWhiteHover },
});

function PdfViewerOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [query, setQuery] = useState('');
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Debounce input → query
  useEffect(() => {
    const id = setTimeout(() => setQuery(inputValue.trim()), 280);
    return () => clearTimeout(id);
  }, [inputValue]);

  // Reset state when overlay closes
  useEffect(() => {
    if (!open) {
      setIsSearchMode(false);
      setInputValue('');
      setQuery('');
      setCurrentMatchIndex(0);
    }
  }, [open]);

  // Auto-focus on entering search mode
  useEffect(() => {
    if (isSearchMode) inputRef.current?.focus();
  }, [isSearchMode]);

  // Reset current match when query changes
  useEffect(() => {
    setCurrentMatchIndex(0);
  }, [query]);

  const { rendered, matchCount } = useMemo(() => {
    let counter = 0;
    const renderText = (text: string): React.ReactNode => {
      if (!query) return text;
      const lower = text.toLowerCase();
      const q = query.toLowerCase();
      const parts: React.ReactNode[] = [];
      let idx = 0;
      while (idx <= text.length) {
        const hit = lower.indexOf(q, idx);
        if (hit === -1) {
          if (idx < text.length) parts.push(text.slice(idx));
          break;
        }
        if (hit > idx) parts.push(text.slice(idx, hit));
        const myIndex = counter++;
        parts.push(
          <Highlight key={`m-${myIndex}`} data-match-index={myIndex} isCurrent={myIndex === currentMatchIndex}>
            {text.slice(hit, hit + q.length)}
          </Highlight>,
        );
        idx = hit + q.length;
      }
      return <>{parts}</>;
    };

    const tree = (
      <>
        <DocTitle>{renderText(DOCUMENT.title)}</DocTitle>
        {DOCUMENT.sections.map((s, si) => (
          <SectionBlock key={si}>
            <SectionTitle>{renderText(s.title)}</SectionTitle>
            {s.paragraphs.map((p, pi) => (
              <Paragraph key={pi}>{renderText(p)}</Paragraph>
            ))}
          </SectionBlock>
        ))}
      </>
    );
    return { rendered: tree, matchCount: counter };
  }, [query, currentMatchIndex]);

  // Scroll current match into view
  useEffect(() => {
    if (!query || matchCount === 0) return;
    const el = contentRef.current?.querySelector(`[data-match-index="${currentMatchIndex}"]`);
    if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [currentMatchIndex, query, matchCount]);

  const goPrev = useCallback(() => {
    if (matchCount === 0) return;
    setCurrentMatchIndex(i => (i - 1 + matchCount) % matchCount);
  }, [matchCount]);
  const goNext = useCallback(() => {
    if (matchCount === 0) return;
    setCurrentMatchIndex(i => (i + 1) % matchCount);
  }, [matchCount]);
  const enterSearch = () => setIsSearchMode(true);
  const exitSearch  = () => { setIsSearchMode(false); setInputValue(''); setQuery(''); };
  const clearInput  = () => { setInputValue(''); setQuery(''); inputRef.current?.focus(); };
  const dismissFind = () => { setQuery(''); setInputValue(''); setIsSearchMode(false); };

  return (
    <Overlay open={open}>
      <ViewerHeaderBar>
        {isSearchMode ? (
          <>
            <ViewerIconBtn aria-label="Cancel search" onClick={exitSearch}>
              <Icon path={mdiArrowLeft} size={20} />
            </ViewerIconBtn>
            <SearchInput
              ref={inputRef}
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              placeholder="Search..."
              aria-label="Search PDF"
            />
            <ViewerIconBtn aria-label="Clear" onClick={clearInput}>
              <Icon path={mdiClose} size={18} />
            </ViewerIconBtn>
          </>
        ) : (
          <>
            <ViewerIconBtn aria-label="Close PDF" onClick={onClose}>
              <Icon path={mdiClose} size={20} />
            </ViewerIconBtn>
            <ViewerTitle>{DOCUMENT.title}</ViewerTitle>
            <ViewerIconBtn aria-label="Search PDF" onClick={enterSearch}>
              <Icon path={mdiMagnify} size={20} />
            </ViewerIconBtn>
          </>
        )}
      </ViewerHeaderBar>

      <PdfContent ref={contentRef}>
        <PdfPage>{rendered}</PdfPage>
      </PdfContent>

      {matchCount > 0 && (
        <FindBar role="status" aria-live="polite">
          <FindBarLabel>PDF</FindBarLabel>
          <FindBarCount>{currentMatchIndex + 1}/{matchCount}</FindBarCount>
          <FindBarDivider />
          <FindBarIconBtn aria-label="Previous match" onClick={goPrev}>
            <span style={{ display: 'inline-flex', transform: 'rotate(180deg)' }}>
              <Icon path={mdiChevronDown} size={18} />
            </span>
          </FindBarIconBtn>
          <FindBarIconBtn aria-label="Next match" onClick={goNext}>
            <Icon path={mdiChevronDown} size={18} />
          </FindBarIconBtn>
          <FindBarDivider />
          <FindBarIconBtn aria-label="Dismiss find bar" onClick={dismissFind}>
            <Icon path={mdiClose} size={16} />
          </FindBarIconBtn>
        </FindBar>
      )}
    </Overlay>
  );
}

// ── Page export ─────────────────────────────────────────────────────────────
export default function PdfSearchPage() {
  const [viewerOpen, setViewerOpen] = useState(false);

  return (
    <PhoneFrameLayout>
      <PhoneFrame>
        <PhoneScreen>
          <MobileStatusBar />
          <MobileAppHeader />
          <ListHeader />
          <MetaBar />
          <ListContent onOpenPdf={() => setViewerOpen(true)} />
          <SubmitBar />
          <MobileHomeIndicator />
          <PdfViewerOverlay open={viewerOpen} onClose={() => setViewerOpen(false)} />
        </PhoneScreen>
      </PhoneFrame>
    </PhoneFrameLayout>
  );
}
