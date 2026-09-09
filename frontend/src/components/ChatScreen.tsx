import { useState, type FormEvent } from 'react';
import { type EveAuthorizationData, useEveError } from '@assistant-ui/eve';
import { MarkdownTextPrimitive } from '@assistant-ui/react-markdown';
import {
  AuiIf,
  ComposerPrimitive,
  makeAssistantDataUI,
  MessagePrimitive,
  ThreadPrimitive,
  type ToolCallMessagePartProps,
} from '@assistant-ui/react';
import remarkGfm from 'remark-gfm';
import { ScreenHeader } from './ScreenHeader';
import { EveAssistantProvider } from './EveAssistantProvider';
import { type ScreenId, type TimelineItem } from '../types';
import { SCHEDULE_DAYS } from '../data/mockData';

interface ChatScreenProps {
  destination: string;
  onNavigate: (screen: ScreenId) => void;
}

const QUICK_PROMPTS = [
  'Add a sunset spot',
  'Best coffee near Armenian St',
  'Show vegetarian street food',
];

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

function formatToolName(toolName: string) {
  return toolName
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function ToolStatus({
  toolName,
  status,
  isError,
  approval,
  respondToApproval,
}: ToolCallMessagePartProps) {
  const [answer, setAnswer] = useState('');
  const [isResponding, setIsResponding] = useState(false);
  const needsResponse =
    approval !== undefined &&
    approval.approved === undefined &&
    approval.resolution === undefined;

  const respond = async (
    response: Parameters<typeof respondToApproval>[0],
  ) => {
    setIsResponding(true);
    try {
      await respondToApproval(response);
    } finally {
      setIsResponding(false);
    }
  };

  const submitAnswer = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = answer.trim();
    if (text) void respond({ text });
  };

  if (needsResponse) {
    const acceptsText =
      approval.display === 'text' || approval.allowFreeform === true;

    return (
      <section className="rounded-2xl border border-[#9FE870]/50 bg-[#F5F4EE] p-4">
        <p className="font-label text-xs font-bold uppercase tracking-wide text-[#41493A]">
          TravelBuddy needs your input
        </p>
        <p className="mt-2 text-sm leading-relaxed">
          {approval.prompt ?? `Allow ${formatToolName(toolName)}?`}
        </p>

        {approval.options?.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {approval.options.map((option) => (
              <button
                key={option.id}
                type="button"
                disabled={isResponding}
                onClick={() => void respond({ optionId: option.id })}
                className="rounded-full border border-[#163300]/15 bg-white px-3 py-2 font-label text-xs font-semibold disabled:opacity-50"
              >
                {option.label ?? formatToolName(option.kind)}
              </button>
            ))}
          </div>
        ) : approval.display !== 'text' ? (
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              disabled={isResponding}
              onClick={() => void respond({ approved: true })}
              className="rounded-full bg-[#163300] px-4 py-2 font-label text-xs font-semibold text-white disabled:opacity-50"
            >
              Allow
            </button>
            <button
              type="button"
              disabled={isResponding}
              onClick={() => void respond({ approved: false })}
              className="rounded-full border border-[#163300]/15 bg-white px-4 py-2 font-label text-xs font-semibold disabled:opacity-50"
            >
              Not now
            </button>
          </div>
        ) : null}

        {acceptsText ? (
          <form onSubmit={submitAnswer} className="mt-3 flex gap-2">
            <input
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
              placeholder="Type your answer"
              aria-label="Answer TravelBuddy"
              className="min-w-0 flex-1 rounded-full border border-[#163300]/15 bg-white px-4 py-2 text-sm outline-none focus:border-[#9FE870]"
            />
            <button
              type="submit"
              disabled={!answer.trim() || isResponding}
              className="rounded-full bg-[#9FE870] px-4 py-2 font-label text-xs font-bold disabled:opacity-50"
            >
              Send
            </button>
          </form>
        ) : null}
      </section>
    );
  }

  const finished = status.type === 'complete';
  return (
    <div className="flex items-center gap-2 rounded-xl bg-[#F5F4EE] px-3 py-2 font-label text-xs text-[#41493A]">
      <span
        className={`h-2 w-2 rounded-full ${
          isError ? 'bg-red-500' : finished ? 'bg-[#9FE870]' : 'animate-pulse bg-amber-400'
        }`}
      />
      <span>
        {isError ? 'Could not finish' : finished ? 'Finished' : 'Working on'}{' '}
        {formatToolName(toolName)}
      </span>
    </div>
  );
}

const MARKDOWN_PLUGINS = [remarkGfm];

function AssistantMarkdown() {
  return (
    <MarkdownTextPrimitive
      remarkPlugins={MARKDOWN_PLUGINS}
      className="travelbuddy-markdown"
    />
  );
}

const MESSAGE_PARTS = {
  Text: AssistantMarkdown,
  tools: { Fallback: ToolStatus },
};

function UserMessage() {
  return (
    <MessagePrimitive.Root className="flex w-full justify-end pl-8">
      <div className="max-w-[86%] rounded-3xl rounded-br-md bg-[#163300] px-5 py-4 text-white shadow-sm">
        <div className="font-headline text-[15px] font-normal leading-relaxed">
          <MessagePrimitive.Parts />
        </div>
      </div>
    </MessagePrimitive.Root>
  );
}

function AssistantMessage() {
  return (
    <MessagePrimitive.Root className="flex w-full flex-col space-y-2.5 pr-2">
      <div className="flex items-center gap-2 pl-1">
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#eaf9dc]">
          <span className="material-symbols-filled text-[13px] text-[#163300]">
            auto_awesome
          </span>
        </div>
        <span className="font-label text-xs font-semibold text-[#41493A]">
          TravelBuddy AI
        </span>
      </div>
      <div className="space-y-4 rounded-3xl rounded-tl-md border border-[#E5E5E5] bg-white p-5 text-[15px] leading-relaxed text-[#163300] shadow-sm">
        <MessagePrimitive.Parts components={MESSAGE_PARTS} />
      </div>
    </MessagePrimitive.Root>
  );
}

function ChatError() {
  const error = useEveError();
  if (!error) return null;

  return (
    <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
      TravelBuddy could not reach the agent. Check the Eve server and try again.
      <span className="sr-only"> {error.message}</span>
    </div>
  );
}

function ChatContent({ onNavigate }: Omit<ChatScreenProps, 'destination'>) {
  const [activeDay, setActiveDay] = useState<'1' | '2' | '3'>('1');
  const [isItineraryCollapsed, setIsItineraryCollapsed] = useState(false);
  const [scheduleData] =
    useState<Record<string, TimelineItem[]>>(SCHEDULE_DAYS);
  const currentTimeline = scheduleData[activeDay] ?? [];

  return (
    <>
      <AuthorizationUI />
      <div className="relative mx-auto flex h-[100dvh] w-full max-w-[430px] flex-col overflow-hidden bg-[#FBF9F4] text-[#163300]">
        <ScreenHeader
          title="AI Chat"
          currentScreen="chat"
          onBack={() => onNavigate('map')}
          onNavigate={onNavigate}
        />

        <ThreadPrimitive.Root className="flex min-h-0 flex-1 flex-col pt-16">
          <ThreadPrimitive.Viewport className="no-scrollbar flex-1 space-y-5 overflow-y-auto px-4 pb-6">
            <div className="flex items-center justify-center pb-4 pt-1">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#9FE870]/30 bg-[#eaf9dc] px-3.5 py-1.5 text-[#163300] shadow-xs">
                <span className="h-2 w-2 animate-pulse rounded-full bg-[#9FE870]" />
                <span className="font-label text-[11px] font-bold uppercase tracking-wider">
                  Durable trip chat active
                </span>
              </div>
            </div>

            <AuiIf condition={(state) => state.thread.isEmpty}>
              <div className="rounded-3xl border border-[#E5E5E5] bg-white p-5 shadow-sm">
                <p className="font-headline text-lg font-bold">Plan it together</p>
                <p className="mt-2 text-sm leading-relaxed text-[#41493A]">
                  Ask TravelBuddy to research places, shape your itinerary, or adjust the pace of your trip.
                </p>
              </div>
            </AuiIf>

            <ThreadPrimitive.Messages>
              {({ message }) =>
                message.role === 'user' ? <UserMessage /> : <AssistantMessage />
              }
            </ThreadPrimitive.Messages>

            <AuiIf condition={(state) => state.thread.isRunning}>
              <div className="flex items-center gap-2 pl-2 font-headline text-xs text-[#41493A] animate-pulse">
                <span className="h-2 w-2 rounded-full bg-[#9FE870]" />
                <span>TravelBuddy is curating recommendations...</span>
              </div>
            </AuiIf>

            <ChatError />

            <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto py-1">
              {QUICK_PROMPTS.map((prompt) => (
                <ThreadPrimitive.Suggestion
                  key={prompt}
                  prompt={prompt}
                  send
                  className="shrink-0 cursor-pointer rounded-full border border-[#E5E5E5] bg-white px-3 py-1.5 font-headline text-xs font-semibold text-[#163300] transition-colors hover:border-[#9FE870] hover:bg-[#eaf9dc] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  + {prompt}
                </ThreadPrimitive.Suggestion>
              ))}
            </div>
          </ThreadPrimitive.Viewport>

          <div className="w-full shrink-0 bg-gradient-to-t from-[#FBF9F4] via-[#FBF9F4]/95 to-transparent px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2">
            <div className="mb-3 w-full rounded-3xl border border-[#E5E5E5] bg-white p-4 shadow-[0_8px_30px_rgba(22,51,0,0.06)] transition-all duration-300">
              <div className="flex w-full flex-col items-center">
                <div className="mb-3 h-1 w-10 rounded-full bg-[#E4E2DD]" />
              </div>

              <div className="flex items-center justify-between px-1 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="font-headline text-lg font-bold tracking-tight text-[#163300]">
                    Penang Flow
                  </span>
                  <span className="rounded-full bg-[#eaf9dc] px-2.5 py-0.5 font-label text-xs font-semibold text-[#163300]">
                    3 Days
                  </span>
                </div>
                <button
                  type="button"
                  aria-label="Toggle itinerary expansion"
                  aria-expanded={!isItineraryCollapsed}
                  onClick={() => setIsItineraryCollapsed((value) => !value)}
                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-[#E5E5E5] bg-[#F5F4EE] text-[#163300] transition-transform active:scale-95"
                >
                  <span
                    className={`material-symbols-outlined text-[20px] transition-transform duration-200 ${
                      isItineraryCollapsed ? 'rotate-180' : 'rotate-0'
                    }`}
                  >
                    expand_less
                  </span>
                </button>
              </div>

              <div className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-3.5">
                {(['1', '2', '3'] as const).map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setActiveDay(day)}
                    className={`shrink-0 cursor-pointer rounded-full px-4 py-1.5 font-label text-xs font-semibold tracking-wide transition-colors ${
                      activeDay === day
                        ? 'bg-[#163300] text-white shadow-xs'
                        : 'border border-[#E5E5E5] bg-[#F5F4EE] text-[#41493A] hover:text-[#163300]'
                    }`}
                  >
                    Day {day}
                  </button>
                ))}
              </div>

              {!isItineraryCollapsed ? (
                <div className="flex flex-col space-y-2">
                  {currentTimeline.map((item) => (
                    <div
                      key={`${item.time}-${item.title}`}
                      className="flex items-center justify-between rounded-2xl border border-[#E5E5E5]/70 bg-[#F5F4EE] p-3"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="w-11 shrink-0 font-label text-xs font-bold tabular-nums text-[#41493A]">
                          {item.time}
                        </span>
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#9FE870]" />
                        <div className="flex min-w-0 flex-col">
                          <span className="truncate font-headline text-sm font-bold text-[#163300]">
                            {item.title}
                          </span>
                          <span className="truncate font-body text-xs text-[#41493A]">
                            {item.desc}
                          </span>
                        </div>
                      </div>
                      <span className="material-symbols-outlined shrink-0 text-[19px] text-[#41493A]">
                        {item.icon}
                      </span>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <ComposerPrimitive.Root className="flex w-full items-center gap-2 rounded-full border border-[#E5E5E5] bg-white p-2 shadow-[0_4px_24px_rgba(22,51,0,0.06)]">
              <button
                type="button"
                disabled
                title="Attachments are not enabled yet"
                aria-label="Attachments are not enabled yet"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#41493A] opacity-40"
              >
                <span className="material-symbols-outlined text-[20px]">add</span>
              </button>

              <ComposerPrimitive.Input
                rows={1}
                submitMode="enter"
                placeholder="Ask to adjust stops, times, or vibe..."
                className="max-h-24 min-h-6 min-w-0 flex-1 resize-none bg-transparent px-1 py-0.5 font-body text-sm text-[#163300] outline-none placeholder:text-[#41493A]/60"
              />

              <AuiIf condition={(state) => state.thread.isRunning}>
                <ComposerPrimitive.Cancel
                  aria-label="Stop response"
                  className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-[#163300] text-white transition-transform active:scale-90"
                >
                  <span className="material-symbols-outlined text-[18px]">stop</span>
                </ComposerPrimitive.Cancel>
              </AuiIf>
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
        </ThreadPrimitive.Root>
      </div>
    </>
  );
}

export function ChatScreen({ destination, onNavigate }: ChatScreenProps) {
  return (
    <EveAssistantProvider destination={destination}>
      <ChatContent onNavigate={onNavigate} />
    </EveAssistantProvider>
  );
}
