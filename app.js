// Usuarios disponibles
const users = ['Juanpi', 'Santiago', 'Allison'];
let currentUser = 'Juanpi';
const userData = {
  Juanpi: { personCount: 0, timers: [] },
  Santiago: { personCount: 0, timers: [] },
  Allison: { personCount: 0, timers: [] }
};

const peopleList = document.getElementById('peopleList');
const addPersonBtn = document.getElementById('addPersonBtn');

// Botones de usuario
users.forEach(user => {
  const btn = document.getElementById('btn' + user);
  btn.addEventListener('click', () => switchUser(user));
});

function switchUser(user) {
  currentUser = user;
  // Cambiar clase activa
  users.forEach(u => {
    const btn = document.getElementById('btn' + u);
    if (u === user) btn.classList.add('active');
    else btn.classList.remove('active');
  });
  renderPeopleList();
}

function renderPeopleList() {
  peopleList.innerHTML = '';
  userData[currentUser].timers.forEach(timer => {
    timer.render(peopleList);
  });
}

class PersonTimer {
  constructor(id) {
    this.id = id;
    this.time = 0;
    this.interval = null;
    this.startTimestamp = null;
    this.createElements();
  }

  async finish() {
    this.pause();
    // Mostrar indicador de envío
    this.finishBtn.textContent = 'Enviando...';
    this.finishBtn.disabled = true;

    try {
      const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz5UEPoEBpewVhHHRJ8dz9du5nD7LECl3Pd3Tti1xefARPWieA7wzSomVEaX8GgSK_fcg/exec';

      const formData = new FormData();
      formData.append('action', 'addData');
      formData.append('sheet', currentUser);
      formData.append('persona', `Persona ${this.id}`);
      formData.append('tiempo', this.formatTimeSeconds(this.time));
      formData.append('timestamp', new Date().toLocaleString());

      const response = await fetch(SCRIPT_URL, {
        method: 'POST',
        body: formData
      });

      const result = await response.text();
      if (!(result.includes('Success') || result.includes('success'))) {
        throw new Error('Respuesta inesperada del servidor: ' + result);
      }
    } catch (error) {
      //alert('❌ Error al enviar los datos a Google Sheets. Verifica la configuración del script.');
      this.finishBtn.textContent = 'Finalizar';
      this.finishBtn.disabled = false;
      return;
    }

    // Eliminar el timer
    this.container.remove();
    // Remover del array de timers
    const data = userData[currentUser];
    const idx = data.timers.indexOf(this);
    if (idx !== -1) {
      data.timers.splice(idx, 1);
    }
    renderPeopleList();
  }

  createElements() {
    this.container = document.createElement('div');
    this.container.className = 'person-timer';

    this.title = document.createElement('span');
    this.title.textContent = `Persona ${this.id}`;
    this.title.className = 'person-title';
    this.title.style.marginRight = '16px';

    this.timerDisplay = document.createElement('span');
    this.timerDisplay.textContent = this.formatTime(this.time);
    this.timerDisplay.className = 'timer-display';
    this.timerDisplay.style.marginRight = '16px';

    this.startBtn = document.createElement('button');
    this.startBtn.textContent = 'Iniciar';
    this.startBtn.onclick = () => this.start();

    this.pauseBtn = document.createElement('button');
    this.pauseBtn.textContent = 'Pausar';
    this.pauseBtn.onclick = () => this.pause();
    this.pauseBtn.disabled = true;

    this.resetBtn = document.createElement('button');
    this.resetBtn.textContent = 'Reiniciar';
    this.resetBtn.onclick = () => this.reset();

    this.finishBtn = document.createElement('button');
    this.finishBtn.textContent = 'Finalizar';
    this.finishBtn.onclick = () => this.finish();

    this.container.appendChild(this.title);
    this.container.appendChild(this.timerDisplay);
    this.container.appendChild(this.startBtn);
    this.container.appendChild(this.pauseBtn);
    this.container.appendChild(this.resetBtn);
    this.container.appendChild(this.finishBtn);
  }

  formatTime(seconds) {
    const min = String(Math.floor(seconds / 60)).padStart(2, '0');
    const sec = String(seconds % 60).padStart(2, '0');
    return `${min}:${sec}`;
  }

  formatTimeSeconds(seconds) {
    let value = Number(seconds).toFixed(3);
    value = value.replace('.', ',');
    value = value.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `${value} segundos`;
  }


  start() {
    if (this.interval) return;
    // Si estaba pausado, continuar desde el tiempo guardado
    this.startTimestamp = Date.now() - (this.time * 1000);
    this.interval = setInterval(() => {
      // Calcular segundos con decimales solo mientras está corriendo
      const now = Date.now();
      this.time = (now - this.startTimestamp) / 1000;
      this.timerDisplay.textContent = this.formatTimeSeconds(this.time);
    }, 50);
    this.startBtn.disabled = true;
    this.pauseBtn.disabled = false;
    this.isPaused = false;
  }

  pause() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      // Ajustar this.time a los segundos exactos al pausar
      if (this.startTimestamp) {
        this.time = (Date.now() - this.startTimestamp) / 1000;
      }
    }
    this.startBtn.disabled = false;
    this.pauseBtn.disabled = true;
    this.isPaused = true;
    // Mostrar el tiempo fijo al pausar
    this.timerDisplay.textContent = this.formatTimeSeconds(this.time);
  }

  reset() {
    this.pause();
    this.time = 0;
    this.timerDisplay.textContent = this.formatTimeSeconds(this.time);
  }

  render(parent) {
    parent.appendChild(this.container);
  }
}

addPersonBtn.addEventListener('click', () => {
  const data = userData[currentUser];
  data.personCount++;
  const person = new PersonTimer(data.personCount);
  data.timers.push(person);
  renderPeopleList();
});

// Inicializar usuario activo
switchUser(currentUser);