/* global $, localStorage */

class Shell {
  constructor(term, commands) {
    this.commands = commands;
    this.setupListeners(term);
    this.term = term;

    localStorage.directory = 'root';
    localStorage.history = JSON.stringify('');
    localStorage.historyIndex = -1;
    localStorage.inHistory = false;

    $('.input').focus();
  }

  setupListeners(term) {
    $('#terminal').mouseup(() => $('.input').last().focus());

    term.addEventListener('keyup', (evt) => {
      const upKey = 38;
      const downKey = 40;
      const key = evt.keyCode;

      if ([upKey, downKey].includes(key)) {
        let history = localStorage.history;
        history = history ? Object.values(JSON.parse(history)) : [];

        if (key === upKey) {
          if (localStorage.historyIndex >= 0) {
            if (localStorage.inHistory == 'false') {
              localStorage.inHistory = true;
            }
            // Prevent repetition of last command while traversing history.
            if (localStorage.historyIndex == history.length - 1 && history.length !== 1) {
              localStorage.historyIndex -= 1;
            }
            $('.input').last().html(`${history[localStorage.historyIndex]}<span class="end"><span>`);
            if (localStorage.historyIndex != 0) localStorage.historyIndex -= 1;
          }
        } else if (key === downKey) {
          if (localStorage.inHistory == 'true' && localStorage.historyIndex < history.length) {
            let ret;

            if (localStorage.historyIndex > 0) {
              ret = `${history[localStorage.historyIndex]}<span class="end"><span>`;
              if (localStorage.historyIndex != history.length - 1) {
                localStorage.historyIndex = Number(localStorage.historyIndex) + 1;
              }
              // Prevent repetition of first command while traversing history.
            } else if (localStorage.historyIndex == 0 && history.length > 1) {
              ret = `${history[1]}<span class="end"><span>`;
              localStorage.historyIndex = history.length !== 2 ? 2 : 1;
            }
            $('.input').last().html(ret);
          }
        }
        evt.preventDefault();
        $('.end').focus();
      }
    });

    term.addEventListener('keydown', (evt) => {
      // Keydown legend:
      // 9 -> Tab key.
      // 8 -> Backspace key.
      // 46 -> Delete key.

      if (evt.keyCode === 9) {
        evt.preventDefault();
      } else if (evt.keyCode === 8 || evt.keyCode === 46) {
        this.resetHistoryIndex();
      }
    });

    term.addEventListener('keypress', (evt) => {
      // Exclude these keys for Firefox, as they're fired for arrow/tab keypresses.
      if (![9, 27, 37, 38, 39, 40].includes(evt.keyCode)) {
        // If input keys are pressed then resetHistoryIndex() is called.
        this.resetHistoryIndex();
      }
      if (evt.keyCode === 13) {
        const prompt = evt.target;
        const input = prompt.textContent.trim().split(' ');
        const cmd = input[0].toLowerCase();
        const args = input[1];
        if (cmd === 'clear' || cmd === 'cls') {
          this.updateHistory(cmd);
          this.clearConsole();
        } else if (cmd === 'cd..' && args == null) {
          this.runCommand('cd', '..');
          this.resetPrompt(term, prompt);
          $('.root').last().html(localStorage.directory == "root" ? "~" : localStorage.directory);
        } else if (cmd === 'echo' || cmd === 'printf') {
          this.runCommand(cmd, input.slice(1, input.length).join(' '));
          this.resetPrompt(term, prompt);
        } else if (['exit', 'shutdown', 'quit'].includes(cmd)) {
          this.runCommand(cmd, prompt);
        } else if (cmd && cmd in this.commands) {
          this.runCommand(cmd, args);
          this.resetPrompt(term, prompt);
          $('.root').last().html(localStorage.directory == "root" ? "~" : localStorage.directory);
        } else if (input == '') {
          this.resetPrompt(term, prompt);
        } else {
          this.term.innerHTML += 'Error: command not recognized';
          this.resetPrompt(term, prompt);
        }
        evt.preventDefault();
      }
    });
  }

  runCommand(cmd, args) {
    const command = args ? `${cmd} ${args}` : cmd;
    this.updateHistory(command);

    const output = this.commands[cmd](args);
    if (output) {
      this.term.innerHTML += output;
    }
    $('pre#pre-ra').on("animationend", function () {
      $(this).removeClass('fade-in');
    });
  }

  resetPrompt(term, prompt) {
    const newPrompt = prompt.parentNode.cloneNode(true);
    prompt.setAttribute('contenteditable', false);

    if (this.prompt) {
      newPrompt.querySelector('.prompt').textContent = this.prompt;
    }

    term.appendChild(newPrompt);
    newPrompt.querySelector('.input').innerHTML = '';
    newPrompt.querySelector('.input').focus();
  }

  resetHistoryIndex() {
    let history = localStorage.history;

    history = history ? Object.values(JSON.parse(history)) : [];
    if (localStorage.goingThroughHistory == true) {
      localStorage.goingThroughHistory = false;
    }

    if (history.length == 0) {
      localStorage.historyIndex = -1;
    } else {
      localStorage.historyIndex = history.length - 1 > 0 ? history.length - 1 : 0;
    }
  }

  updateHistory(command) {
    let history = localStorage.history;
    history = history ? Object.values(JSON.parse(history)) : [];

    history.push(command);
    localStorage.history = JSON.stringify(history);
    localStorage.historyIndex = history.length - 1;
  }

  clearConsole() {
    const getDirectory = () => localStorage.directory;
    const dir = getDirectory() == "root" ? "~" : getDirectory();

    $('#terminal').html(
      `
      <p> <span class="green-glow">(ᵔᵕᵔ)/</span> - WELCOME TO <span class="root">〈 RA 〉's Console</span>! TYPE \`<span class="tick">help</span>\` TO GET STARTED. </p>
      <p class="hidden">
          <span class="prompt">
            <span class="root">${dir}</span>
            <span class="tick">$</span>
          </span>
          <span contenteditable="true" class="input"></span>
      </p>`,
    );

    $('.input').focus();
  }
}
