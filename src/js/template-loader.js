const loadTemplate = async (id, file) => {
  const element = document.getElementById(id);
  if (!element) return;
  const isRootPage =
    window.location.pathname.endsWith('index.html') ||
    window.location.pathname === '/' ||
    window.location.pathname.endsWith('/');
  const basePath = isRootPage ? './' : '../';

  try {
    const response = await fetch(
      `${basePath}src/templates/${file}`
    );

    if (!response.ok) {
      throw new Error(`Erro ao carregar ${file}`);
    }

    let html = await response.text();
    html = html.replaceAll('{{BASE}}', basePath);
    element.innerHTML = html;
  } catch (error) {
    console.error(
      `Erro ao carregar template: ${file}`,
      error
    );
  }
};

document.addEventListener('DOMContentLoaded', async () => {
  await loadTemplate(
    'header-placeholder',
    'header.html'
  );

  await loadTemplate(
    'footer-placeholder',
    'footer.html'
  );
});