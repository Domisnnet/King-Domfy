const audio = new Audio();
let indiceAtual = 0;
let isShuffle = false;
let isRepeat = false;
const playlist = [
  {
    titulo: 'Hino 1 - Hino da Jornada',
    caminho: '../src/assets/media/hino1.mp3',
    capa: '../src/assets/imagens/img1.jpeg'
  },
  {
    titulo: 'Hino 2 - A estrada é longa, mas eu sigo',
    caminho: '../src/assets/media/hino2.mp3',
    capa: '../src/assets/imagens/img2.jpeg'
  },
  {
    titulo: 'Hino 3 - Em Tua Vida, Deus',
    caminho: '../src/assets/media/hino3.mp3',
    capa: '../src/assets/imagens/img3.jpeg'
  },
  {
    titulo: 'Hino 4 - Siga adiante, não desanima',
    caminho: '../src/assets/media/hino4.mp3',
    capa: '../src/assets/imagens/img4.jpeg'
  },
  {
    titulo: 'Hino 5 - Eu só queria, Senhor!',
    caminho: '../src/assets/media/hino5.mp3',
    capa: '../src/assets/imagens/img5.jpeg'
  },
  {
    titulo: 'Hino 6 - Às vezes eu me sinto assim',
    caminho: '../src/assets/media/hino6.mp3',
    capa: '../src/assets/imagens/img6.jpeg'
  },
  {
    titulo: 'Hino 7 - O Sangue de Cristo Conhecido',
    caminho: '../src/assets/media/hino7.mp3',
    capa: '../src/assets/imagens/img7.jpeg'
  },
  {
    titulo: 'Hino 8 - O Amor aqui, esfriando está',
    caminho: '../src/assets/media/hino8.mp3',
    capa: '../src/assets/imagens/img8.jpeg'
  },
  {
    titulo: 'Hino 9 - Hoje é tão Difícil',
    caminho: '../src/assets/media/hino9.mp3',
    capa: '../src/assets/imagens/img9.jpeg'
  },
  {
    titulo: 'Hino 10 - Pelo Sangue purificado',
    caminho: '../src/assets/media/hino10.mp3',
    capa: '../src/assets/imagens/img10.jpeg'
  }
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
    if (!Number.isFinite(segundos)) { return '0:00'; }
    const min = Math.floor(segundos / 60);
    const seg = Math.floor(segundos % 60);
    return `${min}:${seg < 10 ? '0' : ''}${seg}`;
  };
  const atualizarUIPlayPause = () => {
    const pausado = audio.paused;
    if (svgPlay) { svgPlay.style.display = pausado ? 'block' : 'none'; }
    if (svgPause) { svgPause.style.display = pausado ? 'none' : 'block'; }
  };
  const atualizarIconeVolume = () => {
    if (!volumeIcon) return;
    if (audio.muted || audio.volume === 0) { volumeIcon.className = 'fas fa-volume-mute'; return; }
    if (audio.volume < 0.5) { volumeIcon.className = 'fas fa-volume-down'; return; }
    volumeIcon.className = 'fas fa-volume-up';
  };
  const carregarMusica = (indice) => {
    const musica = playlist[indice];
    if (!musica) return;
    audio.pause();
    audio.currentTime = 0;
    audio.src = musica.caminho;
    audio.load();
    if (displayTitulo) { displayTitulo.innerText = musica.titulo; }
    if (displayCapa) {
      displayCapa.src = musica.capa;
      displayCapa.alt = musica.titulo;
    }
    atualizarUIPlayPause();
  };
  const tocarMusica = async () => {
    try {
      await audio.play();
      atualizarUIPlayPause();
    } catch (erro) {
      console.error( 'Erro ao reproduzir áudio:', erro );
    }
  };
  const pausarMusica = () => { audio.pause(); atualizarUIPlayPause(); };
  const togglePlay = () => { if (audio.paused) { tocarMusica(); return; } pausarMusica(); };
  const proximaMusica = () => {
    if (isRepeat) { audio.currentTime = 0; tocarMusica(); return; }
    if (isShuffle) {
      let novoIndice;
      do {
        novoIndice = Math.floor( Math.random() * playlist.length );
      } while ( novoIndice === indiceAtual && playlist.length > 1 );
      indiceAtual = novoIndice;
    } else {
      indiceAtual++;
      if (indiceAtual >= playlist.length) { indiceAtual = 0; }
    }
    carregarMusica(indiceAtual);
    tocarMusica();
  };

  const musicaAnterior = () => {
    indiceAtual--;
    if (indiceAtual < 0) { indiceAtual = playlist.length - 1; }
    carregarMusica(indiceAtual);
    tocarMusica();
  };

  btnPlayPause.addEventListener( 'click', togglePlay );
  if (btnNext) { btnNext.addEventListener( 'click', proximaMusica ); }
  if (btnPrev) { btnPrev.addEventListener( 'click', musicaAnterior ); }
  if (btnShuffle) {
    btnShuffle.addEventListener('click', () => {
      isShuffle = !isShuffle;
      btnShuffle.classList.toggle( 'active-control', isShuffle );
    });
  }

  if (btnRepeat) {
    btnRepeat.addEventListener('click', () => {
      isRepeat = !isRepeat;
      btnRepeat.classList.toggle( 'active-control', isRepeat );
    });
  }

  audio.addEventListener( 'play', atualizarUIPlayPause );
  audio.addEventListener( 'pause', atualizarUIPlayPause );
  audio.addEventListener( 'ended', proximaMusica );
  audio.addEventListener( 'loadedmetadata', () => { if (timeTotal) { timeTotal.innerText = formatarTempo( audio.duration ); } } );
  audio.addEventListener(
    'timeupdate',
    () => {
      if ( !Number.isFinite(audio.duration) || audio.duration <= 0 ) { return; }
      const percent =
        (audio.currentTime / audio.duration) * 100;
      if (progressFill) {
        progressFill.style.width = `${percent}%`;
      }
      if (timeCurrent) {
        timeCurrent.innerText = formatarTempo( audio.currentTime );
      }
    }
  );

  if (progressContainer) {
    progressContainer.addEventListener(
      'click',
      (event) => {
        if (!audio.duration) return;
        const width = progressContainer.clientWidth;
        const clickPosition = event.offsetX;
        audio.currentTime = (clickPosition / width) * audio.duration; }
    );
  }

  if (volumeSlider) {
    audio.volume = Number( volumeSlider.value || 1 );
    atualizarIconeVolume();
    volumeSlider.addEventListener(
      'input',
      () => {
        audio.volume = Number( volumeSlider.value );
        audio.muted = false;
        atualizarIconeVolume();
      }
    );
  }

  if (volumeIcon) {
    volumeIcon.addEventListener(
      'click',
      () => {
        audio.muted = !audio.muted;
        atualizarIconeVolume();
      }
    );
  }
  carregarMusica(indiceAtual);
};
document.addEventListener( 'DOMContentLoaded', initPlayer );