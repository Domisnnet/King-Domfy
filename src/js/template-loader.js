document.addEventListener("DOMContentLoaded", function() {
  // Ajusta o caminho base dependendo da profundidade da página
  const base = document.body.dataset.base || '../';

  // Carrega o cabeçalho
  fetch(base + 'templates/header.html')
      .then(response => response.text())
      .then(data => {
          document.getElementById('header-placeholder').innerHTML = data;
      });

  // Carrega o rodapé
  fetch(base + 'templates/footer.html')
      .then(response => response.text())
      .then(data => {
          document.getElementById('footer-placeholder').innerHTML = data;
      });
});