import { startTransition, useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router-dom';

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

/* Layout route that renders its child routes only when `allowed`, otherwise redirects.
   Sessions live in memory, so a refresh or a stale back/forward entry lands on a safe screen. */
function Guard({ allowed, redirectTo }) {
  return allowed ? <Outlet /> : <Navigate to={redirectTo} replace />;
}

function App() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

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
  }, [pathname]);

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

  // React Router runs navigations as transitions. Ending a session in that same transition keeps the
  // route guards from seeing the cleared session on the old screen and redirecting somewhere else first.
  const leaveSession = (path) => startTransition(() => {
    setBoarder(null);
    setOwner(null);
    setSelectedId(null);
    setActiveThreadId(null);
    navigate(path);
  });

  const logout = () => leaveSession('/');

  const openPost = (listing, role = 'boarder') => {
    setSelectedId(listing.id);
    navigate(role === 'owner' ? '/owner-post-details' : '/post-details');
  };

  const openReviews = (listing, role = 'boarder') => {
    setSelectedId(listing.id);
    navigate(role === 'owner' ? '/owner-reviews' : '/reviews');
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
    navigate('/boarder-messages');
  };

  const openEditor = (listing = null) => {
    setEditingListing(listing);
    navigate('/owner-post');
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
    navigate(needsCredentials ? '/send-credentials' : '/owner-home');
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
    navigate('/boarder-login');
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
    onHome: () => navigate('/boarder-home'),
    onOpenMessages: () => openBoarderMessages(),
    onOpenProfile: () => navigate('/boarder-profile'),
    onLogout: logout,
  };

  const ownerNav = {
    onHome: () => navigate('/owner-home'),
    onPost: () => openEditor(null),
    onOpenMessages: () => navigate('/owner-messages'),
    onOpenProfile: () => navigate('/owner-profile'),
    onLogout: logout,
  };

  const reservedListing = reservation && allListings.find((l) => l.id === reservation.listingId);

  return (
    <Routes>
      <Route
        path="/"
        element={(
          <WelcomeRoleSelect
            onSelectBoarder={() => navigate('/boarder-login')}
            onSelectOwner={() => navigate('/owner-login')}
          />
        )}
      />

      <Route
        path="/boarder-login"
        element={(
          <BoarderLogin
            initialEmail={signupFor('boarder')?.email}
            notice={signupNotice('boarder')}
            onBack={() => { setSignup(null); navigate('/'); }}
            onLogin={({ email, password }) => {
              const account = findAccount('boarder', email, password);
              const name = account?.fullName ?? displayNameFor({ email, role: 'boarder' });
              setBoarder({ email, name });
              // Same boarder logging back in keeps their edits; anyone else starts from a blank profile.
              setBoarderProfile((p) => (accountKey(p.email) === accountKey(email)
                ? { ...p, name, ...(account && { phone: account.contactNumber }) }
                : blankBoarderProfile({ name, email, phone: account?.contactNumber })));
              setSignup(null);
              navigate('/boarder-home');
            }}
            onResetPassword={resetPassword('boarder')}
            onCreateAccount={() => navigate('/boarder-register')}
          />
        )}
      />

      <Route
        path="/boarder-register"
        element={(
          <BoarderRegister
            onBack={() => navigate('/')}
            onBackToLogin={() => navigate('/boarder-login')}
            onRegister={register('boarder')}
          />
        )}
      />

      <Route
        path="/owner-login"
        element={(
          <OwnerLogin
            initialEmail={signupFor('owner')?.email}
            notice={signupNotice('owner')}
            onBack={() => { setSignup(null); navigate('/'); }}
            onSubmit={({ email, password }) => {
              const account = findAccount('owner', email, password);
              startOwnerSession({
                email,
                name: account?.fullName ?? displayNameFor({ email, role: 'owner' }),
                phone: account?.contactNumber,
              });
            }}
            onResetPassword={resetPassword('owner')}
            onCreateAccount={() => navigate('/owner-register')}
          />
        )}
      />

      <Route
        path="/owner-register"
        element={(
          <OwnerRegister
            onBack={() => navigate('/')}
            onBackToLogin={() => navigate('/owner-login')}
            onRegister={register('owner')}
          />
        )}
      />

      {/* Boarder screens need a logged-in boarder. */}
      <Route element={<Guard allowed={!!boarder} redirectTo="/" />}>
        <Route
          path="/boarder-home"
          element={(
            <BoarderHome
              listings={feedListings}
              session={boarderSession}
              onOpenMessages={openBoarderMessages}
              onViewPost={(l) => openPost(l)}
              onOpenProfile={boarderNav.onOpenProfile}
              onLogout={logout}
            />
          )}
        />

        <Route
          path="/boarder-messages"
          element={(
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
              onWriteReview={(listingId) => { setSelectedId(listingId); navigate('/write-review'); }}
            />
          )}
        />

        <Route
          path="/boarder-profile"
          element={(
            <Profile
              session={boarderSession}
              nav={boarderNav}
              profile={boarderProfile}
              reservation={reservedListing ? { listing: reservedListing, status: reservation.status } : null}
              myReviews={Object.entries(submittedReviews).flatMap(([id, reviews]) =>
                reviews.map((review) => ({ listing: allListings.find((l) => l.id === id), review })))}
              ownersMessaged={boarderThreadsView.map((t) => ({ name: t.contact, color: t.color }))}
              onOpenListing={(l) => openPost(l)}
              onEditProfile={() => navigate('/boarder-edit-profile')}
            />
          )}
        />

        <Route
          path="/boarder-edit-profile"
          element={(
            <EditProfile
              session={boarderSession}
              nav={boarderNav}
              profile={boarderProfile}
              onCancel={() => navigate('/boarder-profile')}
              onSave={(profile) => { setBoarderProfile(profile); navigate('/boarder-profile'); }}
            />
          )}
        />

        {/* Listing screens need a selected listing (it is lost on a page refresh). */}
        <Route element={<Guard allowed={!!selectedListing} redirectTo="/boarder-home" />}>
          <Route
            path="/post-details"
            element={(
              <PostDetails
                listing={selectedListing}
                reviewStats={statsFor(selectedListing)}
                reserved={reservation?.listingId === selectedListing?.id}
                session={boarderSession}
                onBack={() => navigate('/boarder-home')}
                onMessageOwner={openBoarderMessages}
                onReserve={(l) => {
                  setReservation({ listingId: l.id, status: 'pending' });
                  navigate('/reservation-sent');
                }}
                onOpenReviews={(l) => openReviews(l)}
                onOpenMessages={boarderNav.onOpenMessages}
                onOpenProfile={boarderNav.onOpenProfile}
                onLogout={logout}
              />
            )}
          />

          <Route
            path="/reservation-sent"
            element={(
              <ReservationSent
                session={boarderSession}
                nav={boarderNav}
                listing={selectedListing}
                onMessageOwner={openBoarderMessages}
                onBackHome={() => navigate('/boarder-home')}
              />
            )}
          />

          <Route
            path="/reviews"
            element={(
              <Reviews
                session={boarderSession}
                nav={boarderNav}
                listing={selectedListing}
                summary={statsFor(selectedListing)}
                requestStatus={requestStatuses[selectedListing?.id] ?? 'none'}
                onBack={() => navigate('/post-details')}
                onRequestReview={() => {
                  setReviewRequests((prev) => ({ ...prev, [selectedListing.id]: { status: 'pending', by: boarderName } }));
                  navigate('/review-request-sent');
                }}
                onViewRequest={() => navigate('/review-request-sent')}
                onWriteReview={() => navigate('/write-review')}
              />
            )}
          />

          <Route
            path="/review-request-sent"
            element={(
              <ReviewRequestSent
                session={boarderSession}
                nav={boarderNav}
                listing={selectedListing}
                onBackToPost={() => navigate('/post-details')}
                onPreviewAccepted={() => { setRequestStatus(selectedListing.id, 'accepted'); navigate('/write-review'); }}
                onPreviewDeclined={() => { setRequestStatus(selectedListing.id, 'declined'); navigate('/review-declined'); }}
              />
            )}
          />

          <Route
            path="/review-declined"
            element={(
              <ReviewRequestDeclined
                session={boarderSession}
                nav={boarderNav}
                listing={selectedListing}
                onBackToPost={() => navigate('/post-details')}
                onMessageOwner={openBoarderMessages}
              />
            )}
          />

          <Route
            path="/write-review"
            element={(
              <WriteReview
                session={boarderSession}
                nav={boarderNav}
                listing={selectedListing}
                onCancel={() => navigate('/reviews')}
                onSubmit={({ rating, tags, text }) => {
                  const review = {
                    id: `mine-${Date.now()}`, author: boarderName, color: '#e5383b', when: 'Just now', rating, tags, text,
                  };
                  setSubmittedReviews((prev) => ({ ...prev, [selectedListing.id]: [review, ...(prev[selectedListing.id] ?? [])] }));
                  setRequestStatus(selectedListing.id, 'reviewed');
                  setLastReview(review);
                  navigate('/review-submitted');
                }}
              />
            )}
          />

          <Route element={<Guard allowed={!!lastReview} redirectTo="/reviews" />}>
            <Route
              path="/review-submitted"
              element={(
                <ReviewSubmitted
                  session={boarderSession}
                  nav={boarderNav}
                  listing={selectedListing}
                  review={lastReview}
                  onSeeReviews={() => navigate('/reviews')}
                  onBackHome={() => navigate('/boarder-home')}
                />
              )}
            />
          </Route>
        </Route>
      </Route>

      {/* Owner screens need a logged-in owner. */}
      <Route element={<Guard allowed={!!owner} redirectTo="/" />}>
        <Route
          path="/send-credentials"
          element={(
            <SendCredentials
              onBack={() => startTransition(() => { setOwner(null); navigate('/owner-login'); })}
              onSend={() => {
                setOwnerCredentials((prev) => ({ ...prev, [accountKey(owner.email)]: 'review' }));
                setOwner((o) => ({ ...o, needsCredentials: false }));
                navigate('/owner-credentials-review');
              }}
            />
          )}
        />

        <Route
          path="/owner-credentials-review"
          element={<CredentialsUnderReview onContinue={() => navigate('/owner-home')} />}
        />

        {/* An owner who still needs to send credentials can't reach the dashboard or any other owner screen. */}
        <Route element={<Guard allowed={!owner?.needsCredentials} redirectTo="/send-credentials" />}>
          <Route
            path="/owner-home"
            element={(
              <BoarderHome
                session={ownerSession}
                listings={feedListings}
                onViewPost={(l) => openPost(l, 'owner')}
                onPost={ownerNav.onPost}
                onOpenMessages={ownerNav.onOpenMessages}
                onOpenProfile={ownerNav.onOpenProfile}
                onLogout={logout}
              />
            )}
          />

          <Route element={<Guard allowed={!!selectedListing} redirectTo="/owner-home" />}>
            <Route
              path="/owner-post-details"
              element={(
                <PostDetails
                  session={ownerSession}
                  listing={selectedListing}
                  reviewStats={statsFor(selectedListing)}
                  onBack={() => navigate('/owner-home')}
                  onOpenReviews={(l) => openReviews(l, 'owner')}
                  onPost={ownerNav.onPost}
                  onOpenMessages={ownerNav.onOpenMessages}
                  onOpenProfile={ownerNav.onOpenProfile}
                  onLogout={logout}
                />
              )}
            />

            <Route
              path="/owner-reviews"
              element={(
                <Reviews
                  session={ownerSession}
                  nav={ownerNav}
                  listing={selectedListing}
                  summary={statsFor(selectedListing)}
                  onBack={() => navigate('/owner-post-details')}
                />
              )}
            />
          </Route>

          <Route
            path="/owner-post"
            element={(
              <PostEditor
                key={editingListing?.id ?? 'new'}
                session={ownerSession}
                nav={ownerNav}
                listing={editingListing}
                ownerName={ownerName}
                onDiscard={() => navigate(editingListing ? '/owner-profile' : '/owner-home')}
                onSave={(listing) => {
                  setOwnerListings((prev) => (prev.some((l) => l.id === listing.id)
                    ? prev.map((l) => (l.id === listing.id ? listing : l))
                    : [...prev, listing]));
                  setSavedListing(listing);
                  navigate('/post-saved');
                }}
              />
            )}
          />

          <Route element={<Guard allowed={!!savedListing} redirectTo="/owner-home" />}>
            <Route
              path="/post-saved"
              element={(
                <PostSaved
                  session={ownerSession}
                  nav={ownerNav}
                  listing={savedListing}
                  onEditAgain={(l) => openEditor(l)}
                  onViewHome={() => navigate('/owner-home')}
                />
              )}
            />
          </Route>

          <Route
            path="/owner-messages"
            element={(
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
            )}
          />

          <Route
            path="/owner-profile"
            element={(
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
                onEditProfile={() => navigate('/owner-edit-profile')}
              />
            )}
          />

          <Route
            path="/owner-edit-profile"
            element={(
              <EditProfile
                session={ownerSession}
                nav={ownerNav}
                profile={ownerProfile}
                onCancel={() => navigate('/owner-profile')}
                onSave={(profile) => { setOwnerProfile(profile); navigate('/owner-profile'); }}
              />
            )}
          />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
