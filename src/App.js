import { useCallback, useEffect, useMemo, useState } from 'react';

import WelcomeRoleSelect from './components/WelcomeRoleSelect/WelcomeRoleSelect';
import BoarderLogin from './components/BoarderLogin/BoarderLogin';
import BoarderRegister from './components/BoarderRegister/BoarderRegister';
import OwnerLogin from './components/OwnerLogin/OwnerLogin';
import OwnerRegister from './components/OwnerRegister/OwnerRegister';
import SendCredentials from './components/SendCredentials/SendCredentials';
import CredentialsUnderReview from './components/CredentialsUnderReview/CredentialsUnderReview';

import BoarderHome from './components/BoarderHome/BoarderHome';
import PostDetails from './components/PostDetails/PostDetails';
import Reviews from './components/Reviews/Reviews';
import Messages from './components/Messages/Messages';
import Profile from './components/Profile/Profile';
import EditProfile from './components/EditProfile/EditProfile';

import WriteReview from './components/WriteReview/WriteReview';
import PostEditor from './components/PostEditor/PostEditor';
import {
  PostSaved,
  ReservationSent,
  ReviewRequestDeclined,
  ReviewRequestSent,
  ReviewSubmitted,
} from './components/StatusScreens/StatusScreens';

import { displayNameFor } from './components/BoarderTopBar/BoarderTopBar';
import { LISTINGS } from './components/BoarderHome/listings';
import { reviewsFor } from './data/reviews';
import {
  BOARDER_THREADS, OWNER_THREADS, nextMessageId, nowLabel, personalizeThreads, reviveThreads,
} from './data/messages';
import usePersistentState from './hooks/usePersistentState';
import {
  BOARDER_PROFILE, OWNER_EXTRA_LISTINGS, OWNER_LISTING_IDS, OWNER_PROFILE, blankBoarderProfile, blankOwnerProfile,
} from './data/profiles';

const INITIAL_OWNER_LISTINGS = [
  ...LISTINGS.filter((l) => OWNER_LISTING_IDS.includes(l.id)),
  ...OWNER_EXTRA_LISTINGS,
];

const REQUESTER_THREAD_ID = 'maria';

const PRE_DASHBOARD_SCREENS = new Set(['owner-login', 'owner-register', 'owner-credentials', 'owner-credentials-review']);

/* Append a message to a thread and move that thread to the top of the list.
   `incoming` marks a message from the other side, which adds to the unread count. */
const withMessage = (threads, threadId, text, from = 'me', incoming = false) => {
  const thread = threads.find((t) => t.id === threadId);
  if (!thread) return threads;
  const updated = {
    ...thread,
    time: 'now',
    unread: incoming ? (thread.unread ?? 0) + 1 : thread.unread,
    messages: [...thread.messages, { id: nextMessageId(), from, text, time: nowLabel() }],
  };
  return [updated, ...threads.filter((t) => t.id !== threadId)];
};

/* Owner threads with the logged-in boarder (the seeded requester thread, or one started by the boarder).
   Each one is paired with the boarder's thread about the same listing. */
const isBoarderChat = (thread) => thread.id === REQUESTER_THREAD_ID || thread.withBoarder;

const newBoarderThread = (listing) => ({
  id: listing.id,
  listingId: listing.id,
  contact: listing.owner,
  context: listing.name,
  detail: `Owner · ${listing.name}`,
  time: 'now',
  unread: 0,
  messages: [],
});

const newOwnerThread = (listing) => ({
  id: `boarder-${listing.id}`,
  listingId: listing.id,
  withBoarder: true,
  contact: '',
  color: '#1d4ed8',
  detail: `Student · Re: ${listing.name}`,
  time: 'now',
  unread: 0,
  messages: [],
});

/* Deliver a message into the other side's thread for `listing`, creating that thread if needed. */
const deliver = (threads, matches, create, text, from) => {
  const existing = threads.find(matches);
  const thread = existing ?? create();
  return withMessage(existing ? threads : [thread, ...threads], thread.id, text, from, true);
};

const accountKey = (email = '') => email.trim().toLowerCase();

function App() {
  const [screen, setScreen] = useState('welcome');

  const [boarder, setBoarder] = useState(null);
  const [owner, setOwner] = useState(null);
  const [boarderProfile, setBoarderProfile] = usePersistentState('boarderProfile', BOARDER_PROFILE);
  const [ownerProfile, setOwnerProfile] = usePersistentState('ownerProfile', OWNER_PROFILE);

  const [accounts, setAccounts] = usePersistentState('accounts', { boarder: {}, owner: {} });
  const [signup, setSignup] = useState(null);
  // Owners who have submitted credentials: { [email]: 'review' | 'approved' }. The sample owner already has.
  const [ownerCredentials, setOwnerCredentials] = usePersistentState(
    'ownerCredentials', { [accountKey(OWNER_PROFILE.email)]: 'review' });

  const [ownerListings, setOwnerListings] = usePersistentState('ownerListings', INITIAL_OWNER_LISTINGS);
  const [selectedId, setSelectedId] = useState(null);
  const [reservation, setReservation] = useState(null);
  const [reviewRequests, setReviewRequests] = useState({});
  const [submittedReviews, setSubmittedReviews] = useState({});
  const [lastReview, setLastReview] = useState(null);
  const [boarderThreads, setBoarderThreads] = usePersistentState(
    'boarderThreads', BOARDER_THREADS, (stored) => reviveThreads(stored, BOARDER_THREADS));
  const [ownerThreads, setOwnerThreads] = usePersistentState(
    'ownerThreads', OWNER_THREADS, (stored) => reviveThreads(stored, OWNER_THREADS));
  const [activeThreadId, setActiveThreadId] = useState(null);
  const [editingListing, setEditingListing] = useState(null);
  const [savedListing, setSavedListing] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [screen]);

  const ownerName = ownerProfile.name;

  // Every post in ownerListings belongs to the current owner, so it always shows their name.
  const myListings = useMemo(
    () => ownerListings.map((l) => ({ ...l, owner: ownerName })), [ownerListings, ownerName]);
  const ownedIds = useMemo(() => new Set(myListings.map((l) => l.id)), [myListings]);

  // Owner edits to a public listing show up in the feed; brand-new posts stay off the feed
  // until the owner's credentials are approved.
  const feedListings = useMemo(() => {
    const byId = Object.fromEntries(myListings.map((l) => [l.id, l]));
    return LISTINGS.map((l) => byId[l.id] ?? l);
  }, [myListings]);

  const allListings = useMemo(() => {
    const ids = new Set(feedListings.map((l) => l.id));
    return [...feedListings, ...myListings.filter((l) => !ids.has(l.id))];
  }, [feedListings, myListings]);

  const selectedListing = allListings.find((l) => l.id === selectedId) ?? null;
  const listingNames = useMemo(() => Object.fromEntries(allListings.map((l) => [l.id, l.name])), [allListings]);
  const requestStatuses = useMemo(
    () => Object.fromEntries(Object.entries(reviewRequests).map(([id, r]) => [id, r.status])),
    [reviewRequests],
  );

  const boarderName = boarderProfile.name;
  const boarderSession = { role: 'boarder', email: boarder?.email, name: boarderName };
  const ownerSession = { role: 'owner', email: owner?.email, name: ownerName };
  const statsFor = (listing) => (listing ? reviewsFor(listing.id, submittedReviews[listing.id]) : null);

  // Sample greetings ("Hello …!") and the requester's thread use the logged-in boarder's name.
  // Boarder chats about the current owner's houses show the owner's current name.
  const boarderThreadsView = useMemo(
    () => personalizeThreads(boarderThreads, boarderName)
      .map((t) => (ownedIds.has(t.listingId) ? { ...t, contact: ownerName } : t)),
    [boarderThreads, boarderName, ownedIds, ownerName]);

  // Owner inbox: chats with the logged-in boarder show their name; the requester's thread carries the review request.
  const ownerThreadsView = useMemo(() => personalizeThreads(ownerThreads, boarderName).map((t) => {
    if (!isBoarderChat(t)) return t;
    if (t.id !== REQUESTER_THREAD_ID) return { ...t, contact: boarderName };
    const request = reviewRequests[t.listingId];
    return request ? { ...t, contact: request.by, requester: request.by } : t;
  }), [ownerThreads, reviewRequests, boarderName]);

  const go = setScreen;

  const logout = () => {
    setBoarder(null);
    setOwner(null);
    setSelectedId(null);
    setActiveThreadId(null);
    go('welcome');
  };

  const openPost = (listing, role = 'boarder') => {
    setSelectedId(listing.id);
    go(role === 'owner' ? 'owner-post-details' : 'post-details');
  };

  const openReviews = (listing, role = 'boarder') => {
    setSelectedId(listing.id);
    go(role === 'owner' ? 'owner-reviews' : 'reviews');
  };

  // Boarder → Messages, optionally opening (or starting) the conversation about a listing.
  const openBoarderMessages = (listing) => {
    if (listing) {
      setBoarderThreads((threads) => (threads.some((t) => t.id === listing.id)
        ? threads
        : [newBoarderThread(listing), ...threads]));
      setActiveThreadId(listing.id);
    } else {
      setActiveThreadId(null);
    }
    go('boarder-messages');
  };

  const openEditor = (listing = null) => {
    setEditingListing(listing);
    go('owner-post');
  };

  // `from` is 'me' for typed/quick-reply messages and 'bot' for the boarder's auto-reply helper.
  // Messages in a boarder ↔ current-owner chat are also delivered to the other side's inbox.
  const sendMessage = (role) => (threadId, text, from = 'me') => {
    const incomingAs = from === 'me' ? 'them' : from;

    if (role === 'owner') {
      setOwnerThreads((threads) => withMessage(threads, threadId, text, from));
      const thread = ownerThreads.find((t) => t.id === threadId);
      const listing = thread && isBoarderChat(thread) && allListings.find((l) => l.id === thread.listingId);
      if (!listing) return;
      setBoarderThreads((threads) => deliver(
        threads, (t) => t.listingId === listing.id, () => newBoarderThread(listing), text, incomingAs));
      return;
    }

    setBoarderThreads((threads) => withMessage(threads, threadId, text, from));
    const thread = boarderThreads.find((t) => t.id === threadId);
    const listing = thread && ownedIds.has(thread.listingId) && allListings.find((l) => l.id === thread.listingId);
    if (!listing) return;
    setOwnerThreads((threads) => deliver(
      threads, (t) => isBoarderChat(t) && t.listingId === listing.id, () => newOwnerThread(listing), text, incomingAs));
  };

  const markBoarderRead = useCallback(
    (id) => setBoarderThreads((ts) => ts.map((t) => (t.id === id ? { ...t, unread: 0 } : t))), [setBoarderThreads]);
  const markOwnerRead = useCallback(
    (id) => setOwnerThreads((ts) => ts.map((t) => (t.id === id ? { ...t, unread: 0 } : t))), [setOwnerThreads]);

  const setRequestStatus = (listingId, status) =>
    setReviewRequests((prev) => ({ ...prev, [listingId]: { by: prev[listingId]?.by ?? boarderName, status } }));

  // Sign an owner in. Owners who haven't sent credentials go to the camera step before the dashboard.
  const startOwnerSession = ({ email, name, phone }) => {
    const needsCredentials = !ownerCredentials[accountKey(email)];
    setOwner({ email, name, needsCredentials });
    // Same owner logging back in keeps their edits; anyone else starts without the sample owner's details.
    setOwnerProfile((p) => (accountKey(p.email) === accountKey(email)
      ? { ...p, name, ...(phone && { phone }) }
      : blankOwnerProfile({ name, email, phone })));
    setSignup(null);
    go(needsCredentials ? 'owner-credentials' : 'owner-home');
  };

  // Save the new account. New owners are signed in and sent to the camera step; boarders go to their login screen.
  const register = (role) => ({ email, fullName, contactNumber, password }) => {
    setAccounts((prev) => ({
      ...prev,
      [role]: { ...prev[role], [accountKey(email)]: { email, fullName, contactNumber, password } },
    }));
    if (role === 'owner') {
      startOwnerSession({ email, name: fullName, phone: contactNumber });
      return;
    }
    setSignup({ role, email });
    go('boarder-login');
  };

  // Recovery never reveals whether an email is registered; unregistered emails already log in with any password.
  const resetPassword = (role) => ({ email, password }) => setAccounts((prev) => {
    const account = prev[role][accountKey(email)];
    if (!account) return prev;
    return { ...prev, [role]: { ...prev[role], [accountKey(email)]: { ...account, password } } };
  });

  // Registered emails must use their password; unknown emails still log in (demo mode, no backend).
  const findAccount = (role, email, password) => {
    const account = accounts[role][accountKey(email)];
    if (account && account.password !== password) throw new Error('Incorrect password. Please try again.');
    return account;
  };

  const signupFor = (role) => (signup?.role === role ? signup : null);
  const signupNotice = (role) => (signupFor(role)
    ? `Account created for ${signupFor(role).email}. Log in to continue.`
    : '');

  const boarderNav = {
    onHome: () => go('boarder-home'),
    onOpenMessages: () => openBoarderMessages(),
    onOpenProfile: () => go('boarder-profile'),
    onLogout: logout,
  };

  const ownerNav = {
    onHome: () => go('owner-home'),
    onPost: () => openEditor(null),
    onOpenMessages: () => go('owner-messages'),
    onOpenProfile: () => go('owner-profile'),
    onLogout: logout,
  };

  // An owner who still needs to send credentials can't reach the dashboard or any other owner screen.
  const activeScreen = owner?.needsCredentials && screen.startsWith('owner-') && !PRE_DASHBOARD_SCREENS.has(screen)
    ? 'owner-credentials'
    : screen;

  switch (activeScreen) {
    case 'boarder-login':
      return (
        <BoarderLogin
          initialEmail={signupFor('boarder')?.email}
          notice={signupNotice('boarder')}
          onBack={() => { setSignup(null); go('welcome'); }}
          onLogin={({ email, password }) => {
            const account = findAccount('boarder', email, password);
            const name = account?.fullName ?? displayNameFor({ email, role: 'boarder' });
            setBoarder({ email, name });
            // Same boarder logging back in keeps their edits; anyone else starts from a blank profile.
            setBoarderProfile((p) => (accountKey(p.email) === accountKey(email)
              ? { ...p, name, ...(account && { phone: account.contactNumber }) }
              : blankBoarderProfile({ name, email, phone: account?.contactNumber })));
            setSignup(null);
            go('boarder-home');
          }}
          onResetPassword={resetPassword('boarder')}
          onCreateAccount={() => go('boarder-register')}
        />
      );

    case 'boarder-register':
      return (
        <BoarderRegister
          onBack={() => go('welcome')}
          onBackToLogin={() => go('boarder-login')}
          onRegister={register('boarder')}
        />
      );

    case 'owner-login':
      return (
        <OwnerLogin
          initialEmail={signupFor('owner')?.email}
          notice={signupNotice('owner')}
          onBack={() => { setSignup(null); go('welcome'); }}
          onSubmit={({ email, password }) => {
            const account = findAccount('owner', email, password);
            startOwnerSession({
              email,
              name: account?.fullName ?? displayNameFor({ email, role: 'owner' }),
              phone: account?.contactNumber,
            });
          }}
          onResetPassword={resetPassword('owner')}
          onCreateAccount={() => go('owner-register')}
        />
      );

    case 'owner-register':
      return (
        <OwnerRegister
          onBack={() => go('welcome')}
          onBackToLogin={() => go('owner-login')}
          onRegister={register('owner')}
        />
      );

    case 'owner-credentials':
      return (
        <SendCredentials
          onBack={() => { setOwner(null); go('owner-login'); }}
          onSend={() => {
            setOwnerCredentials((prev) => ({ ...prev, [accountKey(owner.email)]: 'review' }));
            setOwner((o) => ({ ...o, needsCredentials: false }));
            go('owner-credentials-review');
          }}
        />
      );

    case 'owner-credentials-review':
      return <CredentialsUnderReview onContinue={() => go('owner-home')} />;

    case 'boarder-home':
      return (
        <BoarderHome
          listings={feedListings}
          session={boarderSession}
          onOpenMessages={openBoarderMessages}
          onViewPost={(l) => openPost(l)}
          onOpenProfile={boarderNav.onOpenProfile}
          onLogout={logout}
        />
      );

    case 'post-details':
      if (!selectedListing) return null;
      return (
        <PostDetails
          listing={selectedListing}
          reviewStats={statsFor(selectedListing)}
          reserved={reservation?.listingId === selectedListing.id}
          session={boarderSession}
          onBack={() => go('boarder-home')}
          onMessageOwner={openBoarderMessages}
          onReserve={(l) => {
            setReservation({ listingId: l.id, status: 'pending' });
            go('reservation-sent');
          }}
          onOpenReviews={(l) => openReviews(l)}
          onOpenMessages={boarderNav.onOpenMessages}
          onOpenProfile={boarderNav.onOpenProfile}
          onLogout={logout}
        />
      );

    case 'reservation-sent':
      if (!selectedListing) return null;
      return (
        <ReservationSent
          session={boarderSession}
          nav={boarderNav}
          listing={selectedListing}
          onMessageOwner={openBoarderMessages}
          onBackHome={() => go('boarder-home')}
        />
      );

    case 'reviews':
      if (!selectedListing) return null;
      return (
        <Reviews
          session={boarderSession}
          nav={boarderNav}
          listing={selectedListing}
          summary={statsFor(selectedListing)}
          requestStatus={requestStatuses[selectedListing.id] ?? 'none'}
          onBack={() => go('post-details')}
          onRequestReview={() => {
            setReviewRequests((prev) => ({ ...prev, [selectedListing.id]: { status: 'pending', by: boarderName } }));
            go('review-request-sent');
          }}
          onViewRequest={() => go('review-request-sent')}
          onWriteReview={() => go('write-review')}
        />
      );

    case 'review-request-sent':
      if (!selectedListing) return null;
      return (
        <ReviewRequestSent
          session={boarderSession}
          nav={boarderNav}
          listing={selectedListing}
          onBackToPost={() => go('post-details')}
          onPreviewAccepted={() => { setRequestStatus(selectedListing.id, 'accepted'); go('write-review'); }}
          onPreviewDeclined={() => { setRequestStatus(selectedListing.id, 'declined'); go('review-declined'); }}
        />
      );

    case 'review-declined':
      if (!selectedListing) return null;
      return (
        <ReviewRequestDeclined
          session={boarderSession}
          nav={boarderNav}
          listing={selectedListing}
          onBackToPost={() => go('post-details')}
          onMessageOwner={openBoarderMessages}
        />
      );

    case 'write-review':
      if (!selectedListing) return null;
      return (
        <WriteReview
          session={boarderSession}
          nav={boarderNav}
          listing={selectedListing}
          onCancel={() => go('reviews')}
          onSubmit={({ rating, tags, text }) => {
            const review = {
              id: `mine-${Date.now()}`, author: boarderName, color: '#e5383b', when: 'Just now', rating, tags, text,
            };
            setSubmittedReviews((prev) => ({ ...prev, [selectedListing.id]: [review, ...(prev[selectedListing.id] ?? [])] }));
            setRequestStatus(selectedListing.id, 'reviewed');
            setLastReview(review);
            go('review-submitted');
          }}
        />
      );

    case 'review-submitted':
      if (!selectedListing || !lastReview) return null;
      return (
        <ReviewSubmitted
          session={boarderSession}
          nav={boarderNav}
          listing={selectedListing}
          review={lastReview}
          onSeeReviews={() => go('reviews')}
          onBackHome={() => go('boarder-home')}
        />
      );

    case 'boarder-messages':
      return (
        <Messages
          key={activeThreadId ?? 'inbox'}
          session={boarderSession}
          nav={boarderNav}
          threads={boarderThreadsView}
          initialThreadId={activeThreadId ?? undefined}
          reviewRequests={requestStatuses}
          listingNames={listingNames}
          listings={allListings}
          onSend={sendMessage('boarder')}
          onOpenThread={markBoarderRead}
          onWriteReview={(listingId) => { setSelectedId(listingId); go('write-review'); }}
        />
      );

    case 'boarder-profile': {
      const reserved = reservation && allListings.find((l) => l.id === reservation.listingId);
      return (
        <Profile
          session={boarderSession}
          nav={boarderNav}
          profile={boarderProfile}
          reservation={reserved ? { listing: reserved, status: reservation.status } : null}
          myReviews={Object.entries(submittedReviews).flatMap(([id, reviews]) =>
            reviews.map((review) => ({ listing: allListings.find((l) => l.id === id), review })))}
          ownersMessaged={boarderThreadsView.map((t) => ({ name: t.contact, color: t.color }))}
          onOpenListing={(l) => openPost(l)}
          onEditProfile={() => go('boarder-edit-profile')}
        />
      );
    }

    case 'boarder-edit-profile':
      return (
        <EditProfile
          session={boarderSession}
          nav={boarderNav}
          profile={boarderProfile}
          onCancel={() => go('boarder-profile')}
          onSave={(profile) => { setBoarderProfile(profile); go('boarder-profile'); }}
        />
      );

    case 'owner-home':
      return (
        <BoarderHome
          session={ownerSession}
          listings={feedListings}
          onViewPost={(l) => openPost(l, 'owner')}
          onPost={ownerNav.onPost}
          onOpenMessages={ownerNav.onOpenMessages}
          onOpenProfile={ownerNav.onOpenProfile}
          onLogout={logout}
        />
      );

    case 'owner-post-details':
      if (!selectedListing) return null;
      return (
        <PostDetails
          session={ownerSession}
          listing={selectedListing}
          reviewStats={statsFor(selectedListing)}
          onBack={() => go('owner-home')}
          onOpenReviews={(l) => openReviews(l, 'owner')}
          onPost={ownerNav.onPost}
          onOpenMessages={ownerNav.onOpenMessages}
          onOpenProfile={ownerNav.onOpenProfile}
          onLogout={logout}
        />
      );

    case 'owner-reviews':
      if (!selectedListing) return null;
      return (
        <Reviews
          session={ownerSession}
          nav={ownerNav}
          listing={selectedListing}
          summary={statsFor(selectedListing)}
          onBack={() => go('owner-post-details')}
        />
      );

    case 'owner-post':
      return (
        <PostEditor
          key={editingListing?.id ?? 'new'}
          session={ownerSession}
          nav={ownerNav}
          listing={editingListing}
          ownerName={ownerName}
          onDiscard={() => go(editingListing ? 'owner-profile' : 'owner-home')}
          onSave={(listing) => {
            setOwnerListings((prev) => (prev.some((l) => l.id === listing.id)
              ? prev.map((l) => (l.id === listing.id ? listing : l))
              : [...prev, listing]));
            setSavedListing(listing);
            go('post-saved');
          }}
        />
      );

    case 'post-saved':
      if (!savedListing) return null;
      return (
        <PostSaved
          session={ownerSession}
          nav={ownerNav}
          listing={savedListing}
          onEditAgain={(l) => openEditor(l)}
          onViewHome={() => go('owner-home')}
        />
      );

    case 'owner-messages':
      return (
        <Messages
          session={ownerSession}
          nav={ownerNav}
          threads={ownerThreadsView}
          reviewRequests={requestStatuses}
          requesterName={boarderName}
          listingNames={listingNames}
          onSend={sendMessage('owner')}
          onOpenThread={markOwnerRead}
          onAcceptRequest={(listingId) => setRequestStatus(listingId, 'accepted')}
          onDeclineRequest={(listingId) => setRequestStatus(listingId, 'declined')}
        />
      );

    case 'owner-profile':
      return (
        <Profile
          session={ownerSession}
          nav={ownerNav}
          profile={ownerProfile}
          ownerListings={myListings}
          currentBoarders={ownerThreadsView.map((t) => ({ name: t.contact, color: t.color }))}
          boarderCount={ownerProfile.boarders}
          rating={reviewsFor(OWNER_LISTING_IDS[0], submittedReviews[OWNER_LISTING_IDS[0]]).average}
          credentialsStatus={ownerCredentials[accountKey(owner?.email)] ?? 'review'}
          onEditListing={(l) => openEditor(l)}
          onAddListing={() => openEditor(null)}
          onEditProfile={() => go('owner-edit-profile')}
        />
      );

    case 'owner-edit-profile':
      return (
        <EditProfile
          session={ownerSession}
          nav={ownerNav}
          profile={ownerProfile}
          onCancel={() => go('owner-profile')}
          onSave={(profile) => { setOwnerProfile(profile); go('owner-profile'); }}
        />
      );

    default:
      return (
        <WelcomeRoleSelect
          onSelectBoarder={() => go('boarder-login')}
          onSelectOwner={() => go('owner-login')}
        />
      );
  }
}

export default App;
