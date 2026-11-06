'use strict';

const REPOSITORY = 'jokeo132-a11y/josimi';
const RELEASES_PAGE = `https://github.com/${REPOSITORY}/releases/latest`;
const RELEASE_API = `https://api.github.com/repos/${REPOSITORY}/releases/latest`;
const byId = (id) => document.getElementById(id);

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }).format(date);
}

function formatSize(bytes) {
  const size = Number(bytes);
  if (!Number.isFinite(size) || size <= 0) return null;
  return `약 ${(size / (1024 * 1024)).toFixed(1)} MiB`;
}

function setReleasePageFallback() {
  const label = 'GitHub에서 최신 릴리스 열기';
  for (const id of ['hero-download', 'download-button', 'release-link']) {
    const link = byId(id);
    if (!link) continue;
    link.href = RELEASES_PAGE;
    link.rel = 'noopener noreferrer';
  }
  byId('hero-download-label').textContent = 'GitHub 릴리스에서 ZIP 찾기';
  byId('download-button-label').textContent = label;
  byId('release-state').textContent = '자동 버전 확인을 할 수 없어요. GitHub에서 현재 버전을 직접 확인할 수 있습니다.';
  byId('download-status').textContent = '이 페이지의 표시 버전은 마지막으로 게시된 스냅샷일 수 있습니다. 릴리스 페이지에서 날짜와 Windows x64 ZIP을 확인하세요.';
}

function updateRelease(release) {
  const tag = String(release.tag_name || '').trim();
  const zip = (release.assets || []).find((asset) => /-x64\.zip$/i.test(asset.name || ''));
  if (!/^v?\d+\.\d+\.\d+(?:[-+][\w.-]+)?$/.test(tag) || !zip?.browser_download_url) {
    throw new Error('No published Windows x64 ZIP was found in the latest release.');
  }
  const version = tag.startsWith('v') ? tag : `v${tag}`;
  const publishedAt = release.published_at || release.created_at;
  const publishedDate = publishedAt ? new Date(publishedAt) : null;
  const publishedDateIso = publishedDate && !Number.isNaN(publishedDate.getTime()) ? publishedDate.toISOString().slice(0, 10) : null;
  const dateText = formatDate(publishedAt);
  const sizeText = formatSize(zip.size);

  byId('release-version').textContent = version;
  byId('download-version').textContent = version;
  byId('release-date').textContent = dateText || '공개일 확인 불가';
  byId('download-date').textContent = dateText || '확인 불가';
  if (publishedDateIso) {
    byId('release-date').dateTime = publishedDateIso;
    byId('download-date').dateTime = publishedDateIso;
  }
  if (sizeText) byId('download-size').textContent = sizeText;

  for (const id of ['hero-download', 'download-button']) {
    const link = byId(id);
    link.href = zip.browser_download_url;
    link.rel = 'noopener noreferrer';
  }
  byId('hero-download-label').textContent = 'Windows ZIP 받기';
  byId('download-button-label').textContent = 'Windows ZIP 다운로드';
  byId('release-link').href = release.html_url || RELEASES_PAGE;
  byId('release-link').rel = 'noopener noreferrer';
  const checksum = (release.assets || []).find((asset) => /^SHA256SUMS\.txt$/i.test(asset.name || ''));
  if (checksum?.browser_download_url) byId('checksum-link').href = checksum.browser_download_url;
  byId('release-state').textContent = 'GitHub의 최신 공개 릴리스 정보를 표시하고 있습니다. 릴리스 날짜와 파일은 GitHub에서 확인할 수 있습니다.';
  byId('download-status').textContent = `GitHub 릴리스 ${version}의 Windows x64 ZIP을 찾았습니다. 체크섬은 파일 안전성 인증이 아닙니다.`;
  const versionMeta = document.querySelector('script[type="application/ld+json"]');
  if (versionMeta) {
    try {
      const data = JSON.parse(versionMeta.textContent);
      data.softwareVersion = version.replace(/^v/, '');
      versionMeta.textContent = JSON.stringify(data);
    } catch (_) { /* Keep static structured data if parsing fails. */ }
  }
  const downloadUrlMeta = document.querySelector('meta[name="description"]');
  if (downloadUrlMeta) downloadUrlMeta.dataset.releaseVersion = version;
}

async function loadLatestRelease() {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 7000);
  try {
    const response = await fetch(RELEASE_API, {
      headers: { Accept: 'application/vnd.github+json' },
      cache: 'no-store',
      signal: controller.signal
    });
    if (!response.ok) throw new Error(`GitHub returned ${response.status}`);
    updateRelease(await response.json());
  } catch (_) {
    setReleasePageFallback();
  } finally {
    window.clearTimeout(timer);
  }
}

function initializeNavigation() {
  const toggle = byId('menu-toggle');
  const nav = byId('site-nav');
  if (!toggle || !nav) return;
  const close = () => {
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', '메뉴 열기');
    nav.classList.remove('is-open');
  };
  toggle.addEventListener('click', () => {
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!expanded));
    toggle.setAttribute('aria-label', expanded ? '메뉴 열기' : '메뉴 닫기');
    nav.classList.toggle('is-open', !expanded);
  });
  nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', close));
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') close(); });
  window.addEventListener('resize', () => { if (window.innerWidth > 700) close(); });
}

initializeNavigation();
loadLatestRelease();
