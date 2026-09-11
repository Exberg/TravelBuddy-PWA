import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { toast } from 'sonner';
import { type EveAuthorizationData, useEveError } from '@assistant-ui/eve';
import { MarkdownTextPrimitive } from '@assistant-ui/react-markdown';
import {
  ActionBarPrimitive,
  AuiIf,
  BranchPickerPrimitive,
  ComposerPrimitive,
  ErrorPrimitive,
  makeAssistantDataUI,
  MessagePrimitive,
  ThreadPrimitive,
  type PartState,
} from '@assistant-ui/react';
import remarkGfm from 'remark-gfm';
import { ScreenHeader } from './ScreenHeader';
import { BottomSheet, type BottomSheetSnap } from './BottomSheet';
import { EveAssistantProvider } from './EveAssistantProvider';
import { ItineraryTimeline } from './ItineraryTimeline';
import { GridMatrixLoader } from './chat/GridMatrixLoader';
import { ItineraryToolCard } from './chat/ItineraryToolCard';
import {
  isPlanningToolName,
  PlanningProgressCard,
  PlanningProgressStep,
} from './chat/PlanningProgressCard';
import { ShimmerText, ThinkingIndicator } from './chat/ThinkingIndicator';
import { ReasoningTrace, ThoughtTrace } from './chat/ThoughtTrace';
import { ToolCallCard } from './chat/ToolCallCard';
import { type ScreenId } from '../types';
import { useTripStore } from '../store/tripStore';
import { formatMyr } from '../lib/itinerary';
import {
  countUserMessages,
  loadChatHistory,
  saveChatHistory,
  type LocalChat,
  type LocalChatHistory,
} from '../lib/chatHistory';

const ItineraryMap = lazy(async () => {
  const module = await import('./ItineraryMap');
  return { default: module.ItineraryMap };
});

interface ChatScreenProps {
  onNavigate: (screen: ScreenId) => void;
}

interface ChatContentProps extends ChatScreenProps {
  activeChat: LocalChat;
  chats: LocalChat[];
  onNewChat: () => void;
  onSelectChat: (chatId: string) => void;
}

const AuthorizationUI = makeAssistantDataUI<EveAuthorizationData>({
  name: 'authorization',
  render: ({ data }) => (
    <div className="rounded-2xl border border-[#9FE870]/40 bg-[#F5F4EE] p-4 text-sm">
      {data.state === 'required' ? (
        <div className="space-y-3">
          <p>
            {data.instructions ??
              `Connect ${data.displayName ?? data.name} to continue.`}
          </p>
          {data.userCode ? (
            <code className="block w-fit rounded-lg bg-white px-3 py-2 font-mono text-xs">
              {data.userCode}
            </code>
          ) : null}
          {data.url ? (
            <a
              href={data.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex rounded-full bg-[#163300] px-4 py-2 font-label text-xs font-semibold text-white"
            >
              Continue to sign in
            </a>
          ) : null}
        </div>
      ) : (
        <p>{data.outcome ?? 'Authorization completed.'}</p>
      )}
    </div>
  ),
});

const MARKDOWN_PLUGINS = [remarkGfm];

function AssistantMarkdown() {
  return (
    <MarkdownTextPrimitive
      remarkPlugins={MARKDOWN_PLUGINS}
      className="travelbuddy-markdown"
    />
  );
}

const THOUGHT_PATH = ['group-thought'] as const;
const PLANNING_PATH = ['group-planning'] as const;
type ThoughtGroupKey = (typeof THOUGHT_PATH)[number];
type PlanningGroupKey = (typeof PLANNING_PATH)[number];
type ChatGroupKey = ThoughtGroupKey | PlanningGroupKey;

/**
 * Collapses the agent's reasoning and its background tool calls into a single
 * "thought" run, the way Cursor and Claude Code fold their steps away.
 *
 * Two kinds of tool call stay outside the group because they are the traveler's
 * business rather than trace noise: the published itinerary, which is a real
 * result card, and any call parked on an approval, which blocks the run until
 * it is answered.
 */
const groupChatParts = (
  part: PartState,
): readonly ChatGroupKey[] | null => {
  if (part.type === 'reasoning') return THOUGHT_PATH;
  if (part.type !== 'tool-call') return null;
  if (isPlanningToolName(part.toolName)) return PLANNING_PATH;
  if (part.toolName === 'save_itinerary') return null;

  const { approval } = part;
  if (
    approval &&
    approval.approved === undefined &&
    approval.resolution === undefined
  ) {
    return null;
  }

  return THOUGHT_PATH;
};

function UserMessage() {
  return (
    <MessagePrimitive.Root className="tb-rise flex w-full flex-col items-end gap-1 pl-8">
      <div className="max-w-[86%] rounded-3xl rounded-br-md bg-[#163300] px-5 py-4 text-white shadow-sm">
        <div className="font-headline text-[15px] font-normal leading-relaxed">
          <MessagePrimitive.Parts />
        </div>
      </div>
    </MessagePrimitive.Root>
  );
}

function MessageBranchPicker() {
  return (
    <BranchPickerPrimitive.Root
      hideWhenSingleBranch
      className="flex items-center gap-0.5"
    >
      <BranchPickerPrimitive.Previous
        aria-label="Previous version"
        className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-[#41493A]/70 transition-colors hover:bg-[#F5F4EE] hover:text-[#163300] disabled:opacity-40"
      >
        <span className="material-symbols-outlined text-[15px]">
          chevron_left
        </span>
      </BranchPickerPrimitive.Previous>
      <span className="font-label text-[10px] font-bold tabular-nums text-[#41493A]/70">
        <BranchPickerPrimitive.Number /> / <BranchPickerPrimitive.Count />
      </span>
      <BranchPickerPrimitive.Next
        aria-label="Next version"
        className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-[#41493A]/70 transition-colors hover:bg-[#F5F4EE] hover:text-[#163300] disabled:opacity-40"
      >
        <span className="material-symbols-outlined text-[15px]">
          chevron_right
        </span>
      </BranchPickerPrimitive.Next>
    </BranchPickerPrimitive.Root>
  );
}

function AssistantMessage({ onOpenItinerary }: { onOpenItinerary: () => void }) {
  return (
    <MessagePrimitive.Root className="tb-rise flex w-full flex-col gap-2.5 pr-2">
      <div className="flex items-center gap-2 pl-1">
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#eaf9dc]">
          <span className="material-symbols-filled text-[13px] text-[#163300]">
            auto_awesome
          </span>
        </div>
        <span className="font-label text-xs font-semibold text-[#41493A]">
          TravelBuddy AI
        </span>
        <AuiIf
          condition={(state) =>
            state.message.isLast && state.thread.isRunning
          }
        >
          <ShimmerText className="font-label text-[11px] font-semibold text-[#41493A]">
            live
          </ShimmerText>
        </AuiIf>
      </div>

      <div className="space-y-3 text-[15px] leading-relaxed text-[#163300]">
        <MessagePrimitive.GroupedParts
          groupBy={groupChatParts}
          indicator="no-text"
        >
          {({ part, children }) => {
            switch (part.type) {
              case 'group-thought':
                return (
                  <ThoughtTrace
                    isRunning={
                      part.status.type === 'running' ||
                      part.status.type === 'requires-action'
                    }
                    steps={part.indices.length}
                  >
                    {children}
                  </ThoughtTrace>
                );
              case 'group-planning':
                return (
                  <PlanningProgressCard status={part.status}>
                    {children}
                  </PlanningProgressCard>
                );
              case 'indicator':
                return <ThinkingIndicator />;
              case 'text':
                return <AssistantMarkdown />;
              case 'reasoning':
                return (
                  <ReasoningTrace
                    text={part.text}
                    isStreaming={part.status.type === 'running'}
                  />
                );
              case 'tool-call':
                if (isPlanningToolName(part.toolName)) {
                  return <PlanningProgressStep {...part} />;
                }
                if (part.toolName === 'save_itinerary') {
                  return (
                    <ItineraryToolCard
                      {...part}
                      onOpenItinerary={onOpenItinerary}
                    />
                  );
                }
                // Respect a registered tool UI when one exists, otherwise fall
                // back to the generic status card.
                return part.toolUI ?? <ToolCallCard {...part} />;
              default:
                return null;
            }
          }}
        </MessagePrimitive.GroupedParts>

        <MessagePrimitive.Error>
          <ErrorPrimitive.Root className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5">
            <span className="material-symbols-outlined text-[16px] text-red-600">
              error
            </span>
            <ErrorPrimitive.Message className="min-w-0 font-body text-[12px] leading-snug text-red-700" />
          </ErrorPrimitive.Root>
        </MessagePrimitive.Error>
      </div>

      <div className="flex items-center gap-1 pl-1">
        <ActionBarPrimitive.Root
          hideWhenRunning
          autohide="not-last"
          className="flex items-center gap-1"
        >
          <ActionBarPrimitive.Copy
            aria-label="Copy reply"
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-[#41493A]/70 transition-colors hover:bg-[#F5F4EE] hover:text-[#163300]"
          >
            <AuiIf condition={(state) => state.message.isCopied}>
              <span className="material-symbols-outlined text-[15px]">
                check
              </span>
            </AuiIf>
            <AuiIf condition={(state) => !state.message.isCopied}>
              <span className="material-symbols-outlined text-[15px]">
                content_copy
              </span>
            </AuiIf>
          </ActionBarPrimitive.Copy>
          <ActionBarPrimitive.Reload
            aria-label="Try this reply again"
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-[#41493A]/70 transition-colors hover:bg-[#F5F4EE] hover:text-[#163300]"
          >
            <span className="material-symbols-outlined text-[15px]">
              refresh
            </span>
          </ActionBarPrimitive.Reload>
        </ActionBarPrimitive.Root>
        <MessageBranchPicker />
      </div>
    </MessagePrimitive.Root>
  );
}

function ChatError() {
  const error = useEveError();

  useEffect(() => {
    if (!error) return;

    console.error('[TravelBuddy] Eve agent request failed', error);
    toast.error('TravelBuddy could not reach the agent', {
      description: error.message || 'Check the Eve server and try again.',
    });
  }, [error]);

  return null;
}

interface ChatPanelProps {
  children: ReactNode;
  composer: ReactNode;
}

/**
 * The assistant-ui conversation panel. Keeping the panel boundary separate
 * from the screen shell lets the itinerary drawer and chat history remain
 * TravelBuddy-specific while the conversation uses assistant-ui primitives.
 */
function ChatPanel({ children, composer }: ChatPanelProps) {
  return (
    <ThreadPrimitive.Root className="flex min-h-0 flex-1 flex-col pt-14">
      <ThreadPrimitive.ViewportProvider>
        {children}
        {composer}
      </ThreadPrimitive.ViewportProvider>
    </ThreadPrimitive.Root>
  );
}

interface MobileComposerProps {
  onNavigate: (screen: ScreenId) => void;
}

/** Mobile-first assistant-ui composer with TravelBuddy's persistent settings action. */
function MobileComposer({ onNavigate }: MobileComposerProps) {
  return (
    <div className="chat-composer-dock pointer-events-none absolute inset-x-0 bottom-0 z-40 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-16">
      <div aria-hidden="true" className="chat-composer-fade" />

      <div className="relative z-10">
        <div className="mb-2 flex justify-center">
          <ThreadPrimitive.ScrollToBottom
            aria-label="Scroll to the latest message"
            className="pointer-events-auto flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-[#E5E5E5] bg-white/95 text-[#163300] shadow-md backdrop-blur transition-transform active:scale-90 disabled:pointer-events-none disabled:opacity-0"
          >
            <span className="material-symbols-outlined text-[18px]">
              arrow_downward
            </span>
          </ThreadPrimitive.ScrollToBottom>
        </div>

        <AuiIf condition={(state) => !state.thread.isRunning}>
          <div className="no-scrollbar mb-2 flex items-center gap-1.5 overflow-x-auto py-1">
            <ThreadPrimitive.Suggestions>
              {({ suggestion }) => (
                <ThreadPrimitive.Suggestion
                  prompt={suggestion.prompt}
                  send
                  className="pointer-events-auto shrink-0 cursor-pointer rounded-full border border-[#E5E5E5] bg-white px-3 py-1.5 font-headline text-xs font-semibold text-[#163300] transition-colors hover:border-[#9FE870] hover:bg-[#eaf9dc] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {suggestion.title ?? suggestion.label ?? suggestion.prompt}
                </ThreadPrimitive.Suggestion>
              )}
            </ThreadPrimitive.Suggestions>
          </div>
        </AuiIf>

        <ComposerPrimitive.Root className="pointer-events-auto mx-auto flex w-full items-center gap-2">
          <button
            type="button"
            title="Trip settings"
            aria-label="Open trip settings"
            onClick={() => onNavigate('trip-settings')}
            className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-[#F5F4EE] text-[#41493A] transition-colors hover:bg-[#eaf9dc] hover:text-[#163300] active:scale-90"
          >
            <span className="material-symbols-outlined text-[20px]">settings</span>
          </button>

          <div className="flex min-h-10 min-w-0 flex-1 items-center rounded-full border border-[#E5E5E5] bg-white px-3">
            <ComposerPrimitive.Input
              rows={1}
              submitMode="enter"
              placeholder="Ask TravelBuddy..."
              className="max-h-24 min-h-6 min-w-0 flex-1 resize-none bg-transparent py-2 font-body text-sm text-[#163300] outline-none placeholder:text-[#41493A]/60"
            />

            <AuiIf condition={(state) => state.thread.isRunning}>
              <GridMatrixLoader
                size={3}
                label="TravelBuddy is responding"
                className="mr-0.5"
              />
              <ComposerPrimitive.Cancel
                aria-label="Stop response"
                className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full bg-[#163300] text-white transition-transform active:scale-90"
              >
                <span className="material-symbols-outlined text-[17px]">stop</span>
              </ComposerPrimitive.Cancel>
            </AuiIf>
            <AuiIf condition={(state) => !state.thread.isRunning}>
              <AuiIf condition={(state) => state.composer.dictation != null}>
                <ComposerPrimitive.StopDictation
                  aria-label="Stop dictation"
                  className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-[#163300] transition-colors hover:bg-[#eaf9dc] active:scale-90"
                >
                  <span className="material-symbols-outlined text-[19px]">mic</span>
                </ComposerPrimitive.StopDictation>
              </AuiIf>
              <AuiIf condition={(state) => state.composer.dictation == null}>
                <ComposerPrimitive.Dictate
                  aria-label="Use voice input"
                  title="Use voice input"
                  className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-[#41493A] transition-colors hover:bg-[#eaf9dc] hover:text-[#163300] active:scale-90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <span className="material-symbols-outlined text-[19px]">mic</span>
                </ComposerPrimitive.Dictate>
              </AuiIf>
            </AuiIf>
          </div>

          <AuiIf condition={(state) => !state.thread.isRunning}>
            <ComposerPrimitive.Send
              aria-label="Send message"
              className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-[#9FE870] text-[#163300] shadow-xs transition-all hover:brightness-105 active:scale-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[19px] font-bold">
                arrow_upward
              </span>
            </ComposerPrimitive.Send>
          </AuiIf>
        </ComposerPrimitive.Root>
      </div>
    </div>
  );
}

function ChatContent({
  onNavigate,
  activeChat,
  chats,
  onNewChat,
  onSelectChat,
}: ChatContentProps) {
  const [activeDayNumber, setActiveDayNumber] = useState(1);
  const [sheetSnap, setSheetSnap] = useState<BottomSheetSnap>('half');
  const [isSheetVisible, setIsSheetVisible] = useState(
    () => useTripStore.getState().itinerary !== null,
  );
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isItineraryMapOpen, setIsItineraryMapOpen] = useState(false);
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);

  // The timeline is driven entirely by what the agent published through
  // save_itinerary; there is no mock schedule behind it any more.
  const itinerary = useTripStore((state) => state.itinerary);
  const itineraryRevision = useTripStore((state) => state.revision);
  const destination = useTripStore((state) => state.destination);

  // A successful save_itinerary publish is the AI's explicit signal that the
  // itinerary is fresh. It reopens the sheet even after a full dismissal.
  useEffect(() => {
    if (!itinerary || itineraryRevision === 0) return;
    setIsSheetVisible(true);
    setSheetSnap('half');
  }, [itinerary, itineraryRevision]);

  const openItinerary = () => {
    if (!itinerary) return;
    setIsSheetVisible(true);
    setSheetSnap('half');
  };

  const activeDay =
    itinerary?.days.find((day) => day.day === activeDayNumber) ??
    itinerary?.days[0] ??
    null;

  const mappedStops = useMemo(
    () =>
      activeDay?.stops.filter(
        (stop) => typeof stop.lat === 'number' && typeof stop.lng === 'number',
      ) ?? [],
    [activeDay],
  );

  useEffect(() => {
    if (mappedStops.some((stop) => stop.id === selectedStopId)) return;
    setSelectedStopId(mappedStops[0]?.id ?? activeDay?.stops[0]?.id ?? null);
  }, [activeDay, mappedStops, selectedStopId]);

  const selectStop = useCallback((stopId: string) => {
    setSelectedStopId(stopId);
  }, []);

  const totalCost = itinerary?.estimatedTotalMyr ?? null;

  return (
    <>
      <AuthorizationUI />
      <div className="relative mx-auto flex h-[100dvh] w-full max-w-[430px] flex-col overflow-hidden bg-[#FBF9F4] text-[#163300]">
        <ScreenHeader
          title={isItineraryMapOpen ? 'Trip map' : 'AI Chat'}
          currentScreen="chat"
          onBack={() => onNavigate('home')}
          onNavigate={onNavigate}
          rightAction={activeDay && mappedStops.length > 0 ? (
            <button
              type="button"
              aria-label={isItineraryMapOpen ? 'Switch to AI chat' : 'Switch to itinerary map'}
              title={isItineraryMapOpen ? 'Switch to AI chat' : 'Switch to itinerary map'}
              onClick={() => setIsItineraryMapOpen((open) => !open)}
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-[#163300] text-[#9FE870] shadow-sm transition-transform active:scale-95"
            >
              <span className="material-symbols-filled text-[18px]">
                {isItineraryMapOpen ? 'chat' : 'map'}
              </span>
            </button>
          ) : null}
        />

        {isHistoryOpen ? (
          <>
            <button
              type="button"
              aria-label="Close chat history"
              onClick={() => setIsHistoryOpen(false)}
              className="absolute inset-0 z-40 bg-[#163300]/20 backdrop-blur-[1px]"
            />
            <aside className="tb-rise absolute inset-x-3 top-16 z-40 max-h-[70dvh] overflow-hidden rounded-3xl border border-[#E5E5E5] bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-[#E5E5E5] px-4 py-3">
                <div>
                  <p className="font-headline text-base font-bold">Chat history</p>
                  <p className="font-label text-[11px] text-[#41493A]">
                    Stored only on this device
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onNewChat();
                    setIsHistoryOpen(false);
                  }}
                  className="inline-flex items-center gap-1 rounded-full bg-[#9FE870] px-3 py-2 font-label text-xs font-bold"
                >
                  <span className="material-symbols-outlined text-[17px]">add</span>
                  New chat
                </button>
              </div>
              <div className="no-scrollbar max-h-[56dvh] space-y-1 overflow-y-auto p-2">
                {chats.map((chat) => {
                  const isActive = chat.id === activeChat.id;
                  const messageCount = countUserMessages(chat);
                  return (
                    <button
                      key={chat.id}
                      type="button"
                      onClick={() => {
                        onSelectChat(chat.id);
                        setIsHistoryOpen(false);
                      }}
                      className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors ${
                        isActive ? 'bg-[#eaf9dc]' : 'hover:bg-[#F5F4EE]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[20px] text-[#41493A]">
                        chat_bubble
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-headline text-sm font-bold">
                          {chat.title}
                        </span>
                        <span className="block font-label text-[11px] text-[#41493A]">
                          {messageCount} {messageCount === 1 ? 'message' : 'messages'} ·{' '}
                          {new Date(chat.updatedAt).toLocaleDateString()}
                        </span>
                      </span>
                      {isActive ? (
                        <span className="h-2 w-2 rounded-full bg-[#163300]" />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </aside>
          </>
        ) : null}

        {isItineraryMapOpen && activeDay ? (
          <main className="absolute inset-0 top-14 overflow-hidden">
            <Suspense
              fallback={
                <div className="absolute inset-0 flex items-center justify-center bg-[#F5F4EE]">
                  <GridMatrixLoader size={4} label="Loading trip map" />
                </div>
              }
            >
              <ItineraryMap
                day={activeDay}
                selectedStopId={selectedStopId}
                onSelectStop={selectStop}
              />
            </Suspense>
            <div className="absolute left-4 top-4 z-20 rounded-full bg-white/95 px-3 py-2 shadow-md backdrop-blur">
              <span className="font-label text-[11px] font-bold uppercase tracking-wider text-[#163300]">
                Day {activeDay.day} · {activeDay.stops.length} stops
              </span>
            </div>
          </main>
        ) : (
        <ChatPanel
          composer={<MobileComposer onNavigate={onNavigate} />}
        >
            <ThreadPrimitive.Viewport className="no-scrollbar flex-1 space-y-5 overflow-y-auto px-4 pb-40 pt-2">
              <div className="flex items-center justify-between gap-2 pb-4 pt-1">
                <button
                  type="button"
                  onClick={() => setIsHistoryOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#E5E5E5] bg-white px-3 py-1.5 font-label text-[11px] font-bold shadow-xs"
                >
                  <span className="material-symbols-outlined text-[16px]">history</span>
                  History
                </button>
                <div className="inline-flex items-center gap-2 rounded-full border border-[#9FE870]/30 bg-[#eaf9dc] px-3.5 py-1.5 text-[#163300] shadow-xs">
                  <span className="h-2 w-2 rounded-full bg-[#9FE870]" />
                  <span className="font-label text-[11px] font-bold uppercase tracking-wider">
                    {activeChat.session ? 'Saved chat' : 'New chat'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onNewChat}
                  aria-label="Start a new chat"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-[#163300] text-[#9FE870] shadow-xs"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                </button>
              </div>

              <ThreadPrimitive.Empty>
                <div className="tb-rise rounded-3xl border border-[#E5E5E5] bg-white p-5 shadow-sm">
                  <p className="font-headline text-lg font-bold">Plan it together</p>
                  <p className="mt-2 text-sm leading-relaxed text-[#41493A]">
                    TravelBuddy already knows your {destination} dates, budget and
                    must-visit picks. Ask it to build the itinerary, then adjust
                    any day by just saying what you want changed.
                  </p>
                </div>
              </ThreadPrimitive.Empty>

              <ThreadPrimitive.Messages>
                {({ message }) =>
                  message.role === 'user' ? (
                    <UserMessage />
                  ) : (
                    <AssistantMessage onOpenItinerary={openItinerary} />
                  )
                }
              </ThreadPrimitive.Messages>

              {/* Covers the gap between sending and the assistant turn appearing;
                  once the turn exists, its own indicator takes over. */}
              <AuiIf
                condition={(state) =>
                  state.thread.isRunning &&
                  state.thread.messages.at(-1)?.role === 'user'
                }
              >
                <div className="flex items-center gap-2 pl-1">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#eaf9dc]">
                    <span className="material-symbols-filled text-[13px] text-[#163300]">
                      auto_awesome
                    </span>
                  </div>
                  <ThinkingIndicator />
                </div>
              </AuiIf>

              <ChatError />

            </ThreadPrimitive.Viewport>

        </ChatPanel>
        )}

        {isSheetVisible && itinerary ? (
          <BottomSheet
            snap={sheetSnap}
            onSnapChange={setSheetSnap}
            onDismiss={() => setIsSheetVisible(false)}
            dismissible
            label="Trip itinerary"
          >
          <div className="flex min-h-0 flex-1 flex-col">
            {sheetSnap === 'sticky' ? (
              <button
                type="button"
                onClick={() => setSheetSnap('half')}
                className="flex min-h-12 items-center justify-between gap-3 pb-2 text-left"
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#163300] text-[#9FE870]">
                    <span className="material-symbols-outlined text-[16px]">route</span>
                  </span>
                  <span className="truncate font-headline text-sm font-bold text-[#163300]">
                    {itinerary.title}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-1 font-label text-[11px] font-bold text-[#163300]">
                  Open
                  <span className="material-symbols-outlined text-[17px]">expand_less</span>
                </span>
              </button>
            ) : null}

            {sheetSnap !== 'sticky' ? <div className="flex items-center justify-between gap-2 pb-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="truncate font-headline text-lg font-bold tracking-tight text-[#163300]">
                  {itinerary?.title ?? `${destination} trip`}
                </span>
                {itinerary ? (
                  <span className="shrink-0 rounded-full bg-[#eaf9dc] px-2.5 py-0.5 font-label text-xs font-semibold text-[#163300]">
                    {itinerary.days.length}{' '}
                    {itinerary.days.length === 1 ? 'Day' : 'Days'}
                  </span>
                ) : null}
              </div>
              <button
                type="button"
                aria-label="Toggle itinerary expansion"
                aria-expanded={sheetSnap === 'full'}
                onClick={() => setSheetSnap(sheetSnap === 'full' ? 'half' : 'full')}
                className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full border border-[#E5E5E5] bg-[#F5F4EE] text-[#163300] transition-transform active:scale-95"
              >
                <span
                  className={`material-symbols-outlined text-[20px] transition-transform duration-200 ${
                    sheetSnap === 'half' ? 'rotate-180' : 'rotate-0'
                  }`}
                >
                  expand_less
                </span>
              </button>
            </div> : null}

            {itinerary ? (
              <div className="no-scrollbar flex shrink-0 items-center gap-2 overflow-x-auto pb-3.5">
                {itinerary.days.map((day) => (
                  <button
                    key={day.day}
                    type="button"
                    onClick={() => setActiveDayNumber(day.day)}
                    className={`shrink-0 cursor-pointer rounded-full px-4 py-1.5 font-label text-xs font-semibold tracking-wide transition-colors ${
                      activeDay?.day === day.day
                        ? 'bg-[#163300] text-white shadow-xs'
                        : 'border border-[#E5E5E5] bg-[#F5F4EE] text-[#41493A] hover:text-[#163300]'
                    }`}
                  >
                    Day {day.day}
                  </button>
                ))}
                {totalCost !== null ? (
                  <span className="ml-auto shrink-0 rounded-full bg-[#eaf9dc] px-2.5 py-1 font-label text-[11px] font-bold tabular-nums text-[#163300]">
                    ~{formatMyr(totalCost)}
                  </span>
                ) : null}
              </div>
            ) : null}

            {sheetSnap !== 'sticky' ? (
              <div className="no-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto pb-28">
                {activeDay ? (
                  <ItineraryTimeline
                    day={activeDay}
                    selectedStopId={selectedStopId}
                    onSelectStop={selectStop}
                  />
                ) : (
                  <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-10 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F5F4EE]">
                      <span className="material-symbols-outlined text-[24px] text-[#41493A]">
                        event_note
                      </span>
                    </div>
                    <p className="font-headline text-[15px] font-bold text-[#163300]">
                      No itinerary yet
                    </p>
                    <p className="font-body text-[13px] leading-relaxed text-[#41493A]">
                      Ask TravelBuddy to build your {destination} itinerary and
                      it will appear here, day by day.
                    </p>
                  </div>
                )}
              </div>
            ) : null}
          </div>
          </BottomSheet>
        ) : null}
      </div>
    </>
  );
}

export function ChatScreen({ onNavigate }: ChatScreenProps) {
  const tripId = useTripStore((state) => state.tripId);
  const destination = useTripStore((state) => state.destination);
  const [history, setHistory] = useState<LocalChatHistory | null>(null);

  useEffect(() => {
    let cancelled = false;
    setHistory(null);
    void loadChatHistory(tripId, destination).then((loaded) => {
      if (!cancelled) setHistory(loaded);
    });
    return () => {
      cancelled = true;
    };
  }, [tripId, destination]);

  const updateChat = useCallback(
    (chatId: string, update: Partial<LocalChat>) => {
      setHistory((current) => {
        if (!current) return current;
        const next = {
          ...current,
          chats: current.chats.map((chat) =>
            chat.id === chatId ? { ...chat, ...update } : chat,
          ),
        };
        void saveChatHistory(next);
        return next;
      });
    },
    [],
  );

  const selectChat = useCallback((chatId: string) => {
    setHistory((current) => {
      if (!current) return current;
      const selected = current.chats.find((chat) => chat.id === chatId);
      if (!selected || chatId === current.activeChatId) return current;

      const next = { ...current, activeChatId: chatId };
      void saveChatHistory(next);
      return next;
    });
  }, []);

  const keepTripChat = useCallback(() => {
    const tripId = useTripStore.getState().tripId;
    setHistory((current) => {
      if (!current) return current;
      const tripChat = current.chats.find((chat) => chat.tripId === tripId);
      if (!tripChat || tripChat.id === current.activeChatId) return current;
      const next = { ...current, activeChatId: tripChat.id };
      void saveChatHistory(next);
      return next;
    });
  }, []);

  if (!history) {
    return (
      <div className="flex h-[100dvh] w-full max-w-[430px] items-center justify-center bg-[#FBF9F4] font-label text-sm text-[#41493A]">
        Restoring your trip chat…
      </div>
    );
  }

  const activeChat =
    history.chats.find((chat) => chat.id === history.activeChatId) ??
    history.chats[0]!;

  return (
    <EveAssistantProvider
      key={activeChat.id}
      chat={activeChat}
      onChatChange={updateChat}
    >
      <ChatContent
        activeChat={activeChat}
        chats={history.chats}
        onNavigate={onNavigate}
        onNewChat={keepTripChat}
        onSelectChat={selectChat}
      />
    </EveAssistantProvider>
  );
}
