export function setParticle() {
  const particlesContainers = document.querySelectorAll(
    '[data-tag="particles-js-for"]',
  );

  const theme =
    document.documentElement.className === 'dark' ? 'dark' : 'light';
  particlesContainers.forEach((container) => {
    (window as any).particlesJS.load(
      container.id,
      theme === 'dark' ? '/particles-dark.json' : '/particles-light.json',
      function () {},
    );
    (window as any).particlesJS.load(
      container.id,
      theme === 'dark' ? '/particles-dark.json' : '/particles-light.json',
      function () {},
    );
  });
}

export function removeParticle() {
  (window as any)?.pJSDom?.forEach((item: any) => {
    item?.pJS?.fn.particlesEmpty();
    item?.pJS?.fn.canvasClear();
  });
  (window as any)?.pJSDom && ((window as any).pJSDom.length = 0);
}
