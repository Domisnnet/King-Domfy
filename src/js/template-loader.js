const getBasePath = () => {
  const bodyBase = document.body.dataset.base;
  return bodyBase || './';
};

const loadTemplate = async (
  templateName,
  targetId
) => {

  const target = document.getElementById(targetId);

  if (!target) return;

  const base = getBasePath();

  const templatePath =
    `${base}src/templates/${templateName}`;

  try {

    const response = await fetch(templatePath);

    if (!response.ok) {
      throw new Error(
        `Erro ao carregar ${templateName}`
      );
    }

    let html = await response.text();

    html = html.replace(
      /\{\{BASE\}\}/g,
      base
    );

    target.innerHTML = html;

  } catch (error) {

    console.error(
      `Erro ao carregar template: ${templateName}`,
      error
    );

  }

};

document.addEventListener(
  'DOMContentLoaded',
  async () => {

    await loadTemplate(
      'header.html',
      'header-placeholder'
    );

    await loadTemplate(
      'footer.html',
      'footer-placeholder'
    );

  }
);