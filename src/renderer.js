const $ = (id) => document.getElementById(id);
const LANG = {
  ko: { lock:'잠금', heroTitle:'내 키는<br/><span>내 기기에.</span>', heroText:'josimi는 seed와 private key를 서버로 보내지 않는 비수탁형 Monero 지갑입니다.', walletTitle:'josimi 지갑', feeNotice:'서비스 수수료 0.25%, 최대 0.05 XMR + 네트워크 수수료', reviewEyebrow:'송금 검토', reviewDescription:'아래 내용을 확인한 뒤 한 번만 전송하세요.', walletSubtitle:'지갑을 열거나 새로 만드세요.', open:'열기', create:'새 지갑', restore:'복구', walletPassword:'지갑 비밀번호', passwordPlaceholder:'8자 이상', nodeMode:'노드', localNode:'원격 노드 사용', remoteNode:'원격 노드 사용', nodeAddress:'노드 주소', moneroSeed:'Monero seed', seedPlaceholder:'13/14/25단어 seed', seedOffset:'Seed offset passphrase (선택)', seedOffsetPlaceholder:'없으면 비워두세요', restoreHeight:'복구 시작 블록 높이', restoreHeightPlaceholder:'첫 입금 전의 블록 높이(모르면 낮게 입력)', createdAtHeight:'생성 시 블록 높이', openWallet:'지갑 열기', createWallet:'새 지갑 만들기', restoreWallet:'seed로 복구', authFine:'송금 전 주소·금액·서비스 수수료를 반드시 확인하세요.', totalBalance:'TOTAL BALANCE', syncWaiting:'동기화 대기', myAddress:'내 주소', copyAddress:'주소 복사', showQr:'QR 보기', send:'보내기', recipientAddress:'받는 주소', recipientPlaceholder:'Monero 주소를 붙여넣으세요', sendAmount:'보낼 금액 (XMR)', priority:'우선순위', low:'낮음', normal:'보통', high:'높음', review:'검토하기', recentTransactions:'최근 거래', localRecord:'로컬 기록', noTransactions:'아직 거래가 없습니다.', walletTools:'지갑 도구', backupWallet:'지갑 파일 백업', showSeed:'복구용 seed 표시', seedFine:'seed는 화면에 표시하는 순간 노출될 수 있습니다. 오프라인에만 보관하세요.', reviewTitle:'송금 내용을 확인하세요', cancel:'취소', confirmSend:'확인하고 송금', miningTitle:'채굴', miningStopped:'중지됨', miningMining:'채굴 중', miningRemote:'원격 채굴만 지원', miningThreads:'CPU 스레드', miningBackground:'백그라운드 채굴', miningIgnoreBattery:'배터리 상태 무시', startMining:'채굴 시작', stopMining:'채굴 중지' },
  en: { lock:'Lock', heroTitle:'Your keys,<br/><span>your device.</span>', heroText:'josimi is a non-custodial Monero wallet. Your seed and private keys stay on your device.', walletTitle:'josimi wallet', feeNotice:'Service fee 0.25%, capped at 0.05 XMR + network fee', reviewEyebrow:'Transaction review', reviewDescription:'Check the details below before sending once.', walletSubtitle:'Open an existing wallet or create a new one.', open:'Open', create:'New wallet', restore:'Restore', walletPassword:'Wallet password', passwordPlaceholder:'8 characters or more', nodeMode:'Node', localNode:'Local node (recommended)', remoteNode:'Use a remote node', nodeAddress:'Daemon address', moneroSeed:'Monero seed', seedPlaceholder:'13/14/25-word seed', seedOffset:'Seed offset passphrase (optional)', seedOffsetPlaceholder:'Leave blank if none', restoreHeight:'Restore height', restoreHeightPlaceholder:'Block height before the first incoming transaction', createdAtHeight:'Creation block height', openWallet:'Open wallet', createWallet:'Create wallet', restoreWallet:'Restore from seed', authFine:'Always check the address, amount, and service fee before sending.', totalBalance:'TOTAL BALANCE', syncWaiting:'Waiting for sync', myAddress:'My address', copyAddress:'Copy address', showQr:'Show QR', send:'Send', recipientAddress:'Recipient address', recipientPlaceholder:'Paste a Monero address', sendAmount:'Amount (XMR)', priority:'Priority', low:'Low', normal:'Normal', high:'High', review:'Review', recentTransactions:'Recent transactions', localRecord:'Local record', noTransactions:'No transactions yet.', walletTools:'Wallet tools', backupWallet:'Back up wallet file', showSeed:'Show recovery seed', seedFine:'Showing your seed can expose it. Keep it offline.', reviewTitle:'Review transaction', cancel:'Cancel', confirmSend:'Confirm and send', miningTitle:'Mining', miningStopped:'Stopped', miningMining:'Mining', miningRemote:'Remote pools only', miningThreads:'CPU threads', miningBackground:'Background mining', miningIgnoreBattery:'Ignore battery state', startMining:'Start mining', stopMining:'Stop mining' },
  zh: { lock:'锁定', heroTitle:'你的密钥，<br/><span>在你的设备。</span>', heroText:'josimi 是非托管 Monero 钱包。您的 seed 和私钥只保存在您的设备上。', walletTitle:'josimi 钱包', feeNotice:'服务费 0.25%，最高 0.05 XMR + 网络手续费', reviewEyebrow:'交易检查', reviewDescription:'发送前请确认以下内容。', walletSubtitle:'打开现有钱包或创建新钱包。', open:'打开', create:'新建钱包', restore:'恢复', walletPassword:'钱包密码', passwordPlaceholder:'至少 8 个字符', nodeMode:'节点', localNode:'使用本机节点（推荐）', remoteNode:'使用远程节点', nodeAddress:'节点地址', moneroSeed:'Monero seed', seedPlaceholder:'13/14/25 个单词的 seed', seedOffset:'Seed offset passphrase（可选）', seedOffsetPlaceholder:'没有则留空', restoreHeight:'恢复起始区块高度', restoreHeightPlaceholder:'首次收款前的区块高度（不确定时填低一些）', createdAtHeight:'创建时区块高度', openWallet:'打开钱包', createWallet:'创建钱包', restoreWallet:'从 seed 恢复', authFine:'发送前请务必核对地址、金额和服务费。', totalBalance:'总余额', syncWaiting:'等待同步', myAddress:'我的地址', copyAddress:'复制地址', showQr:'显示二维码', send:'发送', recipientAddress:'收款地址', recipientPlaceholder:'粘贴 Monero 地址', sendAmount:'发送金额 (XMR)', priority:'优先级', low:'低', normal:'普通', high:'高', review:'检查', recentTransactions:'最近交易', localRecord:'本地记录', noTransactions:'暂无交易。', walletTools:'钱包工具', backupWallet:'备份钱包文件', showSeed:'显示恢复 seed', seedFine:'显示 seed 可能导致泄露。请离线保存。', reviewTitle:'检查交易内容', cancel:'取消', confirmSend:'确认并发送', miningTitle:'挖矿', miningStopped:'已停止', miningMining:'挖矿中', miningRemote:'仅支持远程矿池', miningThreads:'CPU 线程', miningBackground:'后台挖矿', miningIgnoreBattery:'忽略电池状态', startMining:'开始挖矿', stopMining:'停止挖矿' },
  ja: { lock:'ロック', heroTitle:'鍵は、<br/><span>あなたの端末に。</span>', heroText:'josimiは非カストディ型のMoneroウォレットです。seedと秘密鍵は端末内に保存されます。', walletTitle:'josimi ウォレット', feeNotice:'サービス手数料 0.25%、上限 0.05 XMR + ネットワーク手数料', reviewEyebrow:'送金確認', reviewDescription:'送信前に以下の内容を確認してください。', walletSubtitle:'ウォレットを開くか、新しく作成します。', open:'開く', create:'新しいウォレット', restore:'復元', walletPassword:'ウォレットパスワード', passwordPlaceholder:'8文字以上', nodeMode:'ノード', localNode:'自分の端末のノード（推奨）', remoteNode:'リモートノードを使う', nodeAddress:'ノードアドレス', moneroSeed:'Monero seed', seedPlaceholder:'13/14/25語のseed', seedOffset:'Seed offset passphrase（任意）', seedOffsetPlaceholder:'なければ空欄', restoreHeight:'復元開始ブロック高', restoreHeightPlaceholder:'最初の入金前のブロック高（不明なら低め）', createdAtHeight:'作成時のブロック高', openWallet:'ウォレットを開く', createWallet:'ウォレットを作成', restoreWallet:'seedから復元', authFine:'送信前にアドレス・金額・サービス手数料を確認してください。', totalBalance:'合計残高', syncWaiting:'同期を待機中', myAddress:'自分のアドレス', copyAddress:'アドレスをコピー', showQr:'QRを表示', send:'送信', recipientAddress:'送金先アドレス', recipientPlaceholder:'Moneroアドレスを貼り付け', sendAmount:'送金額 (XMR)', priority:'優先度', low:'低', normal:'通常', high:'高', review:'確認', recentTransactions:'最近の取引', localRecord:'ローカル記録', noTransactions:'取引はまだありません。', walletTools:'ウォレットツール', backupWallet:'ウォレットファイルをバックアップ', showSeed:'復元用seedを表示', seedFine:'seedを表示すると漏洩する可能性があります。オフラインで保管してください。', reviewTitle:'送金内容を確認', cancel:'キャンセル', confirmSend:'確認して送信', miningTitle:'マイニング', miningStopped:'停止中', miningMining:'マイニング中', miningRemote:'リモートプールのみ対応', miningThreads:'CPUスレッド', miningBackground:'バックグラウンドマイニング', miningIgnoreBattery:'バッテリー状態を無視', startMining:'マイニング開始', stopMining:'マイニング停止' }
};
let language = localStorage.getItem('josimi.language') || 'ko';
if (!LANG[language]) language = 'ko';
const EXTRA_LANG = {
  ko: { miningFine: 'josimi는 CPU 채굴만 지원합니다. Solo와 P2Pool은 동기화가 끝난 로컬 monerod가 필요하며, P2Pool도 첫 실행 뒤 자체 네트워크를 동기화합니다. 전력과 발열을 고려해 스레드 수를 정하세요.', poolPlaintextWarning:'TLS를 끄면 지갑 주소와 풀 로그인/작업자 정보가 암호화되지 않습니다. 같은 네트워크의 관찰자가 이를 볼 수 있습니다.', miningPrivacyNotice:'채굴을 시작하면 원격 endpoint는 IP와 연결 정보를 볼 수 있습니다. 직접/자동 풀에는 공개 지갑 주소와 설정한 작업자/비밀번호가 전달됩니다. MoneroOcean 프리셋은 TLS를 사용합니다. 사용자 지정 풀에서 TLS를 끄면 로그인 정보가 평문으로 전달되어 네트워크에서 관찰될 수 있습니다. 로컬 P2Pool에는 --wallet으로 공개 주소를 전달하며, XMRig는 loopback Stratum에만 연결하고 주소나 풀 로그인 정보를 받지 않습니다. P2Pool 피어 연결은 IP와 채굴 활동을 노출할 수 있고, 주소는 공개 보상 기록이나 로컬 프로세스 목록에 보일 수 있습니다. Solo는 공개 주소와 채굴 설정을 로컬 monerod에만 전달하며, Monero P2P 피어는 노드 IP와 연결 정보를 볼 수 있습니다. 채굴은 직접 시작해야 합니다. seed와 개인 키는 전송하지 않습니다. 풀 정책과 XMRig 개발자 기부 수수료가 적용될 수 있습니다.', miningPartial: '채굴 프로세스 일부 실패', miningUnsupported: 'Windows에서만 지원', miningUserThreads: '내 지갑', miningFeeThreads: '수수료', reviewRecipient: '받는 주소', reviewAmount: '보낼 금액', reviewServiceFee: '서비스 수수료 (0.25%, 최대 0.05 XMR)', reviewNetworkFee: '네트워크 수수료', reviewTotal: '총 차감액', reviewFeeAddress: '수수료 수취 주소' },
  en: { miningFine: 'josimi supports CPU mining only; GPU mining is not implemented. Solo and P2Pool require a fully synced local monerod, and P2Pool also needs time to synchronize its own network on first start. Consider power use and heat when setting threads.', poolPlaintextWarning:'With TLS off, your wallet address and pool login/worker value are sent unencrypted and may be visible to network observers.', miningPrivacyNotice:'Starting mining connects to a remote endpoint, which can see your IP and connection details. Direct/automatic pools receive your public wallet address and configured worker/password. The MoneroOcean preset uses TLS. If you disable TLS for a custom pool, the login travels in plaintext and network observers may read it. Local P2Pool receives the public address as --wallet; XMRig connects only to P2Pool\'s loopback Stratum listener and does not receive a wallet address or pool credentials. P2Pool peers can observe your IP and mining activity; your address may also appear in public reward records or local process listings. Solo sends the public address and mining settings only to local monerod; Monero P2P peers can see the node IP and connection metadata. Mining runs only when you start it. josimi does not send your seed or private keys. Pool terms and XMRig developer donations may apply.', miningPartial: 'One mining process failed', miningUnsupported: 'Supported on Windows only', miningUserThreads: 'Your wallet', miningFeeThreads: 'Fee', reviewRecipient: 'Recipient address', reviewAmount: 'Amount', reviewServiceFee: 'Service fee (0.25%, max 0.05 XMR)', reviewNetworkFee: 'Network fee', reviewTotal: 'Total debit', reviewFeeAddress: 'Fee recipient' },
  zh: { miningFine: 'josimi目前仅支持CPU挖矿，不支持GPU。Solo和P2Pool需要已完全同步的本地monerod；P2Pool首次启动后还需要时间同步自身网络。请根据功耗和温度设置线程数。', poolPlaintextWarning:'关闭TLS后，钱包地址和矿池登录/工作者信息将以明文传输，网络观察者可能看到。', miningPrivacyNotice:'开始挖矿后，远程endpoint可以看到您的IP地址和连接信息。直接/自动矿池会收到您的公开钱包地址及设置的工作者/密码。MoneroOcean预设使用TLS。自定义矿池关闭TLS时，登录信息将以明文传输，网络观察者可能看到。本地P2Pool通过--wallet接收公开地址；XMRig仅连接P2Pool的loopback Stratum，不会收到钱包地址或矿池登录信息。P2Pool节点可能看到您的IP和挖矿活动；地址也可能出现在公开奖励记录或本机进程列表中。Solo仅将公开地址和挖矿设置发送给本地monerod；Monero P2P节点可以看到节点IP和连接信息。挖矿仅在您手动启动后运行。josimi不会发送seed或私钥。矿池条款和XMRig开发者捐赠费用可能适用。', miningPartial: '一个挖矿进程失败', miningUnsupported: '仅支持 Windows', miningUserThreads: '您的钱包', miningFeeThreads: '手续费', reviewRecipient: '收款地址', reviewAmount: '发送金额', reviewServiceFee: '服务费（0.25%，最高 0.05 XMR）', reviewNetworkFee: '网络手续费', reviewTotal: '总扣款', reviewFeeAddress: '手续费收款地址' },
  ja: { miningFine: 'josimiが対応するのはCPUマイニングのみで、GPUには対応していません。SoloとP2Poolには同期済みのローカルmonerodが必要です。P2Poolも初回起動後に独自のネットワーク同期を行います。電力と温度を考慮してスレッド数を設定してください。', poolPlaintextWarning:'TLSを無効にすると、ウォレットアドレスとプールのログイン/ワーカー情報が暗号化されず、ネットワーク上で傍受される可能性があります。', miningPrivacyNotice:'マイニングを開始すると、リモートendpointにIPアドレスと接続情報が伝わります。直接/自動プールには公開ウォレットアドレスと設定したワーカー/パスワードが送信されます。MoneroOceanのプリセットはTLSを使用します。カスタムプールでTLSを無効にするとログイン情報が平文で送信され、ネットワーク上で見られる可能性があります。ローカルP2Poolには--walletで公開アドレスを渡します。XMRigはP2Poolのloopback Stratumにのみ接続し、ウォレットアドレスやプール認証情報は受け取りません。P2PoolのピアにはIPとマイニング活動が見える場合があり、アドレスは公開報酬記録やローカルのプロセス一覧に表示されることがあります。Soloでは公開アドレスと設定をローカルmonerodにのみ送信し、Monero P2PピアにはノードIPと接続情報が見える場合があります。マイニングは手動で開始した場合のみ動作します。josimiがseedや秘密鍵を送信することはありません。プール規約やXMRigの開発者寄付が適用される場合があります。', miningPartial: 'マイニングプロセスの一部が失敗', miningUnsupported: 'Windowsのみ対応', miningUserThreads: '自分のウォレット', miningFeeThreads: '手数料', reviewRecipient: '送金先アドレス', reviewAmount: '送金額', reviewServiceFee: 'サービス手数料（0.25%、上限0.05 XMR）', reviewNetworkFee: 'ネットワーク手数料', reviewTotal: '合計引落額', reviewFeeAddress: '手数料の受取先' }
};
for (const code of Object.keys(EXTRA_LANG)) Object.assign(LANG[code], EXTRA_LANG[code]);
const GUI_LANG = {
  ko: { accountsTitle:'계정과 하위 주소', accountName:'새 계정 이름', accountNamePlaceholder:'예: 저축', createAccount:'계정 만들기', renameAccount:'이름 저장', receiveAccount:'받을 계정', receiveSubaddress:'받을 하위 주소', createSubaddress:'하위 주소 만들기', subaddressLabel:'선택 계정의 하위 주소 이름', subaddressLabelPlaceholder:'예: 월급', sendFromAccount:'보낼 계정', recipientName:'받는 사람 이름 (선택)', transactionNote:'거래 메모 (선택)', txIncoming:'받음', txOutgoing:'보냄', txUnknown:'거래', editTxNote:'메모', addressBookTitle:'주소록', contactName:'이름', contactNamePlaceholder:'예: 거래처', contactAddress:'Monero 주소', contactAddressPlaceholder:'Monero 주소를 입력하세요', addContact:'주소록에 추가', updateContact:'주소록 수정', cancelEdit:'수정 취소', useContact:'받는 주소로 사용', editContact:'편집', deleteContact:'삭제', noContacts:'주소록이 비어 있습니다.', noAccounts:'계정을 불러오지 못했습니다.', accountBalance:'잔액', unlockedBalance:'사용 가능', confirmDeleteContact:'이 주소록 항목을 삭제할까요?', notePrompt:'거래 메모를 입력하세요. 비우면 메모를 지웁니다.', saved:'저장했습니다.' },
  en: { accountsTitle:'Accounts and subaddresses', accountName:'New account name', accountNamePlaceholder:'e.g. Savings', createAccount:'Create account', renameAccount:'Save name', receiveAccount:'Receive account', receiveSubaddress:'Receive subaddress', createSubaddress:'Create subaddress', subaddressLabel:'New subaddress name', subaddressLabelPlaceholder:'e.g. Salary', sendFromAccount:'Send from account', recipientName:'Recipient name (optional)', transactionNote:'Transaction note (optional)', txIncoming:'Received', txOutgoing:'Sent', txUnknown:'Transaction', editTxNote:'Note', addressBookTitle:'Address book', contactName:'Name', contactNamePlaceholder:'e.g. Merchant', contactAddress:'Monero address', contactAddressPlaceholder:'Enter a Monero address', addContact:'Add to address book', updateContact:'Update contact', cancelEdit:'Cancel edit', useContact:'Use as recipient', editContact:'Edit', deleteContact:'Delete', noContacts:'Address book is empty.', noAccounts:'Could not load accounts.', accountBalance:'Balance', unlockedBalance:'Unlocked', confirmDeleteContact:'Delete this address book entry?', notePrompt:'Enter a transaction note. Leave empty to clear it.', saved:'Saved.' },
  zh: { accountsTitle:'账户与子地址', accountName:'新账户名称', accountNamePlaceholder:'例如：储蓄', createAccount:'创建账户', renameAccount:'保存名称', receiveAccount:'收款账户', receiveSubaddress:'收款子地址', createSubaddress:'创建子地址', subaddressLabel:'新子地址名称', subaddressLabelPlaceholder:'例如：工资', sendFromAccount:'付款账户', recipientName:'收款人名称（可选）', transactionNote:'交易备注（可选）', txIncoming:'收款', txOutgoing:'付款', txUnknown:'交易', editTxNote:'备注', addressBookTitle:'地址簿', contactName:'名称', contactNamePlaceholder:'例如：商家', contactAddress:'Monero 地址', contactAddressPlaceholder:'输入 Monero 地址', addContact:'添加到地址簿', updateContact:'更新联系人', cancelEdit:'取消编辑', useContact:'用作收款地址', editContact:'编辑', deleteContact:'删除', noContacts:'地址簿为空。', noAccounts:'无法加载账户。', accountBalance:'余额', unlockedBalance:'可用', confirmDeleteContact:'删除此地址簿条目吗？', notePrompt:'输入交易备注。留空即可清除。', saved:'已保存。' },
  ja: { accountsTitle:'アカウントとサブアドレス', accountName:'新しいアカウント名', accountNamePlaceholder:'例：貯蓄', createAccount:'アカウントを作成', renameAccount:'名前を保存', receiveAccount:'受取アカウント', receiveSubaddress:'受取サブアドレス', createSubaddress:'サブアドレスを作成', subaddressLabel:'新しいサブアドレス名', subaddressLabelPlaceholder:'例：給与', sendFromAccount:'送金元アカウント', recipientName:'受取人名（任意）', transactionNote:'取引メモ（任意）', txIncoming:'受取', txOutgoing:'送金', txUnknown:'取引', editTxNote:'メモ', addressBookTitle:'アドレス帳', contactName:'名前', contactNamePlaceholder:'例：販売店', contactAddress:'Monero アドレス', contactAddressPlaceholder:'Monero アドレスを入力', addContact:'アドレス帳に追加', updateContact:'連絡先を更新', cancelEdit:'編集を取消', useContact:'送金先に使用', editContact:'編集', deleteContact:'削除', noContacts:'アドレス帳は空です。', noAccounts:'アカウントを読み込めませんでした。', accountBalance:'残高', unlockedBalance:'利用可能', confirmDeleteContact:'このアドレス帳項目を削除しますか？', notePrompt:'取引メモを入力してください。空欄で消去します。', saved:'保存しました。' }
};
for (const code of Object.keys(GUI_LANG)) Object.assign(LANG[code], GUI_LANG[code]);
Object.assign(LANG.ko, { txConfirmed:'확정', txLocked:'잠금 중', txPending:'대기 중' });
Object.assign(LANG.en, { txConfirmed:'Confirmed', txLocked:'Locked', txPending:'Pending' });
Object.assign(LANG.zh, { txConfirmed:'已确认', txLocked:'锁定中', txPending:'待处理' });
Object.assign(LANG.ja, { txConfirmed:'確定済み', txLocked:'ロック中', txPending:'保留中' });
Object.assign(LANG.ko, { miningStarting: '채굴 준비 중' });
Object.assign(LANG.en, { miningStarting: 'Preparing mining' });
Object.assign(LANG.zh, { miningStarting: '正在准备挖矿' });
Object.assign(LANG.ja, { miningStarting: 'マイニングを準備中' });
Object.assign(LANG.ko, { reviewPriority: '우선순위' });
Object.assign(LANG.en, { reviewPriority: 'Priority' });
Object.assign(LANG.zh, { reviewPriority: '优先级' });
Object.assign(LANG.ja, { reviewPriority: '優先度' });
Object.assign(LANG.ko, { miningMining: '채굴 중' });
Object.assign(LANG.en, { miningMining: 'Mining' });
Object.assign(LANG.zh, { miningMining: '挖矿中' });
Object.assign(LANG.ja, { miningMining: 'マイニング中' });
Object.assign(LANG.ko, { miningTitle: '채굴', miningMode: '채굴 방식', miningPool: '직접 풀', miningAuto: '자동으로 풀 선택', miningP2pool: 'P2Pool', poolAddress: '풀 주소', poolTls: 'TLS 사용', p2poolProfile: 'P2Pool 네트워크', p2poolNodeMode: 'P2Pool 노드', p2poolRemote: '원격 P2Pool stratum 사용', p2poolNodeAddress: 'P2Pool 주소', miningAuto100: 'CPU 자동 100% 사용', miningFine: 'josimi는 CPU 채굴만 지원하며 GPU 채굴은 지원하지 않습니다. Solo와 P2Pool은 완전히 동기화된 로컬 monerod가 필요합니다. 전력과 발열을 고려해 스레드 수를 정하세요.', miningRemote: '원격 노드 모드' });
Object.assign(LANG.en, { miningTitle: 'Mining', miningMode: 'Mining mode', miningPool: 'Direct pool', miningAuto: 'Auto-select pool', miningP2pool: 'P2Pool', poolAddress: 'Pool address', poolTls: 'Use TLS', p2poolProfile: 'P2Pool network', p2poolNodeMode: 'P2Pool node', p2poolRemote: 'Use a remote P2Pool stratum', p2poolNodeAddress: 'P2Pool address', miningAuto100: 'Automatically use 100% CPU', miningFine: 'josimi supports CPU mining only; GPU mining is not supported. Solo and P2Pool require a fully synced local monerod. Consider power use and heat when setting threads.', miningRemote: 'Remote node mode' });
Object.assign(LANG.zh, { miningAuto100: '自动使用 100% CPU' });
Object.assign(LANG.ja, { miningAuto100: 'CPUを自動で100%使用' });
Object.assign(LANG.ko, { walletSubtitle: '새 지갑 만들기부터 시작하세요.', existingKeysOpen: '이미 지갑이 있나요? .keys 파일 열기', selectedKeyFile: '선택한 .keys 파일' });
Object.assign(LANG.en, { walletSubtitle: 'Start by creating a new wallet.', existingKeysOpen: 'Already have a wallet? Open a .keys file', selectedKeyFile: 'Selected .keys file' });
Object.assign(LANG.zh, { walletSubtitle: '请先创建一个新钱包。', existingKeysOpen: '已有钱包？打开 .keys 文件', selectedKeyFile: '已选 .keys 文件' });
Object.assign(LANG.ja, { walletSubtitle: 'まず新しいウォレットを作成してください。', existingKeysOpen: '既にウォレットがありますか？.keys ファイルを開く', selectedKeyFile: '選択した .keys ファイル' });
Object.assign(LANG.ko, { nodePrivacyNotice: '원격 노드 운영자는 IP와 연결 메타데이터를 볼 수 있습니다. 신뢰하는 노드를 사용하세요.', nodeOffline: '노드 연결 끊김', nodeOfflineDetail: '노드 주소와 네트워크 연결을 확인하세요.', nodeSyncing: '노드 동기화 중', nodeSynced: '동기화 완료', nodeRemote: '원격 노드 연결됨', nodeStopped: '노드 중지됨', syncBlocks: '블록', syncPeers: '피어', txFeeLabel: '수수료', seedRevealConfirm: '복구 seed를 화면에 표시합니다. 주변에 사람이 없고 기록 장치가 안전한지 확인했습니까?', seedBackupReminder: '지갑을 만들었습니다. 복구용 seed 표시에서 seed를 오프라인으로 안전하게 백업하세요.', seedUnavailable: '이 지갑에서 복구 seed를 가져올 수 없습니다.', copiedAddress: '주소를 복사했습니다.', backupSaved: '지갑 백업을 저장했습니다.', restoredWallet: 'seed로 지갑을 복구했습니다.', relayInProgress: '노드가 송금 전파를 처리 중입니다. 새 송금을 만들지 말고 잠시 기다리세요.', relayUnknownActive: '전파 결과가 아직 불확실하고 기존 요청이 진행 중입니다. 새 송금을 만들지 말고 기다리세요.', relayUnknownRetry: '전파 결과가 불확실합니다. 새 송금을 만들지 말고 기존 서명 거래만 다시 확인하세요.', relayCancelUnavailable: '이미 전파를 시도한 거래는 취소할 수 없습니다. 새 송금을 만들지 마세요.' });
Object.assign(LANG.en, { nodePrivacyNotice: 'Remote node operators can see your IP address and connection metadata. Use a node you trust.', nodeOffline: 'Node disconnected', nodeOfflineDetail: 'Check the node address and network connection.', nodeSyncing: 'Node syncing', nodeSynced: 'Synced', nodeRemote: 'Remote node connected', nodeStopped: 'Node stopped', syncBlocks: 'Blocks', syncPeers: 'Peers', txFeeLabel: 'Fee', seedRevealConfirm: 'This will show your recovery seed on screen. Make sure nobody can see it and your device is safe.', seedBackupReminder: 'Wallet created. Use Show recovery seed to make a secure offline backup.', seedUnavailable: 'Could not retrieve a recovery seed for this wallet.', copiedAddress: 'Address copied.', backupSaved: 'Wallet backup saved.', restoredWallet: 'Wallet restored from seed.', relayInProgress: 'The node is processing the relay. Wait; do not create another transaction.', relayUnknownActive: 'The relay result is unknown and the original request is still in progress. Wait; do not create another transaction.', relayUnknownRetry: 'The relay result is unknown. Do not create a new transaction; only retry checking the same signed transaction.', relayCancelUnavailable: 'A transaction that has entered relay cannot be cancelled. Do not create another transaction.' });
Object.assign(LANG.zh, { nodePrivacyNotice: '远程节点运营者可以看到您的 IP 地址和连接元数据。请使用您信任的节点。', nodeOffline: '节点已断开', nodeOfflineDetail: '请检查节点地址和网络连接。', nodeSyncing: '节点同步中', nodeSynced: '已同步', nodeRemote: '远程节点已连接', nodeStopped: '节点已停止', syncBlocks: '区块', syncPeers: '节点', txFeeLabel: '手续费', seedRevealConfirm: '将在屏幕上显示恢复 seed。请确认周围无人且设备安全。', seedBackupReminder: '钱包已创建。请使用“显示恢复 seed”进行安全的离线备份。', seedUnavailable: '无法从此钱包获取恢复 seed。', copiedAddress: '地址已复制。', backupSaved: '钱包备份已保存。', restoredWallet: '已从 seed 恢复钱包。', relayInProgress: '节点正在处理中继。请等待，不要创建另一笔交易。', relayUnknownActive: '中继结果未知，原请求仍在处理中。请等待，不要创建新交易。', relayUnknownRetry: '中继结果未知。请勿创建新交易；只能重试检查同一笔已签名交易。', relayCancelUnavailable: '已尝试中继的交易无法取消。请勿创建另一笔交易。' });
Object.assign(LANG.ja, { nodePrivacyNotice: 'リモートノードの運営者にはIPアドレスや接続メタデータが見える場合があります。信頼できるノードを使用してください。', nodeOffline: 'ノード未接続', nodeOfflineDetail: 'ノードアドレスとネットワーク接続を確認してください。', nodeSyncing: 'ノード同期中', nodeSynced: '同期完了', nodeRemote: 'リモートノード接続済み', nodeStopped: 'ノード停止中', syncBlocks: 'ブロック', syncPeers: 'ピア', txFeeLabel: '手数料', seedRevealConfirm: '復元用seedを画面に表示します。周囲に人がいないこと、端末が安全であることを確認しましたか？', seedBackupReminder: 'ウォレットを作成しました。「復元用seedを表示」からオフラインで安全にバックアップしてください。', seedUnavailable: 'このウォレットから復元用seedを取得できません。', copiedAddress: 'アドレスをコピーしました。', backupSaved: 'ウォレットのバックアップを保存しました。', restoredWallet: 'seedからウォレットを復元しました。', relayInProgress: 'ノードが送信を中継中です。別の取引を作らずお待ちください。', relayUnknownActive: '中継結果は不明で、元の要求がまだ処理中です。別の取引を作らずお待ちください。', relayUnknownRetry: '中継結果は不明です。新しい取引を作らず、同じ署名済み取引のみ再確認してください。', relayCancelUnavailable: '中継を試みた取引はキャンセルできません。別の取引を作らないでください。' });
Object.assign(LANG.ko, { qrError: 'QR 코드를 표시하지 못했습니다.' });
Object.assign(LANG.en, { qrError: 'Could not display the QR code.' });
Object.assign(LANG.zh, { qrError: '无法显示二维码。' });
Object.assign(LANG.ja, { qrError: 'QRコードを表示できませんでした。' });
Object.assign(LANG.ko, { copyAddressError: '주소 복사 실패' });
Object.assign(LANG.en, { copyAddressError: 'Could not copy address' });
Object.assign(LANG.zh, { copyAddressError: '无法复制地址' });
Object.assign(LANG.ja, { copyAddressError: 'アドレスをコピーできませんでした' });
Object.assign(LANG.ko, { openPasswordPlaceholder: '기존 지갑의 비밀번호 (없으면 비워두세요)' });
Object.assign(LANG.en, { openPasswordPlaceholder: 'Existing wallet password (leave blank if none)' });
Object.assign(LANG.zh, { openPasswordPlaceholder: '原有钱包密码（若无密码请留空）' });
Object.assign(LANG.ja, { openPasswordPlaceholder: '既存ウォレットのパスワード（なければ空欄）' });
Object.assign(LANG.zh, { miningMode: '挖矿模式', miningPool: '直接矿池', miningAuto: '自动选择矿池', miningP2pool: 'P2Pool', poolAddress: '矿池地址', poolTls: '使用 TLS', p2poolProfile: 'P2Pool 网络', p2poolNodeMode: 'P2Pool 节点', p2poolRemote: '使用远程 P2Pool stratum', p2poolNodeAddress: 'P2Pool 地址', miningFine: '使用远程节点和矿池，不运行本地 monerod。请留意电量、温度以及操作系统的实际处理能力。', miningRemote: '远程节点模式' });
Object.assign(LANG.ja, { miningMode: 'マイニング方式', miningPool: '直接プール', miningAuto: 'プールを自動選択', miningP2pool: 'P2Pool', poolAddress: 'プールアドレス', poolTls: 'TLSを使用', p2poolProfile: 'P2Poolネットワーク', p2poolNodeMode: 'P2Poolノード', p2poolRemote: 'リモートP2Pool stratumを使用', p2poolNodeAddress: 'P2Poolアドレス', miningFine: 'ローカルmonerodを使わず、リモートノードとプールを使用します。電力、温度、OSの処理能力に注意してください。', miningRemote: 'リモートノードモード' });
Object.assign(LANG.ko, { seedFine: 'seed는 화면에 표시되는 순간 노출될 수 있습니다. seed offset passphrase를 사용했다면 별도로 보관하세요. 둘 다 오프라인에 보관하세요.' });
Object.assign(LANG.en, { seedFine: 'Showing your seed can expose it. If you used a seed offset passphrase, keep it separately. Store both offline.' });
Object.assign(LANG.zh, { seedFine: '显示 seed 可能导致泄露。若使用了 seed offset passphrase，请单独保存。请将两者离线保管。' });
Object.assign(LANG.ja, { seedFine: 'seedを表示すると漏洩する可能性があります。seed offset passphraseを使った場合は別に保管し、両方をオフラインで保存してください。' });
const LOCALIZED_RUNTIME = {
  ko: {
    nodeMode:'노드 유형', nodeRemoteChoice:'신뢰하는 원격 노드', nodeLocalChoice:'이 PC의 로컬 monerod', nodeAddress:'원격 Monero 노드 주소',
    nodePrivacyNotice:'원격 daemon 운영자는 IP 주소를 볼 수 있고 RPC 요청에서 지갑 잔액·활동을 추론할 수 있습니다. 신뢰하는 노드나 로컬 monerod를 사용하세요.',
    nodeLocalNotice:'지갑 RPC는 127.0.0.1의 로컬 monerod에만 연결됩니다. 노드는 외부 P2P 피어에 연결해 IP를 알릴 수 있으며, 기본 포트 18080에서 계속 수신 대기합니다. --hide-my-port는 피어 목록 광고만 막고, 외부 연결 가능성은 방화벽에 달려 있습니다.',
    localNodeSummary:'로컬 노드 (monerod)', localNodeIntro:'josimi Windows ZIP에는 Monero CLI 전체가 아닌 공식 monerod v0.18.5.4와 필요한 런타임 파일만 포함됩니다. 빌드 시 원본 archive SHA-256을 확인하고, 실행 전 파일 무결성을 검사해 monerod를 창 없이 실행합니다.',
    localNodeChecking:'로컬 노드 상태 확인 중', localNodeInstall:'포함된 monerod 검증', localNodeStart:'monerod 시작', localNodeStop:'노드 중지',
    localNodeStorageNotice:'첫 동기화는 수 시간 또는 며칠이 걸리고 큰 저장 공간과 대역폭을 쓸 수 있습니다. pruning과 UPnP 비활성화를 적용하지만 monerod는 네트워크 인터페이스의 기본 P2P 포트 18080에서 계속 수신 대기합니다. --hide-my-port는 피어 후보로 광고되는 것만 막으며, 외부 연결 가능성은 PC 방화벽에 달려 있습니다.',
    localNodeUnsupported:'로컬 노드는 Windows에서만 지원됩니다.', localNodeMissing:'포함된 monerod 런타임을 찾지 못했습니다. 공식 josimi Windows ZIP을 다시 설치하세요. 실행 중 다운로드는 하지 않습니다.',
    localNodeVerifying:'포함된 monerod 파일 검증 중', localNodeInstalled:'monerod와 필요한 런타임 파일이 포함되어 있습니다. 실행 전 각 파일의 SHA-256을 포함된 manifest와 대조합니다. manifest 자체는 별도 서명되지 않았습니다.', localNodeRunning:'monerod 실행 중 — 동기화 상태를 확인하세요.', localNodeStopped:'로컬 monerod 중지됨', localNodeSynced:'로컬 노드 동기화 완료', localNodeSyncing:'로컬 노드 동기화 중',
    miningFine:'josimi는 CPU 채굴만 지원하며 GPU 채굴은 지원하지 않습니다. Solo와 P2Pool은 동기화가 끝난 로컬 monerod가 필요하고, P2Pool은 첫 실행 뒤 자체 네트워크도 동기화합니다. 전력과 발열을 고려해 스레드 수를 정하세요.',
    miningPrivacyNotice:'직접 풀은 IP, 공개 지갑 주소(-u), 풀 비밀번호/작업자(-p)를 받습니다. MoneroOcean 기본 주소는 gulf.moneroocean.stream:20128(TLS)이며 작업자 기본값은 josimi~rx/0입니다. 자동 선택은 후보에 TLS 연결만 병렬 확인하므로 후보는 IP와 연결 시점을 볼 수 있지만 지갑 주소나 채굴 작업은 받지 않습니다. 사용자 지정 풀에서 TLS를 끄면 로그인 정보가 평문으로 전달되어 네트워크에서 관찰될 수 있습니다. P2Pool에는 공개 주소를 --wallet으로 전달합니다. XMRig는 P2Pool의 127.0.0.1:3333 loopback Stratum에만 연결하고 주소나 풀 자격정보를 받지 않습니다. P2Pool 명령줄이나 공개 보상 기록에는 주소가 보일 수 있습니다. P2Pool 피어는 IP와 채굴 활동을 볼 수 있으며 P2P 리스너는 모든 네트워크 인터페이스에서 수신 대기할 수 있습니다. 방화벽이 허용하면 피어가 연결할 수 있고, UPnP 포트 개방은 하지 않습니다. Solo는 공개 주소와 채굴 설정을 로컬 monerod에만 전달합니다. Monero P2P 피어는 노드 IP와 연결 정보를 볼 수 있습니다. seed와 개인 키는 전송하지 않습니다. josimi 수수료 0.25%는 지갑 송금에만 적용되고 채굴 보상에는 적용되지 않습니다. XMRig 기본 개발자 기부율은 1%입니다.',
    miningPool:'직접 풀', miningAuto:'자동으로 풀 선택', miningP2pool:'로컬 P2Pool', miningSolo:'Solo (monerod)', p2poolLocalNotice:'로컬 P2Pool과 XMRig는 숨김 프로세스로 실행됩니다. monerod 동기화 후 P2Pool도 첫 동기화에 보통 5~10분이 걸릴 수 있으며, 이 동안 XMRig 상태는 연결 중일 수 있습니다. P2Pool 피어 포트는 네트워크 인터페이스에서 수신 대기할 수 있고 방화벽이 허용하면 외부 피어가 연결할 수 있습니다. UPnP 라우터 포트 개방은 끕니다.',
    relayRestartUnknown:'앱이 다시 시작된 뒤 이전 송금 전파 결과가 확인되지 않았습니다. 아래 해시를 지갑·신뢰할 수 있는 노드에서 확인하세요. 같은 거래가 전파됐을 가능성이 있으므로 확인 전 새 송금을 만들지 마세요. 서명된 거래 원문은 재시작 후 보관되지 않아 자동 재전송할 수 없습니다.',
    recoveryTxHash:'확인할 거래 해시', leaveBlocked:'차단 상태로 닫기', resolveUnknownSend:'확인 후 차단 해제', resolveSendSuccess:'이전 송금 차단을 해제했습니다. 반드시 이전 거래 상태를 확인한 뒤 새 송금을 진행하세요.'
  },
  en: {
    nodeMode:'Node type', nodeRemoteChoice:'Trusted remote node', nodeLocalChoice:'This PC (local monerod)', nodeAddress:'Remote Monero node address',
    nodePrivacyNotice:'A remote daemon can see your IP address and may infer wallet balances or activity from RPC requests. Use a node you trust or run local monerod.',
    nodeLocalNotice:'Wallet RPC connects only to local monerod at 127.0.0.1. The node connects to Monero P2P peers, which can see its IP, and still listens on the default P2P port 18080. --hide-my-port only prevents peer-list advertisement; the firewall controls inbound reachability.',
    localNodeSummary:'Local node (monerod)', localNodeIntro:'The josimi Windows ZIP includes the official Monero v0.18.5.4 monerod daemon and required runtime files, not the full CLI. The source archive SHA-256 is checked at build time, and monerod runs hidden after its files are verified.',
    localNodeChecking:'Checking local node status', localNodeInstall:'Verify bundled monerod', localNodeStart:'Start monerod', localNodeStop:'Stop node',
    localNodeStorageNotice:'Initial sync may take hours or days and use substantial disk space and bandwidth. Pruning is enabled and UPnP is disabled, but monerod still listens on the default P2P port 18080 across network interfaces. --hide-my-port only prevents peer-list advertisement; inbound reachability depends on the PC firewall.',
    localNodeUnsupported:'Local node is supported on Windows only.', localNodeMissing:'The bundled monerod runtime was not found. Reinstall the official josimi Windows ZIP; the app does not download it at runtime.',
    localNodeVerifying:'Verifying bundled monerod files', localNodeInstalled:'monerod and its required runtime files are bundled; file SHA-256 values are checked against the included manifest before launch. The manifest itself is not separately signed.', localNodeRunning:'monerod is running — check sync status.', localNodeStopped:'Local monerod stopped', localNodeSynced:'Local node synced', localNodeSyncing:'Local node syncing',
    miningFine:'josimi supports CPU mining only; GPU mining is not implemented. Solo and P2Pool require a fully synced local monerod, and P2Pool also synchronizes its own network on first start. Consider power use and heat when setting threads.',
    miningPrivacyNotice:'Direct pools receive your IP, public wallet address (-u), and pool password/worker (-p). MoneroOcean defaults to gulf.moneroocean.stream:20128 (TLS) and worker value josimi~rx/0. Auto-select makes parallel TLS connection checks, so candidates see your IP and connection time but not your wallet address or mining work. Disabling TLS for a custom pool sends the login in plaintext, where network observers may read it. P2Pool receives the public address as --wallet. XMRig connects only to P2Pool\'s loopback Stratum at 127.0.0.1:3333 and receives no wallet address or pool credentials. The P2Pool command line or public reward records may expose the address. P2Pool peers can see your IP and mining activity; its peer listener may accept connections on all network interfaces if the firewall permits. UPnP port mapping is disabled. Solo sends the public address and mining settings only to local monerod; Monero P2P peers can see the node IP and connection metadata. Seed and private keys are not sent. The 0.25% josimi fee applies only to wallet transfers, not mining rewards. XMRig\'s default developer donation is 1%.',
    miningPool:'Direct pool', miningAuto:'Auto-select pool', miningP2pool:'Local P2Pool', miningSolo:'Solo (monerod)', p2poolLocalNotice:'Local P2Pool and XMRig run as hidden processes. After monerod is synced, P2Pool may need about 5–10 minutes for its first sync; XMRig can remain in a connecting state during that time. P2Pool peers may connect through its network-interface listener if the firewall permits. Router UPnP mapping is disabled.',
    relayRestartUnknown:'The previous transaction relay result is unknown after the app restarted. Check the hash below in your wallet or a trusted node. Do not create another transfer until you know whether the transaction was relayed. Signed transaction data is not retained across restarts, so this app cannot automatically retry it.',
    recoveryTxHash:'Transaction hash to check', leaveBlocked:'Close and keep blocked', resolveUnknownSend:'Clear block after checking', resolveSendSuccess:'The previous-send block was cleared. Verify the old transaction before sending again.'
  },
  zh: {
    nodeMode:'节点类型', nodeRemoteChoice:'可信的远程节点', nodeLocalChoice:'本机（本地 monerod）', nodeAddress:'远程 Monero 节点地址',
    nodePrivacyNotice:'远程 daemon 可以看到您的 IP 地址，并可能根据 RPC 请求推断钱包余额或活动。请使用可信节点或运行本地 monerod。',
    nodeLocalNotice:'钱包 RPC 仅连接到 127.0.0.1 上的本地 monerod。节点会连接 Monero P2P 节点并可能暴露 IP，且仍在默认 P2P 端口 18080 上监听。--hide-my-port 只阻止节点被列为候选节点；外部能否连接取决于电脑防火墙。',
    localNodeSummary:'本地节点（monerod）', localNodeIntro:'josimi Windows ZIP 仅包含 Monero 官方 v0.18.5.4 monerod 守护进程及必要运行库，不包含完整 CLI。构建时核对源 archive SHA-256，启动前验证文件完整性，并在后台运行。',
    localNodeChecking:'正在检查本地节点状态', localNodeInstall:'验证内置 monerod', localNodeStart:'启动 monerod', localNodeStop:'停止节点',
    localNodeStorageNotice:'首次同步可能需要数小时或数天，并占用大量磁盘空间和网络流量。已启用裁剪并禁用 UPnP，但 monerod 仍会在网络接口的默认 P2P 端口 18080 上监听。--hide-my-port 仅阻止节点被列为候选节点；外部能否连接取决于电脑防火墙。',
    localNodeUnsupported:'本地节点仅支持 Windows。', localNodeMissing:'未找到内置 monerod 运行文件。请重新安装官方 josimi Windows ZIP；应用运行时不会下载节点。',
    localNodeVerifying:'正在验证内置 monerod 文件', localNodeInstalled:'已包含 monerod 和必要运行库；启动前会将文件 SHA-256 与内置清单核对。该清单本身未单独签名。', localNodeRunning:'monerod 正在运行 — 请查看同步状态。', localNodeStopped:'本地 monerod 已停止', localNodeSynced:'本地节点已同步', localNodeSyncing:'本地节点同步中',
    miningFine:'josimi目前仅支持CPU挖矿，不支持GPU。Solo和P2Pool需要已完全同步的本地monerod；P2Pool首次启动后还需要同步自身网络。请根据功耗和温度设置线程数。',
    miningPrivacyNotice:'直接矿池会收到您的IP、公开钱包地址（-u）和矿池密码/工作者值（-p）。MoneroOcean默认地址为gulf.moneroocean.stream:20128（TLS），默认工作者值为josimi~rx/0。自动选择会并行进行TLS连接检查，候选矿池可看到IP和连接时间，但不会收到钱包地址或挖矿工作。自定义矿池关闭TLS时，登录信息将以明文传输，网络观察者可能看到。本地P2Pool通过--wallet接收公开地址；XMRig仅连接P2Pool的127.0.0.1:3333 loopback Stratum，不会收到钱包地址或矿池凭据。P2Pool命令行或公开奖励记录可能暴露地址。P2Pool节点可能看到您的IP和挖矿活动；其P2P监听器可能在所有网络接口上接受连接，具体取决于防火墙。已禁用UPnP端口映射。Solo仅将公开地址和挖矿设置发送给本地monerod；Monero P2P节点可以看到节点IP和连接信息。不会发送seed或私钥。josimi的0.25%手续费仅适用于钱包转账，不从挖矿奖励收取。XMRig默认开发者捐赠比例为1%。',
    miningPool:'直接矿池', miningAuto:'自动选择矿池', miningP2pool:'本地 P2Pool', miningSolo:'Solo（monerod）', p2poolLocalNotice:'本地P2Pool和XMRig以隐藏进程运行。monerod同步后，P2Pool首次同步通常还需约5至10分钟；此期间XMRig可能显示正在连接。防火墙允许时，其他节点可能通过网络接口上的P2Pool监听器连接。已禁用路由器UPnP端口映射。',
    relayRestartUnknown:'应用重启后，上一笔交易的广播结果尚不确定。请在钱包或可信节点中核对下方哈希。在确认交易状态前不要创建另一笔转账。应用不会跨重启保存已签名交易原文，因此无法自动重试。',
    recoveryTxHash:'需要核对的交易哈希', leaveBlocked:'保持阻止并关闭', resolveUnknownSend:'核对后解除阻止', resolveSendSuccess:'已解除上一笔交易的阻止状态。再次转账前请确认旧交易状态。'
  },
  ja: {
    nodeMode:'ノードの種類', nodeRemoteChoice:'信頼できるリモートノード', nodeLocalChoice:'このPC（ローカル monerod）', nodeAddress:'リモートMoneroノードのアドレス',
    nodePrivacyNotice:'リモートdaemonにはIPアドレスが見え、RPC要求から残高や利用状況を推測される可能性があります。信頼できるノードまたはローカルmonerodを使用してください。',
    nodeLocalNotice:'ウォレットRPCは127.0.0.1のローカルmonerodにのみ接続します。ノードはMonero P2Pピアに接続しIPを知られる可能性があり、既定P2Pポート18080でも待ち受けます。--hide-my-portはピア候補としての広告だけを止め、外部から接続できるかはPCのファイアウォールに依存します。',
    localNodeSummary:'ローカルノード（monerod）', localNodeIntro:'josimi Windows ZIPにはMonero公式v0.18.5.4のmonerodデーモンと必要なランタイムファイルのみを含み、CLI全体は含みません。ビルド時に元archiveのSHA-256を照合し、起動前にファイルを検証してバックグラウンド実行します。',
    localNodeChecking:'ローカルノードの状態を確認中', localNodeInstall:'同梱monerodを検証', localNodeStart:'monerodを起動', localNodeStop:'ノードを停止',
    localNodeStorageNotice:'初回同期には数時間から数日かかり、大きなストレージと通信量を使う場合があります。pruningとUPnP無効化を適用しますが、monerodはネットワークインターフェースの既定P2Pポート18080で引き続き待ち受けます。--hide-my-portはピア候補としての広告だけを止め、外部からの接続可否はPCのファイアウォールに依存します。',
    localNodeUnsupported:'ローカルノードはWindowsのみ対応です。', localNodeMissing:'同梱monerodランタイムが見つかりません。公式josimi Windows ZIPを再インストールしてください。実行中のダウンロードはありません。',
    localNodeVerifying:'同梱monerodファイルを検証中', localNodeInstalled:'monerodと必要なランタイムファイルを同梱しています。起動前に各ファイルのSHA-256を同梱マニフェストと照合します。マニフェスト自体は個別に署名されていません。', localNodeRunning:'monerod実行中 — 同期状態を確認してください。', localNodeStopped:'ローカルmonerod停止中', localNodeSynced:'ローカルノード同期完了', localNodeSyncing:'ローカルノード同期中',
    miningFine:'josimiはCPUマイニングのみ対応し、GPUには対応していません。SoloとP2Poolには同期済みのローカルmonerodが必要です。P2Poolも初回起動後に独自ネットワークを同期します。電力と温度を考慮してスレッド数を設定してください。',
    miningPrivacyNotice:'直接プールにはIP、公開ウォレットアドレス（-u）、プールパスワード/ワーカー（-p）が伝わります。MoneroOceanの既定先はgulf.moneroocean.stream:20128（TLS）、既定ワーカーはjosimi~rx/0です。自動選択は候補へTLS接続確認を並行して行うため、候補にはIPと接続時刻が見えますが、ウォレットアドレスや採掘ジョブは送信しません。カスタムプールでTLSを無効にするとログイン情報が平文で送信され、ネットワーク上で傍受される可能性があります。ローカルP2Poolには公開アドレスを--walletで渡します。XMRigはP2Poolの127.0.0.1:3333 loopback Stratumにのみ接続し、ウォレットアドレスやプール認証情報を受け取りません。P2Poolのコマンドラインや公開報酬記録にアドレスが表示される場合があります。P2PoolのピアにはIPとマイニング活動が見える可能性があり、ファイアウォールの設定によっては全ネットワークインターフェースで待ち受けます。UPnPポート転送は無効です。Soloでは公開アドレスとマイニング設定をローカルmonerodにのみ送信し、Monero P2PピアにはノードIPと接続情報が見える場合があります。seedや秘密鍵は送信しません。josimiの0.25%手数料はウォレット送金にのみ適用され、採掘報酬にはかかりません。XMRigの既定開発者寄付率は1%です。',
    miningPool:'直接プール', miningAuto:'プールを自動選択', miningP2pool:'ローカルP2Pool', miningSolo:'Solo（monerod）', p2poolLocalNotice:'ローカルP2PoolとXMRigは非表示プロセスとして実行されます。monerod同期後、P2Poolの初回同期には通常さらに約5～10分かかる場合があり、その間XMRigは接続中のままになることがあります。ファイアウォールが許可すると、P2Poolはネットワークインターフェースでピア接続を受け入れます。ルーターのUPnPポート転送は無効です。',
    relayRestartUnknown:'アプリ再起動後、前の取引の中継結果が不明です。下のハッシュをウォレットまたは信頼できるノードで確認してください。状態が分かるまで別の送金を作成しないでください。署名済み取引データは再起動をまたいで保存しないため、自動再送はできません。',
    recoveryTxHash:'確認する取引ハッシュ', leaveBlocked:'ブロック状態のまま閉じる', resolveUnknownSend:'確認後にブロック解除', resolveSendSuccess:'前の取引ブロックを解除しました。再送金前に旧取引の状態を確認してください。'
  }
};
for (const code of Object.keys(LOCALIZED_RUNTIME)) Object.assign(LANG[code], LOCALIZED_RUNTIME[code]);
const SEED_REAUTH_TEXT = {
  ko: { title: '복구 seed 표시', message: '현재 지갑 비밀번호를 다시 입력해야 seed를 표시할 수 있습니다. 비밀번호 확인은 임시 메모리 지갑에서 수행되며 기존 지갑 파일을 변경하지 않습니다.', password: '현재 지갑 비밀번호', confirm: '확인 후 계속', cancel: '취소' },
  en: { title: 'Reveal recovery seed', message: 'Enter the current wallet password to reveal the seed. Verification uses a temporary in-memory wallet and does not change the existing wallet files.', password: 'Current wallet password', confirm: 'Verify and continue', cancel: 'Cancel' },
  zh: { title: '显示恢复 seed', message: '请重新输入当前钱包密码以显示 seed。密码会通过临时内存钱包验证，不会修改现有钱包文件。', password: '当前钱包密码', confirm: '验证并继续', cancel: '取消' },
  ja: { title: '復元seedを表示', message: 'seedを表示するには現在のウォレットパスワードを再入力してください。確認は一時的なメモリ上のウォレットで行い、既存のウォレットファイルは変更しません。', password: '現在のウォレットパスワード', confirm: '確認して続行', cancel: 'キャンセル' }
};
const RECOVERY_BANNER_LANG = {
  ko: { relayRecoveryBanner:'이 지갑에 확인되지 않은 이전 송금이 있습니다. 새 송금은 차단됩니다.', reviewPendingSend:'이전 송금 확인' },
  en: { relayRecoveryBanner:'This wallet has a previous send with an unknown outcome. New sends are blocked.', reviewPendingSend:'Review previous send' },
  zh: { relayRecoveryBanner:'此钱包有一笔结果未确认的先前转账。新转账已阻止。', reviewPendingSend:'查看上一笔转账' },
  ja: { relayRecoveryBanner:'このウォレットには結果未確認の以前の送金があります。新しい送金はブロックされています。', reviewPendingSend:'前回の送金を確認' }
};
for (const code of Object.keys(RECOVERY_BANNER_LANG)) Object.assign(LANG[code], RECOVERY_BANNER_LANG[code]);
const AUTH_VALIDATION_LANG = {
  ko: { restoreConfirm:'입력한 seed가 정확하며 복구하려는 지갑의 것임을 확인했습니다. 복구를 시작할까요? 기존 저장 파일은 복구 전에 자동 보관됩니다.', nodeAddressRequired:'원격 노드 주소를 입력하세요.', localNodeStartRequired:'먼저 로컬 노드 패널에서 monerod를 설치하고 시작하세요.', restoreHeightInvalid:'복구 블록 높이는 0 이상의 정수여야 합니다.' },
  en: { restoreConfirm:'I verified that this is the correct seed for the wallet I want to restore. Start restoration? Existing wallet files are archived first.', nodeAddressRequired:'Enter a remote node address.', localNodeStartRequired:'Install and start monerod from the local node panel first.', restoreHeightInvalid:'Restore height must be a non-negative integer.' },
  zh: { restoreConfirm:'我已确认这是要恢复钱包的正确 seed。现在开始恢复吗？现有钱包文件会先自动归档。', nodeAddressRequired:'请输入远程节点地址。', localNodeStartRequired:'请先在本地节点面板安装并启动 monerod。', restoreHeightInvalid:'恢复区块高度必须是非负整数。' },
  ja: { restoreConfirm:'復元するウォレットの正しいseedであることを確認しました。復元を開始しますか？既存のウォレットファイルは先に自動保管されます。', nodeAddressRequired:'リモートノードのアドレスを入力してください。', localNodeStartRequired:'先にローカルノードパネルでmonerodをインストールして起動してください。', restoreHeightInvalid:'復元ブロック高は0以上の整数で入力してください。' }
};
for (const code of Object.keys(AUTH_VALIDATION_LANG)) Object.assign(LANG[code], AUTH_VALIDATION_LANG[code]);
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
let miningActive = false;
let miningPools = [];
let miningRecommendationInfo = null;
let localNodeUrl = 'http://127.0.0.1:18081';
let toastTimer;
let selectedWalletFile = null;
let inactivityTimer;
let syncTimer;
let syncRequestInFlight = false;
let refreshPromise = null;
let receiveQrAddress = '';
let qrGeneration = 0;
let currentAccounts = [];
let currentAddressBook = [];
let currentTransactions = [];
let selectedSendContactName = '';

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
  if (next !== mode) { $('password').value = ''; $('seed').value = ''; $('seedOffset').value = ''; }
  mode = next;
  document.querySelectorAll('.tab').forEach((tab) => { const active = tab.dataset.tab === next; tab.classList.toggle('active', active); tab.setAttribute('aria-selected', String(active)); });
  $('seedLabel').classList.toggle('hidden', next !== 'restore');
  $('seedOffsetLabel').classList.toggle('hidden', next !== 'restore');
  $('restoreHeightLabel').classList.toggle('hidden', next !== 'restore');
  $('password').required = next !== 'open';
  $('password').minLength = next === 'open' ? 0 : 8;
  const dict = LANG[language];
  $('password').placeholder = next === 'open' ? dict.openPasswordPlaceholder : dict.passwordPlaceholder;
  $('submitBtn').textContent = next === 'create' ? dict.createWallet : next === 'restore' ? dict.restoreWallet : dict.openWallet;
}
function showWalletFileStatus(fileName = '') {
  $('walletFileStatus').textContent = fileName ? `${LANG[language].selectedKeyFile}: ${fileName}.keys` : '';
}
async function chooseWalletFile(action) {
  const result = await window.josimi.chooseWalletFile(action);
  if (!result || result.canceled) return false;
  selectedWalletFile = result;
  showWalletFileStatus(result.fileName);
  return true;
}
function renderTxs(txs = []) {
  currentTransactions = txs;
  if (!txs.length) { $('txList').innerHTML = `<div class="empty">${escapeHtml(LANG[language].noTransactions)}</div>`; return; }
  const locale = { ko: 'ko-KR', en: 'en-US', zh: 'zh-CN', ja: 'ja-JP' }[language] || 'ko-KR';
  $('txList').innerHTML = txs.map((tx) => {
    const direction = tx.isIncoming ? LANG[language].txIncoming : tx.isOutgoing ? LANG[language].txOutgoing : LANG[language].txUnknown;
    const timestamp = Number(tx.timestamp);
    const date = Number.isFinite(timestamp) && timestamp > 0 ? new Date(timestamp * 1000).toLocaleString(locale) : '';
    const hash = String(tx.hash || '');
    const note = tx.note ? `<div class="tx-note">${escapeHtml(tx.note)}</div>` : '';
    const state = tx.isConfirmed ? LANG[language].txConfirmed : tx.isLocked ? LANG[language].txLocked : LANG[language].txPending;
    return `<div class="tx-row tx-row-expanded"><div class="tx-main"><div class="tx-hash" title="${escapeHtml(hash)}">${escapeHtml(hash.slice(0, 18))}${hash ? '…' : ''}</div><div class="muted">${escapeHtml(direction)} · ${state}${date ? ` · ${escapeHtml(date)}` : ''}</div><div class="muted">${escapeHtml(LANG[language].txFeeLabel)} ${escapeHtml(formatXmr(tx.fee || '0'))} XMR</div>${note}</div><div class="tx-side"><div class="tx-amount">${escapeHtml(formatXmr(tx.amount))} XMR</div>${/^[0-9a-f]{64}$/i.test(hash) ? `<button class="tool tx-note-button" type="button" data-tx-note="${hash}">${escapeHtml(LANG[language].editTxNote)}</button>` : ''}</div></div>`;
  }).join('');
}
function accountTitle(account) { return account.label || `#${Number(account.index) + 1}`; }
function renderAccountManagement(accounts = [], addressBook = []) {
  currentAccounts = Array.isArray(accounts) ? accounts : [];
  currentAddressBook = Array.isArray(addressBook) ? addressBook : [];
  const previousReceiveAccount = $('receiveAccount').value;
  const previousSendAccount = $('sendAccount').value;
  const accountOptions = currentAccounts.map((account) => `<option value="${Number(account.index)}">${escapeHtml(accountTitle(account))} · ${escapeHtml(formatXmr(account.balance))} XMR</option>`).join('');
  $('receiveAccount').innerHTML = accountOptions;
  $('sendAccount').innerHTML = accountOptions;
  const validReceive = currentAccounts.some((account) => String(account.index) === previousReceiveAccount);
  const validSend = currentAccounts.some((account) => String(account.index) === previousSendAccount);
  if (validReceive) $('receiveAccount').value = previousReceiveAccount;
  if (validSend) $('sendAccount').value = previousSendAccount;
  const activeReceive = currentAccounts.find((account) => String(account.index) === $('receiveAccount').value);
  const previousSubaddress = $('receiveSubaddress').value;
  const subaddresses = activeReceive?.subaddresses || [];
  $('receiveSubaddress').innerHTML = subaddresses.map((subaddress) => `<option value="${Number(subaddress.index)}">${escapeHtml(subaddress.label || `#${Number(subaddress.index)}`)}${subaddress.isUsed ? ' · ✓' : ''}</option>`).join('');
  if (subaddresses.some((subaddress) => String(subaddress.index) === previousSubaddress)) $('receiveSubaddress').value = previousSubaddress;
  else if (subaddresses.length) $('receiveSubaddress').value = String(subaddresses[0].index);
  $('receiveAccount').disabled = !currentAccounts.length;
  $('sendAccount').disabled = !currentAccounts.length;
  $('receiveSubaddress').disabled = !subaddresses.length;
  $('accountList').innerHTML = currentAccounts.length ? currentAccounts.map((account) => `<div class="management-row"><div class="management-heading"><strong>${escapeHtml(accountTitle(account))}</strong><span class="muted">${escapeHtml(LANG[language].accountBalance)} ${escapeHtml(formatXmr(account.balance))} · ${escapeHtml(LANG[language].unlockedBalance)} ${escapeHtml(formatXmr(account.unlockedBalance))} XMR</span></div><div class="management-actions"><input data-account-label="${Number(account.index)}" maxlength="80" value="${escapeHtml(account.label)}" aria-label="${escapeHtml(accountTitle(account))}" /><button class="tool" type="button" data-save-account="${Number(account.index)}">${escapeHtml(LANG[language].renameAccount)}</button></div><div class="subaddress-list">${(account.subaddresses || []).map((subaddress) => `<div class="subaddress-row"><span class="subaddress-index">${Number(subaddress.index)}</span><span class="subaddress-details"><strong>${escapeHtml(subaddress.label || `#${Number(subaddress.index)}`)}</strong><span class="muted">${escapeHtml(subaddress.address)}</span></span><input data-subaddress-label="${Number(account.index)}:${Number(subaddress.index)}" maxlength="80" value="${escapeHtml(subaddress.label)}" aria-label="${escapeHtml(subaddress.label || 'subaddress')}" /><button class="tool" type="button" data-save-subaddress="${Number(account.index)}:${Number(subaddress.index)}">${escapeHtml(LANG[language].renameAccount)}</button></div>`).join('')}</div></div>`).join('') : `<div class="empty">${escapeHtml(LANG[language].noAccounts)}</div>`;
  $('addressBookCount').textContent = String(currentAddressBook.length);
  $('addressBookList').innerHTML = currentAddressBook.length ? currentAddressBook.map((entry) => `<div class="contact-row"><div class="contact-details"><strong>${escapeHtml(entry.description || entry.address.slice(0, 12))}</strong><span class="muted contact-address" title="${escapeHtml(entry.address)}">${escapeHtml(entry.address)}</span></div><div class="contact-actions"><button class="tool" type="button" data-use-contact="${Number(entry.index)}">${escapeHtml(LANG[language].useContact)}</button><button class="tool" type="button" data-edit-contact="${Number(entry.index)}">${escapeHtml(LANG[language].editContact)}</button><button class="tool danger" type="button" data-delete-contact="${Number(entry.index)}">${escapeHtml(LANG[language].deleteContact)}</button></div></div>`).join('') : `<div class="empty">${escapeHtml(LANG[language].noContacts)}</div>`;
  renderReceiveAddress();
}
function renderReceiveAddress() {
  const account = currentAccounts.find((entry) => String(entry.index) === $('receiveAccount').value);
  const subaddress = account?.subaddresses?.find((entry) => String(entry.index) === $('receiveSubaddress').value);
  const nextAddress = subaddress?.address || account?.address || '—';
  if (nextAddress !== receiveQrAddress) {
    receiveQrAddress = nextAddress;
    qrGeneration += 1;
    $('qr').classList.add('hidden');
    $('qr').width = 0;
    $('qr').height = 0;
  }
  $('address').textContent = nextAddress;
  if (subaddress) $('receiveBalance').textContent = `${LANG[language].accountBalance}: ${formatXmr(subaddress.balance)} XMR · ${LANG[language].unlockedBalance}: ${formatXmr(subaddress.unlockedBalance)} XMR`;
  else $('receiveBalance').textContent = '';
}
function renderSync(sync = {}) {
  const dict = LANG[language];
  const state = sync.state || 'stopped';
  const labels = { downloading: dict.nodeSyncing, starting: dict.nodeSyncing, syncing: dict.nodeSyncing, synced: dict.nodeSynced, remote: dict.nodeRemote, offline: dict.nodeOffline, stopped: dict.nodeStopped };
  $('status').textContent = labels[state] || state;
  if (state === 'offline') $('syncDetails').textContent = `${dict.nodeOfflineDetail} · ${sync.node || ''}`;
  else if (sync.targetHeight) $('syncDetails').textContent = `${sync.progress || 0}% · ${dict.syncBlocks} ${(sync.height || 0).toLocaleString()} / ${(sync.targetHeight || 0).toLocaleString()} · ${dict.syncPeers} ${sync.peers || 0}`;
  else $('syncDetails').textContent = sync.node || '';
}
function renderLocalNodeStatus(status = {}) {
  const dict = LANG[language];
  let label = status.supported ? status.installed ? dict.localNodeInstalled : dict.localNodeMissing : dict.localNodeUnsupported;
  if (status.installing) {
    label = dict.localNodeVerifying;
  } else if (status.running) {
    label = status.rpc?.state === 'synced' ? dict.localNodeSynced : status.rpc?.state === 'syncing' ? dict.localNodeSyncing : dict.localNodeRunning;
    if (status.rpc?.height) label += ` · ${status.rpc.progress || 0}% · ${Number(status.rpc.height).toLocaleString()} / ${Number(status.rpc.targetHeight || 0).toLocaleString()}`;
  } else if (status.installed && status.supported) label += ` · ${dict.localNodeStopped}`;
  $('localNodeStatus').textContent = label;
  $('installLocalNodeBtn').disabled = !status.supported || Boolean(status.installing);
  $('startLocalNodeBtn').disabled = !status.supported || !status.installed || Boolean(status.installing) || Boolean(status.running);
  $('stopLocalNodeBtn').disabled = !status.running;
}
async function refreshLocalNodeStatus() {
  try { renderLocalNodeStatus(await window.josimi.localNodeStatus()); } catch (_) {}
}
window.josimi.onLocalNodeStatus(renderLocalNodeStatus);
refreshLocalNodeStatus();
setInterval(refreshLocalNodeStatus, 10000);
function updateNodeModeFields() {
  const local = $('nodeMode').value === 'local';
  $('remoteNodeLabel').classList.toggle('hidden', local);
  $('remoteNodeNotice').classList.toggle('hidden', local);
  $('localNodeNotice').classList.toggle('hidden', !local);
  $('node').required = !local;
  if (local) $('localNodePanel').open = true;
}
$('nodeMode').addEventListener('change', updateNodeModeFields);
updateNodeModeFields();
function renderSummary(summary) {
  $('password').value = ''; $('seed').value = ''; $('seedOffset').value = '';
  $('authView').classList.add('hidden'); $('appView').classList.remove('hidden'); $('lockBtn').classList.remove('hidden');
  $('balance').innerHTML = `${escapeHtml(summary.balanceXmr)} <small>XMR</small>`; renderAccountManagement(summary.accounts, summary.addressBook); renderSync(summary.sync); renderTxs(summary.txs);
  if (summary.createdAtHeight !== undefined && summary.createdAtHeight !== null) $('walletHeight').textContent = `${LANG[language].createdAtHeight}: ${Number(summary.createdAtHeight).toLocaleString()}`;
  if (summary.restoreHeightUsed !== undefined && summary.restoreHeightUsed !== null) $('walletHeight').textContent = `${LANG[language].restoreHeight}: ${Number(summary.restoreHeightUsed).toLocaleString()}`;
}
async function refresh() {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    try { const summary = await window.josimi.refresh(); renderSummary(summary); return summary; }
    catch (e) { showToast(e.message); return null; }
  })();
  try { return await refreshPromise; } finally { refreshPromise = null; }
}
function resetInactivityTimer() {
  clearTimeout(inactivityTimer);
  if ($('appView').classList.contains('hidden')) return;
  inactivityTimer = setTimeout(async () => { try { await window.josimi.lock(); location.reload(); } catch (error) { showToast(error.message); resetInactivityTimer(); } }, 15 * 60 * 1000);
}
['click', 'keydown', 'mousemove', 'touchstart'].forEach((eventName) => document.addEventListener(eventName, resetInactivityTimer, { passive: true }));

document.querySelectorAll('.tab').forEach((tab) => tab.addEventListener('click', () => setMode(tab.dataset.tab)));
$('walletChoiceBtn').addEventListener('click', async () => {
  clearError('authError');
  try {
    if (!(await chooseWalletFile('open'))) return;
    document.querySelector('[data-tab="open"]').classList.remove('hidden');
    setMode('open');
    $('password').focus();
  } catch (error) { showError('authError', error); }
});
window.josimi.onNodeStatus((status) => { if (!$('appView').classList.contains('hidden')) renderSync(status); });
for (const id of ['installLocalNodeBtn', 'startLocalNodeBtn', 'stopLocalNodeBtn']) $(id).addEventListener('click', async () => {
  clearError('localNodeError');
  const button = $(id);
  button.disabled = true;
  try {
    if (id === 'installLocalNodeBtn') await window.josimi.localNodeInstall();
    else if (id === 'startLocalNodeBtn') await window.josimi.localNodeStart();
    else await window.josimi.localNodeStop();
    await refreshLocalNodeStatus();
  } catch (error) { showError('localNodeError', error); await refreshLocalNodeStatus(); }
  finally { button.disabled = false; }
});
 $('receiveAccount').addEventListener('change', () => renderAccountManagement(currentAccounts, currentAddressBook));
 $('receiveSubaddress').addEventListener('change', renderReceiveAddress);
 $('accountForm').addEventListener('submit', async (event) => {
  event.preventDefault(); clearError('accountError');
  try {
    const accounts = await window.josimi.createAccount({ label: $('accountName').value });
    $('accountName').value = '';
    renderAccountManagement(accounts, currentAddressBook);
    const newest = accounts.reduce((a, b) => Number(a.index) > Number(b.index) ? a : b);
    $('receiveAccount').value = String(newest.index);
    renderAccountManagement(accounts, currentAddressBook);
    await refresh(); showToast(LANG[language].saved);
  } catch (error) { showError('accountError', error); }
 });
 $('subaddressForm').addEventListener('submit', async (event) => {
  event.preventDefault(); clearError('accountError');
  try {
    const accountIndex = Number($('receiveAccount').value);
    const accounts = await window.josimi.createSubaddress({ accountIndex, label: $('subaddressName').value });
    $('subaddressName').value = '';
    const updatedAccount = accounts.find((account) => Number(account.index) === accountIndex);
    renderAccountManagement(accounts, currentAddressBook);
    const newest = updatedAccount?.subaddresses?.reduce((a, b) => Number(a.index) > Number(b.index) ? a : b);
    if (newest) $('receiveSubaddress').value = String(newest.index);
    renderReceiveAddress(); await refresh(); showToast(LANG[language].saved);
  } catch (error) { showError('accountError', error); }
 });
 $('accountList').addEventListener('click', async (event) => {
  const accountButton = event.target.closest('[data-save-account]');
  const subaddressButton = event.target.closest('[data-save-subaddress]');
  try {
    if (accountButton) {
      const accountIndex = Number(accountButton.dataset.saveAccount);
      const input = $('accountList').querySelector(`[data-account-label="${accountIndex}"]`);
      await window.josimi.setAccountLabel({ accountIndex, label: input?.value || '' });
      await refresh(); showToast(LANG[language].saved);
    } else if (subaddressButton) {
      const [accountIndex, subaddressIndex] = subaddressButton.dataset.saveSubaddress.split(':').map(Number);
      const input = $('accountList').querySelector(`[data-subaddress-label="${accountIndex}:${subaddressIndex}"]`);
      await window.josimi.setSubaddressLabel({ accountIndex, subaddressIndex, label: input?.value || '' });
      await refresh(); showToast(LANG[language].saved);
    }
  } catch (error) { showError('accountError', error); }
 });
 $('addressBookForm').addEventListener('submit', async (event) => {
  event.preventDefault(); clearError('addressBookError');
  const entryIndex = $('contactEditIndex').value;
  const payload = { address: $('contactAddress').value.trim(), description: $('contactName').value.trim() };
  try {
    if (entryIndex === '') await window.josimi.addAddressBookEntry(payload);
    else await window.josimi.editAddressBookEntry({ ...payload, entryIndex: Number(entryIndex) });
    $('addressBookForm').reset(); $('contactEditIndex').value = ''; $('cancelContactEdit').classList.add('hidden');
    $('saveContactBtn').textContent = LANG[language].addContact;
    await refresh(); showToast(LANG[language].saved);
  } catch (error) { showError('addressBookError', error); }
 });
 $('cancelContactEdit').addEventListener('click', () => {
  $('addressBookForm').reset(); $('contactEditIndex').value = ''; $('cancelContactEdit').classList.add('hidden'); $('saveContactBtn').textContent = LANG[language].addContact; clearError('addressBookError');
 });
 $('addressBookList').addEventListener('click', async (event) => {
  const useButton = event.target.closest('[data-use-contact]');
  const editButton = event.target.closest('[data-edit-contact]');
  const deleteButton = event.target.closest('[data-delete-contact]');
  const index = Number((useButton || editButton || deleteButton)?.dataset.useContact ?? (useButton || editButton || deleteButton)?.dataset.editContact ?? (useButton || editButton || deleteButton)?.dataset.deleteContact);
  const entry = currentAddressBook.find((candidate) => Number(candidate.index) === index);
  if (!entry) return;
  if (useButton) {
    $('sendAddress').value = entry.address; $('sendRecipientName').value = entry.description; selectedSendContactName = entry.description;
    $('sendAddress').focus(); $('sendForm').scrollIntoView({ behavior: 'smooth', block: 'center' });
  } else if (editButton) {
    $('contactEditIndex').value = String(entry.index); $('contactName').value = entry.description; $('contactAddress').value = entry.address;
    $('cancelContactEdit').classList.remove('hidden'); $('saveContactBtn').textContent = LANG[language].updateContact; $('contactName').focus();
  } else if (deleteButton && confirm(LANG[language].confirmDeleteContact)) {
    clearError('addressBookError');
    try { await window.josimi.deleteAddressBookEntry({ entryIndex: entry.index }); await refresh(); showToast(LANG[language].saved); }
    catch (error) { showError('addressBookError', error); }
  }
 });
 $('txList').addEventListener('click', async (event) => {
  const button = event.target.closest('[data-tx-note]');
  if (!button) return;
  const hash = button.dataset.txNote;
  const tx = currentTransactions.find((item) => item.hash === hash);
  const note = prompt(LANG[language].notePrompt, tx?.note || '');
  if (note === null) return;
  try { await window.josimi.setTransactionNote({ txHash: hash, note }); await refresh(); showToast(LANG[language].saved); }
  catch (error) { showToast(error.message); }
 });
syncTimer = setInterval(async () => {
  if ($('appView').classList.contains('hidden') || syncRequestInFlight) return;
  syncRequestInFlight = true;
  try { await refresh(); } finally { syncRequestInFlight = false; }
}, 30000);
function renderMiningStatus(status) {
  const dict = LANG[language];
  if (status.state === 'mining') {
    const endpoint = status.poolUrl || status.p2poolEndpoint || '';
    const threadText = status.cpuAuto100 ? dict.miningAuto100 : `${dict.miningThreads}: ${status.totalThreads}`;
    const modeLabel = { pool: dict.miningPool, auto: dict.miningAuto, p2pool: dict.miningP2pool, solo: dict.miningSolo }[status.mode] || '';
    const shares = status.sharesAccepted ? ` · ${dict.miningShareAccepted}: ${status.sharesAccepted}` : '';
    $('miningStatus').textContent = `${dict.miningMining}${modeLabel ? ` · ${modeLabel}` : ''} · ${threadText}${endpoint ? ` · ${endpoint}` : ''}${shares}`;
  } else if (status.state === 'connected' || status.state === 'connecting') {
    const endpoint = status.poolUrl || status.p2poolEndpoint || '';
    const threadText = status.cpuAuto100 ? dict.miningAuto100 : `${dict.miningThreads}: ${status.totalThreads}`;
    const modeLabel = { pool: dict.miningPool, auto: dict.miningAuto, p2pool: dict.miningP2pool, solo: dict.miningSolo }[status.mode] || '';
    const label = status.state === 'connected' ? dict.miningConnected : dict.miningConnecting;
    $('miningStatus').textContent = `${label}${modeLabel ? ` · ${modeLabel}` : ''} · ${threadText}${endpoint ? ` · ${endpoint}` : ''}`;
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
  const unavailable = ['mining', 'connected', 'connecting', 'starting', 'remote'].includes(status.state) || !status.supported;
  miningActive = Boolean(status.active);
  $('startMiningBtn').disabled = miningCallInProgress || unavailable;
  $('stopMiningBtn').disabled = miningCallInProgress || !status.active;
  $('startMiningBtn').setAttribute('aria-busy', String(miningCallInProgress));
  $('stopMiningBtn').setAttribute('aria-busy', String(miningCallInProgress));
  $('miningThreads').disabled = miningCallInProgress || miningActive || $('miningAuto100').checked;
  $('miningMode').disabled = miningCallInProgress || miningActive;
  $('miningAuto100').disabled = miningCallInProgress || miningActive;
  $('miningIgnoreBattery').disabled = miningCallInProgress || miningActive;
  $('p2poolProfile').disabled = miningCallInProgress || miningActive;
  $('miningPoolPassword').disabled = miningCallInProgress || miningActive;
  $('miningRecommendBtn').disabled = miningCallInProgress || miningActive;
  updatePoolPresetFields();
  if (status.error) showError('miningError', new Error(status.error));
}
async function refreshMiningStatus() {
  try { renderMiningStatus(await window.josimi.miningStatus()); }
  catch (_) {
    $('miningStatus').textContent = LANG[language].miningStatusUnavailable;
    $('startMiningBtn').disabled = true;
    $('stopMiningBtn').disabled = miningCallInProgress || !miningActive;
    $('startMiningBtn').setAttribute('aria-busy', String(miningCallInProgress));
    $('stopMiningBtn').setAttribute('aria-busy', String(miningCallInProgress));
  }
}
window.josimi.onMiningStatus(renderMiningStatus);
async function configureMiningInput() {
  try {
    const config = await window.josimi.config();
    if (typeof config.localNodeUrl === 'string') localNodeUrl = config.localNodeUrl;
    miningPools = Array.isArray(config.miningPools) ? config.miningPools : [];
    updatePoolPresetFields();
    $('nodeMode').querySelector('option[value="local"]').disabled = !config.localNodeSupported;
    if (!config.localNodeSupported && $('nodeMode').value === 'local') $('nodeMode').value = 'remote';
    updateNodeModeFields();
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
}
function updatePoolPresetFields() {
  const poolId = $('miningPoolPreset').value;
  const custom = poolId === 'custom';
  const pool = miningPools.find((candidate) => candidate.id === poolId);
  const customUrl = $('miningPoolUrl').value.trim().toLowerCase();
  const explicitlyPlain = customUrl.startsWith('stratum+tcp://');
  const explicitlyTls = customUrl.startsWith('stratum+ssl://');
  const effectiveTls = explicitlyTls || (!explicitlyPlain && $('miningPoolTls').checked);
  $('customPoolAddressField').classList.toggle('hidden', !custom);
  $('customPoolTlsRow').classList.toggle('hidden', !custom);
  $('miningPoolPlaintextNotice').classList.toggle('hidden', !custom || effectiveTls);
  $('miningPoolUrl').required = custom;
  $('miningPoolUrl').disabled = !custom || miningCallInProgress || miningActive;
  $('miningPoolTls').disabled = !custom || miningCallInProgress || miningActive;
  $('miningPoolPreset').disabled = miningCallInProgress || miningActive;
  $('miningPoolPassword').disabled = miningCallInProgress || miningActive;
  const endpoint = $('miningPoolEndpoint');
  endpoint.classList.toggle('hidden', custom || !pool);
  if (pool) endpoint.textContent = LANG[language].poolEndpointTemplate.replace('{endpoint}', `${pool.host}:${pool.port}`);
  $('miningPoolPassword').placeholder = poolId === 'moneroocean' ? 'josimi~rx/0' : 'x';
}
function updateAutoThreadsField() {
  $('miningThreads').disabled = miningCallInProgress || miningActive || $('miningAuto100').checked;
}
function renderMiningRecommendation() {
  if (!miningRecommendationInfo) return;
  const recommendation = miningRecommendationInfo;
  const dict = LANG[language];
  const template = dict.miningRecommendationTemplate;
  $('miningRecommendation').textContent = `${template.replace('{cpuModel}', recommendation.cpuModel).replace('{processors}', recommendation.logicalProcessors).replace('{memory}', recommendation.memoryGiB).replace('{threads}', recommendation.recommendedThreads)} — ${dict.miningRecommendationNote}`;
}
$('miningMode').addEventListener('change', updateMiningModeFields);
$('miningPoolPreset').addEventListener('change', updatePoolPresetFields);
$('miningPoolTls').addEventListener('change', updatePoolPresetFields);
$('miningPoolUrl').addEventListener('input', updatePoolPresetFields);
$('miningAuto100').addEventListener('change', updateAutoThreadsField);
updateMiningModeFields();
updatePoolPresetFields();
updateAutoThreadsField();
$('miningRecommendBtn').addEventListener('click', async () => {
  if (miningCallInProgress || miningActive) return;
  try {
    const recommendation = await window.josimi.miningRecommendation();
    if (miningCallInProgress || miningActive) return;
    miningRecommendationInfo = recommendation;
    $('miningThreads').value = String(recommendation.recommendedThreads);
    $('miningAuto100').checked = false;
    updateAutoThreadsField();
    renderMiningRecommendation();
  } catch (error) { showError('miningError', error); }
});
$('startMiningBtn').addEventListener('click', async () => { if (miningCallInProgress) return; clearError('miningError'); miningCallInProgress = true; renderMiningStatus({ state: 'starting', supported: true, active: true }); try { const mode = $('miningMode').value; const status = await window.josimi.miningStart({ mode, threads: $('miningThreads').value, cpuAuto100: $('miningAuto100').checked, ignoreBattery: $('miningIgnoreBattery').checked, poolPreset: $('miningPoolPreset').value, poolUrl: $('miningPoolUrl').value, poolTls: $('miningPoolTls').checked, poolPassword: $('miningPoolPassword').value, p2poolProfile: $('p2poolProfile').value }); renderMiningStatus(status); const toastKey = status.state === 'mining' ? 'miningMining' : status.state === 'connected' ? 'miningConnected' : status.state === 'connecting' ? 'miningConnecting' : 'miningStopped'; showToast(LANG[language][toastKey]); } catch (e) { showError('miningError', e); await refreshMiningStatus(); } finally { miningCallInProgress = false; await refreshMiningStatus(); } });
$('stopMiningBtn').addEventListener('click', async () => { if (miningCallInProgress) return; clearError('miningError'); miningCallInProgress = true; try { await window.josimi.miningStop(); showToast(LANG[language].miningStopped); } catch (e) { showError('miningError', e); } finally { miningCallInProgress = false; await refreshMiningStatus(); } });
configureMiningInput();
refreshMiningStatus();
setInterval(refreshMiningStatus, 5000);
$('languageSelect').addEventListener('change', () => { language = $('languageSelect').value; localStorage.setItem('josimi.language', language); applyLanguage(); setMode(mode); renderAccountManagement(currentAccounts, currentAddressBook); renderTxs(currentTransactions); renderMiningRecommendation(); refreshMiningStatus(); });
$('walletForm').addEventListener('submit', async (event) => {
  event.preventDefault(); clearError('authError');
  const action = mode;
  const clearSensitiveFields = () => { $('password').value = ''; $('seed').value = ''; $('seedOffset').value = ''; };
  let payload = null;
  let seedValue = '';
  let seedOffsetValue = '';
  try {
    if (action === 'open' && !selectedWalletFile && !(await chooseWalletFile('open'))) { clearSensitiveFields(); return; }
    if ((action === 'create' || action === 'restore') && !(await chooseWalletFile('save'))) { clearSensitiveFields(); return; }
  } catch (error) { clearSensitiveFields(); showError('authError', error); return; }
  const useLocalNode = $('nodeMode').value === 'local';
  let nodeValue = '';
  if (useLocalNode) {
    try {
      const nodeStatus = await window.josimi.localNodeStatus();
      if (!nodeStatus.running) { clearSensitiveFields(); showError('authError', new Error(nodeStatus.installed ? LANG[language].localNodeStopped : LANG[language].localNodeMissing)); return; }
      nodeValue = localNodeUrl;
    } catch (error) { clearSensitiveFields(); showError('authError', error); return; }
  } else {
    nodeValue = $('node').value.trim();
    if (!nodeValue) { clearSensitiveFields(); showError('authError', new Error(LANG[language].nodeAddressRequired)); return; }
  }
  const restoreHeightValue = $('restoreHeight').value.trim();
  if (action === 'restore' && restoreHeightValue && !/^\d+$/.test(restoreHeightValue)) { clearSensitiveFields(); showError('authError', new Error(LANG[language].restoreHeightInvalid)); return; }
  payload = { password: $('password').value, node: nodeValue, restoreHeight: action === 'restore' && restoreHeightValue ? Number(restoreHeightValue) : undefined, network: 'mainnet' };
  $('submitBtn').disabled = true;
  try {
    let result;
    if (action === 'create') result = await window.josimi.create(payload);
    else if (action === 'restore') {
      seedValue = $('seed').value.trim();
      if (!confirm(LANG[language].restoreConfirm)) return;
      seedOffsetValue = $('seedOffset').value;
      result = await window.josimi.restore({ ...payload, seed: seedValue, seedOffset: seedOffsetValue === '' ? undefined : seedOffsetValue });
    }
    else result = await window.josimi.open(payload);
    renderSummary(result); await refreshMiningStatus();
    await resumePendingSendDialog();
    if (action === 'create') showToast(LANG[language].seedBackupReminder);
    else if (result.restored) showToast(LANG[language].restoredWallet);
    resetInactivityTimer();
  } catch (e) { showError('authError', e); } finally {
    if (payload) { payload.password = ''; payload.node = ''; payload.restoreHeight = undefined; }
    seedValue = ''; seedOffsetValue = '';
    $('password').value = ''; $('seed').value = ''; $('seedOffset').value = '';
    $('submitBtn').disabled = false; setMode(action);
  }
});
 $('refreshBtn').addEventListener('click', refresh);
 $('lockBtn').addEventListener('click', async () => { try { await window.josimi.lock(); location.reload(); } catch (e) { showToast(e.message); } });
 $('copyAddress').addEventListener('click', async () => { try { await navigator.clipboard.writeText($('address').textContent); showToast(LANG[language].copiedAddress); } catch (e) { showToast(`${LANG[language].copyAddressError}: ${e.message}`); } });
 $('showQr').addEventListener('click', async () => {
  const canvas = $('qr');
  if (!canvas.classList.contains('hidden')) { qrGeneration += 1; canvas.classList.add('hidden'); canvas.width = 0; canvas.height = 0; return; }
  const address = $('address').textContent;
  if (!address || address === '—') return;
  const requestId = ++qrGeneration;
  canvas.classList.remove('hidden');
  try {
    const source = await window.josimi.qr(address);
    if (requestId !== qrGeneration || address !== $('address').textContent || canvas.classList.contains('hidden')) return;
    const image = new Image();
    image.onload = () => { if (requestId !== qrGeneration || address !== $('address').textContent || canvas.classList.contains('hidden')) return; canvas.width = image.width; canvas.height = image.height; canvas.getContext('2d').drawImage(image, 0, 0); };
    image.onerror = () => { if (requestId === qrGeneration) { canvas.classList.add('hidden'); showToast(LANG[language].qrError); } };
    image.src = source;
  } catch (error) { if (requestId === qrGeneration) { canvas.classList.add('hidden'); showToast(error.message); } }
 });
 $('backupBtn').addEventListener('click', async () => { try { const result = await window.josimi.exportBackup(); if (!result.canceled) showToast(LANG[language].backupSaved); } catch (e) { showToast(e.message); } });
function requestSeedPassword() {
  const copy = SEED_REAUTH_TEXT[language] || SEED_REAUTH_TEXT.ko;
  const dialog = $('seedReauthDialog');
  const form = $('seedReauthForm');
  const input = $('seedReauthPassword');
  $('seedReauthTitle').textContent = copy.title;
  $('seedReauthMessage').textContent = copy.message;
  $('seedReauthPasswordLabel').textContent = copy.password;
  $('seedReauthConfirm').textContent = copy.confirm;
  $('seedReauthCancel').textContent = copy.cancel;
  input.value = '';
  return new Promise((resolve) => {
    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      form.removeEventListener('submit', onSubmit);
      $('seedReauthCancel').removeEventListener('click', onCancelButton);
      dialog.removeEventListener('cancel', onCancelDialog);
      dialog.removeEventListener('close', onClose);
      input.value = '';
      if (dialog.open) dialog.close();
      resolve(value);
    };
    const onSubmit = (event) => { event.preventDefault(); finish(input.value); };
    const onCancelButton = () => finish(null);
    const onCancelDialog = (event) => { event.preventDefault(); finish(null); };
    const onClose = () => finish(null);
    form.addEventListener('submit', onSubmit);
    $('seedReauthCancel').addEventListener('click', onCancelButton);
    dialog.addEventListener('cancel', onCancelDialog);
    dialog.addEventListener('close', onClose);
    dialog.showModal();
    input.focus();
  });
}
 $('seedBtn').addEventListener('click', async () => {
  $('seedBtn').disabled = true;
  let password = '';
  let seed = '';
  try {
   password = await requestSeedPassword();
   if (password === null) return;
   seed = await window.josimi.getSeed({ password, language });
   if (typeof seed === 'string' && seed) alert(seed);
  }
  catch (error) { showToast(error.message || LANG[language].seedUnavailable); }
  finally { password = ''; seed = ''; $('seedReauthPassword').value = ''; $('seedBtn').disabled = false; }
 });
function renderSendReview(preview) {
  const dict = LANG[language];
  const priorityLabel = { 1: dict.low, 2: dict.normal, 3: dict.high }[preview.priority] || String(preview.priority);
  const sourceAccount = preview.accountLabel || `#${Number(preview.accountIndex || 0) + 1}`;
  const rows = [[dict.sendFromAccount, sourceAccount], [dict.reviewRecipient, preview.address], [dict.reviewAmount, `${preview.amountXmr} XMR`], [dict.reviewPriority, priorityLabel]];
  if (preview.note) rows.push([dict.transactionNote, preview.note]);
  rows.push([dict.reviewServiceFee, `${preview.serviceFeeXmr} XMR`], [dict.reviewNetworkFee, `${preview.networkFeeXmr} XMR`], [dict.reviewTotal, `${preview.totalXmr} XMR`], [dict.reviewFeeAddress, preview.feeAddress]);
  $('review').innerHTML = rows.map(([key, value]) => `<div class="review-row"><span>${escapeHtml(key)}</span><strong>${escapeHtml(value)}</strong></div>`).join('');
}
$('sendForm').addEventListener('submit', async (event) => {
  event.preventDefault(); clearError('sendError'); clearError('sendDialogError');
  try {
    pendingSend = { address: $('sendAddress').value.trim(), amount: $('sendAmount').value.trim(), priority: $('priority').value, accountIndex: Number($('sendAccount').value), note: $('sendNote').value.trim(), recipientName: $('sendRecipientName').value.trim() };
    $('sendForm').querySelector('button[type="submit"]').disabled = true;
    const request = { ...pendingSend };
    const preview = await window.josimi.previewSend(request);
    pendingSend = { pendingId: preview.pendingId };
    renderSendReview(preview);
    clearError('sendDialogError');
    $('confirmDialog').showModal();
  } catch (e) { pendingSend = null; showError('sendError', e); } finally { $('sendForm').querySelector('button[type="submit"]').disabled = false; }
});
 $('cancelSend').addEventListener('click', async () => { if (cancelCallInProgress || sendCallInProgress) return; cancelCallInProgress = true; $('cancelSend').disabled = true; const pending = pendingSend; try { if (pending?.pendingId) { const cancelled = await window.josimi.cancelSend(pending).catch(() => false); if (!cancelled) { showError('sendDialogError', new Error(LANG[language].relayCancelUnavailable)); return; } } pendingSend = null; $('confirmDialog').close(); } finally { cancelCallInProgress = false; if (pendingSend?.pendingId) { try { await applyPendingSendStatus(await window.josimi.pendingSend()); } catch (_) { $('cancelSend').disabled = true; } } else $('cancelSend').disabled = false; } });
 $('confirmDialog').addEventListener('cancel', (event) => { event.preventDefault(); if (pendingSend?.requiresManualReview) $('dismissUnknownSend').click(); else $('cancelSend').click(); });
 $('dismissUnknownSend').addEventListener('click', () => { $('confirmDialog').close(); $('relayRecoveryBanner').classList.remove('hidden'); });
 $('resolveUnknownSend').addEventListener('click', async () => {
  if (!pendingSend?.requiresManualReview) return;
  $('resolveUnknownSend').disabled = true;
  try {
    const cleared = await window.josimi.resolvePendingSendRecovery({ pendingId: pendingSend.pendingId, language });
    if (!cleared) return;
    pendingSend = null; $('confirmDialog').close(); $('relayRecoveryBanner').classList.add('hidden'); clearError('sendDialogError');
    showToast(LANG[language].resolveSendSuccess);
  } catch (error) { showError('sendDialogError', error); }
  finally { $('resolveUnknownSend').disabled = false; }
 });
 $('reviewPendingSendBtn').addEventListener('click', async () => { try { const pending = await window.josimi.pendingSend(); if (pending?.requiresManualReview) { pendingSend = { pendingId: pending.pendingId, requiresManualReview: true }; renderManualRelayReview(pending); $('confirmDialog').showModal(); await applyPendingSendStatus(pending); } } catch (error) { showError('sendError', error); } });
$('confirmSend').addEventListener('click', async () => { if (!pendingSend || sendCallInProgress) return; clearError('sendDialogError'); const pendingId = pendingSend.pendingId; sendCallInProgress = true; try { $('confirmSend').disabled = true; const result = await window.josimi.send(pendingSend); pendingSend = null; $('confirmDialog').close(); await window.josimi.ackSend({ pendingId }).catch(() => false); showToast(`송금 완료 · ${result.txHashes?.join(', ') || ''}`); await refresh(); } catch (e) { showError('sendDialogError', e); try { await applyPendingSendStatus(await window.josimi.pendingSend()); } catch (_) {} } finally { sendCallInProgress = false; } });
setMode('create');
Object.assign(LANG.ko, { miningPoolPreset:'풀 선택', poolMoneroOcean:'MoneroOcean · TLS', poolHashVault:'HashVault · TLS', poolSupportXMR:'SupportXMR · TLS', poolCustom:'사용자 지정 풀', poolAddressPlaceholder:'예: pool.example.com:3333', poolPassword:'풀 비밀번호 / 작업자', poolPasswordHint:'MoneroOcean 작업자 값은 작업자~알고리즘 형식입니다. 기본값 josimi~rx/0을 사용합니다.', poolEndpointTemplate:'연결 주소: {endpoint} · TLS', miningRecommend:'PC 사양으로 스레드 추천', miningRecommendationTemplate:'{cpuModel} · 논리 프로세서 {processors}개 · RAM {memory} GB · 권장 {threads} 스레드', miningRecommendationNote:'보수적인 시작값입니다. CPU 온도와 PC 반응 속도를 확인하며 조정하세요.', miningConnecting:'풀 연결 중', miningConnected:'작업 수신 중', miningShareAccepted:'XMRig 보고 승인 share', miningShareNotice:'표시되는 승인 share 수는 XMRig 로그 기준이며 개발자 기부 share가 포함될 수 있습니다. 실제 풀 입금이나 지갑 지급을 보장하지 않습니다.' });
Object.assign(LANG.en, { miningPoolPreset:'Pool', poolMoneroOcean:'MoneroOcean · TLS', poolHashVault:'HashVault · TLS', poolSupportXMR:'SupportXMR · TLS', poolCustom:'Custom pool', poolAddressPlaceholder:'Example: pool.example.com:3333', poolPassword:'Pool password / worker', poolPasswordHint:'MoneroOcean uses worker~algorithm format; the default is josimi~rx/0.', poolEndpointTemplate:'Endpoint: {endpoint} · TLS', miningRecommend:'Recommend threads for this PC', miningRecommendationTemplate:'{cpuModel} · {processors} logical processors · {memory} GB RAM · suggested {threads} threads', miningRecommendationNote:'A conservative starting point. Adjust after checking CPU temperature and PC responsiveness.', miningConnecting:'Connecting to pool', miningConnected:'Receiving work', miningShareAccepted:'XMRig accepted shares', miningShareNotice:'The count is reported by XMRig and may include developer-donation shares; it does not confirm that your pool credited a payout.' });
Object.assign(LANG.zh, { miningPoolPreset:'矿池', poolMoneroOcean:'MoneroOcean · TLS', poolHashVault:'HashVault · TLS', poolSupportXMR:'SupportXMR · TLS', poolCustom:'自定义矿池', poolAddressPlaceholder:'例如：pool.example.com:3333', poolPassword:'矿池密码 / 工作者', poolPasswordHint:'MoneroOcean 使用“工作者~算法”格式；默认值为 josimi~rx/0。', poolEndpointTemplate:'连接地址：{endpoint} · TLS', miningRecommend:'根据此电脑推荐线程数', miningRecommendationTemplate:'{cpuModel} · {processors} 个逻辑处理器 · RAM {memory} GB · 建议 {threads} 个线程', miningRecommendationNote:'这是较保守的起始值。请观察 CPU 温度和电脑响应后再调整。', miningConnecting:'正在连接矿池', miningConnected:'已收到工作', miningShareAccepted:'XMRig报告的已接受份额', miningShareNotice:'此数量来自XMRig日志，可能包含开发者捐赠份额；它不代表矿池已向您的钱包记账或付款。' });
Object.assign(LANG.ja, { miningPoolPreset:'プール', poolMoneroOcean:'MoneroOcean · TLS', poolHashVault:'HashVault · TLS', poolSupportXMR:'SupportXMR · TLS', poolCustom:'カスタムプール', poolAddressPlaceholder:'例: pool.example.com:3333', poolPassword:'プールパスワード / ワーカー', poolPasswordHint:'MoneroOceanの形式は worker~algorithm です。既定値は josimi~rx/0 です。', poolEndpointTemplate:'接続先: {endpoint} · TLS', miningRecommend:'PCの仕様からスレッド数を提案', miningRecommendationTemplate:'{cpuModel} · 論理プロセッサ {processors} 個 · RAM {memory} GB · 推奨 {threads} スレッド', miningRecommendationNote:'控えめな開始値です。CPU温度とPCの応答を見ながら調整してください。', miningConnecting:'プールに接続中', miningConnected:'ジョブを受信', miningShareAccepted:'XMRigが報告した承認シェア', miningShareNotice:'この件数はXMRigのログに基づき、開発者寄付分を含む場合があります。プールからウォレットへの支払いを確認するものではありません。' });
Object.assign(LANG.ko, { miningStatusUnavailable:'채굴 상태를 확인할 수 없습니다' });
Object.assign(LANG.en, { miningStatusUnavailable:'Mining status unavailable' });
Object.assign(LANG.zh, { miningStatusUnavailable:'无法获取挖矿状态' });
Object.assign(LANG.ja, { miningStatusUnavailable:'マイニング状態を取得できません' });
applyLanguage();
async function applyPendingSendStatus(status) {
  if (!status || status.pendingId !== pendingSend?.pendingId) return;
  if (status.requiresManualReview) {
    pendingSend = { pendingId: status.pendingId, requiresManualReview: true };
    renderManualRelayReview(status);
    $('relayRecoveryBanner').classList.remove('hidden');
    $('confirmSend').classList.add('hidden'); $('cancelSend').classList.add('hidden');
    $('dismissUnknownSend').classList.remove('hidden'); $('resolveUnknownSend').classList.remove('hidden');
    showError('sendDialogError', new Error(LANG[language].relayRestartUnknown));
    return;
  }
  $('confirmSend').classList.remove('hidden'); $('cancelSend').classList.remove('hidden');
  $('dismissUnknownSend').classList.add('hidden'); $('resolveUnknownSend').classList.add('hidden');
  if (status.state === 'relayed') {
    const id = status.pendingId;
    pendingSend = null;
    if ($('confirmDialog').open) $('confirmDialog').close();
    await window.josimi.ackSend({ pendingId: id }).catch(() => false);
    showToast(`송금 완료 · ${status.txHashes?.join(', ') || ''}`);
    await refresh();
    return;
  }
  const relayActive = status.state === 'relaying' || Boolean(status.relayInProgress);
  $('confirmSend').disabled = relayActive;
  $('cancelSend').disabled = status.state !== 'ready';
  if (status.state === 'relaying') showError('sendDialogError', new Error(LANG[language].relayInProgress));
  else if (status.state === 'relay-unknown') showError('sendDialogError', new Error(status.relayInProgress ? LANG[language].relayUnknownActive : LANG[language].relayUnknownRetry));
}
function renderManualRelayReview(status = {}) {
  const hashes = Array.isArray(status.txHashes) ? status.txHashes.filter((hash) => /^[a-f0-9]{64}$/i.test(String(hash))) : [];
  $('review').innerHTML = `<div class="review-row"><span>${escapeHtml(LANG[language].recoveryTxHash)}</span><strong>${hashes.length ? hashes.map(escapeHtml).join('<br>') : '—'}</strong></div>`;
}
async function pollPendingSendStatus() {
  if (sendCallInProgress || !pendingSend?.pendingId || !$('confirmDialog').open) return;
  try { await applyPendingSendStatus(await window.josimi.pendingSend()); } catch (_) {}
}
setInterval(pollPendingSendStatus, 5000);
async function resumePendingSendDialog() {
  try {
    const pending = await window.josimi.pendingSend();
    if (!pending) { $('relayRecoveryBanner').classList.add('hidden'); return; }
    pendingSend = { pendingId: pending.pendingId, requiresManualReview: Boolean(pending.requiresManualReview) };
    if (pending.state === 'relayed') {
      await applyPendingSendStatus({ ...pending, pendingId: pending.pendingId });
      return;
    }
    if (pending.requiresManualReview) { renderManualRelayReview(pending); $('relayRecoveryBanner').classList.remove('hidden'); }
    else renderSendReview(pending);
    $('confirmDialog').showModal();
    await applyPendingSendStatus(pending);
  } catch (_) {}
}
async function resumeOpenWalletAndPendingSend() {
  try { renderSummary(await window.josimi.refresh()); resetInactivityTimer(); await refreshMiningStatus(); } catch (_) {}
  await resumePendingSendDialog();
}
resumeOpenWalletAndPendingSend();
