const loadTemplate = async (id, file) => {
  const element = document.getElementById(id);
  if (!element) return;
  const base = document.body.dataset.base || './';
  try {
    const response = await fetch(`${base}src/templates/${file}`);
    if (!response.ok) {
      throw new Error(`Erro ao carregar ${file}`);
    }

    let html = await response.text();
    html = html.replaceAll('{{BASE}}', base);
    element.innerHTML = html;
  } catch (error) {
    console.error(error);
  }

};

document.addEventListener('DOMContentLoaded', async () => {
  await loadTemplate('header-placeholder', 'header.html');
  await loadTemplate('footer-placeholder', 'footer.html');
});