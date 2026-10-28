import { createScanRecord, validateRoutineDraft } from './account-data.js';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from './supabase-config.js';

const $ = (selector) => document.querySelector(selector);
const PRODUCTS = {
  vitc: 'Vitamin C Day Booster Serum',
  night: 'Vitamin C Brightening Night Serum',
  micellar: 'Micellar Cleansing Water',
  pure: 'Pure Active face care',
  skin: 'Garnier face moisturisers',
  superuv: 'Garnier Super UV sun care',
};

let client = null;
let currentUser = null;
let authMode = 'signin';

function setMessage(text, isError = false) {
  const node = $('#account-message');
  if (!node) return;
  node.textContent = text;
  node.classList.toggle('error', isError);
}

function setAuthMode(mode) {
  authMode = mode;
  const signup = mode === 'signup';
  $('#display-name-field').hidden = !signup;
  $('#auth-submit').textContent = signup ? 'Create account' : 'Sign in';
  $('#auth-password').autocomplete = signup ? 'new-password' : 'current-password';
  $('#auth-mode-signin').classList.toggle('active', !signup);
  $('#auth-mode-signup').classList.toggle('active', signup);
  setMessage('');
}

function makeProductList(ids) {
  return (ids ?? []).map((id) => PRODUCTS[id]).filter(Boolean).join(' · ') || 'No products listed';
}

function renderHistoryList(selector, rows, formatter, emptyText) {
  const list = $(selector);
  list.replaceChildren();
  if (!rows?.length) {
    const item = document.createElement('li');
    item.textContent = emptyText;
    list.append(item);
    return;
  }
  for (const row of rows) {
    const item = document.createElement('li');
    item.textContent = formatter(row);
    list.append(item);
  }
}

async function refreshHistory() {
  if (!client || !currentUser) return;
  const [scans, routines] = await Promise.all([
    client.from('scan_history').select('id,outcome,created_at').order('created_at', { ascending: false }).limit(30),
    client.from('routine_history').select('id,title,product_ids,created_at').order('created_at', { ascending: false }).limit(30),
  ]);
  if (scans.error || routines.error) {
    setMessage(scans.error?.message ?? routines.error?.message, true);
    return;
  }
  renderHistoryList('#scan-history-list', scans.data, (row) => `${new Date(row.created_at).toLocaleString()} · Face in frame`, 'No saved scan checks yet.');
  renderHistoryList('#routine-history-list', routines.data, (row) => `${new Date(row.created_at).toLocaleString()} · ${row.title} — ${makeProductList(row.product_ids)}`, 'No saved routines yet.');
}

function renderCommunityRoutines(rows) {
  const host = $('#community-routine-list');
  host.replaceChildren();
  if (!rows?.length) {
    const note = document.createElement('p');
    note.className = 'community-empty';
    note.textContent = 'No community routines have been approved yet. Sign in to submit one for review.';
    host.append(note);
    return;
  }
  for (const routine of rows) {
    const article = document.createElement('article');
    article.className = 'community-routine-card';
    const title = document.createElement('h3');
    title.textContent = routine.title;
    const description = document.createElement('p');
    description.textContent = routine.description;
    const products = document.createElement('p');
    products.className = 'community-products';
    products.textContent = `Products: ${makeProductList(routine.product_ids)}`;
    const steps = document.createElement('ol');
    for (const text of routine.steps ?? []) {
      const step = document.createElement('li');
      step.textContent = text;
      steps.append(step);
    }
    article.append(title, description, products, steps);
    host.append(article);
  }
}

async function refreshCommunityRoutines() {
  if (!client) return;
  const { data, error } = await client.from('community_routines')
    .select('id,title,description,product_ids,steps,created_at')
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(30);
  if (error) {
    $('#community-routine-list').textContent = 'Community routines are temporarily unavailable.';
    return;
  }
  renderCommunityRoutines(data);
}

async function refreshAccount() {
  const signedIn = Boolean(currentUser);
  $('#auth-panel').hidden = signedIn;
  $('#profile-panel').hidden = !signedIn;
  $('#account-toggle').textContent = signedIn ? 'My account' : 'Sign in';
  if (!signedIn) {
    renderHistoryList('#scan-history-list', [], () => '', 'Sign in to view your saved scan checks.');
    renderHistoryList('#routine-history-list', [], () => '', 'Sign in to view your saved routines.');
    return;
  }
  const { data, error } = await client.from('profiles').select('display_name').eq('id', currentUser.id).maybeSingle();
  $('#profile-email').textContent = currentUser.email ?? 'Signed in';
  $('#profile-name').value = data?.display_name ?? currentUser.user_metadata?.display_name ?? '';
  if (error) setMessage(error.message, true);
  await refreshHistory();
}

export async function initAccountUI() {
  $('#account-toggle').addEventListener('click', () => $('#account-dialog').showModal());
  $('#account-close').addEventListener('click', () => $('#account-dialog').close());
  $('#auth-mode-signin').addEventListener('click', () => setAuthMode('signin'));
  $('#auth-mode-signup').addEventListener('click', () => setAuthMode('signup'));
  $('#auth-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!client) return;
    const email = $('#auth-email').value.trim();
    const password = $('#auth-password').value;
    setMessage('');
    const result = authMode === 'signup'
      ? await client.auth.signUp({ email, password, options: { data: { display_name: $('#display-name').value.trim() } } })
      : await client.auth.signInWithPassword({ email, password });
    if (result.error) return setMessage(result.error.message, true);
    if (authMode === 'signup' && !result.data.session) {
      setMessage('Check your email to confirm your account, then sign in.');
    } else {
      currentUser = result.data.user;
      await refreshAccount();
      setMessage('You’re signed in.');
    }
  });
  $('#signout-button').addEventListener('click', async () => {
    const { error } = await client.auth.signOut();
    if (error) return setMessage(error.message, true);
    currentUser = null;
    await refreshAccount();
    setMessage('You’re signed out.');
  });
  $('#profile-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!client || !currentUser) return;
    const displayName = $('#profile-name').value.trim();
    const { error } = await client.from('profiles').update({ display_name: displayName }).eq('id', currentUser.id);
    setMessage(error ? error.message : 'Profile updated.', Boolean(error));
  });
  $('#community-routine-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!client || !currentUser) return setMessage('Sign in to submit a community routine.', true);
    try {
      const draft = validateRoutineDraft({
        title: $('#community-title').value,
        description: $('#community-description').value,
        productIds: [...document.querySelectorAll('[name="community-product"]:checked')].map((input) => input.value),
        steps: $('#community-steps').value.split('\n'),
      });
      const { error } = await client.from('community_routines').insert({ ...draft, author_id: currentUser.id });
      if (error) throw error;
      event.target.reset();
      setMessage('Submitted for review. It will appear in the community after approval.');
      await refreshAccount();
    } catch (error) {
      setMessage(error.message ?? 'Could not submit this routine.', true);
    }
  });

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    $('#account-setup-notice').hidden = false;
    $('#auth-panel').hidden = true;
    $('#profile-panel').hidden = true;
    $('#community-routine-list').textContent = 'Account and community features need a Supabase project configuration.';
    return;
  }

  try {
    const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    });
    $('#account-setup-notice').hidden = true;
    const { data: { session } } = await client.auth.getSession();
    currentUser = session?.user ?? null;
    await Promise.all([refreshAccount(), refreshCommunityRoutines()]);
    client.auth.onAuthStateChange((_event, nextSession) => {
      currentUser = nextSession?.user ?? null;
      void refreshAccount();
      void refreshCommunityRoutines();
    });
  } catch {
    $('#account-setup-notice').hidden = false;
    $('#account-setup-notice').textContent = 'Could not load the account service. Try again later.';
    $('#auth-panel').hidden = true;
    $('#profile-panel').hidden = true;
  }
}

export async function recordSuccessfulScan() {
  if (!client || !currentUser) throw new Error('Sign in to save scan history.');
  const { error } = await client.from('scan_history').insert({ user_id: currentUser.id, ...createScanRecord() });
  if (error) throw error;
  await refreshHistory();
}

export async function saveGeneratedRoutine({ title, productIds }) {
  if (!client || !currentUser) throw new Error('Sign in to save routines.');
  const { error } = await client.from('routine_history').insert({
    user_id: currentUser.id,
    title: String(title).slice(0, 120),
    product_ids: [...new Set(productIds)].filter((id) => Object.hasOwn(PRODUCTS, id)).slice(0, 6),
  });
  if (error) throw error;
  await refreshHistory();
}
