import { useCallback, useEffect, useMemo, useState } from 'react';

// Entry & owner onboarding
import WelcomeRoleSelect from './components/WelcomeRoleSelect/WelcomeRoleSelect';
import BoarderLogin from './components/BoarderLogin/BoarderLogin';
import BoarderRegister from './components/BoarderRegister/BoarderRegister';
import OwnerLogin from './components/OwnerLogin/OwnerLogin';
import OwnerRegister from './components/OwnerRegister/OwnerRegister';
import SendCredentials from './components/SendCredentials/SendCredentials';
import CredentialsUnderReview from './components/CredentialsUnderReview/CredentialsUnderReview';

// Shared boarder/owner screens (role decides the Figma variant)
import BoarderHome from './components/BoarderHome/BoarderHome';             // B3 / D5 (+ B4 / D6 filters)
import PostDetails from './components/PostDetails/PostDetails';             // B5 / D7
import Reviews from './components/Reviews/Reviews';                         // B7 / D8
import Messages from './components/Messages/Messages';                      // B10 / D10, D12–D14
import Profile from './components/Profile/Profile';                         // B11 / D11
import EditProfile from './components/EditProfile/EditProfile';             // B14 / D16

// Boarder-only and owner-only screens
import WriteReview from './components/WriteReview/WriteReview';             // B9
import PostEditor from './components/PostEditor/PostEditor';                // D9
import {
  PostSaved,              // D15
  ReservationSent,        // B6
  ReviewRequestDeclined,  // B12
  ReviewRequestSent,      // B8
  ReviewSubmitted,        // B13
} from './components/StatusScreens/StatusScreens';

import { displayNameFor } from './components/BoarderTopBar/BoarderTopBar';
import { LISTINGS } from './components/BoarderHome/listings';
import { reviewsFor } from './data/reviews';
import { BOARDER_THREADS, OWNER_THREADS, nextMessageId, nowLabel, personalizeThreads } from './data/messages';
import {
  BOARDER_PROFILE, OWNER_EXTRA_LISTINGS, OWNER_LISTING_IDS, OWNER_PROFILE, blankBoarderProfile,
} from './data/profiles';

const INITIAL_OWNER_LISTINGS = [
  ...LISTINGS.filter((l) => OWNER_LISTING_IDS.includes(l.id)),
  ...OWNER_EXTRA_LISTINGS,
];

// The owner-side thread that belongs to the boarder who asks to review (Figma: Maria Santos).
const REQUESTER_THREAD_ID = 'maria';

/* Append a message to a thread and move that thread to the top of the list. */
const withMessage = (threads, threadId, text, from = 'me') => {
  const thread = threads.find((t) => t.id === threadId);
  if (!thread) return threads;
  const updated = {
    ...thread,
    time: 'now',
    messages: [...thread.messages, { id: nextMessageId(), from, text, time: nowLabel() }],
  };
  return [updated, ...threads.filter((t) => t.id !== threadId)];
};

const accountKey = (email = '') => email.trim().toLowerCase();

function App() {
  const [screen, setScreen] = useState('welcome');

  // ---------- Sessions ----------
  const [boarder, setBoarder] = useState(null);           // { email, name }
  const [owner, setOwner] = useState(null);               // { email, name }
  const [boarderProfile, setBoarderProfile] = useState(BOARDER_PROFILE);
  const [ownerProfile, setOwnerProfile] = useState(OWNER_PROFILE);

  // ---------- Registered accounts (in-memory until there is a backend) ----------
  const [accounts, setAccounts] = useState({ boarder: {}, owner: {} }); // { [role]: { [email]: account } }
  const [signup, setSignup] = useState(null); // { role, email } — just registered, shown on the login screen

  // ---------- Shared app data (kept across log-outs so both roles can see the same requests) ----------
  const [ownerListings, setOwnerListings] = useState(INITIAL_OWNER_LISTINGS);
  const [selectedId, setSelectedId] = useState(null);
  const [reservation, setReservation] = useState(null);           // { listingId, status }
  const [reviewRequests, setReviewRequests] = useState({});       // { [listingId]: { status, by } }
  const [submittedReviews, setSubmittedReviews] = useState({});   // { [listingId]: review[] }
  const [lastReview, setLastReview] = useState(null);
  const [boarderThreads, setBoarderThreads] = useState(BOARDER_THREADS);
  const [ownerThreads, setOwnerThreads] = useState(OWNER_THREADS);
  const [activeThreadId, setActiveThreadId] = useState(null);
  const [editingListing, setEditingListing] = useState(null);     // D9: null = new post
  const [savedListing, setSavedListing] = useState(null);         // D15

  // Every screen change starts at the top of the page.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [screen]);

  // ---------- Derived data ----------
  // Owner edits to a public listing (e.g. Sampaguita) show up in the feed; brand-new posts stay
  // off the feed until credentials are approved, as the Figma copy says.
  const feedListings = useMemo(() => {
    const byId = Object.fromEntries(ownerListings.map((l) => [l.id, l]));
    return LISTINGS.map((l) => byId[l.id] ?? l);
  }, [ownerListings]);

  const allListings = useMemo(() => {
    const ids = new Set(feedListings.map((l) => l.id));
    return [...feedListings, ...ownerListings.filter((l) => !ids.has(l.id))];
  }, [feedListings, ownerListings]);

  const selectedListing = allListings.find((l) => l.id === selectedId) ?? null;
  const listingNames = useMemo(() => Object.fromEntries(allListings.map((l) => [l.id, l.name])), [allListings]);
  const requestStatuses = useMemo(
    () => Object.fromEntries(Object.entries(reviewRequests).map(([id, r]) => [id, r.status])),
    [reviewRequests],
  );

  const boarderName = boarderProfile.name;
  const boarderSession = { role: 'boarder', email: boarder?.email, name: boarderName };
  const ownerSession = { role: 'owner', email: owner?.email, name: ownerProfile.name };
  const statsFor = (listing) => (listing ? reviewsFor(listing.id, submittedReviews[listing.id]) : null);

  // Owner inbox: the requester's thread carries the review request (D12–D14).
  // Sample greetings ("Hello …!") and the requester's thread use the logged-in boarder's name.
  const boarderThreadsView = useMemo(
    () => personalizeThreads(boarderThreads, boarderName), [boarderThreads, boarderName]);

  const ownerThreadsView = useMemo(() => personalizeThreads(ownerThreads, boarderName).map((t) => {
    if (t.id !== REQUESTER_THREAD_ID) return t;
    const request = reviewRequests[t.listingId];
    return request ? { ...t, contact: request.by, requester: request.by } : t;
  }), [ownerThreads, reviewRequests, boarderName]);

  // ---------- Navigation helpers ----------
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
      setBoarderThreads((threads) => (threads.some((t) => t.id === listing.id) ? threads : [
        {
          id: listing.id,
          listingId: listing.id,
          contact: listing.owner,
          context: listing.name,
          detail: `Owner · ${listing.name}`,
          time: 'now',
          unread: 0,
          messages: [],
        },
        ...threads,
      ]));
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
  const sendMessage = (role) => (threadId, text, from = 'me') =>
    (role === 'owner' ? setOwnerThreads : setBoarderThreads)((threads) => withMessage(threads, threadId, text, from));

  const markBoarderRead = useCallback(
    (id) => setBoarderThreads((ts) => ts.map((t) => (t.id === id ? { ...t, unread: 0 } : t))), []);
  const markOwnerRead = useCallback(
    (id) => setOwnerThreads((ts) => ts.map((t) => (t.id === id ? { ...t, unread: 0 } : t))), []);

  const setRequestStatus = (listingId, status) =>
    setReviewRequests((prev) => ({ ...prev, [listingId]: { by: prev[listingId]?.by ?? boarderName, status } }));

  // Save the new account, then send the user to their login screen with the email pre-filled.
  const register = (role) => ({ email, fullName, contactNumber, password }) => {
    setAccounts((prev) => ({
      ...prev,
      [role]: { ...prev[role], [accountKey(email)]: { email, fullName, contactNumber, password } },
    }));
    setSignup({ role, email });
    go(role === 'owner' ? 'owner-login' : 'boarder-login');
  };

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

  // ---------- Screens ----------
  switch (screen) {
    /* ===== Entry ===== */
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
            const name = account?.fullName ?? displayNameFor({ email, role: 'owner' });
            setOwner({ email, name });
            setOwnerProfile((p) => ({ ...p, email, name, ...(account && { phone: account.contactNumber }) }));
            setSignup(null);
            go('owner-home');
          }}
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

    case 'sendCredentials':
      return <SendCredentials onBack={() => go('owner-login')} onSend={() => go('credentialsReview')} />;

    case 'credentialsReview':
      return <CredentialsUnderReview onContinue={() => go('owner-home')} />;

    /* ===== Boarder ===== */
    case 'boarder-home':
      return (
        <BoarderHome
          listings={feedListings}
          email={boarder?.email}
          name={boarderName}
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
          email={boarder?.email}
          name={boarderName}
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

    /* ===== Owner ===== */
    case 'owner-home':
      return (
        <BoarderHome
          role="owner"
          listings={feedListings}
          email={owner?.email}
          name={ownerProfile.name}
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
          role="owner"
          listing={selectedListing}
          reviewStats={statsFor(selectedListing)}
          email={owner?.email}
          name={ownerProfile.name}
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
          ownerName={ownerProfile.name}
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
          ownerListings={ownerListings}
          currentBoarders={ownerThreadsView.map((t) => ({ name: t.contact, color: t.color }))}
          boarderCount={ownerProfile.boarders}
          rating={reviewsFor(OWNER_LISTING_IDS[0], submittedReviews[OWNER_LISTING_IDS[0]]).average}
          credentialsStatus="review"
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

    /* ===== Welcome (default) ===== */
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
