const $ = (id) => document.getElementById(id);
const LANG = {
  ko: { lock:'잠금', heroTitle:'내 키는<br/><span>내 기기에.</span>', heroText:'monejo는 seed와 private key를 서버로 보내지 않는 비수탁형 Monero 지갑입니다.', open:'열기', create:'새 지갑', restore:'복구', walletPassword:'지갑 비밀번호', passwordPlaceholder:'8자 이상', nodeAddress:'노드 주소', moneroSeed:'Monero seed', seedPlaceholder:'12/13/24/25단어 seed', openWallet:'지갑 열기', createWallet:'새 지갑 만들기', restoreWallet:'seed로 복구', authFine:'mainnet 지갑입니다. 송금 전 주소·금액·서비스 수수료를 반드시 확인하세요.', totalBalance:'TOTAL BALANCE', syncWaiting:'동기화 대기', myAddress:'내 주소', copyAddress:'주소 복사', showQr:'QR 보기', send:'보내기', recipientAddress:'받는 주소', recipientPlaceholder:'Monero 주소를 붙여넣으세요', sendAmount:'보낼 금액 (XMR)', priority:'우선순위', low:'낮음', normal:'보통', high:'높음', review:'검토하기', recentTransactions:'최근 거래', localRecord:'로컬 기록', noTransactions:'아직 거래가 없습니다.', walletTools:'지갑 도구', backupWallet:'지갑 파일 백업', showSeed:'복구용 seed 표시', seedFine:'seed는 화면에 표시하는 순간 노출될 수 있습니다. 오프라인에만 보관하세요.', reviewTitle:'송금 내용을 확인하세요', cancel:'취소', confirmSend:'확인하고 송금' },
  en: { lock:'Lock', heroTitle:'Your keys,<br/><span>your device.</span>', heroText:'monejo is a non-custodial Monero wallet. Your seed and private keys stay on your device.', open:'Open', create:'New wallet', restore:'Restore', walletPassword:'Wallet password', passwordPlaceholder:'8 characters or more', nodeAddress:'Daemon address', moneroSeed:'Monero seed', seedPlaceholder:'12/13/24/25-word seed', openWallet:'Open wallet', createWallet:'Create wallet', restoreWallet:'Restore from seed', authFine:'Mainnet wallet. Always check the address, amount, and service fee before sending.', totalBalance:'TOTAL BALANCE', syncWaiting:'Waiting for sync', myAddress:'My address', copyAddress:'Copy address', showQr:'Show QR', send:'Send', recipientAddress:'Recipient address', recipientPlaceholder:'Paste a Monero address', sendAmount:'Amount (XMR)', priority:'Priority', low:'Low', normal:'Normal', high:'High', review:'Review', recentTransactions:'Recent transactions', localRecord:'Local record', noTransactions:'No transactions yet.', walletTools:'Wallet tools', backupWallet:'Back up wallet file', showSeed:'Show recovery seed', seedFine:'Showing your seed can expose it. Keep it offline.', reviewTitle:'Review transaction', cancel:'Cancel', confirmSend:'Confirm and send' },
  zh: { lock:'锁定', heroTitle:'你的密钥，<br/><span>在你的设备。</span>', heroText:'monejo 是非托管 Monero 钱包。您的 seed 和私钥只保存在您的设备上。', open:'打开', create:'新建钱包', restore:'恢复', walletPassword:'钱包密码', passwordPlaceholder:'至少 8 个字符', nodeAddress:'节点地址', moneroSeed:'Monero seed', seedPlaceholder:'12/13/24/25 个单词的 seed', openWallet:'打开钱包', createWallet:'创建钱包', restoreWallet:'从 seed 恢复', authFine:'这是主网钱包。发送前请务必核对地址、金额和服务费。', totalBalance:'总余额', syncWaiting:'等待同步', myAddress:'我的地址', copyAddress:'复制地址', showQr:'显示二维码', send:'发送', recipientAddress:'收款地址', recipientPlaceholder:'粘贴 Monero 地址', sendAmount:'发送金额 (XMR)', priority:'优先级', low:'低', normal:'普通', high:'高', review:'检查', recentTransactions:'最近交易', localRecord:'本地记录', noTransactions:'暂无交易。', walletTools:'钱包工具', backupWallet:'备份钱包文件', showSeed:'显示恢复 seed', seedFine:'显示 seed 可能导致泄露。请离线保存。', reviewTitle:'检查交易内容', cancel:'取消', confirmSend:'确认并发送' },
  ja: { lock:'ロック', heroTitle:'鍵は、<br/><span>あなたの端末に。</span>', heroText:'monejoは非カストディ型のMoneroウォレットです。seedと秘密鍵は端末内に保存されます。', open:'開く', create:'新しいウォレット', restore:'復元', walletPassword:'ウォレットパスワード', passwordPlaceholder:'8文字以上', nodeAddress:'ノードアドレス', moneroSeed:'Monero seed', seedPlaceholder:'12/13/24/25語のseed', openWallet:'ウォレットを開く', createWallet:'ウォレットを作成', restoreWallet:'seedから復元', authFine:'mainnetウォレットです。送信前にアドレス・金額・サービス手数料を確認してください。', totalBalance:'合計残高', syncWaiting:'同期を待機中', myAddress:'自分のアドレス', copyAddress:'アドレスをコピー', showQr:'QRを表示', send:'送信', recipientAddress:'送金先アドレス', recipientPlaceholder:'Moneroアドレスを貼り付け', sendAmount:'送金額 (XMR)', priority:'優先度', low:'低', normal:'通常', high:'高', review:'確認', recentTransactions:'最近の取引', localRecord:'ローカル記録', noTransactions:'取引はまだありません。', walletTools:'ウォレットツール', backupWallet:'ウォレットファイルをバックアップ', showSeed:'復元用seedを表示', seedFine:'seedを表示すると漏洩する可能性があります。オフラインで保管してください。', reviewTitle:'送金内容を確認', cancel:'キャンセル', confirmSend:'確認して送信' }
};
let language = localStorage.getItem('monejo.language') || 'ko';
function applyLanguage() {
  const dict = LANG[language];
  document.documentElement.lang = language;
  document.querySelectorAll('[data-i18n]').forEach((node) => { if (dict[node.dataset.i18n]) node.textContent = dict[node.dataset.i18n]; });
  document.querySelectorAll('[data-i18n-html]').forEach((node) => { if (dict[node.dataset.i18nHtml]) node.innerHTML = dict[node.dataset.i18nHtml]; });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((node) => { if (dict[node.dataset.i18nPlaceholder]) node.placeholder = dict[node.dataset.i18nPlaceholder]; });
  $('languageSelect').value = language;
}
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
  const dict = LANG[language];
  $('submitBtn').textContent = next === 'create' ? dict.createWallet : next === 'restore' ? dict.restoreWallet : dict.openWallet;
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
$('languageSelect').addEventListener('change', () => { language = $('languageSelect').value; localStorage.setItem('monejo.language', language); applyLanguage(); setMode(mode); });
$('walletForm').addEventListener('submit', async (event) => {
  event.preventDefault(); clearError('authError');
  const payload = { password: $('password').value, node: $('node').value.trim() || undefined, network: 'mainnet' };
  try {
    let result;
    if (mode === 'create') result = await window.monejo.create(payload);
    else if (mode === 'restore') {
      const seed = $('seed').value.trim();
      if (!confirm('입력한 seed가 정확한지 확인했습니다. 복구를 시작할까요? 기존 지갑은 자동 보관됩니다.')) return;
      result = await window.monejo.restore({ ...payload, seed });
    }
    else result = await window.monejo.open(payload);
    currentSeed = result.seed || null; renderSummary(result);
    if (currentSeed) showToast('지갑이 생성되었습니다. seed를 오프라인 백업하세요.');
    else if (result.restored) showToast(result.recoveryNote || 'seed로 지갑을 복구했습니다.');
    resetInactivityTimer();
  } catch (e) { showError('authError', e); }
});
$('refreshBtn').addEventListener('click', refresh);
$('lockBtn').addEventListener('click', async () => { await window.monejo.lock(); location.reload(); });
$('copyAddress').addEventListener('click', async () => { await navigator.clipboard.writeText($('address').textContent); showToast('주소를 복사했습니다.'); });
 $('showQr').addEventListener('click', async () => { const canvas = $('qr'); canvas.classList.toggle('hidden'); if (!canvas.classList.contains('hidden')) { const image = new Image(); image.onload = () => { canvas.width = image.width; canvas.height = image.height; canvas.getContext('2d').drawImage(image, 0, 0); }; image.src = await window.monejo.qr($('address').textContent); } });
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
applyLanguage();
