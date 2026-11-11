const $ = (id) => document.getElementById(id);
const LANG = {
  ko: { lock:'잠금', heroTitle:'내 키는<br/><span>내 기기에.</span>', heroText:'josimi는 seed와 private key를 서버로 보내지 않는 비수탁형 Monero 지갑입니다.', walletTitle:'josimi 지갑', feeNotice:'서비스 수수료 0.25%, 최대 0.05 XMR + 네트워크 수수료', reviewEyebrow:'송금 검토', reviewDescription:'아래 내용을 확인한 뒤 한 번만 전송하세요.', walletSubtitle:'지갑을 열거나 새로 만드세요.', open:'열기', create:'새 지갑', restore:'복구', walletPassword:'지갑 비밀번호', passwordPlaceholder:'8자 이상', nodeMode:'노드', localNode:'원격 노드 사용', remoteNode:'원격 노드 사용', nodeAddress:'노드 주소', moneroSeed:'Monero seed', seedPlaceholder:'13/14/25단어 seed', seedOffset:'Seed offset passphrase (선택)', seedOffsetPlaceholder:'없으면 비워두세요', restoreHeight:'복구 시작 블록 높이', restoreHeightPlaceholder:'첫 입금 전의 블록 높이(모르면 낮게 입력)', createdAtHeight:'생성 시 블록 높이', openWallet:'지갑 열기', createWallet:'새 지갑 만들기', restoreWallet:'seed로 복구', authFine:'송금 전 주소·금액·서비스 수수료를 반드시 확인하세요.', totalBalance:'TOTAL BALANCE', syncWaiting:'동기화 대기', myAddress:'내 주소', copyAddress:'주소 복사', showQr:'QR 보기', send:'보내기', recipientAddress:'받는 주소', recipientPlaceholder:'Monero 주소를 붙여넣으세요', sendAmount:'보낼 금액 (XMR)', priority:'우선순위', low:'낮음', normal:'보통', high:'높음', review:'검토하기', recentTransactions:'최근 거래', localRecord:'로컬 기록', noTransactions:'아직 거래가 없습니다.', walletTools:'지갑 도구', backupWallet:'지갑 파일 백업', showSeed:'복구용 seed 표시', seedFine:'seed는 화면에 표시하는 순간 노출될 수 있습니다. 오프라인에만 보관하세요.', reviewTitle:'송금 내용을 확인하세요', cancel:'취소', confirmSend:'확인하고 송금' },
  en: { lock:'Lock', heroTitle:'Your keys,<br/><span>your device.</span>', heroText:'josimi is a non-custodial Monero wallet. Your seed and private keys stay on your device.', walletTitle:'josimi wallet', feeNotice:'Service fee 0.25%, capped at 0.05 XMR + network fee', reviewEyebrow:'Transaction review', reviewDescription:'Check the details below before sending once.', walletSubtitle:'Open an existing wallet or create a new one.', open:'Open', create:'New wallet', restore:'Restore', walletPassword:'Wallet password', passwordPlaceholder:'8 characters or more', nodeMode:'Node', localNode:'Local node (recommended)', remoteNode:'Use a remote node', nodeAddress:'Daemon address', moneroSeed:'Monero seed', seedPlaceholder:'13/14/25-word seed', seedOffset:'Seed offset passphrase (optional)', seedOffsetPlaceholder:'Leave blank if none', restoreHeight:'Restore height', restoreHeightPlaceholder:'Block height before the first incoming transaction', createdAtHeight:'Creation block height', openWallet:'Open wallet', createWallet:'Create wallet', restoreWallet:'Restore from seed', authFine:'Always check the address, amount, and service fee before sending.', totalBalance:'TOTAL BALANCE', syncWaiting:'Waiting for sync', myAddress:'My address', copyAddress:'Copy address', showQr:'Show QR', send:'Send', recipientAddress:'Recipient address', recipientPlaceholder:'Paste a Monero address', sendAmount:'Amount (XMR)', priority:'Priority', low:'Low', normal:'Normal', high:'High', review:'Review', recentTransactions:'Recent transactions', localRecord:'Local record', noTransactions:'No transactions yet.', walletTools:'Wallet tools', backupWallet:'Back up wallet file', showSeed:'Show recovery seed', seedFine:'Showing your seed can expose it. Keep it offline.', reviewTitle:'Review transaction', cancel:'Cancel', confirmSend:'Confirm and send' },
  zh: { lock:'锁定', heroTitle:'你的密钥，<br/><span>在你的设备。</span>', heroText:'josimi 是非托管 Monero 钱包。您的 seed 和私钥只保存在您的设备上。', walletTitle:'josimi 钱包', feeNotice:'服务费 0.25%，最高 0.05 XMR + 网络手续费', reviewEyebrow:'交易检查', reviewDescription:'发送前请确认以下内容。', walletSubtitle:'打开现有钱包或创建新钱包。', open:'打开', create:'新建钱包', restore:'恢复', walletPassword:'钱包密码', passwordPlaceholder:'至少 8 个字符', nodeMode:'节点', localNode:'使用本机节点（推荐）', remoteNode:'使用远程节点', nodeAddress:'节点地址', moneroSeed:'Monero seed', seedPlaceholder:'13/14/25 个单词的 seed', seedOffset:'Seed offset passphrase（可选）', seedOffsetPlaceholder:'没有则留空', restoreHeight:'恢复起始区块高度', restoreHeightPlaceholder:'首次收款前的区块高度（不确定时填低一些）', createdAtHeight:'创建时区块高度', openWallet:'打开钱包', createWallet:'创建钱包', restoreWallet:'从 seed 恢复', authFine:'发送前请务必核对地址、金额和服务费。', totalBalance:'总余额', syncWaiting:'等待同步', myAddress:'我的地址', copyAddress:'复制地址', showQr:'显示二维码', send:'发送', recipientAddress:'收款地址', recipientPlaceholder:'粘贴 Monero 地址', sendAmount:'发送金额 (XMR)', priority:'优先级', low:'低', normal:'普通', high:'高', review:'检查', recentTransactions:'最近交易', localRecord:'本地记录', noTransactions:'暂无交易。', walletTools:'钱包工具', backupWallet:'备份钱包文件', showSeed:'显示恢复 seed', seedFine:'显示 seed 可能导致泄露。请离线保存。', reviewTitle:'检查交易内容', cancel:'取消', confirmSend:'确认并发送' },
  ja: { lock:'ロック', heroTitle:'鍵は、<br/><span>あなたの端末に。</span>', heroText:'josimiは非カストディ型のMoneroウォレットです。seedと秘密鍵は端末内に保存されます。', walletTitle:'josimi ウォレット', feeNotice:'サービス手数料 0.25%、上限 0.05 XMR + ネットワーク手数料', reviewEyebrow:'送金確認', reviewDescription:'送信前に以下の内容を確認してください。', walletSubtitle:'ウォレットを開くか、新しく作成します。', open:'開く', create:'新しいウォレット', restore:'復元', walletPassword:'ウォレットパスワード', passwordPlaceholder:'8文字以上', nodeMode:'ノード', localNode:'自分の端末のノード（推奨）', remoteNode:'リモートノードを使う', nodeAddress:'ノードアドレス', moneroSeed:'Monero seed', seedPlaceholder:'13/14/25語のseed', seedOffset:'Seed offset passphrase（任意）', seedOffsetPlaceholder:'なければ空欄', restoreHeight:'復元開始ブロック高', restoreHeightPlaceholder:'最初の入金前のブロック高（不明なら低め）', createdAtHeight:'作成時のブロック高', openWallet:'ウォレットを開く', createWallet:'ウォレットを作成', restoreWallet:'seedから復元', authFine:'送信前にアドレス・金額・サービス手数料を確認してください。', totalBalance:'合計残高', syncWaiting:'同期を待機中', myAddress:'自分のアドレス', copyAddress:'アドレスをコピー', showQr:'QRを表示', send:'送信', recipientAddress:'送金先アドレス', recipientPlaceholder:'Moneroアドレスを貼り付け', sendAmount:'送金額 (XMR)', priority:'優先度', low:'低', normal:'通常', high:'高', review:'確認', recentTransactions:'最近の取引', localRecord:'ローカル記録', noTransactions:'取引はまだありません。', walletTools:'ウォレットツール', backupWallet:'ウォレットファイルをバックアップ', showSeed:'復元用seedを表示', seedFine:'seedを表示すると漏洩する可能性があります。オフラインで保管してください。', reviewTitle:'送金内容を確認', cancel:'キャンセル', confirmSend:'確認して送信' }
};
let language = localStorage.getItem('josimi.language') || 'ko';
if (!LANG[language]) language = 'ko';
const EXTRA_LANG = {
  ko: {        reviewRecipient: '받는 주소', reviewAmount: '보낼 금액', reviewServiceFee: '서비스 수수료 (0.25%, 최대 0.05 XMR)', reviewNetworkFee: '네트워크 수수료', reviewTotal: '총 차감액', reviewFeeAddress: '수수료 수취 주소' },
  en: {        reviewRecipient: 'Recipient address', reviewAmount: 'Amount', reviewServiceFee: 'Service fee (0.25%, max 0.05 XMR)', reviewNetworkFee: 'Network fee', reviewTotal: 'Total debit', reviewFeeAddress: 'Fee recipient' },
  zh: {        reviewRecipient: '收款地址', reviewAmount: '发送金额', reviewServiceFee: '服务费（0.25%，最高 0.05 XMR）', reviewNetworkFee: '网络手续费', reviewTotal: '总扣款', reviewFeeAddress: '手续费收款地址' },
  ja: {        reviewRecipient: '送金先アドレス', reviewAmount: '送金額', reviewServiceFee: 'サービス手数料（0.25%、上限0.05 XMR）', reviewNetworkFee: 'ネットワーク手数料', reviewTotal: '合計引落額', reviewFeeAddress: '手数料の受取先' }
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
Object.assign(LANG.ko, { sendSuccess: '송금이 완료됐습니다.', sendTxHash: '거래 해시' });
Object.assign(LANG.en, { sendSuccess: 'Transfer sent.', sendTxHash: 'Transaction hash' });
Object.assign(LANG.zh, { sendSuccess: '转账已发送。', sendTxHash: '交易哈希' });
Object.assign(LANG.ja, { sendSuccess: '送金が完了しました。', sendTxHash: '取引ハッシュ' });
Object.assign(LANG.ko, { reviewPriority: '우선순위' });
Object.assign(LANG.en, { reviewPriority: 'Priority' });
Object.assign(LANG.zh, { reviewPriority: '优先级' });
Object.assign(LANG.ja, { reviewPriority: '優先度' });
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
    localNodeStorageNotice:'첫 동기화는 수 시간 또는 며칠이 걸리고 큰 저장 공간과 대역폭을 쓸 수 있습니다. Monero 기본 빠른 DB 동기화는 체인 끝에 가까워지면 안전 모드로 전환되며, pruning과 UPnP 비활성화도 적용합니다. 초기 동기화 중 정전이나 시스템 강제 종료로 블록체인 DB를 다시 확인하거나 재동기화해야 할 수 있지만, 지갑 키 파일과는 별개입니다. monerod는 기본 P2P 포트 18080에서 계속 수신 대기하고, --hide-my-port는 피어 후보 광고만 막습니다. 외부 연결 가능성은 PC 방화벽에 달려 있습니다.',
    localNodeUnsupported:'로컬 노드는 Windows에서만 지원됩니다.', localNodeMissing:'포함된 monerod 런타임을 찾지 못했습니다. 공식 josimi Windows ZIP을 다시 설치하세요. 실행 중 다운로드는 하지 않습니다.',
    localNodeVerifying:'포함된 monerod 파일 검증 중', localNodeInstalled:'monerod와 필요한 런타임 파일이 포함되어 있습니다. 실행 전 각 파일의 SHA-256을 포함된 manifest와 대조합니다. manifest 자체는 별도 서명되지 않았습니다.', localNodeRunning:'monerod 실행 중 — 동기화 상태를 확인하세요.', localNodeStopped:'로컬 monerod 중지됨', localNodeSynced:'로컬 노드 동기화 완료', localNodeSyncing:'로컬 노드 동기화 중',



    relayRestartUnknown:'앱이 다시 시작된 뒤 이전 송금 전파 결과가 확인되지 않았습니다. 아래 해시를 지갑·신뢰할 수 있는 노드에서 확인하세요. 같은 거래가 전파됐을 가능성이 있으므로 확인 전 새 송금을 만들지 마세요. 서명된 거래 원문은 재시작 후 보관되지 않아 자동 재전송할 수 없습니다.',
    recoveryTxHash:'확인할 거래 해시', leaveBlocked:'차단 상태로 닫기', resolveUnknownSend:'확인 후 차단 해제', resolveSendSuccess:'이전 송금 차단을 해제했습니다. 반드시 이전 거래 상태를 확인한 뒤 새 송금을 진행하세요.'
  },
  en: {
    nodeMode:'Node type', nodeRemoteChoice:'Trusted remote node', nodeLocalChoice:'This PC (local monerod)', nodeAddress:'Remote Monero node address',
    nodePrivacyNotice:'A remote daemon can see your IP address and may infer wallet balances or activity from RPC requests. Use a node you trust or run local monerod.',
    nodeLocalNotice:'Wallet RPC connects only to local monerod at 127.0.0.1. The node connects to Monero P2P peers, which can see its IP, and still listens on the default P2P port 18080. --hide-my-port only prevents peer-list advertisement; the firewall controls inbound reachability.',
    localNodeSummary:'Local node (monerod)', localNodeIntro:'The josimi Windows ZIP includes the official Monero v0.18.5.4 monerod daemon and required runtime files, not the full CLI. The source archive SHA-256 is checked at build time, and monerod runs hidden after its files are verified.',
    localNodeChecking:'Checking local node status', localNodeInstall:'Verify bundled monerod', localNodeStart:'Start monerod', localNodeStop:'Stop node',
    localNodeStorageNotice:'Initial sync may take hours or days and use substantial disk space and bandwidth. The Monero default fast database-sync mode switches to safe mode near the chain tip; pruning is enabled and UPnP is disabled. A power loss or system crash during initial async sync may require checking or resyncing the blockchain database, but wallet key files are separate. monerod still listens on the default P2P port 18080; --hide-my-port only prevents peer-list advertisement, and inbound reachability depends on the PC firewall.',
    localNodeUnsupported:'Local node is supported on Windows only.', localNodeMissing:'The bundled monerod runtime was not found. Reinstall the official josimi Windows ZIP; the app does not download it at runtime.',
    localNodeVerifying:'Verifying bundled monerod files', localNodeInstalled:'monerod and its required runtime files are bundled; file SHA-256 values are checked against the included manifest before launch. The manifest itself is not separately signed.', localNodeRunning:'monerod is running — check sync status.', localNodeStopped:'Local monerod stopped', localNodeSynced:'Local node synced', localNodeSyncing:'Local node syncing',



    relayRestartUnknown:'The previous transaction relay result is unknown after the app restarted. Check the hash below in your wallet or a trusted node. Do not create another transfer until you know whether the transaction was relayed. Signed transaction data is not retained across restarts, so this app cannot automatically retry it.',
    recoveryTxHash:'Transaction hash to check', leaveBlocked:'Close and keep blocked', resolveUnknownSend:'Clear block after checking', resolveSendSuccess:'The previous-send block was cleared. Verify the old transaction before sending again.'
  },
  zh: {
    nodeMode:'节点类型', nodeRemoteChoice:'可信的远程节点', nodeLocalChoice:'本机（本地 monerod）', nodeAddress:'远程 Monero 节点地址',
    nodePrivacyNotice:'远程 daemon 可以看到您的 IP 地址，并可能根据 RPC 请求推断钱包余额或活动。请使用可信节点或运行本地 monerod。',
    nodeLocalNotice:'钱包 RPC 仅连接到 127.0.0.1 上的本地 monerod。节点会连接 Monero P2P 节点并可能暴露 IP，且仍在默认 P2P 端口 18080 上监听。--hide-my-port 只阻止节点被列为候选节点；外部能否连接取决于电脑防火墙。',
    localNodeSummary:'本地节点（monerod）', localNodeIntro:'josimi Windows ZIP 仅包含 Monero 官方 v0.18.5.4 monerod 守护进程及必要运行库，不包含完整 CLI。构建时核对源 archive SHA-256，启动前验证文件完整性，并在后台运行。',
    localNodeChecking:'正在检查本地节点状态', localNodeInstall:'验证内置 monerod', localNodeStart:'启动 monerod', localNodeStop:'停止节点',
    localNodeStorageNotice:'首次同步可能需要数小时或数天，并占用较多磁盘空间和网络流量。Monero 默认快速数据库同步模式会在接近链顶时切换到安全模式；同时启用裁剪并禁用 UPnP。初次异步同步期间若断电或系统崩溃，区块链数据库可能需要重新检查或同步，但钱包密钥文件单独保存，不受影响。monerod 仍会在默认 P2P 端口 18080 上监听；--hide-my-port 只阻止节点被列为候选节点，外部能否连接取决于电脑防火墙。',
    localNodeUnsupported:'本地节点仅支持 Windows。', localNodeMissing:'未找到内置 monerod 运行文件。请重新安装官方 josimi Windows ZIP；应用运行时不会下载节点。',
    localNodeVerifying:'正在验证内置 monerod 文件', localNodeInstalled:'已包含 monerod 和必要运行库；启动前会将文件 SHA-256 与内置清单核对。该清单本身未单独签名。', localNodeRunning:'monerod 正在运行 — 请查看同步状态。', localNodeStopped:'本地 monerod 已停止', localNodeSynced:'本地节点已同步', localNodeSyncing:'本地节点同步中',



    relayRestartUnknown:'应用重启后，上一笔交易的广播结果尚不确定。请在钱包或可信节点中核对下方哈希。在确认交易状态前不要创建另一笔转账。应用不会跨重启保存已签名交易原文，因此无法自动重试。',
    recoveryTxHash:'需要核对的交易哈希', leaveBlocked:'保持阻止并关闭', resolveUnknownSend:'核对后解除阻止', resolveSendSuccess:'已解除上一笔交易的阻止状态。再次转账前请确认旧交易状态。'
  },
  ja: {
    nodeMode:'ノードの種類', nodeRemoteChoice:'信頼できるリモートノード', nodeLocalChoice:'このPC（ローカル monerod）', nodeAddress:'リモートMoneroノードのアドレス',
    nodePrivacyNotice:'リモートdaemonにはIPアドレスが見え、RPC要求から残高や利用状況を推測される可能性があります。信頼できるノードまたはローカルmonerodを使用してください。',
    nodeLocalNotice:'ウォレットRPCは127.0.0.1のローカルmonerodにのみ接続します。ノードはMonero P2Pピアに接続しIPを知られる可能性があり、既定P2Pポート18080でも待ち受けます。--hide-my-portはピア候補としての広告だけを止め、外部から接続できるかはPCのファイアウォールに依存します。',
    localNodeSummary:'ローカルノード（monerod）', localNodeIntro:'josimi Windows ZIPにはMonero公式v0.18.5.4のmonerodデーモンと必要なランタイムファイルのみを含み、CLI全体は含みません。ビルド時に元archiveのSHA-256を照合し、起動前にファイルを検証してバックグラウンド実行します。',
    localNodeChecking:'ローカルノードの状態を確認中', localNodeInstall:'同梱monerodを検証', localNodeStart:'monerodを起動', localNodeStop:'ノードを停止',
    localNodeStorageNotice:'初回同期には数時間から数日かかり、ストレージと通信量を多く使う場合があります。Monero既定の高速DB同期はチェーン先端に近づくと安全モードに切り替わり、pruningとUPnP無効化も適用します。初回の非同期同期中に停電やシステムクラッシュが起きると、ブロックチェーンDBの再確認や再同期が必要になる場合がありますが、ウォレットキーのファイルとは別です。monerodは既定P2Pポート18080で引き続き待ち受け、--hide-my-portはピア候補の広告だけを止めます。外部から接続できるかはPCのファイアウォールに依存します。',
    localNodeUnsupported:'ローカルノードはWindowsのみ対応です。', localNodeMissing:'同梱monerodランタイムが見つかりません。公式josimi Windows ZIPを再インストールしてください。実行中のダウンロードはありません。',
    localNodeVerifying:'同梱monerodファイルを検証中', localNodeInstalled:'monerodと必要なランタイムファイルを同梱しています。起動前に各ファイルのSHA-256を同梱マニフェストと照合します。マニフェスト自体は個別に署名されていません。', localNodeRunning:'monerod実行中 — 同期状態を確認してください。', localNodeStopped:'ローカルmonerod停止中', localNodeSynced:'ローカルノード同期完了', localNodeSyncing:'ローカルノード同期中',



    relayRestartUnknown:'アプリ再起動後、前の取引の中継結果が不明です。下のハッシュをウォレットまたは信頼できるノードで確認してください。状態が分かるまで別の送金を作成しないでください。署名済み取引データは再起動をまたいで保存しないため、自動再送はできません。',
    recoveryTxHash:'確認する取引ハッシュ', leaveBlocked:'ブロック状態のまま閉じる', resolveUnknownSend:'確認後にブロック解除', resolveSendSuccess:'前の取引ブロックを解除しました。再送金前に旧取引の状態を確認してください。'
  }
};
for (const code of Object.keys(LOCALIZED_RUNTIME)) Object.assign(LANG[code], LOCALIZED_RUNTIME[code]);
Object.assign(LANG.ko, { localNodeRpcWaitFailed: '로컬 노드가 응답하지 않아 연결을 확인하지 못했습니다. 노드 상태를 확인한 뒤 다시 시도하세요.', localNodeRestarting: 'monerod가 종료되어 자동으로 다시 시작하고 있습니다.', localNodeRestartFailed: '로컬 노드가 계속 종료되어 자동 재시도를 멈췄습니다. 오류 내용을 확인한 뒤 다시 시도하세요.', localNodeStatusUnavailable: '노드 상태를 확인하지 못했습니다. 잠시 후 자동으로 다시 확인합니다.' });
Object.assign(LANG.en, { localNodeRpcWaitFailed: 'The local node did not respond in time. Check its status and try again.', localNodeRestarting: 'monerod stopped unexpectedly and is restarting automatically.', localNodeRestartFailed: 'The local node kept stopping, so automatic retries have paused. Check the error and try again.', localNodeStatusUnavailable: 'Node status could not be checked. It will be checked again automatically.' });
Object.assign(LANG.zh, { localNodeRpcWaitFailed: '本地节点未能及时响应。请检查节点状态后重试。', localNodeRestarting: 'monerod 意外停止，正在自动重新启动。', localNodeRestartFailed: '本地节点持续停止，自动重试已暂停。请查看错误后重试。', localNodeStatusUnavailable: '无法检查节点状态，稍后会自动重试。' });
Object.assign(LANG.ja, { localNodeRpcWaitFailed: 'ローカルノードが時間内に応答しませんでした。状態を確認して再試行してください。', localNodeRestarting: 'monerodが予期せず停止したため、自動で再起動しています。', localNodeRestartFailed: 'ローカルノードが繰り返し停止したため、自動再試行を停止しました。エラーを確認して再試行してください。', localNodeStatusUnavailable: 'ノードの状態を確認できませんでした。しばらくして自動で再確認します。' });
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
const HUMANIZED_COPY = {
  ko: {
    walletDescriptor:'MONERO 지갑', heroTitle:'지갑 파일은<br/><span>내 PC에 보관돼요.</span>', heroText:'복구 문구와 개인 키는 이 PC에서 관리합니다. josimi 서버로 보내지 않습니다.', firstSyncPromise:'이 PC의 노드는 앱을 열면 자동으로 시작됩니다. 처음에는 블록체인을 내려받고 확인하느라 시간이 걸릴 수 있어요. 저장 공간과 인터넷도 사용합니다.', networkNote:'내 PC에서 노드를 실행해도 Monero 네트워크와 연결됩니다. IP 주소를 숨겨 주는 기능은 아닙니다.', getStarted:'지갑을 시작하는 방법', walletTitle:'지갑을 준비해요', walletSubtitle:'처음이면 새 지갑을 만들고, 이미 지갑 파일이 있으면 열어 주세요.', existingKeysOpen:'기존 지갑 열기', create:'새 지갑', restore:'복구', connectionSettings:'연결 방식', nodeMode:'연결 방식', nodeLocalChoice:'내 PC에서 직접 실행 (기본)', nodeRemoteChoice:'원격 노드', nodeLocalNotice:'이 PC에서 Monero 노드를 직접 실행합니다. 처음 동기화할 때는 저장 공간과 네트워크를 사용하며, 완료까지 시간이 걸릴 수 있습니다.', nodePrivacyNotice:'다른 사람이 운영하는 노드에 연결합니다. 운영자는 접속 IP와 요청 정보를 볼 수 있으니 믿을 수 있는 노드만 사용하세요.', localNodeSummary:'내 PC의 연결 상태', nodeFirstSyncTitle:'처음 동기화는 시간이 걸릴 수 있어요', localNodeIntro:'로컬 노드는 앱을 열면 자동으로 시작됩니다. 처음에는 블록체인 데이터를 내려받고 확인하느라 시간이 걸릴 수 있어요.', localNodeChecking:'로컬 노드 상태 확인 중', localNodeInstall:'포함된 노드 파일 확인', localNodeStart:'로컬 노드 시작', localNodeStop:'노드 중지', nodeAdvancedDetails:'저장 공간과 네트워크 자세히', showDetails:'자세히', nodeLocalPreparing:'노드에 연결하고 있어요', nodeLocalSyncingShort:'블록체인을 확인하고 있어요', nodeLocalReady:'노드가 준비됐어요', nodeLocalStoppedShort:'노드가 멈췄어요', nodeLocalMissingShort:'로컬 노드를 찾지 못했어요', nodeRemoteSelected:'원격 노드에 연결합니다', nodeRemoteSummary:'선택한 원격 노드에 연결합니다.', retryLocalNode:'자동 시작이 안 됐어요. 다시 시도', syncWaiting:'지갑 동기화 상태를 확인하고 있어요', nodeSyncing:'지갑 거래를 확인하고 있어요', nodeSynced:'최신 상태예요', nodeOffline:'연결이 끊겼어요', nodeOfflineDetail:'연결 방식 또는 인터넷 연결을 확인하세요.', syncWaitNotice:'아직 동기화가 끝나지 않았어요. 확인이 더 진행되면 잔액이나 거래 내역이 달라질 수 있습니다.', syncReadyNotice:'지갑 동기화가 끝났어요.', syncMore:'동기화 진행 상황', totalBalance:'내 잔액', authFine:'비밀번호와 복구 문구는 이 기기에만 입력하세요. 송금 전에는 주소와 금액을 다시 확인합니다.', receiveEyebrow:'받기', sendEyebrow:'보내기', activityEyebrow:'기록', receiveHint:'이 주소를 복사해 상대방에게 보내면 됩니다.', addressCheckHint:'주소를 붙여넣은 뒤 전체 주소를 확인하세요. 한 글자만 달라도 다른 곳에 도착할 수 있어요.', sendMoreOptions:'메모와 우선순위 (선택)', walletSecurity:'보안과 백업', walletOrganization:'계정과 주소록', walletOrganizationHint:'필요할 때 펼쳐서 관리하세요'
  },
  en: {
    walletDescriptor:'MONERO WALLET', heroTitle:'Your keys,<br/><span>on this device.</span>', heroText:'Your wallet files and recovery phrase stay on your computer, where you manage them directly.', firstSyncPromise:'Your local node starts automatically. The first sync can take a while; you can check its progress here.', networkNote:'A public-node operator can see your IP and connection details. A local node also connects to Monero peers.', getStarted:'Choose how to begin', walletTitle:'Let’s get your wallet ready', walletSubtitle:'Create a wallet if this is your first time, or open your existing file to continue.', existingKeysOpen:'Open existing wallet', create:'New wallet', restore:'Restore', connectionSettings:'Connection', nodeMode:'Connection', nodeLocalChoice:'This PC (default)', nodeRemoteChoice:'Public node', nodeLocalNotice:'A Monero node runs on this PC. The first sync uses storage and internet and may take a while.', nodePrivacyNotice:'A public-node operator can see your IP and request metadata. Choose a node you trust.', localNodeSummary:'This PC connection', nodeFirstSyncTitle:'The first connection needs time', localNodeIntro:'The local node starts with the app. Its first sync may take a while; progress appears here.', localNodeChecking:'Checking local node status', localNodeInstall:'Check bundled node files', localNodeStart:'Start local node', localNodeStop:'Stop node', nodeAdvancedDetails:'Storage and network details', showDetails:'Details', nodeLocalPreparing:'Preparing local node', nodeLocalSyncingShort:'First sync in progress', nodeLocalReady:'Node connected', nodeLocalStoppedShort:'Node is stopped', nodeLocalMissingShort:'Local node not found', nodeRemoteSelected:'Public node selected', nodeRemoteSummary:'Connects to a public node.', retryLocalNode:'Try again', syncWaiting:'Checking wallet sync', nodeSyncing:'Syncing', nodeSynced:'Up to date', nodeOffline:'Connection lost', nodeOfflineDetail:'Check the connection setting or internet connection.', syncWaitNotice:'Your balance and transaction list may change until sync finishes.', syncReadyNotice:'Your wallet is synchronized with the network.', syncMore:'Sync details', totalBalance:'Your balance', authFine:'Enter passwords and recovery phrases only in this app. Check the address and amount before sending.', receiveEyebrow:'RECEIVE', sendEyebrow:'SEND', activityEyebrow:'ACTIVITY', receiveHint:'Copy this address and share it with the person sending you Monero.', addressCheckHint:'After pasting an address, check the full address. One character can send funds somewhere else.', sendMoreOptions:'Note and priority (optional)', walletSecurity:'Security and backup', walletOrganization:'Accounts and address book', walletOrganizationHint:'Open when you need them'
  },
  zh: {
    walletDescriptor:'MONERO 钱包', heroTitle:'你的密钥，<br/><span>留在这台设备。</span>', heroText:'钱包文件和恢复短语保存在你的电脑上，由你直接管理。', firstSyncPromise:'本地节点会自动启动。首次同步可能需要一些时间，进度会显示在这里。', networkNote:'公共节点运营者可以看到你的 IP 和连接信息。本地节点也会连接 Monero 网络节点。', getStarted:'选择开始方式', walletTitle:'准备好你的钱包', walletSubtitle:'第一次使用可以新建钱包；已有钱包则打开文件继续。', existingKeysOpen:'打开已有钱包', create:'新建钱包', restore:'恢复', connectionSettings:'连接方式', nodeMode:'连接方式', nodeLocalChoice:'这台电脑（默认）', nodeRemoteChoice:'公共节点', nodeLocalNotice:'Monero 节点将在这台电脑运行。首次同步会占用存储空间和网络，可能需要较长时间。', nodePrivacyNotice:'公共节点运营者可以看到你的 IP 和请求信息。请选择你信任的节点。', localNodeSummary:'本机连接状态', nodeFirstSyncTitle:'首次连接需要一点时间', localNodeIntro:'本地节点会随应用自动启动。首次同步可能需要较长时间，进度会显示在这里。', localNodeChecking:'正在检查本地节点状态', localNodeInstall:'检查内置节点文件', localNodeStart:'启动本地节点', localNodeStop:'停止节点', nodeAdvancedDetails:'存储和网络详情', showDetails:'详情', nodeLocalPreparing:'正在准备本地节点', nodeLocalSyncingShort:'首次同步进行中', nodeLocalReady:'节点已连接', nodeLocalStoppedShort:'节点已停止', nodeLocalMissingShort:'未找到本地节点', nodeRemoteSelected:'已选择公共节点', nodeRemoteSummary:'将连接到公共节点。', retryLocalNode:'重试', syncWaiting:'正在检查钱包同步状态', nodeSyncing:'同步中', nodeSynced:'已同步至最新状态', nodeOffline:'连接已断开', nodeOfflineDetail:'请检查连接方式或互联网连接。', syncWaitNotice:'同步完成前，余额和交易记录可能会变化。', syncReadyNotice:'钱包已与网络同步。', syncMore:'查看同步详情', totalBalance:'我的余额', authFine:'请只在此应用中输入密码和恢复短语。发送前请再次核对地址和金额。', receiveEyebrow:'收款', sendEyebrow:'发送', activityEyebrow:'记录', receiveHint:'复制此地址并分享给向你发送 Monero 的人。', addressCheckHint:'粘贴后请核对完整地址。即使一个字符不同，资金也可能发往别处。', sendMoreOptions:'备注与优先级（可选）', walletSecurity:'安全与备份', walletOrganization:'账户和地址簿', walletOrganizationHint:'需要时再展开管理'
  },
  ja: {
    walletDescriptor:'MONERO WALLET', heroTitle:'鍵は、<br/><span>この端末の中に。</span>', heroText:'ウォレットファイルと復元フレーズは自分のPCに保管し、このアプリで管理します。', firstSyncPromise:'ローカルノードは自動で起動します。初回同期には時間がかかることがあります。進み具合はここで確認できます。', networkNote:'パブリックノードの運営者にはIPアドレスや接続情報が見える場合があります。ローカルノードもMoneroのピアに接続します。', getStarted:'始め方を選ぶ', walletTitle:'ウォレットを準備しましょう', walletSubtitle:'初めてなら新しく作成し、すでにお持ちならファイルを開いて続けられます。', existingKeysOpen:'既存のウォレットを開く', create:'新規作成', restore:'復元', connectionSettings:'接続方法', nodeMode:'接続方法', nodeLocalChoice:'このPC（既定）', nodeRemoteChoice:'パブリックノード', nodeLocalNotice:'このPCでMoneroノードを実行します。初回同期はストレージと通信量を使い、時間がかかることがあります。', nodePrivacyNotice:'パブリックノード運営者にはIPアドレスやリクエスト情報が見える場合があります。信頼できるノードを選んでください。', localNodeSummary:'このPCの接続状態', nodeFirstSyncTitle:'最初の接続には時間がかかります', localNodeIntro:'ローカルノードはアプリと一緒に自動で起動します。初回同期には時間がかかることがあり、進捗はここに表示されます。', localNodeChecking:'ローカルノードの状態を確認中', localNodeInstall:'同梱ノードファイルを確認', localNodeStart:'ローカルノードを起動', localNodeStop:'ノードを停止', nodeAdvancedDetails:'ストレージとネットワークの詳細', showDetails:'詳細', nodeLocalPreparing:'ローカルノードを準備中', nodeLocalSyncingShort:'初回同期中', nodeLocalReady:'ノード接続済み', nodeLocalStoppedShort:'ノードが停止しています', nodeLocalMissingShort:'ローカルノードが見つかりません', nodeRemoteSelected:'パブリックノードを選択中', nodeRemoteSummary:'パブリックノードに接続します。', retryLocalNode:'再試行', syncWaiting:'ウォレットの同期状態を確認中', nodeSyncing:'同期中', nodeSynced:'最新の状態です', nodeOffline:'接続が切れました', nodeOfflineDetail:'接続方法またはインターネット接続を確認してください。', syncWaitNotice:'同期が終わるまでは残高や取引履歴が変わる場合があります。', syncReadyNotice:'ウォレットはネットワークと同期しています。', syncMore:'同期の詳細', totalBalance:'残高', authFine:'パスワードと復元フレーズはこのアプリにだけ入力してください。送金前にアドレスと金額を再確認します。', receiveEyebrow:'受取', sendEyebrow:'送金', activityEyebrow:'履歴', receiveHint:'このアドレスをコピーして、Moneroを送る相手に共有してください。', addressCheckHint:'貼り付けた後、アドレス全体を確認してください。1文字違うだけでも別の宛先になります。', sendMoreOptions:'メモと優先度（任意）', walletSecurity:'セキュリティとバックアップ', walletOrganization:'アカウントとアドレス帳', walletOrganizationHint:'必要なときに開いて管理できます'
  }
};
for (const code of Object.keys(HUMANIZED_COPY)) Object.assign(LANG[code], HUMANIZED_COPY[code]);
Object.assign(LANG.ko, { nodeLocalStarting:'노드가 연결을 준비하고 있어요', syncStartRetrying:'지갑 동기화 연결이 잠시 끊겼어요. 자동으로 다시 연결하고 있습니다.' });
Object.assign(LANG.en, { nodeLocalStarting:'Waiting for the node to accept connections', syncStartRetrying:'Wallet sync lost its connection briefly. Reconnecting automatically.' });
Object.assign(LANG.zh, { nodeLocalStarting:'正在等待节点接受连接', syncStartRetrying:'钱包同步连接暂时中断，正在自动重连。' });
Object.assign(LANG.ja, { nodeLocalStarting:'ノードの接続準備中です', syncStartRetrying:'ウォレット同期の接続が一時中断しました。自動で再接続しています。' });
Object.assign(LANG.ko, { localNodeRpcWaitFailed:'노드가 아직 연결을 준비 중이에요. 앱을 켜 두면 계속 확인합니다. 잠시 뒤 다시 시도해 주세요.' });
Object.assign(LANG.en, { localNodeRpcWaitFailed:'The node is still preparing its connection. Keep the app open; it will continue checking. Please try again shortly.' });
Object.assign(LANG.zh, { localNodeRpcWaitFailed:'节点仍在准备连接。请保持应用打开，应用会继续检查。请稍后重试。' });
Object.assign(LANG.ja, { localNodeRpcWaitFailed:'ノードは接続準備中です。アプリを開いたままにすると確認を続けます。少し待ってから再試行してください。' });
let mode = 'open';
let pendingSend = null;
let sendCallInProgress = false;
let cancelCallInProgress = false;
let localNodeUrl = 'http://127.0.0.1:18081';
let toastTimer;
let selectedWalletFile = null;
let walletFormSubmissionInFlight = false;
let localNodeStartPromise = null;
let localNodeStartPromiseIntent = -1;
let localNodeIntent = 0;
let localNodeExplicitlyStopped = false;
let localNodeConfigReady = false;
let localNodeSupported = false;
let localNodeStatusRequestToken = 0;
let inactivityTimer;
let syncTimer;
let syncRequestInFlight = false;
let walletSyncStartState = 'running';
let refreshPromise = null;
let receiveQrAddress = '';
let qrGeneration = 0;
let currentAccounts = [];
let currentAddressBook = [];
let currentTransactions = [];
let renderedWalletSessionId = 0;
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
function setWalletFormBusy(busy) {
  document.querySelectorAll('#authView .tabs button, #walletForm input, #walletForm textarea, #walletForm select, #walletForm button').forEach((control) => { control.disabled = busy; });
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
Object.assign(LANG.ko, { nodeConnectionSummary:'연결 상태' });
Object.assign(LANG.en, { nodeConnectionSummary:'Connection status' });
Object.assign(LANG.zh, { nodeConnectionSummary:'连接状态' });
Object.assign(LANG.ja, { nodeConnectionSummary:'接続状態' });
Object.assign(LANG.ko, { networkNote:'로컬 노드도 Monero P2P 피어와 통신하므로, IP 주소를 숨기는 기능은 아닙니다.' });
Object.assign(LANG.en, { networkNote:'A local node still connects to Monero P2P peers; it does not hide your IP address.' });
Object.assign(LANG.zh, { networkNote:'本地节点仍会连接 Monero P2P 节点，因此不会隐藏您的 IP 地址。' });
Object.assign(LANG.ja, { networkNote:'ローカルノードもMoneroのP2Pピアに接続するため、IPアドレスを隠すものではありません。' });
function renderSync(sync = {}) {
  const dict = LANG[language];
  renderSync.lastStatus = sync;
  const state = sync.state || 'stopped';
  const labels = { downloading: dict.nodeSyncing, starting: dict.nodeSyncing, syncing: dict.nodeSyncing, synced: dict.nodeSynced, remote: dict.nodeRemote, offline: dict.nodeOffline, stopped: dict.nodeStopped };
  $('status').textContent = labels[state] || dict.syncWaiting;
  $('status').dataset.state = state;
  const progress = Number(sync.progress);
  const hasProgress = Number.isFinite(progress) && Number(sync.targetHeight) > 0 && ['downloading', 'syncing'].includes(state);
  const indeterminate = ['downloading', 'starting', 'syncing'].includes(state) && !hasProgress;
  $('syncProgress').classList.toggle('hidden', !hasProgress && !indeterminate);
  if (hasProgress) { $('syncProgress').value = Math.max(0, Math.min(100, progress)); $('syncProgress').setAttribute('aria-valuenow', String(Math.max(0, Math.min(100, progress)))); }
  else if (indeterminate) { $('syncProgress').removeAttribute('value'); $('syncProgress').removeAttribute('aria-valuenow'); }
  else { $('syncProgress').value = state === 'synced' ? 100 : 0; $('syncProgress').setAttribute('aria-valuenow', String(state === 'synced' ? 100 : 0)); }
  if (state === 'offline') {
    $('syncHint').textContent = dict.nodeOfflineDetail;
    $('syncDetails').textContent = `${dict.nodeOfflineDetail} · ${sync.node || ''}`;
  } else if (['downloading', 'starting', 'syncing'].includes(state)) {
    $('syncHint').textContent = dict.syncWaitNotice;
    $('syncDetails').textContent = sync.targetHeight ? `${progress || 0}% · ${dict.syncBlocks} ${(sync.height || 0).toLocaleString()} / ${(sync.targetHeight || 0).toLocaleString()} · ${dict.syncPeers} ${sync.peers || 0}` : (sync.node || dict.nodeSyncing);
  } else if (state === 'synced') {
    $('syncHint').textContent = dict.syncReadyNotice;
    $('syncDetails').textContent = `${dict.syncBlocks} ${(sync.height || 0).toLocaleString()} · ${dict.syncPeers} ${sync.peers || 0}`;
  } else if (state === 'remote') {
    $('syncHint').textContent = dict.nodeRemoteSummary;
    $('syncDetails').textContent = sync.node || dict.nodeRemoteSummary;
  } else {
    $('syncHint').textContent = dict.syncWaitNotice;
    $('syncDetails').textContent = sync.node || '';
  }
  if (walletSyncStartState === 'retrying') $('syncHint').textContent = dict.syncStartRetrying;
}
function renderLocalNodeStatus(status = {}) {
  const dict = LANG[language];
  renderLocalNodeStatus.lastStatus = status;
  let label = status.supported ? status.installed ? dict.localNodeInstalled : dict.localNodeMissing : dict.localNodeUnsupported;
  if (status.statusUnavailable) {
    label = dict.localNodeStatusUnavailable;
  } else if (status.restarting) {
    label = dict.localNodeRestarting;
  } else if (status.restartExhausted) {
    label = dict.localNodeRestartFailed;
  } else if (status.installing) {
    label = dict.localNodeVerifying;
  } else if (status.running) {
    label = status.rpc?.state === 'synced' ? dict.localNodeSynced : status.rpc?.state === 'syncing' ? dict.localNodeSyncing : ['starting', 'stopped'].includes(status.rpc?.state) ? dict.nodeLocalStarting : dict.localNodeRunning;
    if (status.rpc?.height) label += ` · ${status.rpc.progress || 0}% · ${Number(status.rpc.height).toLocaleString()} / ${Number(status.rpc.targetHeight || 0).toLocaleString()}`;
  } else if (status.installed && status.supported) label += ` · ${dict.localNodeStopped}`;
  $('localNodeStatus').textContent = label;
  $('installLocalNodeBtn').disabled = !status.supported || Boolean(status.installing) || Boolean(status.statusUnavailable);
  $('startLocalNodeBtn').disabled = !status.supported || !status.installed || Boolean(status.installing) || Boolean(status.running) || Boolean(status.restarting) || Boolean(status.statusUnavailable);
  $('stopLocalNodeBtn').disabled = (!status.running && !status.restarting) || Boolean(status.statusUnavailable);
  if (status.restartExhausted && $('nodeMode').value === 'local') {
    showError('localNodeError', new Error(dict.localNodeRestartFailed));
    $('retryLocalNodeBtn').classList.remove('hidden');
  } else if (status.running && !status.statusUnavailable) {
    clearError('localNodeError');
    $('retryLocalNodeBtn').classList.add('hidden');
  }
  renderNodeConnectionSummary(status);
}
function renderNodeConnectionSummary(status = renderLocalNodeStatus.lastStatus || {}) {
  const dict = LANG[language];
  const remote = $('nodeMode').value === 'remote';
  let headline = dict.nodeLocalPreparing;
  let detail = dict.localNodeChecking;
  let progress = Number(status.rpc?.progress);
  const syncing = Boolean(!status.statusUnavailable && !status.restarting && status.running && ['downloading', 'syncing'].includes(status.rpc?.state));
  if (status.statusUnavailable) {
    headline = dict.nodeLocalPreparing;
    detail = dict.localNodeStatusUnavailable;
  } else if (status.restarting) {
    headline = dict.nodeLocalPreparing;
    detail = dict.localNodeRestarting;
  } else if (status.restartExhausted) {
    headline = dict.nodeLocalStoppedShort;
    detail = dict.localNodeRestartFailed;
  } else if (remote) {
    headline = dict.nodeRemoteSelected;
    detail = dict.nodeRemoteSummary;
  } else if (status.supported === false) {
    headline = dict.localNodeUnsupported;
    detail = dict.localNodeUnsupported;
  } else if (status.installing) {
    headline = dict.nodeLocalPreparing;
    detail = dict.localNodeVerifying;
  } else if (status.running && ['starting', 'stopped'].includes(status.rpc?.state)) {
    headline = dict.nodeLocalPreparing;
    detail = dict.nodeLocalStarting;
  } else if (status.running && status.rpc?.state === 'synced') {
    headline = dict.nodeLocalReady;
    detail = dict.localNodeSynced;
  } else if (syncing) {
    headline = dict.nodeLocalSyncingShort;
    detail = Number.isFinite(progress) ? `${Math.max(0, Math.min(100, progress))}% · ${dict.localNodeSyncing}` : dict.localNodeSyncing;
  } else if (status.running) {
    headline = dict.nodeLocalPreparing;
    detail = dict.localNodeRunning;
  } else if (status.supported && status.installed) {
    headline = dict.nodeLocalStoppedShort;
    detail = dict.localNodeStopped;
  } else if (status.supported && status.installed === false) {
    headline = dict.nodeLocalMissingShort;
    detail = dict.localNodeMissing;
  }
  $('localNodeSummaryStatus').textContent = headline;
  $('localNodeSummaryDetail').textContent = detail;
  const showProgress = !remote && syncing;
  $('localNodeProgress').classList.toggle('hidden', !showProgress);
  if (showProgress && Number.isFinite(progress) && Number(status.rpc?.targetHeight) > 0) $('localNodeProgress').value = Math.max(0, Math.min(100, progress));
  else if (showProgress) $('localNodeProgress').removeAttribute('value');
  else $('localNodeProgress').value = 0;
}
async function refreshLocalNodeStatus() {
  const requestToken = ++localNodeStatusRequestToken;
  try {
    const status = await window.josimi.localNodeStatus();
    if (requestToken === localNodeStatusRequestToken) renderLocalNodeStatus(status);
  } catch (_) {
    if (requestToken === localNodeStatusRequestToken) renderLocalNodeStatus({ ...(renderLocalNodeStatus.lastStatus || {}), statusUnavailable: true });
  }
}
window.josimi.onLocalNodeStatus((status) => { localNodeStatusRequestToken += 1; renderLocalNodeStatus(status); });
window.josimi.onWalletSyncStatus((status) => {
  walletSyncStartState = status?.state || 'running';
  if (renderSync.lastStatus) renderSync(renderSync.lastStatus);
});
refreshLocalNodeStatus();
setInterval(refreshLocalNodeStatus, 10000);
function updateNodeModeFields() {
  const local = $('nodeMode').value === 'local';
  $('firstSyncPromise').textContent = local ? LANG[language].firstSyncPromise : LANG[language].nodePrivacyNotice;
  try { localStorage.setItem('josimi.nodeMode', local ? 'local' : 'remote'); } catch (_) {}
  $('remoteNodeLabel').classList.toggle('hidden', local);
  $('remoteNodeNotice').classList.toggle('hidden', local);
  $('localNodeNotice').classList.toggle('hidden', !local);
  $('localNodeChoiceChip').classList.toggle('hidden', !local);
  $('remoteNodeChoiceChip').classList.toggle('hidden', local);
  $('localNodePanel').classList.toggle('hidden', !local);
  $('node').required = !local;
  if (!local) { $('localNodeError').classList.add('hidden'); $('retryLocalNodeBtn').classList.add('hidden'); }
  renderNodeConnectionSummary();
}
$('nodeMode').addEventListener('change', () => {
  localNodeIntent += 1;
  localNodeExplicitlyStopped = $('nodeMode').value !== 'local';
  updateNodeModeFields();
  if ($('nodeMode').value === 'local') {
    localNodeExplicitlyStopped = false;
    void startLocalNodeInBackground();
  } else {
    window.josimi.localNodeStop().then(refreshLocalNodeStatus).catch((error) => {
      showError('localNodeError', error);
      $('retryLocalNodeBtn').classList.remove('hidden');
    });
  }
});
try {
  const savedNodeMode = localStorage.getItem('josimi.nodeMode');
  if (savedNodeMode === 'remote' || savedNodeMode === 'local') $('nodeMode').value = savedNodeMode;
} catch (_) {}
updateNodeModeFields();
async function ensureLocalNodeStarted(intent = localNodeIntent) {
  assertLocalNodeIntent(intent);
  if (!localNodeConfigReady || !localNodeSupported) throw new Error(LANG[language].localNodeUnsupported);
  let status = await window.josimi.localNodeStatus();
  assertLocalNodeIntent(intent);
  if (!status.supported) throw new Error(LANG[language].localNodeUnsupported);
  if (!status.installed) {
    await window.josimi.localNodeInstall();
    assertLocalNodeIntent(intent);
  }
  status = await window.josimi.localNodeStatus();
  assertLocalNodeIntent(intent);
  if (!status.running && !status.restarting) await window.josimi.localNodeStart();
  assertLocalNodeIntent(intent);
  try { return await window.josimi.localNodeWaitReady(); }
  catch (error) {
    assertLocalNodeIntent(intent);
    if (error.message === 'LOCAL_NODE_RPC_TIMEOUT') throw new Error(LANG[language].localNodeRpcWaitFailed);
    if (error.message === 'LOCAL_NODE_EXITED') throw new Error(LANG[language].localNodeRestartFailed);
    throw error;
  }
}
function assertLocalNodeIntent(intent) {
  if (intent !== localNodeIntent || $('nodeMode').value !== 'local') throw new Error('LOCAL_NODE_CANCELLED');
}
function ensureLocalNodeStartedOnce() {
  const intent = localNodeIntent;
  if (!localNodeStartPromise || localNodeStartPromiseIntent !== intent) {
    localNodeStartPromiseIntent = intent;
    localNodeStartPromise = ensureLocalNodeStarted(intent).finally(() => {
      if (localNodeStartPromiseIntent === intent) { localNodeStartPromise = null; localNodeStartPromiseIntent = -1; }
    });
  }
  return localNodeStartPromise;
}
function startLocalNodeInBackground() {
  if ($('nodeMode').value !== 'local' || localNodeExplicitlyStopped || !localNodeConfigReady || !localNodeSupported) return Promise.resolve(null);
  const intent = localNodeIntent;
  return ensureLocalNodeStartedOnce().then(refreshLocalNodeStatus).catch((error) => {
    if (error.message === 'LOCAL_NODE_CANCELLED' || intent !== localNodeIntent || $('nodeMode').value !== 'local') return null;
    showError('localNodeError', error);
    $('retryLocalNodeBtn').classList.remove('hidden');
    return null;
  });
}
function renderSummary(summary) {
  const sessionId = Number(summary?.walletSessionId);
  if (Number.isSafeInteger(sessionId)) {
    if (sessionId < renderedWalletSessionId) return false;
    renderedWalletSessionId = sessionId;
  }
  walletSyncStartState = summary.walletSyncStartState || 'running';
  $('password').value = ''; $('seed').value = ''; $('seedOffset').value = '';
  $('authView').classList.add('hidden'); $('appView').classList.remove('hidden'); $('lockBtn').classList.remove('hidden');
  $('balance').innerHTML = `${escapeHtml(summary.balanceXmr)} <small>XMR</small>`; renderAccountManagement(summary.accounts, summary.addressBook); renderSync(summary.sync); renderTxs(summary.txs);
  if (summary.createdAtHeight !== undefined && summary.createdAtHeight !== null) $('walletHeight').textContent = `${LANG[language].createdAtHeight}: ${Number(summary.createdAtHeight).toLocaleString()}`;
  if (summary.restoreHeightUsed !== undefined && summary.restoreHeightUsed !== null) $('walletHeight').textContent = `${LANG[language].restoreHeight}: ${Number(summary.restoreHeightUsed).toLocaleString()}`;
  return true;
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

document.querySelectorAll('.tab:not(#walletChoiceBtn)').forEach((tab) => tab.addEventListener('click', () => setMode(tab.dataset.tab)));
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
  $('retryLocalNodeBtn').classList.add('hidden');
  const button = $(id);
  button.disabled = true;
  try {
    if (id === 'installLocalNodeBtn') await window.josimi.localNodeInstall();
    else if (id === 'startLocalNodeBtn') {
      localNodeExplicitlyStopped = false;
      localNodeIntent += 1;
      await window.josimi.localNodeStart();
    } else {
      localNodeExplicitlyStopped = true;
      localNodeIntent += 1;
      await window.josimi.localNodeStop();
    }
    await refreshLocalNodeStatus();
  } catch (error) { showError('localNodeError', error); $('retryLocalNodeBtn').classList.remove('hidden'); await refreshLocalNodeStatus(); }
  finally { button.disabled = false; }
});
$('retryLocalNodeBtn').addEventListener('click', async () => {
  clearError('localNodeError');
  $('retryLocalNodeBtn').classList.add('hidden');
  $('retryLocalNodeBtn').disabled = true;
  localNodeExplicitlyStopped = false;
  localNodeIntent += 1;
  try { await ensureLocalNodeStartedOnce(); await refreshLocalNodeStatus(); }
  catch (error) { if (error.message !== 'LOCAL_NODE_CANCELLED') { showError('localNodeError', error); $('retryLocalNodeBtn').classList.remove('hidden'); } }
  finally { $('retryLocalNodeBtn').disabled = false; }
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
async function configureNodeInput() {
  try {
    const config = await window.josimi.config();
    if (typeof config.localNodeUrl === 'string') localNodeUrl = config.localNodeUrl;
    localNodeConfigReady = true;
    localNodeSupported = Boolean(config.localNodeSupported);
    $('nodeMode').querySelector('option[value="local"]').disabled = !localNodeSupported;
    if (!localNodeSupported && $('nodeMode').value === 'local') $('nodeMode').value = 'remote';
    updateNodeModeFields();
    if (localNodeSupported && $('nodeMode').value === 'local') void startLocalNodeInBackground();
  } catch (_) {
    localNodeConfigReady = true;
    localNodeSupported = false;
    $('nodeMode').querySelector('option[value="local"]').disabled = true;
    if ($('nodeMode').value === 'local') $('nodeMode').value = 'remote';
    updateNodeModeFields();
  }
}
configureNodeInput();

 $('languageSelect').addEventListener('change', () => { language = $('languageSelect').value; localStorage.setItem('josimi.language', language); applyLanguage(); updateNodeModeFields(); setMode(mode); if (renderLocalNodeStatus.lastStatus) renderLocalNodeStatus(renderLocalNodeStatus.lastStatus); if (renderSync.lastStatus) renderSync(renderSync.lastStatus); renderAccountManagement(currentAccounts, currentAddressBook); renderTxs(currentTransactions); });
$('walletForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  if (walletFormSubmissionInFlight) return;
  walletFormSubmissionInFlight = true;
  const action = mode;
  let passwordValue = $('password').value;
  let seedValue = $('seed').value.trim();
  let seedOffsetValue = $('seedOffset').value;
  const restoreHeightValue = $('restoreHeight').value.trim();
  const nodeModeValue = $('nodeMode').value;
  const remoteNodeValue = $('node').value.trim();
  let payload = null;
  let restorePayload = null;
  setWalletFormBusy(true);
  clearError('authError');
  $('password').value = ''; $('seed').value = ''; $('seedOffset').value = '';
  try {
    let result;
    if (action === 'open' && !selectedWalletFile && !(await chooseWalletFile('open'))) return;
    if ((action === 'create' || action === 'restore') && !(await chooseWalletFile('save'))) return;
    let nodeValue;
    if (nodeModeValue === 'local') {
      nodeValue = localNodeUrl;
      if (localNodeExplicitlyStopped) throw new Error(LANG[language].localNodeStopped);
      await ensureLocalNodeStartedOnce();
    } else {
      nodeValue = remoteNodeValue;
      if (!nodeValue) throw new Error(LANG[language].nodeAddressRequired);
    }
    if (action === 'restore' && restoreHeightValue && !/^\d+$/.test(restoreHeightValue)) throw new Error(LANG[language].restoreHeightInvalid);
    payload = { password: passwordValue, node: nodeValue, restoreHeight: action === 'restore' && restoreHeightValue ? Number(restoreHeightValue) : undefined, network: 'mainnet' };
    if (action === 'create') result = await window.josimi.create(payload);
    else if (action === 'restore') {
      if (!confirm(LANG[language].restoreConfirm)) return;
      restorePayload = { ...payload, seed: seedValue, seedOffset: seedOffsetValue === '' ? undefined : seedOffsetValue };
      result = await window.josimi.restore(restorePayload);
    } else result = await window.josimi.open(payload);
    renderSummary(result);
    await resumePendingSendDialog();
    if (action === 'create') showToast(LANG[language].seedBackupReminder);
    else if (result.restored) showToast(LANG[language].restoredWallet);
    resetInactivityTimer();
  } catch (error) {
    showError('authError', error);
  } finally {
    if (payload) { payload.password = ''; payload.node = ''; payload.restoreHeight = undefined; }
    if (restorePayload) { restorePayload.password = ''; restorePayload.node = ''; restorePayload.restoreHeight = undefined; restorePayload.seed = ''; restorePayload.seedOffset = ''; }
    passwordValue = ''; seedValue = ''; seedOffsetValue = '';
    $('password').value = ''; $('seed').value = ''; $('seedOffset').value = '';
    setMode(action);
    setWalletFormBusy(false);
    walletFormSubmissionInFlight = false;
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
$('confirmSend').addEventListener('click', async () => { if (!pendingSend || sendCallInProgress) return; clearError('sendDialogError'); const pendingId = pendingSend.pendingId; sendCallInProgress = true; try { $('confirmSend').disabled = true; const result = await window.josimi.send(pendingSend); pendingSend = null; $('confirmDialog').close(); await window.josimi.ackSend({ pendingId }).catch(() => false); showTransferSuccessToast(result.txHashes); await refresh(); } catch (e) { showError('sendDialogError', e); try { await applyPendingSendStatus(await window.josimi.pendingSend()); } catch (_) {} } finally { sendCallInProgress = false; } });
setMode('create');
applyLanguage();
function showTransferSuccessToast(txHashes) {
  const hashes = Array.isArray(txHashes) ? txHashes.join(', ') : '';
  const suffix = hashes ? ` · ${LANG[language].sendTxHash}: ${hashes}` : '';
  showToast(`${LANG[language].sendSuccess}${suffix}`);
}
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
    showTransferSuccessToast(status.txHashes);
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
  try { renderSummary(await window.josimi.refresh()); resetInactivityTimer(); } catch (_) {}
  await resumePendingSendDialog();
}
resumeOpenWalletAndPendingSend();
