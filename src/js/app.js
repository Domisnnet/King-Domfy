let indiceAtual = 0; 
const audio = new Audio(); 
let isPlaying = false;

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
    },
    {
        titulo: "Hino 10 - Pelo-sangue-purificado",
        caminho: "../src/media/Hino 10 - Pelo-sangue-purificado.mp3"
    }
];

const initPlayer = () => {
    // SELETORES
    const btnPlayPause = document.getElementById('btnPlayPause');
    const btnNext = document.getElementById('btnNext'); 
    const btnPrev = document.getElementById('btnPrev'); 
    const svgPlay = document.getElementById('svgPlay');
    const svgPause = document.getElementById('svgPause');
    const progressContainer = document.querySelector('.progress-bar-custom');
    const progressFill = document.querySelector('.progress-fill');
    const displayTitulo = document.querySelector('.song-details h4');
    const displayCapa = document.querySelector('.album-art img');
    const timeCurrent = document.getElementById('currentTime'); 
    const timeTotal = document.getElementById('totalDuration');

    if (!btnPlayPause || !progressContainer) return;

    // --- AUXILIAR: Formatar Segundos em MM:SS ---
    const formatarTempo = (segundos) => {
        const min = Math.floor(segundos / 60);
        const seg = Math.floor(segundos % 60);
        return `${min}:${seg < 10 ? '0' : ''}${seg}`;
    };

    // --- FUNÇÃO PARA CARREGAR A MÚSICA ---
    const carregarMusica = (indice) => {
        const musica = playlist[indice];
        audio.src = musica.caminho;
        displayTitulo.innerText = musica.titulo;
        if (displayCapa) displayCapa.src = musica.capa;
        audio.load();
    };

    // --- NAVEGAÇÃO ---
    const proximaMusica = () => {
        indiceAtual = (indiceAtual + 1) % playlist.length;
        carregarMusica(indiceAtual);
        if (isPlaying) audio.play();
    };

    const musicaAnterior = () => {
        indiceAtual = (indiceAtual - 1 + playlist.length) % playlist.length;
        carregarMusica(indiceAtual);
        if (isPlaying) audio.play();
    };

    // --- EVENT LISTENERS ---
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

    if (btnNext) btnNext.addEventListener('click', proximaMusica);
    if (btnPrev) btnPrev.addEventListener('click', musicaAnterior);

    // --- ATUALIZAÇÃO DE PROGRESSO E TIMERS ---
    audio.addEventListener('timeupdate', () => {
        // Barra de progresso
        const percent = (audio.currentTime / audio.duration) * 100;
        if (progressFill) progressFill.style.width = `${percent}%`;

        // Timers numéricos
        if (timeCurrent) timeCurrent.innerText = formatarTempo(audio.currentTime);
        if (timeTotal && audio.duration) timeTotal.innerText = formatarTempo(audio.duration);
    });

    // Seek (clicar na barra)
    progressContainer.addEventListener('click', (e) => {
        const width = progressContainer.clientWidth;
        const clickX = e.offsetX;
        const duration = audio.duration;
        if (duration) audio.currentTime = (clickX / width) * duration;
    });

    audio.addEventListener('ended', proximaMusica);

    // Init
    carregarMusica(indiceAtual);
};

document.addEventListener('DOMContentLoaded', initPlayer);