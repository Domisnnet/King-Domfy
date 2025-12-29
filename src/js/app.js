// 1. A sua lista de músicas (O "estoque" de CDs)
const playlist = [
    {
        titulo: "Hino 1 - Hino da Jornada",
        caminho: "../src/media/Hino 1 - Hino da Jornada.mp3"
    },
    {
        titulo: "Hino 2 - A estrada é longa, mas eu sigo",
        caminho: "../src/media/Hino 2 - A estrada é longa, mas eu sigo.mp3"
    },
    {
        titulo: "Hino 3 - Em Tua Vida, Deus",
        caminho: "../src/media/Hino 3 - Em Tua Vida, Deus.mp3"
    },
    {
        titulo: "Hino 4 - Siga adiante, não desanima",
        caminho: "../src/media/Hino 4 - Siga adiante, não desanima.mp3"
    },
    {
        titulo: "Hino 5 - Eu só queria, Senhor!",
        caminho: "../src/media/Hino 5 - Eu só queria, Senhor!.mp3"
    },
    {
        titulo: "Hino 6 - Às vezes eu me sinto assim",
        caminho: "../src/media/Hino 6 - Às vezes eu me sinto assim.mp3"
    },
    {
        titulo: "Hino 7 - Só Tu és, Senhor",
        caminho: "../src/media/Hino 7 - Só Tu és, Senhor.mp3"
    },
    {
        titulo: "Hino 8 - Eu Te busquei, Senhor",
        caminho: "../src/media/Hino 8 - Eu Te busquei, Senhor.mp3"
    },
    {
        titulo: "Hino 9 - Eu Te amo, ó Deus",
        caminho: "../src/media/Hino 9 - Eu Te amo, ó Deus.mp3"
    }
];

let indiceAtual = 0; // Começa na primeira música (0)
const audio = new Audio(); // Criamos o "aparelho" vazio
let isPlaying = false;

const initPlayer = () => {
    const btnPlayPause = document.getElementById('btnPlayPause');
    const svgPlay = document.getElementById('svgPlay');
    const svgPause = document.getElementById('svgPause');
    const progressContainer = document.querySelector('.progress-bar-custom');
    const progressFill = document.querySelector('.progress-fill');
    
    // Seletores para mudar o texto na tela
    const displayTitulo = document.querySelector('.song-details h4');

    if (!btnPlayPause || !progressContainer) return;

    // --- FUNÇÃO PARA CARREGAR A MÚSICA ---
    const carregarMusica = (indice) => {
        const musica = playlist[indice];
        audio.src = musica.caminho; // AQUI trocamos o "CD"
        displayTitulo.innerText = musica.titulo; // Muda o nome na tela
        audio.load(); // Avisa ao navegador para preparar o novo arquivo
    };

    // Inicializa a primeira música
    carregarMusica(indiceAtual);

    // --- PLAY/PAUSE ---
    btnPlayPause.addEventListener('click', () => {
        if (isPlaying) {
            audio.pause();
            svgPlay.style.display = 'block';
            svgPause.style.display = 'none';
        } else {
            audio.play();
            svgPlay.style.display = 'none';
            svgPause.style.display = 'block';
        }
        isPlaying = !isPlaying;
    });

    // --- LÓGICA DE PRÓXIMA / ANTERIOR ---
    // Você pode chamar essas funções nos botões de setinha
    const proximaMusica = () => {
        indiceAtual++;
        if (indiceAtual >= playlist.length) indiceAtual = 0; // Volta pro início
        carregarMusica(indiceAtual);
        if (isPlaying) audio.play();
    };

    const musicaAnterior = () => {
        indiceAtual--;
        if (indiceAtual < 0) indiceAtual = playlist.length - 1; // Vai pra última
        carregarMusica(indiceAtual);
        if (isPlaying) audio.play();
    };

    // --- PROGRESSO E SEEK (Seu código original que já funciona) ---
    audio.addEventListener('timeupdate', () => {
        const percent = (audio.currentTime / audio.duration) * 100;
        if (progressFill) progressFill.style.width = `${percent}%`;
    });

    progressContainer.addEventListener('click', (e) => {
        const width = progressContainer.clientWidth;
        const clickX = e.offsetX;
        const duration = audio.duration;
        if (duration) audio.currentTime = (clickX / width) * duration;
    });

    // Quando a música acabar, pula para a próxima automaticamente
    audio.addEventListener('ended', proximaMusica);
};

document.addEventListener('DOMContentLoaded', initPlayer);