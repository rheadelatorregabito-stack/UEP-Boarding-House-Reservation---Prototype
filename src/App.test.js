import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
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
