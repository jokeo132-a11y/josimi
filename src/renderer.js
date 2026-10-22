const $ = (id) => document.getElementById(id);
const LANG = {
  ko: { lock:'잠금', heroTitle:'내 키는<br/><span>내 기기에.</span>', heroText:'josimi는 seed와 private key를 서버로 보내지 않는 비수탁형 Monero 지갑입니다.', walletTitle:'josimi 지갑', feeNotice:'서비스 수수료 0.25%, 최대 0.05 XMR + 네트워크 수수료', reviewEyebrow:'송금 검토', reviewDescription:'아래 내용을 확인한 뒤 한 번만 전송하세요.', walletSubtitle:'지갑을 열거나 새로 만드세요.', open:'열기', create:'새 지갑', restore:'복구', walletPassword:'지갑 비밀번호', passwordPlaceholder:'8자 이상', nodeMode:'노드', localNode:'원격 노드 사용', remoteNode:'원격 노드 사용', nodeAddress:'노드 주소', moneroSeed:'Monero seed', seedPlaceholder:'13/14/25단어 seed', seedOffset:'Seed offset passphrase (선택)', seedOffsetPlaceholder:'없으면 비워두세요', restoreHeight:'복구 시작 블록 높이', restoreHeightPlaceholder:'첫 입금 전의 블록 높이(모르면 낮게 입력)', createdAtHeight:'생성 시 블록 높이', openWallet:'지갑 열기', createWallet:'새 지갑 만들기', restoreWallet:'seed로 복구', authFine:'송금 전 주소·금액·서비스 수수료를 반드시 확인하세요.', totalBalance:'TOTAL BALANCE', syncWaiting:'동기화 대기', myAddress:'내 주소', copyAddress:'주소 복사', showQr:'QR 보기', send:'보내기', recipientAddress:'받는 주소', recipientPlaceholder:'Monero 주소를 붙여넣으세요', sendAmount:'보낼 금액 (XMR)', priority:'우선순위', low:'낮음', normal:'보통', high:'높음', review:'검토하기', recentTransactions:'최근 거래', localRecord:'로컬 기록', noTransactions:'아직 거래가 없습니다.', walletTools:'지갑 도구', backupWallet:'지갑 파일 백업', showSeed:'복구용 seed 표시', seedFine:'seed는 화면에 표시하는 순간 노출될 수 있습니다. 오프라인에만 보관하세요.', reviewTitle:'송금 내용을 확인하세요', cancel:'취소', confirmSend:'확인하고 송금', miningTitle:'원격 채굴', miningStopped:'중지됨', miningMining:'채굴 중', miningRemote:'원격 채굴만 지원', miningThreads:'CPU 스레드', miningBackground:'백그라운드 채굴', miningIgnoreBattery:'배터리 상태 무시', startMining:'채굴 시작', stopMining:'채굴 중지' },
  en: { lock:'Lock', heroTitle:'Your keys,<br/><span>your device.</span>', heroText:'josimi is a non-custodial Monero wallet. Your seed and private keys stay on your device.', walletTitle:'josimi wallet', feeNotice:'Service fee 0.25%, capped at 0.05 XMR + network fee', reviewEyebrow:'Transaction review', reviewDescription:'Check the details below before sending once.', walletSubtitle:'Open an existing wallet or create a new one.', open:'Open', create:'New wallet', restore:'Restore', walletPassword:'Wallet password', passwordPlaceholder:'8 characters or more', nodeMode:'Node', localNode:'Local node (recommended)', remoteNode:'Use a remote node', nodeAddress:'Daemon address', moneroSeed:'Monero seed', seedPlaceholder:'13/14/25-word seed', seedOffset:'Seed offset passphrase (optional)', seedOffsetPlaceholder:'Leave blank if none', restoreHeight:'Restore height', restoreHeightPlaceholder:'Block height before the first incoming transaction', createdAtHeight:'Creation block height', openWallet:'Open wallet', createWallet:'Create wallet', restoreWallet:'Restore from seed', authFine:'Always check the address, amount, and service fee before sending.', totalBalance:'TOTAL BALANCE', syncWaiting:'Waiting for sync', myAddress:'My address', copyAddress:'Copy address', showQr:'Show QR', send:'Send', recipientAddress:'Recipient address', recipientPlaceholder:'Paste a Monero address', sendAmount:'Amount (XMR)', priority:'Priority', low:'Low', normal:'Normal', high:'High', review:'Review', recentTransactions:'Recent transactions', localRecord:'Local record', noTransactions:'No transactions yet.', walletTools:'Wallet tools', backupWallet:'Back up wallet file', showSeed:'Show recovery seed', seedFine:'Showing your seed can expose it. Keep it offline.', reviewTitle:'Review transaction', cancel:'Cancel', confirmSend:'Confirm and send', miningTitle:'Remote mining', miningStopped:'Stopped', miningMining:'Mining', miningRemote:'Remote pools only', miningThreads:'CPU threads', miningBackground:'Background mining', miningIgnoreBattery:'Ignore battery state', startMining:'Start mining', stopMining:'Stop mining' },
  zh: { lock:'锁定', heroTitle:'你的密钥，<br/><span>在你的设备。</span>', heroText:'josimi 是非托管 Monero 钱包。您的 seed 和私钥只保存在您的设备上。', walletTitle:'josimi 钱包', feeNotice:'服务费 0.25%，最高 0.05 XMR + 网络手续费', reviewEyebrow:'交易检查', reviewDescription:'发送前请确认以下内容。', walletSubtitle:'打开现有钱包或创建新钱包。', open:'打开', create:'新建钱包', restore:'恢复', walletPassword:'钱包密码', passwordPlaceholder:'至少 8 个字符', nodeMode:'节点', localNode:'使用本机节点（推荐）', remoteNode:'使用远程节点', nodeAddress:'节点地址', moneroSeed:'Monero seed', seedPlaceholder:'13/14/25 个单词的 seed', seedOffset:'Seed offset passphrase（可选）', seedOffsetPlaceholder:'没有则留空', restoreHeight:'恢复起始区块高度', restoreHeightPlaceholder:'首次收款前的区块高度（不确定时填低一些）', createdAtHeight:'创建时区块高度', openWallet:'打开钱包', createWallet:'创建钱包', restoreWallet:'从 seed 恢复', authFine:'发送前请务必核对地址、金额和服务费。', totalBalance:'总余额', syncWaiting:'等待同步', myAddress:'我的地址', copyAddress:'复制地址', showQr:'显示二维码', send:'发送', recipientAddress:'收款地址', recipientPlaceholder:'粘贴 Monero 地址', sendAmount:'发送金额 (XMR)', priority:'优先级', low:'低', normal:'普通', high:'高', review:'检查', recentTransactions:'最近交易', localRecord:'本地记录', noTransactions:'暂无交易。', walletTools:'钱包工具', backupWallet:'备份钱包文件', showSeed:'显示恢复 seed', seedFine:'显示 seed 可能导致泄露。请离线保存。', reviewTitle:'检查交易内容', cancel:'取消', confirmSend:'确认并发送', miningTitle:'远程挖矿', miningStopped:'已停止', miningMining:'挖矿中', miningRemote:'仅支持远程矿池', miningThreads:'CPU 线程', miningBackground:'后台挖矿', miningIgnoreBattery:'忽略电池状态', startMining:'开始挖矿', stopMining:'停止挖矿' },
  ja: { lock:'ロック', heroTitle:'鍵は、<br/><span>あなたの端末に。</span>', heroText:'josimiは非カストディ型のMoneroウォレットです。seedと秘密鍵は端末内に保存されます。', walletTitle:'josimi ウォレット', feeNotice:'サービス手数料 0.25%、上限 0.05 XMR + ネットワーク手数料', reviewEyebrow:'送金確認', reviewDescription:'送信前に以下の内容を確認してください。', walletSubtitle:'ウォレットを開くか、新しく作成します。', open:'開く', create:'新しいウォレット', restore:'復元', walletPassword:'ウォレットパスワード', passwordPlaceholder:'8文字以上', nodeMode:'ノード', localNode:'自分の端末のノード（推奨）', remoteNode:'リモートノードを使う', nodeAddress:'ノードアドレス', moneroSeed:'Monero seed', seedPlaceholder:'13/14/25語のseed', seedOffset:'Seed offset passphrase（任意）', seedOffsetPlaceholder:'なければ空欄', restoreHeight:'復元開始ブロック高', restoreHeightPlaceholder:'最初の入金前のブロック高（不明なら低め）', createdAtHeight:'作成時のブロック高', openWallet:'ウォレットを開く', createWallet:'ウォレットを作成', restoreWallet:'seedから復元', authFine:'送信前にアドレス・金額・サービス手数料を確認してください。', totalBalance:'合計残高', syncWaiting:'同期を待機中', myAddress:'自分のアドレス', copyAddress:'アドレスをコピー', showQr:'QRを表示', send:'送信', recipientAddress:'送金先アドレス', recipientPlaceholder:'Moneroアドレスを貼り付け', sendAmount:'送金額 (XMR)', priority:'優先度', low:'低', normal:'通常', high:'高', review:'確認', recentTransactions:'最近の取引', localRecord:'ローカル記録', noTransactions:'取引はまだありません。', walletTools:'ウォレットツール', backupWallet:'ウォレットファイルをバックアップ', showSeed:'復元用seedを表示', seedFine:'seedを表示すると漏洩する可能性があります。オフラインで保管してください。', reviewTitle:'送金内容を確認', cancel:'キャンセル', confirmSend:'確認して送信', miningTitle:'リモートマイニング', miningStopped:'停止中', miningMining:'マイニング中', miningRemote:'リモートプールのみ対応', miningThreads:'CPUスレッド', miningBackground:'バックグラウンドマイニング', miningIgnoreBattery:'バッテリー状態を無視', startMining:'マイニング開始', stopMining:'マイニング停止' }
};
let language = localStorage.getItem('josimi.language') || 'ko';
if (!LANG[language]) language = 'ko';
const EXTRA_LANG = {
  ko: { miningFine: '로컬 monerod 없이 원격 노드와 원격 풀만 사용합니다. 전력·발열과 운영체제의 실제 처리 능력을 확인하세요.', miningPartial: '채굴 프로세스 일부 실패', miningUnsupported: 'Windows에서만 지원', miningUserThreads: '내 지갑', miningFeeThreads: '수수료', reviewRecipient: '받는 주소', reviewAmount: '보낼 금액', reviewServiceFee: '서비스 수수료 (0.25%, 최대 0.05 XMR)', reviewNetworkFee: '네트워크 수수료', reviewTotal: '총 차감액', reviewFeeAddress: '수수료 수취 주소' },
  en: { miningFine: 'Uses remote nodes and remote pools without local monerod. Check power, heat, and what your operating system can handle.', miningPartial: 'One mining process failed', miningUnsupported: 'Supported on Windows only', miningUserThreads: 'Your wallet', miningFeeThreads: 'Fee', reviewRecipient: 'Recipient address', reviewAmount: 'Amount', reviewServiceFee: 'Service fee (0.25%, max 0.05 XMR)', reviewNetworkFee: 'Network fee', reviewTotal: 'Total debit', reviewFeeAddress: 'Fee recipient' },
  zh: { miningFine: '线程数没有人为的 20 线程步进限制。请注意功耗、温度和操作系统的实际处理能力。', miningPartial: '一个挖矿进程失败', miningUnsupported: '仅支持 Windows', miningUserThreads: '您的钱包', miningFeeThreads: '手续费', reviewRecipient: '收款地址', reviewAmount: '发送金额', reviewServiceFee: '服务费（0.25%，最高 0.05 XMR）', reviewNetworkFee: '网络手续费', reviewTotal: '总扣款', reviewFeeAddress: '手续费收款地址' },
  ja: { miningFine: 'スレッド数に20単位の人工的な制限はありません。電力、温度、OSの処理能力に注意してください。', miningPartial: 'マイニングプロセスの一部が失敗', miningUnsupported: 'Windowsのみ対応', miningUserThreads: '自分のウォレット', miningFeeThreads: '手数料', reviewRecipient: '送金先アドレス', reviewAmount: '送金額', reviewServiceFee: 'サービス手数料（0.25%、上限0.05 XMR）', reviewNetworkFee: 'ネットワーク手数料', reviewTotal: '合計引落額', reviewFeeAddress: '手数料の受取先' }
};
for (const code of Object.keys(EXTRA_LANG)) Object.assign(LANG[code], EXTRA_LANG[code]);
Object.assign(LANG.ko, { miningStarting: '채굴 준비 중' });
Object.assign(LANG.en, { miningStarting: 'Preparing mining' });
Object.assign(LANG.zh, { miningStarting: '正在准备挖矿' });
Object.assign(LANG.ja, { miningStarting: 'マイニングを準備中' });
Object.assign(LANG.ko, { reviewPriority: '우선순위' });
Object.assign(LANG.en, { reviewPriority: 'Priority' });
Object.assign(LANG.zh, { reviewPriority: '优先级' });
Object.assign(LANG.ja, { reviewPriority: '優先度' });
Object.assign(LANG.ko, { miningMining: '두 채굴 프로세스 실행 중' });
Object.assign(LANG.en, { miningMining: 'Both mining processes running' });
Object.assign(LANG.zh, { miningMining: '两个挖矿进程均在运行' });
Object.assign(LANG.ja, { miningMining: '2つのマイニングプロセスが実行中' });
Object.assign(LANG.ko, { miningTitle: '채굴', miningMode: '채굴 방식', miningPool: '직접 풀', miningAuto: '자동으로 풀 선택', miningP2pool: 'P2Pool', poolAddress: '풀 주소', poolTls: 'TLS 사용', p2poolProfile: 'P2Pool 네트워크', p2poolNodeMode: 'P2Pool 노드', p2poolRemote: '원격 P2Pool stratum 사용', p2poolNodeAddress: 'P2Pool 주소', miningAuto100: 'CPU 자동 100% 사용', miningFine: '로컬 monerod 없이 원격 노드와 원격 풀만 사용합니다. 전력·발열과 운영체제의 실제 처리 능력을 확인하세요.', miningRemote: '원격 노드 모드' });
Object.assign(LANG.en, { miningTitle: 'Mining', miningMode: 'Mining mode', miningPool: 'Direct pool', miningAuto: 'Auto-select pool', miningP2pool: 'P2Pool', poolAddress: 'Pool address', poolTls: 'Use TLS', p2poolProfile: 'P2Pool network', p2poolNodeMode: 'P2Pool node', p2poolRemote: 'Use a remote P2Pool stratum', p2poolNodeAddress: 'P2Pool address', miningAuto100: 'Automatically use 100% CPU', miningFine: 'Uses remote nodes and remote pools without local monerod. Check power, heat, and what your operating system can handle.', miningRemote: 'Remote node mode' });
Object.assign(LANG.zh, { miningAuto100: '自动使用 100% CPU' });
Object.assign(LANG.ja, { miningAuto100: 'CPUを自動で100%使用' });
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
let sendCallInProgress = false;
let cancelCallInProgress = false;
let miningCallInProgress = false;
let toastTimer;
let currentSeed = null;
let selectedWalletFile = null;
let inactivityTimer;
let syncTimer;
let syncRequestInFlight = false;

const formatXmr = (atomic) => {
  const n = BigInt(atomic || 0); const negative = n < 0n; const absolute = negative ? -n : n;
  const whole = absolute / 1000000000000n;
  const frac = (absolute % 1000000000000n).toString().padStart(12, '0').replace(/0+$/, '').padEnd(1, '0');
  return `${negative ? '-' : ''}${whole}.${frac}`;
};
const escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
const showToast = (message) => { clearTimeout(toastTimer); $('toast').textContent = message; $('toast').classList.remove('hidden'); toastTimer = setTimeout(() => $('toast').classList.add('hidden'), 3500); };
const showError = (id, error) => { const node = $(id); node.textContent = error?.message || String(error); node.classList.remove('hidden'); node.setAttribute('role', 'alert'); };
const clearError = (id) => { const node = $(id); node.textContent = ''; node.classList.add('hidden'); };
function setMode(next) {
  mode = next;
  document.querySelectorAll('.tab').forEach((tab) => { const active = tab.dataset.tab === next; tab.classList.toggle('active', active); tab.setAttribute('aria-selected', String(active)); });
  $('seedLabel').classList.toggle('hidden', next !== 'restore');
  $('seedOffsetLabel').classList.toggle('hidden', next !== 'restore');
  $('restoreHeightLabel').classList.toggle('hidden', next !== 'restore');
  const dict = LANG[language];
  $('submitBtn').textContent = next === 'create' ? dict.createWallet : next === 'restore' ? dict.restoreWallet : dict.openWallet;
}
function showWalletFileStatus(fileName = '') {
  $('walletFileStatus').textContent = fileName ? `선택한 key 파일: ${fileName}` : '';
}
async function chooseWalletFile(action) {
  const result = await window.josimi.chooseWalletFile(action);
  if (!result || result.canceled) return false;
  selectedWalletFile = result;
  showWalletFileStatus(result.fileName);
  return true;
}
function renderTxs(txs = []) {
  if (!txs.length) { $('txList').innerHTML = '<div class="empty">아직 거래가 없습니다.</div>'; return; }
  $('txList').innerHTML = txs.map((tx) => `<div class="tx-row"><div><div class="tx-hash">${escapeHtml((tx.hash || 'pending').slice(0, 16))}…</div><div class="muted">${tx.isConfirmed ? '확정' : '대기 중'}</div></div><div class="tx-amount">${escapeHtml(formatXmr(tx.amount))} XMR</div></div>`).join('');
}
function renderSync(sync = {}) {
  const state = sync.state || 'stopped';
  const labels = { downloading: 'Monero 노드 다운로드 중', starting: '로컬 노드 시작 중', syncing: '노드 동기화 중', synced: '동기화 완료', remote: '원격 노드 사용', stopped: '노드 중지됨' };
  $('status').textContent = labels[state] || state;
  if (sync.targetHeight) $('syncDetails').textContent = `${sync.progress || 0}% · 블록 ${(sync.height || 0).toLocaleString()} / ${(sync.targetHeight || 0).toLocaleString()} · 피어 ${sync.peers || 0}`;
  else $('syncDetails').textContent = sync.node || '';
}
function renderSummary(summary) {
  $('authView').classList.add('hidden'); $('appView').classList.remove('hidden'); $('lockBtn').classList.remove('hidden');
  $('balance').innerHTML = `${escapeHtml(summary.balanceXmr)} <small>XMR</small>`; $('address').textContent = summary.address; renderSync(summary.sync); renderTxs(summary.txs);
  if (summary.createdAtHeight !== undefined && summary.createdAtHeight !== null) $('walletHeight').textContent = `${LANG[language].createdAtHeight}: ${Number(summary.createdAtHeight).toLocaleString()}`;
  if (summary.restoreHeightUsed !== undefined && summary.restoreHeightUsed !== null) $('walletHeight').textContent = `${LANG[language].restoreHeight}: ${Number(summary.restoreHeightUsed).toLocaleString()}`;
}
async function refresh() { try { renderSummary(await window.josimi.refresh()); } catch (e) { showToast(e.message); } }
function resetInactivityTimer() {
  clearTimeout(inactivityTimer);
  if ($('appView').classList.contains('hidden')) return;
  inactivityTimer = setTimeout(async () => { try { await window.josimi.lock(); location.reload(); } catch (error) { showToast(error.message); resetInactivityTimer(); } }, 15 * 60 * 1000);
}
['click', 'keydown', 'mousemove', 'touchstart'].forEach((eventName) => document.addEventListener(eventName, resetInactivityTimer, { passive: true }));

document.querySelectorAll('.tab').forEach((tab) => tab.addEventListener('click', () => setMode(tab.dataset.tab)));
$('walletChoiceBtn').addEventListener('click', () => $('walletChoiceDialog').showModal());
$('chooseExistingKeyBtn').addEventListener('click', async () => {
  $('walletChoiceDialog').close();
  setMode('open');
  try { await chooseWalletFile('open'); } catch (error) { showError('authError', error); }
});
$('chooseNewKeyBtn').addEventListener('click', () => { $('walletChoiceDialog').close(); selectedWalletFile = null; showWalletFileStatus(); setMode('create'); });
window.josimi.onNodeStatus(renderSync);
syncTimer = setInterval(async () => { if (syncRequestInFlight) return; syncRequestInFlight = true; try { renderSync(await window.josimi.nodeStatus()); } catch (_) {} finally { syncRequestInFlight = false; } }, 3000);
function renderMiningStatus(status) {
  const dict = LANG[language];
  if (status.state === 'mining') {
    const endpoint = status.poolUrl || status.p2poolEndpoint || '';
    const threadText = status.cpuAuto100 ? dict.miningAuto100 : `${status.totalThreads} threads`;
    $('miningStatus').textContent = `${dict.miningMining} · ${threadText}${endpoint ? ` · ${endpoint}` : ''}`;
  } else if (status.state === 'partial') {
    $('miningStatus').textContent = `${dict.miningPartial} · ${status.processCount}/${status.expectedProcesses}`;
  } else if (status.state === 'starting') {
    $('miningStatus').textContent = dict.miningStarting;
  } else if (status.state === 'remote') {
    $('miningStatus').textContent = dict.miningRemote;
  } else if (!status.supported) {
    $('miningStatus').textContent = dict.miningUnsupported;
  } else {
    $('miningStatus').textContent = dict.miningStopped;
  }
  const unavailable = ['mining', 'starting', 'remote'].includes(status.state) || !status.supported;
  $('startMiningBtn').disabled = miningCallInProgress || unavailable;
  $('stopMiningBtn').disabled = miningCallInProgress || !status.active;
  $('startMiningBtn').setAttribute('aria-busy', String(miningCallInProgress));
  $('stopMiningBtn').setAttribute('aria-busy', String(miningCallInProgress));
  $('miningThreads').disabled = miningCallInProgress || $('miningAuto100').checked;
  $('miningMode').disabled = miningCallInProgress;
  if (status.error) showError('miningError', new Error(status.error));
}
async function refreshMiningStatus() { try { renderMiningStatus(await window.josimi.miningStatus()); } catch (_) {} }
window.josimi.onMiningStatus(renderMiningStatus);
async function configureMiningInput() {
  try {
    await window.josimi.config();
    const input = $('miningThreads');
    input.min = '1';
    input.step = '1';
    input.removeAttribute('max');
    input.value = '1';
  } catch (_) {}
}
function updateMiningModeFields() {
  const mode = $('miningMode').value;
  $('poolSettings').classList.toggle('hidden', mode !== 'pool');
  $('p2poolSettings').classList.toggle('hidden', mode !== 'p2pool');
  $('p2poolRemoteLabel').classList.toggle('hidden', mode !== 'p2pool' || $('p2poolNodeMode').value !== 'remote');
}
function updateAutoThreadsField() {
  $('miningThreads').disabled = $('miningAuto100').checked;
}
$('miningMode').addEventListener('change', updateMiningModeFields);
$('p2poolNodeMode').addEventListener('change', updateMiningModeFields);
$('miningAuto100').addEventListener('change', updateAutoThreadsField);
updateMiningModeFields();
updateAutoThreadsField();
$('startMiningBtn').addEventListener('click', async () => { if (miningCallInProgress) return; clearError('miningError'); miningCallInProgress = true; renderMiningStatus({ state: 'starting', supported: true, active: true }); try { const mode = $('miningMode').value; const status = await window.josimi.miningStart({ mode, threads: $('miningThreads').value, cpuAuto100: $('miningAuto100').checked, ignoreBattery: $('miningIgnoreBattery').checked, poolUrl: $('miningPoolUrl').value, poolTls: $('miningPoolTls').checked, p2poolProfile: $('p2poolProfile').value, p2poolNodeMode: $('p2poolNodeMode').value, p2poolNodeAddress: $('p2poolNodeAddress').value }); renderMiningStatus(status); showToast(status.state === 'mining' ? LANG[language].miningMining : LANG[language].miningStopped); } catch (e) { showError('miningError', e); await refreshMiningStatus(); } finally { miningCallInProgress = false; await refreshMiningStatus(); } });
$('stopMiningBtn').addEventListener('click', async () => { if (miningCallInProgress) return; clearError('miningError'); miningCallInProgress = true; try { await window.josimi.miningStop(); showToast(LANG[language].miningStopped); } catch (e) { showError('miningError', e); } finally { miningCallInProgress = false; await refreshMiningStatus(); } });
configureMiningInput();
refreshMiningStatus();
setInterval(refreshMiningStatus, 5000);
$('languageSelect').addEventListener('change', () => { language = $('languageSelect').value; localStorage.setItem('josimi.language', language); applyLanguage(); setMode(mode); refreshMiningStatus(); });
$('walletForm').addEventListener('submit', async (event) => {
  event.preventDefault(); clearError('authError');
  try {
    if (mode === 'open' && !selectedWalletFile && !(await chooseWalletFile('open'))) return;
    if ((mode === 'create' || mode === 'restore') && !(await chooseWalletFile('save'))) return;
  } catch (error) { showError('authError', error); return; }
  const nodeValue = $('node').value.trim();
  if (!nodeValue) { showError('authError', new Error('원격 노드 주소를 입력하세요.')); return; }
  const restoreHeightValue = $('restoreHeight').value.trim();
  if (mode === 'restore' && restoreHeightValue && !/^\d+$/.test(restoreHeightValue)) { showError('authError', new Error('복구 블록 높이는 0 이상의 정수여야 합니다.')); return; }
  const payload = { password: $('password').value, node: nodeValue, restoreHeight: mode === 'restore' && restoreHeightValue ? Number(restoreHeightValue) : undefined, network: 'mainnet' };
  $('submitBtn').disabled = true;
  try {
    let result;
    if (mode === 'create') result = await window.josimi.create(payload);
    else if (mode === 'restore') {
      const seed = $('seed').value.trim();
      if (!confirm('입력한 seed가 정확한지 확인했습니다. 복구를 시작할까요? 기존 지갑은 자동 보관됩니다.')) return;
      const seedOffset = $('seedOffset').value;
      result = await window.josimi.restore({ ...payload, seed, seedOffset: seedOffset === '' ? undefined : seedOffset });
    }
    else result = await window.josimi.open(payload);
    currentSeed = result.seed || null; renderSummary(result); await refreshMiningStatus();
    if (currentSeed) showToast(`지갑이 생성되었습니다. 복구에 사용할 블록 높이: ${result.createdAtHeight ?? '확인 불가'}`);
    else if (result.restored) showToast(result.recoveryNote || 'seed로 지갑을 복구했습니다.');
    resetInactivityTimer();
  } catch (e) { showError('authError', e); } finally { $('submitBtn').disabled = false; setMode(mode); }
});
 $('refreshBtn').addEventListener('click', refresh);
 $('lockBtn').addEventListener('click', async () => { try { await window.josimi.lock(); location.reload(); } catch (e) { showToast(e.message); } });
 $('copyAddress').addEventListener('click', async () => { try { await navigator.clipboard.writeText($('address').textContent); showToast('주소를 복사했습니다.'); } catch (e) { showToast(`주소 복사 실패: ${e.message}`); } });
 $('showQr').addEventListener('click', async () => { const canvas = $('qr'); canvas.classList.toggle('hidden'); if (!canvas.classList.contains('hidden')) { try { const image = new Image(); image.onload = () => { canvas.width = image.width; canvas.height = image.height; canvas.getContext('2d').drawImage(image, 0, 0); }; image.src = await window.josimi.qr($('address').textContent); } catch (e) { canvas.classList.add('hidden'); showToast(e.message); } } });
 $('backupBtn').addEventListener('click', async () => { try { const result = await window.josimi.exportBackup(); if (!result.canceled) showToast('지갑 백업을 저장했습니다.'); } catch (e) { showToast(e.message); } });
$('seedBtn').addEventListener('click', () => { if (!currentSeed) { showToast('현재 세션에서 생성된 seed가 없습니다. 복구 지갑은 원래 seed를 사용하세요.'); return; } if (confirm('seed를 화면에 표시합니다. 주변에 사람이 없고 기록 장치가 안전한지 확인했습니까?')) alert(currentSeed); });
function renderSendReview(preview) {
  const dict = LANG[language];
  const priorityLabel = { 1: dict.low, 2: dict.normal, 3: dict.high }[preview.priority] || String(preview.priority);
  $('review').innerHTML = [[dict.reviewRecipient, preview.address], [dict.reviewAmount, `${preview.amountXmr} XMR`], [dict.reviewPriority, priorityLabel], [dict.reviewServiceFee, `${preview.serviceFeeXmr} XMR`], [dict.reviewNetworkFee, `${preview.networkFeeXmr} XMR`], [dict.reviewTotal, `${preview.totalXmr} XMR`], [dict.reviewFeeAddress, preview.feeAddress]].map(([key, value]) => `<div class="review-row"><span>${escapeHtml(key)}</span><strong>${escapeHtml(value)}</strong></div>`).join('');
}
$('sendForm').addEventListener('submit', async (event) => {
  event.preventDefault(); clearError('sendError'); clearError('sendDialogError');
  try {
    pendingSend = { address: $('sendAddress').value.trim(), amount: $('sendAmount').value.trim(), priority: $('priority').value };
    $('sendForm').querySelector('button[type="submit"]').disabled = true;
    const request = { ...pendingSend };
    const preview = await window.josimi.previewSend(request);
    pendingSend = { pendingId: preview.pendingId };
    renderSendReview(preview);
    clearError('sendDialogError');
    $('confirmDialog').showModal();
  } catch (e) { pendingSend = null; showError('sendError', e); } finally { $('sendForm').querySelector('button[type="submit"]').disabled = false; }
});
 $('cancelSend').addEventListener('click', async () => { if (cancelCallInProgress || sendCallInProgress) return; cancelCallInProgress = true; $('cancelSend').disabled = true; const pending = pendingSend; try { if (pending?.pendingId) { const cancelled = await window.josimi.cancelSend(pending).catch(() => false); if (!cancelled) { showError('sendDialogError', new Error('송금 전파 여부가 불확실합니다. 취소하거나 새 송금을 만들지 말고, 같은 거래를 다시 확인하세요.')); return; } } pendingSend = null; $('confirmDialog').close(); } finally { cancelCallInProgress = false; $('cancelSend').disabled = false; } });
 $('confirmDialog').addEventListener('cancel', (event) => { event.preventDefault(); $('cancelSend').click(); });
 $('confirmSend').addEventListener('click', async () => { if (!pendingSend || sendCallInProgress) return; clearError('sendDialogError'); const pendingId = pendingSend.pendingId; sendCallInProgress = true; try { $('confirmSend').disabled = true; const result = await window.josimi.send(pendingSend); pendingSend = null; $('confirmDialog').close(); await window.josimi.ackSend({ pendingId }).catch(() => false); showToast(`송금 완료 · ${result.txHashes?.join(', ') || ''}`); try { await refresh(); } catch (e) { showToast(`송금은 완료됐지만 새로고침에 실패했습니다: ${e.message}`); } } catch (e) { showError('sendDialogError', e); } finally { sendCallInProgress = false; $('confirmSend').disabled = false; $('cancelSend').disabled = false; } });
setMode('open');
applyLanguage();
async function applyPendingSendStatus(status) {
  if (!status || status.pendingId !== pendingSend?.pendingId) return;
  if (status.state === 'relayed') {
    const id = status.pendingId;
    pendingSend = null;
    if ($('confirmDialog').open) $('confirmDialog').close();
    await window.josimi.ackSend({ pendingId: id }).catch(() => false);
    showToast(`송금 완료 · ${status.txHashes?.join(', ') || ''}`);
    await refresh();
    return;
  }
  $('confirmSend').disabled = status.state === 'relaying';
  if (status.state === 'relaying') showError('sendDialogError', new Error('노드가 아직 송금 전파를 처리 중입니다. 새 송금을 만들지 말고 잠시 기다리세요.'));
  else if (status.state === 'relay-unknown') showError('sendDialogError', new Error(status.relayInProgress ? '전파 결과가 아직 불확실합니다. 새 송금을 만들지 말고 동일한 서명 거래만 재시도할 수 있습니다.' : '전파 결과가 불확실합니다. 새 송금을 만들지 말고 동일한 서명 거래만 재시도하세요.'));
}
async function pollPendingSendStatus() {
  if (sendCallInProgress || !pendingSend?.pendingId || !$('confirmDialog').open) return;
  try { await applyPendingSendStatus(await window.josimi.pendingSend()); } catch (_) {}
}
setInterval(pollPendingSendStatus, 5000);
async function resumeOpenWalletAndPendingSend() {
  try {
    renderSummary(await window.josimi.refresh());
    resetInactivityTimer();
    await refreshMiningStatus();
  } catch (_) {}
  try {
    const pending = await window.josimi.pendingSend();
    if (!pending) return;
    pendingSend = { pendingId: pending.pendingId };
    if (pending.state === 'relayed') {
      await applyPendingSendStatus({ ...pending, pendingId: pending.pendingId });
      return;
    }
    renderSendReview(pending);
    $('confirmDialog').showModal();
    await applyPendingSendStatus(pending);
  } catch (_) {}
}
resumeOpenWalletAndPendingSend();
