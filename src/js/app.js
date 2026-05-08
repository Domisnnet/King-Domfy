import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@/vendor/fontawesome/css/all.min.css';
import '@/css/estilos-globais.css';

import hino1 from '@/assets/media/hino1.mp3';
import hino2 from '@/assets/media/hino2.mp3';
import hino3 from '@/assets/media/hino3.mp3';
import hino4 from '@/assets/media/hino4.mp3';
import hino5 from '@/assets/media/hino5.mp3';
import hino6 from '@/assets/media/hino6.mp3';
import hino7 from '@/assets/media/hino7.mp3';
import hino8 from '@/assets/media/hino8.mp3';
import hino9 from '@/assets/media/hino9.mp3';
import hino10 from '@/assets/media/hino10.mp3';
import capaAlbum from '@/assets/imagens/melodias-da-alma.jpeg';
import img1 from '@/assets/imagens/img1.jpeg';
import img2 from '@/assets/imagens/img2.jpeg';
import img3 from '@/assets/imagens/img3.jpeg';
import img4 from '@/assets/imagens/img4.jpeg';
import img5 from '@/assets/imagens/img5.jpeg';
import img6 from '@/assets/imagens/img6.jpeg';
import img7 from '@/assets/imagens/img7.jpeg';
import img8 from '@/assets/imagens/img8.jpeg';
import img9 from '@/assets/imagens/img9.jpeg';
import img10 from '@/assets/imagens/img10.jpeg';

let indiceAtual = 1;
const audio = new Audio();
let isPlaying = false;
let isShuffle = false;
let isRepeat = false;

const playlist = [
  { titulo: 'Capa do Álbum', caminho: hino1, capa: capaAlbum },
  { titulo: 'Hino 1 - Hino da Jornada', caminho: hino1, capa: img1 },
  { titulo: 'Hino 2 - A estrada é longa, mas eu sigo', caminho: hino2, capa: img2 },
  { titulo: 'Hino 3 - Em Tua Vida, Deus', caminho: hino3, capa: img3 },
  { titulo: 'Hino 4 - Siga adiante, não desanima', caminho: hino4, capa: img4 },
  { titulo: 'Hino 5 - Eu só queria, Senhor!', caminho: hino5, capa: img5 },
  { titulo: 'Hino 6 - Às vezes eu me sinto assim', caminho: hino6, capa: img6 },
  { titulo: 'Hino 7 - O Sangue de Cristo Conhecido', caminho: hino7, capa: img7 },
  { titulo: 'Hino 8 - O Amor aqui, esfriando está', caminho: hino8, capa: img8 },
  { titulo: 'Hino 9 - Hoje é tão Difícil', caminho: hino9, capa: img9 },
  { titulo: 'Hino 10 - Pelo Sangue purificado', caminho: hino10, capa: img10 },
];

const initPlayer = () => {
  const btnPlayPause = document.getElementById('btnPlayPause');
  if (!btnPlayPause) return;
  const btnNext = document.getElementById('btnNext');
  const btnPrev = document.getElementById('btnPrev');
  const btnShuffle = document.getElementById('btnShuffle');
  const btnRepeat = document.getElementById('btnRepeat');
  const svgPlay = document.getElementById('svgPlay');
  const svgPause = document.getElementById('svgPause');
  const progressContainer = document.querySelector('.progress-bar-custom');
  const progressFill = document.querySelector('.progress-fill');
  const displayTitulo = document.querySelector('.song-details h4');
  const displayCapa = document.querySelector('.album-art img');
  const timeCurrent = document.getElementById('currentTime');
  const timeTotal = document.getElementById('totalDuration');
  const volumeSlider = document.getElementById('volumeSlider');
  const volumeIcon = document.getElementById('volumeIcon');
  const formatarTempo = (segundos) => {
    const min = Math.floor(segundos / 60);
    const seg = Math.floor(segundos % 60);
    return `${min}:${seg < 10 ? '0' : ''}${seg}`;
  };

  const carregarMusica = (indice) => {
    const musica = playlist[indice];
    audio.src = musica.caminho;
    displayTitulo.innerText = musica.titulo;
    if (displayCapa) { displayCapa.src = musica.capa; }
    audio.load();
  };

  const proximaMusica = () => {
    if (isRepeat) {
      audio.currentTime = 0;
    } else if (isShuffle) {
      let novoIndice;
      do {
        novoIndice = Math.floor(Math.random() * (playlist.length - 1)) + 1;
      } while (novoIndice === indiceAtual && playlist.length > 2);
      indiceAtual = novoIndice;
    } else {
      indiceAtual++;
      if (indiceAtual >= playlist.length) { indiceAtual = 1; }
    }
    carregarMusica(indiceAtual);
    if (isPlaying) { audio.play(); }
  };

  const musicaAnterior = () => {
    indiceAtual--;
    if (indiceAtual < 1) { indiceAtual = playlist.length - 1; }
    carregarMusica(indiceAtual);
    if (isPlaying) { audio.play(); }
  };

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

  btnShuffle.addEventListener('click', () => {
    isShuffle = !isShuffle;
    btnShuffle.classList.toggle('active-control', isShuffle);
  });

  btnRepeat.addEventListener('click', () => {
    isRepeat = !isRepeat;
    btnRepeat.classList.toggle('active-control', isRepeat);
  });
  btnNext.addEventListener('click', proximaMusica);
  btnPrev.addEventListener('click', musicaAnterior);
  audio.addEventListener('timeupdate', () => {
    const percent = (audio.currentTime / audio.duration) * 100;
    if (progressFill) { progressFill.style.width = `${percent}%`; }
    if (timeCurrent) { timeCurrent.innerText = formatarTempo(audio.currentTime); }
    if (timeTotal && !isNaN(audio.duration)) { timeTotal.innerText = formatarTempo(audio.duration); }
  });

  if (progressContainer) {
    progressContainer.addEventListener('click', (e) => {
      const width = progressContainer.clientWidth;
      const clickX = e.offsetX;
      if (audio.duration) { audio.currentTime = (clickX / width) * audio.duration; }
    });
  }

  audio.addEventListener('ended', proximaMusica);
  if (volumeSlider) {
    volumeSlider.addEventListener('input', () => {
      audio.volume = volumeSlider.value;
      if (audio.volume === 0) {
        volumeIcon.className = 'fas fa-volume-mute';
      } else if (audio.volume < 0.5) {
        volumeIcon.className = 'fas fa-volume-down';
      } else {
        volumeIcon.className = 'fas fa-volume-up';
      }
    });
  }

  if (volumeIcon) {
    volumeIcon.addEventListener('click', () => {
      audio.muted = !audio.muted;
      if (audio.muted) {
        volumeIcon.className = 'fas fa-volume-mute';
        volumeSlider.value = 0;
      } else {
        volumeIcon.className = 'fas fa-volume-up';
        volumeSlider.value = audio.volume;
      }
    });
  }
  carregarMusica(indiceAtual);
  if (volumeSlider) { audio.volume = volumeSlider.value; }
};

document.addEventListener('DOMContentLoaded', initPlayer);