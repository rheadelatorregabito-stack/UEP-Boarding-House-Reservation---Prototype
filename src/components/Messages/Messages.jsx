import { useEffect, useId, useMemo, useRef, useState } from 'react';
import styles from './Messages.module.css';
import { Avatar, Screen, cx, ui } from '../shared/ui';
import { BackIcon, BellIcon, CheckIcon, ClockIcon, CloseIcon, EditIcon, SearchIcon, SendIcon } from '../BoarderHome/icons';
import { QUICK_REPLIES, helperReplyFor } from '../../data/messages';

/* Review-request card shown at the end of a thread (D12 pending, D13 accepted, D14 declined;
   B10 shows the boarder's side of the same request). */
function RequestCard({ isOwner, status, requester, listingName, onAccept, onDecline, onWriteReview }) {
  if (status === 'pending') {
    return (
      <section className={cx(styles.requestCard, styles.requestPending)} aria-label="Review request">
        <div className={styles.requestHead}>
          <span className={cx(styles.requestIcon, styles.iconYellow)}><BellIcon size={22} /></span>
          <p className={styles.requestTitle}>Review request</p>
        </div>
        {isOwner ? (
          <>
            <p className={styles.requestText}>
              {requester} asked to leave a review for {listingName}. Accept to let them write one.
            </p>
            <div className={styles.requestActions}>
              <button type="button" className={cx(ui.btn, ui.btnSmall, ui.btnOutlineDanger)} onClick={onDecline}>
                <CloseIcon size={18} /> Decline
              </button>
              <button type="button" className={cx(ui.btn, ui.btnSmall, ui.btnGreen)} onClick={onAccept}>
                <CheckIcon size={18} /> Accept
              </button>
            </div>
          </>
        ) : (
          <p className={styles.requestText}>
            <ClockIcon size={14} /> You asked to review {listingName}. Waiting for the owner to reply.
          </p>
        )}
      </section>
    );
  }

  if (status === 'accepted') {
    return (
      <section className={cx(styles.requestCard, styles.requestAccepted)} aria-label="Review request accepted">
        <div className={styles.requestHead}>
          <span className={cx(styles.requestIcon, styles.iconGreen)}><CheckIcon size={22} /></span>
          <p className={styles.requestTitle}>Review request accepted</p>
        </div>
        {isOwner ? (
          <>
            <p className={styles.requestText}>
              You accepted {requester}'s request. They can now write a review for {listingName}.
            </p>
            <p className={styles.requestNote}>{requester.split(' ')[0]} has been notified.</p>
          </>
        ) : (
          onWriteReview && (
            <button type="button" className={cx(ui.btn, ui.btnSmall, ui.btnGreen, styles.requestButton)} onClick={onWriteReview}>
              <EditIcon size={18} /> Write your review
            </button>
          )
        )}
      </section>
    );
  }

  if (status === 'declined') {
    return (
      <section className={cx(styles.requestCard, styles.requestDeclined)} aria-label="Review request declined">
        <div className={styles.requestHead}>
          <span className={cx(styles.requestIcon, styles.iconRed)}><CloseIcon size={22} /></span>
          <p className={styles.requestTitle}>Review request declined</p>
        </div>
        <p className={styles.requestText}>
          {isOwner
            ? `You declined ${requester}'s request. They have been notified and cannot post a review for this boarding house.`
            : `The owner declined your request to review ${listingName}.`}
        </p>
      </section>
    );
  }

  return null;
}

const PREVIEW_PREFIX = { me: 'You: ', bot: 'Auto-reply: ' };
const BUBBLE_CLASS = { me: styles.bubbleMe, bot: styles.bubbleBot };

/* ---------- B10 · Messages (17:362) / D10 · Messages (12:217) + D12–D14 review-request states ---------- */

export default function Messages({
  session,
  nav,
  threads,
  initialThreadId,
  reviewRequests = {},     // { [listingId]: 'pending' | 'accepted' | 'declined' | 'reviewed' }
  requesterName = 'The student', // App.js passes the logged-in boarder's name
  listingNames = {},       // { [listingId]: name }
  listings = [],           // boarder: listing data the auto-reply helper answers from
  onSend,                  // (threadId, text, from = 'me')
  onOpenThread,            // (threadId) — clears unread
  onAcceptRequest,         // owner: (listingId)
  onDeclineRequest,        // owner: (listingId)
  onWriteReview,           // boarder: (listingId)
}) {
  const isOwner = session?.role === 'owner';
  const searchId = useId();
  const [activeId, setActiveId] = useState(initialThreadId ?? threads[0]?.id);
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState('');
  const [mobileThreadOpen, setMobileThreadOpen] = useState(Boolean(initialThreadId));
  const bubblesRef = useRef(null);
  const requestRef = useRef(null);

  useEffect(() => {
    if (initialThreadId) setActiveId(initialThreadId);
  }, [initialThreadId]);

  const active = threads.find((t) => t.id === activeId) ?? threads[0];

  // Owner: which thread holds the pending review request (the requester's conversation).
  const pendingThread = isOwner
    ? threads.find((t) => t.requester && reviewRequests[t.listingId] === 'pending')
    : null;

  const visibleThreads = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return threads;
    return threads.filter((t) =>
      [t.contact, t.context, t.detail, t.messages.at(-1)?.text].join(' ').toLowerCase().includes(q));
  }, [threads, query]);

  // Keep the newest message in view.
  useEffect(() => {
    const el = bubblesRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [active?.id, active?.messages.length, reviewRequests]);

  useEffect(() => {
    if (active?.unread) onOpenThread?.(active.id);
  }, [active?.id, active?.unread, onOpenThread]);

  const openThread = (id) => {
    setActiveId(id);
    setDraft('');
    setMobileThreadOpen(true);
  };

  const send = (e) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || !active) return;
    onSend?.(active.id, text);
    setDraft('');
  };

  // Boarder quick reply: send the question, then add the helper's answer when the listing data covers it.
  const activeListing = active ? listings.find((l) => l.id === active.listingId) : null;
  const sendQuickReply = ({ text, topic }) => {
    if (!active) return;
    onSend?.(active.id, text);
    const reply = helperReplyFor(topic, activeListing);
    if (reply) onSend?.(active.id, reply, 'bot');
  };

  const viewRequest = () => {
    openThread(pendingThread.id);
    requestAnimationFrame(() => requestRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
  };

  const requestStatus = active ? reviewRequests[active.listingId] : undefined;
  const showRequest = active && requestStatus && requestStatus !== 'reviewed' && (!isOwner || active.requester);

  return (
    <Screen session={session} nav={nav} active="messages">
      <div>
        <h1 className={ui.pageTitle}>Messages</h1>
        <p className={styles.subtitle}>
          {isOwner
            ? 'Students asking about the boarding houses you own.'
            : 'Owners you have messaged about their boarding houses.'}
        </p>
      </div>

      {pendingThread && (
        <div className={cx(ui.notice, styles.banner)} role="status">
          <BellIcon size={24} />
          <span className={styles.bannerText}>
            New review request: {pendingThread.contact} wants to review {listingNames[pendingThread.listingId] ?? 'your boarding house'}.
          </span>
          <button type="button" className={cx(ui.btn, ui.btnSmall, ui.btnNavy)} onClick={viewRequest}>
            View request
          </button>
        </div>
      )}

      <div className={cx(styles.inbox, mobileThreadOpen && styles.inboxThreadOpen)}>
        {/* ---------- Chat list ---------- */}
        <aside className={styles.chatList} aria-label="Conversations">
          <label htmlFor={searchId} className={styles.search}>
            <SearchIcon size={20} />
            <span className={ui.visuallyHidden}>{isOwner ? 'Search students' : 'Search owners'}</span>
            <input
              id={searchId}
              type="search"
              className={styles.searchInput}
              placeholder={isOwner ? 'Search students' : 'Search owners'}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>

          <ul className={styles.chats}>
            {visibleThreads.map((t) => {
              const last = t.messages.at(-1);
              const isActive = t.id === active?.id;
              return (
                <li key={t.id}>
                  <button
                    type="button"
                    className={cx(styles.chat, isActive && styles.chatActive)}
                    aria-current={isActive ? 'true' : undefined}
                    onClick={() => openThread(t.id)}
                  >
                    <Avatar name={t.contact} color={t.color} size={48} />
                    <span className={styles.chatText}>
                      <span className={styles.chatTop}>
                        <span className={styles.chatName}>{t.contact}</span>
                        <span className={cx(styles.chatTime, t.unread > 0 && styles.chatTimeUnread)}>{t.time}</span>
                      </span>
                      {t.context && <span className={styles.chatContext}>{t.context}</span>}
                      <span className={cx(styles.chatPreview, t.unread > 0 && styles.chatPreviewUnread)}>
                        {last ? `${PREVIEW_PREFIX[last.from] ?? ''}${last.text}` : 'No messages yet'}
                      </span>
                    </span>
                    {t.unread > 0 && (
                      <span className={styles.unread} aria-label={`${t.unread} unread`}>{t.unread}</span>
                    )}
                  </button>
                </li>
              );
            })}
            {visibleThreads.length === 0 && <li className={styles.noResults}>No conversations match “{query}”.</li>}
          </ul>
        </aside>

        {/* ---------- Thread ---------- */}
        {active ? (
          <section className={styles.thread} aria-label={`Conversation with ${active.contact}`}>
            <header className={styles.threadHead}>
              <button
                type="button"
                className={cx(ui.backButton, styles.mobileBack)}
                onClick={() => setMobileThreadOpen(false)}
                aria-label="Back to conversations"
              >
                <BackIcon />
              </button>
              <Avatar name={active.contact} color={active.color} size={48} />
              <div>
                <p className={styles.threadName}>{active.contact}</p>
                <p className={styles.threadDetail}>{active.detail}</p>
              </div>
            </header>

            <div ref={bubblesRef} className={styles.bubbles} aria-live="polite">
              {active.messages.length === 0 && (
                <p className={styles.emptyThread}>Say hi to {active.contact} — ask about slots, rent or visiting.</p>
              )}
              {active.messages.map((m) => (
                <div key={m.id} className={cx(styles.bubbleRow, m.from === 'me' && styles.bubbleRowMe)}>
                  <p className={cx(styles.bubble, BUBBLE_CLASS[m.from] ?? styles.bubbleThem)}>
                    {m.from === 'bot' && (
                      <span className={styles.bubbleLabel}>Auto-reply · from the listing details</span>
                    )}
                    {m.text}
                    <span className={styles.bubbleTime}>{m.time}</span>
                  </p>
                </div>
              ))}
              {showRequest && (
                <div ref={requestRef}>
                  <RequestCard
                    isOwner={isOwner}
                    status={requestStatus}
                    requester={active.requester ?? requesterName}
                    listingName={listingNames[active.listingId] ?? 'this boarding house'}
                    onAccept={() => onAcceptRequest?.(active.listingId)}
                    onDecline={() => onDeclineRequest?.(active.listingId)}
                    onWriteReview={onWriteReview ? () => onWriteReview(active.listingId) : undefined}
                  />
                </div>
              )}
            </div>

            {!isOwner && (
              <div className={styles.quickReplies} role="group" aria-label="Quick replies">
                {QUICK_REPLIES.map((q) => (
                  <button key={q.id} type="button" className={styles.quickReply} onClick={() => sendQuickReply(q)}>
                    {q.text}
                  </button>
                ))}
              </div>
            )}

            <form className={cx(styles.composer, !isOwner && styles.composerWithChips)} onSubmit={send}>
              <label className={styles.composerField}>
                <span className={ui.visuallyHidden}>Message</span>
                <input
                  type="text"
                  className={styles.composerInput}
                  placeholder={isOwner ? 'Type your reply…' : 'Type your message…'}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  maxLength={1000}
                />
              </label>
              <button type="submit" className={styles.sendButton} aria-label="Send message" disabled={!draft.trim()}>
                <SendIcon size={20} />
              </button>
            </form>
          </section>
        ) : (
          <section className={styles.thread}>
            <p className={styles.emptyThread}>No conversations yet.</p>
          </section>
        )}
      </div>
    </Screen>
  );
}
