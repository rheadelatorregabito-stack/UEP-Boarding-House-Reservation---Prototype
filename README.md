# Boardease — UEP Boarding House Reservation System

Boardease is a web prototype that helps University of Eastern Philippines (UEP) students find, compare and reserve boarding houses near campus, and helps boarding house owners post and manage their listings.

The app has two roles:

- **Boarders (students)** browse listings, message owners, send reservation requests and write reviews.
- **Owners** post and edit boarding houses, reply to students and approve or decline review requests.

> This is a front-end prototype. There is no backend server or database: data is kept in React state and saved in the browser's localStorage (see [Data and persistence](#data-and-persistence)).

---

## Features

### Boarder

| Feature | Description |
|---|---|
| Register and log in | Create an account with full name, email, contact number and password, then log in with it. |
| Forgot password | Same three-step recovery as owners: email, 6-digit verification code, new password. |
| Browse listings | Search by name, area, owner or price (e.g. "2000" shows listings at or below ₱2,000). |
| Filter and sort | Filter by price range, gender, room type and zone; sort by price, rating or slots left. |
| Post details | Photo gallery, rent, slots left, distance from UEP, amenities and owner info. |
| Reserve | Send a reservation request for a listing. |
| Messages | Chat with owners. Quick replies and typed questions get an instant auto-reply built from the listing details. |
| Reviews | Request to review a boarding house, then write a review with a star rating once the owner accepts. |
| Profile | View and edit name, bio, contact details and social links. |

### Owner

| Feature | Description |
|---|---|
| Register and log in | Separate owner account and login. |
| Credential verification | After registering, or on the first login, the owner photographs a valid ID or business permit with the device camera. The dashboard opens only after the credentials are sent. |
| Forgot password | Three-step recovery (shared with boarders): enter email, enter a 6-digit verification code (expires in 10 minutes, 5 tries), then set a new password. |
| Browse (view-only) | See other owners' listings, without reserving or messaging. |
| Post and edit listings | Add up to 10 photos, rent, slots, room type, amenities and a description, with a live preview. |
| Messages | Reply to students. Messages are linked to the boarder's inbox in both directions. |
| Review requests | Accept or decline a student's request to review a boarding house. |
| Profile | Edit owner details and manage "My boarding houses". |

### Auto-reply helper

When a boarder asks about a listing, the helper answers straight from the listing data:

| Topic | Example question | Answer includes |
|---|---|---|
| Slots | "Is there a vacant slot?" | Slots left and room type |
| Rent | "How much is the monthly rent?" | Monthly rent and main amenities |
| Payment | "What are the payment terms?" | Rent, and that the owner sets deposit and due dates |
| Visit | "Can I schedule a visit?" | Location and distance from UEP; the owner confirms the time |
| Amenities | "Is WiFi included?" | The full amenities list |

Messages the helper can't answer (e.g. "Hi po!") get no auto-reply, so the owner answers them personally.

---

## Tech stack

| Technology | Version | Purpose |
|---|---|---|
| React | 19.3.0 | Builds every screen as function components with hooks (`useState`, `useEffect`, `useMemo`, `useRef`, `useId`). |
| React DOM | 19.3.0 | Renders the app in the browser. |
| Create React App (`react-scripts`) | 5.0.1 | Dev server, production build and test runner (Webpack, Babel and ESLint included). |
| JavaScript (ES6+) with JSX | — | App logic: search, filters, reservations, reviews, messaging and form validation. |
| CSS Modules | built into react-scripts | One stylesheet per component, so class names never clash. |
| Google Fonts (Inter) | — | Typography for all screens. |
| localStorage | browser API | Keeps accounts, listings, messages and profiles after a page refresh. |
| MediaDevices and Canvas APIs | browser APIs | Device camera capture on the Send Credentials screen. |
| Jest and React Testing Library | Jest 27.5.1, RTL 16.3.3 | Automated tests of the login and messaging flows. |

Navigation between screens is handled with React state in `App.js` (a `screen` value), so no routing library is needed.

---

## Getting started

**Requirements:** [Node.js](https://nodejs.org/) (LTS version) and npm.

```bash
npm install     # install dependencies (first time only)
npm start       # run the app at http://localhost:3000
npm test        # run the automated tests
npm run build   # create an optimized build in the build/ folder
```

### Demo accounts

No setup is needed. Any email and password logs in (demo mode). The name is taken from the email, e.g. `ana.reyes@uep.edu.ph` logs in as **Ana Reyes**. Accounts created through **Register** must use their own password.

To log in as the sample owner with the sample listings and chats, use `lourdes.cabal@email.com` with any password. This owner has already sent credentials, so it opens the dashboard directly. Any other owner email goes through the credentials step first.

### Suggested demo flow

1. **Boarder:** log in as a student, search and filter listings, open a post and send a reservation request.
2. **Messages:** open the chat with the Sampaguita owner and tap the quick replies to show the auto-reply.
3. **Owner:** in a second browser tab, log in as `lourdes.cabal@email.com` and open Messages. The student's messages are already there; reply and watch it appear in the boarder's tab.
4. **Reviews:** as the boarder, request to review the house; as the owner, accept it; then write the review as the boarder.
5. **Post a listing:** as the owner, create a new post with photos and check the live preview.
6. **Owner verification:** register a new owner (or log in as e.g. `pedro.cruz@email.com`), photograph an ID with the camera and send it. The dashboard opens only after that.
7. **Forgot password:** on the boarder or owner login, click **Forgot password?**, enter the registered email, type the code shown in the yellow demo box, and set a new password. The old password stops working.

**To reset the demo data:** open the browser DevTools → Application → Local Storage and delete the `boardease:v1:*` keys, then refresh.

---

## Project structure

```
src/
├── App.js                    App state, login/session handling and screen navigation
├── App.test.js               Automated tests (login, registration, messaging, auto-reply, owner credentials, password recovery)
├── hooks/
│   └── usePersistentState.js useState that saves to localStorage and syncs across tabs
├── data/
│   ├── messages.js           Sample chats, quick replies and the auto-reply helper
│   ├── profiles.js           Sample boarder and owner profiles
│   └── reviews.js            Sample reviews and rating summaries
└── components/
    ├── WelcomeRoleSelect/    Choose boarder or owner
    ├── BoarderLogin/  BoarderRegister/
    ├── OwnerLogin/    OwnerRegister/
    ├── BoarderHome/          Listing feed, search, filters (FilterDrawer) and listing cards
    ├── BoarderTopBar/        Top navigation bar for both roles
    ├── PostDetails/          Single listing page
    ├── PostEditor/           Owner: create or edit a listing
    ├── Messages/             Inbox and chat for both roles
    ├── Reviews/  WriteReview/
    ├── Profile/  EditProfile/
    ├── StatusScreens/        Confirmation screens (reservation sent, review submitted, post saved…)
    ├── SendCredentials/  CredentialsUnderReview/   Owner ID capture before the dashboard
    └── shared/               Reusable UI pieces (layout, avatar, buttons, listing photo, password recovery)
```

Each component folder holds its `.jsx` file and its own `.module.css` stylesheet.

---

## Data and persistence

- **Sample data** in `src/data/` and `src/components/BoarderHome/listings.js` stands in for a backend.
- **Saved in localStorage** (kept after a refresh): accounts, which owners have sent credentials, the owner's listings, boarder and owner message threads, and boarder and owner profiles. The `usePersistentState` hook saves each value under a `boardease:v1:` key.
- **Synced across tabs:** a change in one tab (e.g. an owner's reply) appears immediately in other open tabs.
- **Not saved yet:** the logged-in session, reservations, review requests and submitted reviews reset on refresh.

---

## Testing

```bash
npm test
```

`src/App.test.js` runs the real app the way a user would:

1. A boarder logs in and sees their own name in the top bar and chat greetings.
2. A registered account rejects a wrong password and accepts the right one.
3. Messages between a boarder and the owner reach both inboxes; chats with other owners stay private.
4. Messages are still there after a page refresh.
5. The auto-reply answers all four quick replies from the listing details.
6. The auto-reply answers typed questions, and stays silent when it can't help.
7. Auto-replies reach the owner's inbox, and the owner's own messages never trigger one.
8. A new owner must send credentials (using a simulated camera) before reaching the dashboard, and goes straight to the dashboard on later logins.
9. A newly registered owner goes straight to the camera step, then the dashboard.
10. An owner resets a forgotten password: a wrong code is rejected, a weak password is rejected, the old password stops working and the new one logs in.
11. A boarder resets a forgotten password with the same three steps: mismatched passwords are rejected, the old password stops working and the new one logs in.

---

## Limitations and future work

- **No backend:** data lives in the browser only. A real system would use a server and database, with passwords hashed instead of stored in localStorage.
- **No email is sent for password recovery:** there is no email service, so the verification code is shown on screen in a labelled demo box. A real system would email it.
- **Credentials are not really reviewed:** the photo upload is simulated (no server receives it), and no admin approves owners, so they stay "under review".
- **One boarder at a time:** the owner's inbox treats the logged-in boarder as the single student in linked chats.
- **Storage size:** uploaded photos are saved as text and browsers allow about 5 MB of localStorage, so many large photos can stop new changes from being saved.
- **Auto-reply is keyword-based:** it matches words, so unusual phrasing may get no answer or an extra one.

---

## Developer

- **Name:** Rhea D. Gabito
- **Course / Section:** BSIT-3E
- **University:** University of Eastern Philippines

IPT project prototype.
