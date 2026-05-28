const loadTemplate = async (selector, file) => {
  const element = document.getElementById(selector);
  if (!element) return;
  const base =
    document.body.getAttribute('data-base') || './';
  try {
    const response = await fetch(
      `${base}src/templates/${file}`
    );
    if (!response.ok) {
      throw new Error(
        `Erro ao carregar ${file}: ${response.status}`
      );
    }
    let html = await response.text();
    html = html.replace(/\{\{BASE\}\}/g, base);
    element.innerHTML = html;
  } catch (error) {
    console.error(error);
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