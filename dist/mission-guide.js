import {dialogueFor} from './mission-dialogues.js?v=20261112ficha';
import {missionFacts} from './mission-facts.js?v=20261123v10';
import {createNeptunitoAnimator} from './neptunito-anim/src/neptunito-animator.js';

const get = id => document.getElementById(id);
const descriptionLabel = 'Descripción general';
const historyLabel = 'Historia de la misión';
const transitionMs = 160;
const gestureMs = 4200;
const motion = matchMedia('(prefers-reduced-motion: reduce)');
const missionPrompts = {
  orbiter: ['¡Mira esos objetivos!', 'Abre la cámara en Componentes y sigue el camino de la película.'],
  surveyor: ['¡Vamos a visitar una sonda que recibió visitas!', 'Busca la pala en Componentes. ¿Cómo tomarías una muestra del suelo lunar?'],
  eagle: ['¡Ajusta el cinturón, que vamos a alunizar con Eagle!', 'Abre la etapa de descenso y busca el motor que usaron para alunizar.'],
  lrv15: ['¡El primer paseo en auto por la Luna!', 'Entra a Movilidad y mira de cerca las ruedas de malla.'],
  lrv16: ['¡Súbete! Hoy manejamos por las tierras altas de la Luna.', 'Busca el mando de conducción. ¿Podrías usarlo con guantes espaciales?'],
  lrv17: ['¡Nos espera el último paseo lunar del programa Apollo!', 'Busca el guardabarros trasero derecho. Ahí hay una reparación que vale la pena ver.'],
  mariner: ['¡Demos una vuelta alrededor de Marte!', 'Abre el sistema de imagen. ¿Hacia dónde apuntarías la cámara desde órbita?'],
  viking1: ['¡Bienvenido a Chryse Planitia!', 'Busca el brazo de muestreo y sigue el recorrido del suelo hasta el laboratorio.'],
  viking2: ['¡Acompáñame a la segunda parada de Viking!', 'Abre la cámara. ¿Qué buscarías para comparar este paisaje con el de Viking 1?'],
  sojourner: ['¡Este explorador era pequeño y tenía seis ruedas!', 'Busca el instrumento APXS. ¿Cómo lo acercarías a una roca?'],
  ds2: ['¡Conoce dos sondas que iban a explorar bajo el suelo de Marte!', 'Abre el cuerpo posterior y el penetrador. Encuentra el cable que unía ambas mitades.'],
  spirit: ['¡Busca una roca que te dé curiosidad!', 'Empieza por Pancam y luego abre el brazo. ¿Qué roca estudiarías primero?'],
  opportunity: ['¡Vamos a buscar pistas de agua antigua en Marte!', 'Abre el sistema de movilidad y sigue la suspensión hasta las ruedas.'],
  phoenix: ['¡Abrígate, que vamos al norte de Marte!', 'Empieza por la pala del brazo y sigue la muestra hasta TEGA.'],
  insight: ['¡Acércate y escucha!', 'Abre SEIS en Componentes. ¿Qué piezas protegían al sismómetro?']
};

function node(tag, text) {
  const element = document.createElement(tag);
  element.textContent = text;
  return element;
}

function paragraphs(text) {
  return text.split('\n\n').map(paragraph => node('p', paragraph));
}

function historyFacts(mission) {
  return [
    ['Destino', mission.world],
    ['Llegada', mission.arrival],
    ['Estado', mission.status],
    ['Región', mission.region]
  ];
}

export function createMissionGuide() {
  const character = get('mission-neptunito');
  const heading = get('phase-heading');
  const output = get('nomad-text-output');
  const content = get('mission-guide-content');
  const greeting = get('mission-guide-greeting');
  const archaeologyMessage = get('archaeology-guide-message');
  const switchView = get('mission-guide-switch');
  const modeLabel = get('mission-guide-label');
  const pagination = get('mission-guide-pagination');
  const count = get('phase-count');
  const previous = get('phase-previous');
  const next = get('phase-next');
  const speak = get('btn-speak-reply');
  speak.hidden = true;            // sin controles de audio (v10)
  const voiceNote = get('voice-note');
  const voice = window.speechSynthesis;
  const media = fetch(new URL('./assets/neptunito/media.json', import.meta.url))
    .then(response => response.ok ? response.json() : {}).catch(() => ({}));

  let mission, parts, view = 'description', page = 0;
  let animator, active = false, loadedFrames = false;
  let introduction = 0, reading = 0, transitionTimer, gestureTimer, greetingTimer;
  let writing = null;
  const seen = new Set();
  let voiceRun = null, resumeVoice = false;

  function setPose(pose, interrupt = false) {
    if (active && loadedFrames) animator.setState(pose, {interrupt});
  }

  function stopVoice() {
    const run = voiceRun;
    voiceRun = null;
    if (run?.audio) {
      run.audio.pause();
      run.audio.removeAttribute('src');
      run.audio.load();
    } else if (run?.utterance) voice?.cancel();
    speak.setAttribute('aria-pressed', 'false');
    speak.textContent = 'Escuchar';
  }

  function quiet() {
    resumeVoice = false;
    stopVoice();
    clearTimeout(gestureTimer);
    if (!writing) setPose('waiting');
  }

  function narrateWithGestures() {
    clearTimeout(gestureTimer);
    setPose('talking');
    gestureTimer = setTimeout(() => {
      if (!voiceRun) setPose('waiting');
    }, gestureMs);
  }

  function clearGreeting() {
    clearTimeout(greetingTimer);
    greeting.hidden = true;
    content.classList.remove('is-opening');
  }

  function finishWriting() {
    if (!writing) return;
    cancelAnimationFrame(writing.frame);
    for (const {element, text} of writing.lines) element.textContent = text;
    writing = null;
    content.removeAttribute('aria-busy');
    if (!voiceRun) setPose('waiting');
  }

  function reveal() {
    const firstLook = !seen.has(view);
    seen.add(view);
    if (motion.matches) return;
    if (!firstLook) {
      narrateWithGestures();
      return;
    }

    // Keep the full text in the layout and the accessibility tree as it appears.
    const lines = [];
    for (const element of [heading, ...output.querySelectorAll('p, h3, dt, dd')]) {
      const text = element.textContent;
      const shown = document.createTextNode('');
      const hidden = node('span', text);
      hidden.className = 'mission-guide-unwritten';
      element.replaceChildren(shown, hidden);
      lines.push({element, shown, hidden, text});
    }
    const length = lines.reduce((total, line) => total + line.text.length, 0);
    const duration = Math.max(1900, Math.min(6200, length * 15));
    const start = performance.now();
    writing = {lines, frame: 0};
    content.setAttribute('aria-busy', 'true');
    setPose('talking');
    function step(now) {
      let remaining = Math.ceil(Math.max(0, (now - start) / duration) * length);
      for (const {shown, hidden, text} of lines) {
        const visible = Math.min(remaining, text.length);
        if (shown.length !== visible) {
          shown.data = text.slice(0, visible);
          hidden.textContent = text.slice(visible);
        }
        remaining -= visible;
      }
      if (now - start >= duration) finishWriting();
      else writing.frame = requestAnimationFrame(step);
    }
    writing.frame = requestAnimationFrame(step);
  }

  function render() {
    const history = view === 'history';
    modeLabel.textContent = history ? '' : descriptionLabel;
    modeLabel.hidden = history;
    pagination.hidden = history;
    switchView.textContent = history ? descriptionLabel : historyLabel;
    count.textContent = 'Parte ' + (page + 1) + ' de ' + parts.length;
    previous.disabled = page === 0;
    next.disabled = page === parts.length - 1;

    if (history) {
      heading.textContent = historyLabel;
      const facts = document.createElement('dl');
      facts.className = 'facts';
      for (const [label, value] of historyFacts(mission)) {
        const fact = document.createElement('div');
        fact.append(node('dt', label), node('dd', value));
        facts.append(fact);
      }
      const notes = node('p', [mission.coordinates, mission.end].filter(Boolean).join(' · '));
      notes.className = 'muted';
      output.replaceChildren(node('p', missionFacts[mission.id] || mission.summary), facts, notes);
      return;
    }

    const [first, ...additional] = parts[page];
    heading.textContent = first.title;
    output.replaceChildren(
      ...paragraphs(first.text),
      ...additional.flatMap(chapter => [node('h3', chapter.title), ...paragraphs(chapter.text)])
    );
  }

  function finishVoice(run, message = '') {
    if (voiceRun !== run) return;
    quiet();
    voiceNote.textContent = message;
  }

  function speakText(run, text, done) {
    const voices = voice?.getVoices() || [];
    const spanish = voices.find(item => /^es[-_]pe$/i.test(item.lang)) ||
      voices.find(item => /^es(?:[-_](?:419|mx))?$/i.test(item.lang)) ||
      voices.find(item => /^es[-_]/i.test(item.lang));
    if (!spanish || !window.SpeechSynthesisUtterance) {
      finishVoice(run, 'Activa una voz en español en tu dispositivo para escuchar la narración.');
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    run.utterance = utterance;
    utterance.voice = spanish;
    utterance.lang = spanish.lang;
    utterance.pitch = 1.24;
    utterance.rate = 1.04;
    utterance.onstart = () => { if (voiceRun === run) setPose('talking'); };
    utterance.onend = () => {
      if (voiceRun !== run) return;
      run.utterance = null;
      done();
    };
    utterance.onerror = () => finishVoice(run, 'La voz del navegador no pudo reproducir la narración.');
    voice.speak(utterance);
  }

  function playVoice() {
    // NEPTUNI v10: el relato se presenta solo como texto en pantalla; no hay lectura en voz alta.
    stopVoice(); speak.hidden = true; return;
    const queue = view === 'history' ? [{
      text: [missionFacts[mission.id] || mission.summary,
        ...historyFacts(mission).map(([label, value]) => label + '. ' + value),
        mission.coordinates, mission.end].filter(Boolean).join('. ')
    }] : parts[page];
    const run = voiceRun = {};
    speak.setAttribute('aria-pressed', 'true');
    speak.textContent = 'Detener';
    voiceNote.textContent = '';

    async function play(index) {
      const entries = await media;
      if (voiceRun !== run) return;
      const item = queue[index];
      if (!item) {
        finishVoice(run);
        return;
      }
      const recording = item.id && entries?.[item.id]?.voice;
      if (!recording) {
        speakText(run, item.text, () => play(index + 1));
        return;
      }
      const audio = run.audio = new Audio(recording);
      const failed = () => {
        if (voiceRun !== run || run.audio !== audio) return;
        run.audio = null;
        audio.pause();
        speakText(run, item.text, () => play(index + 1));
      };
      audio.addEventListener('ended', () => {
        if (voiceRun !== run) return;
        run.audio = null;
        void play(index + 1);
      }, {once: true});
      audio.addEventListener('error', failed, {once: true});
      audio.play().then(() => {
        if (voiceRun === run) setPose('talking');
      }).catch(failed);
    }
    void play(0);
  }

  function change(nextView, nextPage) {
    if (!active || nextPage < 0 || nextPage >= parts.length) return;
    const token = ++reading;
    resumeVoice = Boolean(voiceRun) || resumeVoice;
    stopVoice();
    finishWriting();
    clearTimeout(gestureTimer);
    clearTimeout(transitionTimer);
    clearGreeting();
    character.classList.remove('is-entering');
    setPose('waiting', true);
    view = nextView;
    page = nextPage;
    voiceNote.textContent = '';
    content.classList.add('is-changing');
    content.setAttribute('aria-busy', 'true');
    speak.disabled = true;
    transitionTimer = setTimeout(() => {
      if (token !== reading) return;
      render();
      content.classList.remove('is-changing');
      content.removeAttribute('aria-busy');
      speak.disabled = false;
      reveal();
      if (resumeVoice) {
        resumeVoice = false;
        playVoice();
      }
    }, motion.matches ? 0 : transitionMs);
  }

  async function activate() {
    if (active || !mission) return;
    active = true;
    view = 'description';
    page = 0;
    seen.clear();
    render();
    greeting.textContent = missionPrompts[mission.id][0];
    if (!motion.matches) {
      content.classList.add('is-opening');
      content.setAttribute('aria-busy', 'true');
      speak.disabled = true;
    } else {
      greeting.hidden = false;
      reveal();
    }
    character.classList.add('is-entering');
    const token = ++introduction;
    const openingReading = reading;
    animator ??= createNeptunitoAnimator({
      container: character,
      onEvent(name) {
        if (name !== 'greetingReady' || !content.classList.contains('is-opening')) return;
        greeting.hidden = false;
        greetingTimer = setTimeout(() => animator.continueIntro(),
          Math.max(1200, greeting.textContent.length * 26));
      },
      config: {
        narratorX: .55,
        size: {heightRatio: .73, widthRatio: .79, min: 75, max: 194},
        ground: {bottom: .085},
        edge: {clip: 'box'},
        intro: {
          peek: {firstMs: 280, pauseMs: 130, secondMs: 245},
          greet: {slideMs: 210, bobs: 1, bobMs: 280, holdMs: 220},
          anticipation: {recoilMs: 140, crouchMs: 125},
          jump: {ms: 370, distance: .53},
          land: {ms: 170},
          recover: {ms: 160},
          settleMs: 220
        },
        walk: {speed: 1.2}
      }
    });
    try {
      await animator.ready;
      if (token === introduction) loadedFrames = true;
    } catch {
      // Use the static sprite and keep the text available if a frame fails.
    }
    if (token !== introduction) return;
    character.classList.remove('is-entering');
    if (reading !== openingReading) {
      setPose(writing || voiceRun ? 'talking' : 'waiting');
      return;
    }
    if (loadedFrames && !motion.matches) {
      character.classList.add('is-entering');
      await animator.playIntro({holdGreeting: true, endState: 'waiting'});
    } else setPose('waiting');
    if (token !== introduction || reading !== openingReading) return;
    character.classList.remove('is-entering');
    if (content.classList.contains('is-opening')) {
      clearGreeting();
      content.removeAttribute('aria-busy');
      speak.disabled = false;
      reveal();
    }
  }

  function stop() {
    active = false;
    introduction++;
    reading++;
    finishWriting();
    quiet();
    animator?.reset();
    clearGreeting();
    character.classList.remove('is-entering');
    clearTimeout(transitionTimer);
    content.classList.remove('is-changing');
    content.removeAttribute('aria-busy');
    speak.disabled = false;
    voiceNote.textContent = '';
  }

  switchView.addEventListener('click', () => change(view === 'history' ? 'description' : 'history', page));
  previous.addEventListener('click', () => change('description', page - 1));
  next.addEventListener('click', () => change('description', page + 1));
  speak.addEventListener('click', () => voiceRun ? quiet() : playVoice());
  character.addEventListener('click', () => {
    if (active && loadedFrames && !content.hasAttribute('aria-busy')) void animator.react();
  });
  motion.addEventListener('change', () => {
    if (motion.matches) finishWriting();
  });

  return {
    load(nextMission) {
      mission = nextMission;
      archaeologyMessage.textContent = missionPrompts[mission.id][1];
      const chapters = dialogueFor(mission);
      parts = [chapters.slice(0, 1), chapters.slice(1, 2), chapters.slice(2)];
      view = 'description';
      page = 0;
      render();
      return chapters.flatMap(chapter => chapter.sources);
    },
    start: activate,
    stop,
    quiet
  };
}
