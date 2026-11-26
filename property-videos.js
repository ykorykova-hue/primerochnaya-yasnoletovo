const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
const propertyVideos = Array.from(document.querySelectorAll('.property-card-video'), (card) => ({
  video: card.querySelector('.property-background'),
  button: card.querySelector('.property-video-toggle'),
  overview: card.querySelector('.property-overview'),
  manuallyPaused: false,
  manuallyStarted: false,
  visible: 0
}));
let activePropertyVideo;

function playPropertyVideo(item) {
  if (!item.video.hasAttribute('src')) item.video.src = item.video.dataset.src;
  item.video.play().catch(() => {
    item.button.textContent = 'Воспроизвести видео';
  });
}

function syncPropertyVideos() {
  const candidates = propertyVideos
    .filter((item) => item.visible >= .25 && !item.manuallyPaused &&
      (!motionPreference.matches || item.manuallyStarted))
    .sort((a, b) => b.visible - a.visible);
  const next = document.hidden ? undefined : candidates[0];

  if (activePropertyVideo !== next) {
    activePropertyVideo?.video.pause();
    activePropertyVideo = next;
    if (next) playPropertyVideo(next);
  }
}

for (const item of propertyVideos) {
  const updateButton = () => {
    item.button.textContent = item.video.paused ? 'Воспроизвести видео' : 'Пауза видео';
  };
  item.button.hidden = false;
  item.video.addEventListener('play', updateButton);
  item.video.addEventListener('pause', updateButton);
  item.button.addEventListener('click', () => {
    if (!item.video.paused) {
      item.manuallyPaused = true;
      item.video.pause();
      if (activePropertyVideo === item) activePropertyVideo = undefined;
      return;
    }
    item.manuallyPaused = false;
    item.manuallyStarted = true;
    if (activePropertyVideo !== item) activePropertyVideo?.video.pause();
    activePropertyVideo = item;
    playPropertyVideo(item);
  });
}

if ('IntersectionObserver' in window) {
  const byOverview = new Map(propertyVideos.map((item) => [item.overview, item]));
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      byOverview.get(entry.target).visible = entry.intersectionRatio;
    }
    syncPropertyVideos();
  }, { threshold: [0, .25, .4, .55, .7, .85, 1] });
  for (const item of propertyVideos) observer.observe(item.overview);
  document.addEventListener('visibilitychange', syncPropertyVideos);
  motionPreference.addEventListener('change', syncPropertyVideos);
}
