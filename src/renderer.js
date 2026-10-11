const $ = (id) => document.getElementById(id);
let mode = 'open';
let pendingSend = null;
let currentSeed = null;
let inactivityTimer;

const formatXmr = (atomic) => {
  const n = BigInt(atomic || 0);
  const whole = n / 1000000000000n;
  const frac = (n % 1000000000000n).toString().padStart(12, '0').replace(/0+$/, '').padEnd(1, '0');
  return `${whole}.${frac}`;
};
const showToast = (message) => { $('toast').textContent = message; $('toast').classList.remove('hidden'); setTimeout(() => $('toast').classList.add('hidden'), 3000); };
const showError = (id, error) => { $(id).textContent = error?.message || String(error); $(id).classList.remove('hidden'); };
const clearError = (id) => $(id).classList.add('hidden');
function setMode(next) {
  mode = next;
  document.querySelectorAll('.tab').forEach((tab) => tab.classList.toggle('active', tab.dataset.tab === next));
  $('seedLabel').classList.toggle('hidden', next !== 'restore');
  $('submitBtn').textContent = next === 'create' ? '새 지갑 만들기' : next === 'restore' ? 'seed로 복구' : '지갑 열기';
}
function renderTxs(txs = []) {
  if (!txs.length) { $('txList').innerHTML = '<div class="empty">아직 거래가 없습니다.</div>'; return; }
  $('txList').innerHTML = txs.map((tx) => `<div class="tx-row"><div><div class="tx-hash">${(tx.hash || 'pending').slice(0, 16)}…</div><div class="muted">${tx.isConfirmed ? '확정' : '대기 중'}</div></div><div class="tx-amount">${formatXmr(tx.amount)} XMR</div></div>`).join('');
}
function renderSummary(summary) {
  $('authView').classList.add('hidden'); $('appView').classList.remove('hidden'); $('lockBtn').classList.remove('hidden');
  $('balance').innerHTML = `${summary.balanceXmr} <small>XMR</small>`; $('address').textContent = summary.address; $('status').textContent = `${summary.network} · ${summary.node}`; renderTxs(summary.txs);
}
async function refresh() { try { renderSummary(await window.monejo.refresh()); } catch (e) { showToast(e.message); } }
function resetInactivityTimer() {
  clearTimeout(inactivityTimer);
  if ($('appView').classList.contains('hidden')) return;
  inactivityTimer = setTimeout(async () => { await window.monejo.lock(); location.reload(); }, 15 * 60 * 1000);
}
['click', 'keydown', 'mousemove', 'touchstart'].forEach((eventName) => document.addEventListener(eventName, resetInactivityTimer, { passive: true }));

document.querySelectorAll('.tab').forEach((tab) => tab.addEventListener('click', () => setMode(tab.dataset.tab)));
$('walletForm').addEventListener('submit', async (event) => {
  event.preventDefault(); clearError('authError');
  const payload = { password: $('password').value, node: $('node').value.trim() || undefined, network: 'mainnet' };
  try {
    let result;
    if (mode === 'create') result = await window.monejo.create(payload);
    else if (mode === 'restore') result = await window.monejo.restore({ ...payload, seed: $('seed').value });
    else result = await window.monejo.open(payload);
    currentSeed = result.seed || null; renderSummary(result);
    if (currentSeed) showToast('지갑이 생성되었습니다. seed를 오프라인 백업하세요.');
    resetInactivityTimer();
  } catch (e) { showError('authError', e); }
});
$('refreshBtn').addEventListener('click', refresh);
$('lockBtn').addEventListener('click', async () => { await window.monejo.lock(); location.reload(); });
$('copyAddress').addEventListener('click', async () => { await navigator.clipboard.writeText($('address').textContent); showToast('주소를 복사했습니다.'); });
$('showQr').addEventListener('click', async () => { const canvas = $('qr'); canvas.classList.toggle('hidden'); if (!canvas.classList.contains('hidden')) { await window.monejo.qr($('address').textContent, canvas); } });
$('backupBtn').addEventListener('click', async () => { const result = await window.monejo.exportBackup(); if (!result.canceled) showToast('지갑 백업을 저장했습니다.'); });
$('seedBtn').addEventListener('click', () => { if (!currentSeed) { showToast('현재 세션에서 생성된 seed가 없습니다. 복구 지갑은 원래 seed를 사용하세요.'); return; } if (confirm('seed를 화면에 표시합니다. 주변에 사람이 없고 기록 장치가 안전한지 확인했습니까?')) alert(currentSeed); });
$('sendForm').addEventListener('submit', async (event) => {
  event.preventDefault(); clearError('sendError');
  try {
    pendingSend = { address: $('sendAddress').value.trim(), amount: $('sendAmount').value.trim(), priority: $('priority').value };
    const preview = await window.monejo.previewSend(pendingSend);
    $('review').innerHTML = [['받는 주소', preview.address], ['보낼 금액', `${preview.amountXmr} XMR`], ['monejo 서비스 수수료', `${preview.serviceFeeXmr} XMR (0.25%, 상한 0.05)`], ['네트워크 수수료', '지갑 코어가 계산'], ['총액(네트워크 수수료 전)', `${preview.totalBeforeNetworkFeeXmr} XMR`]].map(([key, value]) => `<div class="review-row"><span>${key}</span><strong>${value}</strong></div>`).join('');
    $('confirmDialog').showModal();
  } catch (e) { showError('sendError', e); }
});
$('cancelSend').addEventListener('click', () => $('confirmDialog').close());
$('confirmSend').addEventListener('click', async () => { try { $('confirmSend').disabled = true; const result = await window.monejo.send(pendingSend); $('confirmDialog').close(); showToast(`송금 완료 · 서비스 수수료 ${result.serviceFeeXmr} XMR`); await refresh(); } catch (e) { showError('sendError', e); } finally { $('confirmSend').disabled = false; } });
setMode('open');
