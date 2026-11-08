import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import App from './App';

beforeAll(() => {
  // jsdom does not implement scrolling.
  window.scrollTo = () => {};
  Element.prototype.scrollIntoView = () => {};
});

beforeEach(() => localStorage.clear());

const logIn = async (role, email, password = 'secret123') => {
  fireEvent.click(screen.getByRole('button', { name: new RegExp(`log in as ${role}`, 'i') }));
  fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: email } });
  fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: password } });
  fireEvent.click(screen.getByRole('button', { name: /^log in$/i }));
  await screen.findByRole('navigation', { name: 'Main' });
};

const logOut = () => fireEvent.click(screen.getByRole('button', { name: /log ?out/i }));

const goTo = (page) =>
  fireEvent.click(within(screen.getByRole('navigation', { name: 'Main' })).getByRole('button', { name: page }));

const chatList = () => within(screen.getByRole('complementary', { name: 'Conversations' }));
const openChat = (contact) => fireEvent.click(chatList().getByRole('button', { name: new RegExp(contact) }));
const activeChat = () => within(screen.getByRole('region', { name: /conversation with/i }));

const sendMessage = (text) => {
  fireEvent.change(screen.getByLabelText('Message'), { target: { value: text } });
  fireEvent.click(screen.getByRole('button', { name: 'Send message' }));
};

test('a boarder logs in and sees their name in the top bar and chat greetings', async () => {
  render(<App />);
  await logIn('boarder', 'ana.reyes@uep.edu.ph');

  expect(screen.getByText('Ana Reyes')).toBeInTheDocument();

  goTo(/messages/i);
  openChat('Lourdes Cabal');
  expect(activeChat().getByText(/Hello Ana Reyes!/)).toBeInTheDocument();
});

test('a registered account must use its password', async () => {
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: /log in as boarder/i }));
  fireEvent.click(screen.getByRole('button', { name: /create (an )?account|sign up|register/i }));

  fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Ana Reyes' } });
  fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: 'ana.reyes@uep.edu.ph' } });
  fireEvent.change(screen.getByLabelText(/contact number/i), { target: { value: '09171234567' } });
  fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'secret123' } });
  fireEvent.change(screen.getByLabelText(/^confirm password$/i), { target: { value: 'secret123' } });
  fireEvent.click(screen.getByRole('button', { name: /create account/i }));
  expect(await screen.findByText(/account created for ana\.reyes@uep\.edu\.ph/i)).toBeInTheDocument();

  fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'wrong-password' } });
  fireEvent.click(screen.getByRole('button', { name: /^log in$/i }));
  expect(await screen.findByText(/incorrect password/i)).toBeInTheDocument();

  fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'secret123' } });
  fireEvent.click(screen.getByRole('button', { name: /^log in$/i }));
  expect(await screen.findByRole('navigation', { name: 'Main' })).toBeInTheDocument();
});

test('messages between a boarder and the owner reach both inboxes', async () => {
  render(<App />);

  await logIn('boarder', 'ana.reyes@uep.edu.ph');
  goTo(/messages/i);
  openChat('Lourdes Cabal');
  sendMessage('Can I move in on June 1?');
  openChat('Ramon Abella');
  sendMessage('A question only for Villa Marites');
  logOut();

  await logIn('owner', 'lourdes.cabal@email.com');
  goTo(/messages/i);
  expect(screen.queryByText(/only for Villa Marites/)).not.toBeInTheDocument();
  openChat('Ana Reyes');
  expect(activeChat().getByText('Can I move in on June 1?')).toBeInTheDocument();
  sendMessage('Yes, June 1 works!');
  logOut();

  await logIn('boarder', 'ana.reyes@uep.edu.ph');
  goTo(/messages/i);
  openChat('Lourdes Cabal');
  expect(activeChat().getByText('Yes, June 1 works!')).toBeInTheDocument();
});

test('messages are still there after a page refresh', async () => {
  render(<App />);
  await logIn('boarder', 'ana.reyes@uep.edu.ph');
  goTo(/messages/i);
  openChat('Lourdes Cabal');
  sendMessage('Saved before refresh');

  cleanup();
  render(<App />);

  await logIn('boarder', 'ana.reyes@uep.edu.ph');
  goTo(/messages/i);
  openChat('Lourdes Cabal');
  expect(activeChat().getByText('Saved before refresh')).toBeInTheDocument();
});

const autoReplies = () => activeChat()
  .queryAllByText((_, bubble) => bubble.tagName === 'P' && bubble.textContent.startsWith('Auto-reply'))
  .map((bubble) => bubble.textContent);

test('the auto-reply answers quick replies from the listing details', async () => {
  render(<App />);
  await logIn('boarder', 'ana.reyes@uep.edu.ph');
  goTo(/messages/i);
  openChat('Ramon Abella');

  fireEvent.click(screen.getByRole('button', { name: 'Is there a vacant slot?' }));
  fireEvent.click(screen.getByRole('button', { name: 'How much is the monthly rent?' }));
  fireEvent.click(screen.getByRole('button', { name: 'What are the payment terms?' }));
  fireEvent.click(screen.getByRole('button', { name: 'Can I schedule a visit?' }));

  const replies = autoReplies();
  expect(replies).toHaveLength(4);
  expect(replies[0]).toMatch(/Villa Marites Rooms has 1 slot left out of 8/);
  expect(replies[1]).toMatch(/Rent at Villa Marites Rooms is ₱2,500 per month/);
  expect(replies[2]).toMatch(/Deposit, advance and due dates are set by Mr\. Ramon Abella/);
  expect(replies[3]).toMatch(/Mr\. Ramon Abella will reply here to confirm a day and time for your visit/);
});

test('the auto-reply answers typed questions, and only when it knows the answer', async () => {
  render(<App />);
  await logIn('boarder', 'ana.reyes@uep.edu.ph');
  goTo(/messages/i);
  openChat('Ramon Abella');

  sendMessage('Hi po, good morning!');
  expect(autoReplies()).toHaveLength(0);

  sendMessage('Is a room still available, and is WiFi included?');
  const replies = autoReplies();
  expect(replies).toHaveLength(2);
  expect(replies[0]).toMatch(/slot left/);
  expect(replies[1]).toMatch(/Villa Marites Rooms offers: .*Free WiFi/);
});

test('auto-replies in a chat with the owner also reach the owner, who gets none of their own', async () => {
  render(<App />);
  await logIn('boarder', 'ana.reyes@uep.edu.ph');
  goTo(/messages/i);
  openChat('Lourdes Cabal');
  sendMessage('How much is the rent?');
  logOut();

  await logIn('owner', 'lourdes.cabal@email.com');
  goTo(/messages/i);
  openChat('Ana Reyes');
  expect(activeChat().getByText('How much is the rent?')).toBeInTheDocument();
  expect(autoReplies()).toHaveLength(1);

  sendMessage('Rent is ₱1,800, how much can you pay as deposit?');
  expect(autoReplies()).toHaveLength(1);
});

const mockCamera = () => {
  const track = { stop: () => {}, addEventListener: () => {} };
  const stream = { getTracks: () => [track], getVideoTracks: () => [track] };
  Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getUserMedia: async () => stream } });
  Object.defineProperty(HTMLVideoElement.prototype, 'videoWidth', { configurable: true, get: () => 640 });
  Object.defineProperty(HTMLVideoElement.prototype, 'videoHeight', { configurable: true, get: () => 480 });
  HTMLCanvasElement.prototype.getContext = () => ({ drawImage: () => {} });
  HTMLCanvasElement.prototype.toDataURL = () => 'data:image/jpeg;base64,AAAA';
  global.fetch = async () => ({ blob: async () => new Blob(['photo'], { type: 'image/jpeg' }) });
};

const submitOwnerLogin = () => {
  fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: 'pedro.cruz@email.com' } });
  fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'secret123' } });
  fireEvent.click(screen.getByRole('button', { name: /^log in$/i }));
};

test('a new owner must send credentials before reaching the dashboard', async () => {
  mockCamera();
  render(<App />);

  fireEvent.click(screen.getByRole('button', { name: /log in as owner/i }));
  submitOwnerLogin();
  expect(await screen.findByRole('heading', { name: 'Send your credentials' })).toBeInTheDocument();
  expect(await screen.findByText('Camera on')).toBeInTheDocument();
  expect(screen.queryByRole('navigation', { name: 'Main' })).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Go back' }));
  expect(screen.getByRole('button', { name: /^log in$/i })).toBeInTheDocument();

  submitOwnerLogin();
  await screen.findByText('Camera on');
  fireEvent.click(screen.getByRole('button', { name: /^capture/i }));
  await waitFor(() => expect(screen.getByRole('button', { name: /^capture/i })).toBeDisabled());
  fireEvent.click(screen.getByRole('button', { name: 'Send credentials' }));

  expect(await screen.findByRole('heading', { name: 'Credentials sent!' }, { timeout: 3000 })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /continue/i }));
  expect(await screen.findByRole('navigation', { name: 'Main' })).toBeInTheDocument();

  logOut();
  await logIn('owner', 'pedro.cruz@email.com');
  goTo(/profile/i);
  expect(screen.getByText('Credentials under review')).toBeInTheDocument();
});
