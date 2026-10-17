
## XMRig dual-process mining reference

- Official XMRig Windows x64 download: https://xmrig.com/download
- Official listed release: xmrig-6.26.0-windows-x64.zip
- Official SHA-256 listed on the download page: bba8097cb37d9b458a1cb1137876b27cde6740d17fe4ccbc086ba07d87d9e147
- Official Monero solo guide: https://docs.getmonero.org/interacting/mining/guides/solo/xmrig-solo/
- The guide uses XMRig daemon mode against a local node with `--daemon -o 127.0.0.1:18081 -u XMR_WALLET_ADDRESS`; the wallet address must be the primary address.
- Monero daemon RPC reference: https://docs.getmonero.org/rpc-library/monerod-rpc/
- Standard monerod `start_mining` accepts one miner address; splitting expected mining share requires separate mining processes or time rotation.
