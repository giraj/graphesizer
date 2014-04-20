(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";
var App, math;

math = require('mathjs')();

App = (function() {
  function App(canvas, samplerate) {
    this.canvas = canvas;
    this.samplerate = samplerate;
    this.canvas.height = window.innerHeight;
    this.canvas.width = window.innerWidth;
    this.signalHistory = [];
    this.currentSignal = null;
    this.signalColors = [];
    this.dragging = false;
    this.zoom = 1;
    this.yZoom = 160;
    this.origoX = window.innerWidth / 2;
    this.origoY = window.innerHeight / 2;
    this.audioCtx = new webkitAudioContext();
    this.ctx = canvas.getContext("2d");
    this.canvas.addEventListener('mousedown', ((function(_this) {
      return function(event) {
        return _this.mousedownHandler(event);
      };
    })(this)));
    this.canvas.addEventListener('mouseup', ((function(_this) {
      return function(event) {
        return _this.mouseupHandler(event);
      };
    })(this)));
    this.canvas.addEventListener('mousewheel', ((function(_this) {
      return function(event) {
        return _this.scrollHandler(event);
      };
    })(this)));
    this.initGain();
  }

  App.prototype.initGain = function() {
    this.gain = this.audioCtx.createGain();
    this.gain.gain.value = 0.5;
    this.gain.connect(this.audioCtx.destination);
    return this;
  };

  App.prototype.setLineWidth = function(lineWidth) {
    this.ctx.lineWidth = lineWidth;
    return this;
  };

  App.prototype.setSignalColors = function(signalColors) {
    this.signalColors = signalColors;
    return this;
  };

  App.prototype.nextColor = function() {
    var nSignals;
    nSignals = this.sidebar != null ? this.sidebar.signals.length : this.signalHistory.length;
    return this.signalColors[nSignals % this.signalColors.length];
  };

  App.prototype.add = function(signal) {
    if (this.sidebar != null) {
      this.sidebar.add(signal);
    } else {
      this.signalHistory.push(signal);
    }
    signal.color = this.nextColor();
    if (this.currentSignal != null) {
      this.currentSignal.stop();
    }
    this.currentSignal = signal;
    return this.draw();
  };

  App.prototype.draw = function() {
    var delta, expr, i, scope, _fn, _i, _ref;
    this.clear();
    expr = math.parse(this.currentSignal.fn).compile(math);
    delta = this.zoom / this.canvas.width;
    scope = {
      x: this.graphXToSeconds(0)
    };
    this.ctx.moveTo(0, expr["eval"](scope));
    this.ctx.beginPath();
    this.ctx.strokeStyle = this.currentSignal.color;
    _fn = (function(_this) {
      return function(i) {
        scope.x += delta;
        return _this.ctx.lineTo(i, _this.yZoom * expr["eval"](scope) + _this.origoY);
      };
    })(this);
    for (i = _i = 1, _ref = this.ctx.canvas.width - 1; 1 <= _ref ? _i <= _ref : _i >= _ref; i = 1 <= _ref ? ++_i : --_i) {
      _fn(i);
    }
    this.ctx.stroke();
    this.ctx.closePath();
    return this.drawSelection();
  };

  App.prototype.drawSelection = function() {
    var from, to;
    from = this.currentSignal.window.from;
    to = this.currentSignal.window.to;
    if (to !== from || this.dragging) {
      this.ctx.fillStyle = "rgba(238, 232, 213, 0.5)";
      this.ctx.fillRect(this.secondsToGraphX(from), 0, this.secondsToGraphX(to) - this.secondsToGraphX(from), window.innerHeight);
      this.ctx.beginPath();
      this.ctx.strokeStyle = "#93a1a1";
      this.ctx.moveTo(this.secondsToGraphX(from), 0);
      this.ctx.lineTo(this.secondsToGraphX(from), window.innerHeight);
      this.ctx.moveTo(this.secondsToGraphX(to), 0);
      this.ctx.lineTo(this.secondsToGraphX(to), window.innerHeight);
      this.ctx.stroke();
      this.ctx.closePath();
      this.drawSelectionIndicators();
    }
    return this;
  };

  App.prototype.drawSelectionIndicators = function() {
    var offset1, offset2;
    this.ctx.font = "20pt Georgia";
    this.ctx.fillStyle = "#586e75";
    if (this.currentSignal.window.from < this.currentSignal.window.to) {
      offset1 = -95;
      offset2 = 20;
    } else {
      offset1 = 20;
      offset2 = -95;
    }
    this.ctx.fillText(this.currentSignal.window.from.toFixed(2) + 's', this.secondsToGraphX(this.currentSignal.window.from) + offset1, 30);
    return this.ctx.fillText(this.currentSignal.window.to.toFixed(2) + 's', this.secondsToGraphX(this.currentSignal.window.to) + offset2, 30);
  };

  App.prototype.secondsToGraphX = function(s) {
    return ((s * this.canvas.width) / this.zoom) + this.origoX;
  };

  App.prototype.graphXToSeconds = function(x) {
    return (x - this.origoX) * this.zoom / this.canvas.width;
  };

  App.prototype.mousedownHandler = function(event) {
    if (this.currentSignal != null) {
      this.dragging = true;
      this.startDrag(event);
    }
    return this;
  };

  App.prototype.mouseupHandler = function(event) {
    if (this.dragging) {
      this.dragging = false;
      this.canvas.onmousemove = null;
      this.endDrag(event);
    }
    this.currentSignal.play(this.audioCtx, this.gain);
    return this;
  };

  App.prototype.scrollHandler = function(event) {
    event.preventDefault();
    this.zoom += event.deltaY;
    return this.draw();
  };

  App.prototype.startDrag = function(event) {
    this.currentSignal.startWindowSelection(this.graphXToSeconds(event.x));
    this.canvas.onmousemove = ((function(_this) {
      return function(event) {
        return _this.endDrag(event);
      };
    })(this));
    return this.draw();
  };

  App.prototype.endDrag = function(event) {
    this.currentSignal.endWindowSelection(this.graphXToSeconds(event.x));
    return this.draw();
  };

  App.prototype.clear = function() {
    return this.canvas.height = this.canvas.height;
  };

  return App;

})();

module.exports = App;


},{}],2:[function(require,module,exports){
"use strict";
var Sidebar;

Sidebar = (function() {
  function Sidebar(el, width, hidden) {
    this.el = el;
    this.width = width;
    this.hidden = hidden != null ? hidden : true;
    this.signals = [];
    this.el.style.width = this.width + "px";
    this.signalList = document.createElement('ul');
    this.el.appendChild(this.signalList).className = "sidebar-signal-list";
    if (this.hidden) {
      this.hide();
    } else {
      this.show();
    }
  }

  Sidebar.prototype.bindButton = function(button) {
    this.button = button;
    this.button.innerHTML = this.hidden ? ">>" : "<<";
    return this.button.addEventListener('click', (function(_this) {
      return function(event) {
        return _this.toggle();
      };
    })(this));
  };

  Sidebar.prototype.toggle = function() {
    this.hidden = !this.hidden;
    this.button.innerHTML = this.hidden ? ">>" : "<<";
    if (this.hidden) {
      return this.hide();
    } else {
      return this.show();
    }
  };

  Sidebar.prototype.show = function() {
    this.el.style.left = 0 + "px";
    return this;
  };

  Sidebar.prototype.hide = function() {
    this.el.style.left = (55 - this.width) + "px";
    return this;
  };

  Sidebar.prototype.add = function(signal) {
    this.signals.push(signal);
    return this.signalList.appendChild(this.makeEntry(signal));
  };

  Sidebar.prototype.makeEntry = function(signal) {
    var entry, title, toggles, txt;
    entry = document.createElement('li');
    title = document.createTextNode(signal.fn);
    toggles = document.createElement('div');
    toggles.style.background = signal.color;
    txt = document.createTextNode('');
    toggles.appendChild(txt);
    entry.appendChild(title);
    entry.appendChild(toggles).className = 'sidebar-signal-toggle';
    entry.className = 'sidebar-signal';
    return entry;
  };

  Sidebar.prototype.render = function() {
    var signal, _fn, _i, _len, _ref;
    _ref = this.signals;
    _fn = (function(_this) {
      return function(signal) {
        return _this.signalList.appendChild(_this.makeEntry(signal));
      };
    })(this);
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      signal = _ref[_i];
      _fn(signal);
    }
    return this;
  };

  return Sidebar;

})();

module.exports = Sidebar;


},{}],3:[function(require,module,exports){
"use strict";
var Signal, math;

math = require('mathjs')();

Signal = (function() {
  function Signal(fn, samplerate) {
    this.fn = fn;
    this.samplerate = samplerate;
    this.playing = false;
    this.window = {
      from: 0,
      to: 0
    };
    this.samples = [];
    this;
  }

  Signal.prototype.sample = function() {
    var delta, end, expr, i, nSamples, scope, start, _fn, _i, _ref;
    if (this.window.from < this.window.to) {
      start = this.window.from;
      end = this.window.to;
    } else {
      start = this.window.to;
      end = this.window.from;
    }
    nSamples = Math.floor((end - start) * this.samplerate);
    this.samples = new Float32Array(nSamples);
    delta = 1 / this.samplerate;
    expr = math.parse(this.fn).compile(math);
    scope = {
      x: start
    };
    _fn = (function(_this) {
      return function() {
        scope.x += delta;
        return _this.samples[i] = expr["eval"](scope);
      };
    })(this);
    for (i = _i = 0, _ref = nSamples - 1; 0 <= _ref ? _i <= _ref : _i >= _ref; i = 0 <= _ref ? ++_i : --_i) {
      _fn();
    }
    return this;
  };

  Signal.prototype.createBufferSource = function(ctx) {
    var buffer, data, i, _fn, _i, _ref;
    buffer = ctx.createBuffer(1, this.samples.length, this.samplerate);
    data = buffer.getChannelData(0);
    _fn = (function(_this) {
      return function(i) {
        return data[i] = _this.samples[i];
      };
    })(this);
    for (i = _i = 0, _ref = this.samples.length - 1; 0 <= _ref ? _i <= _ref : _i >= _ref; i = 0 <= _ref ? ++_i : --_i) {
      _fn(i);
    }
    this.source = ctx.createBufferSource();
    this.source.loop = true;
    this.source.buffer = buffer;
    return this;
  };

  Signal.prototype.connect = function(gain) {
    this.source.connect(gain);
    return this;
  };

  Signal.prototype.play = function(ctx, gain) {
    if (this.playing) {
      this.stop();
    }
    if (this.window.from !== this.window.to) {
      this.playing = true;
      this.sample();
      this.createBufferSource(ctx);
      this.connect(gain);
      this.source.noteOn(0);
    }
    return this;
  };

  Signal.prototype.stop = function() {
    if (this.playing) {
      this.source.noteOff(0);
    }
    this.playing = false;
    return this;
  };

  Signal.prototype.startWindowSelection = function(s) {
    this.window.from = s;
    this.window.to = s;
    return this;
  };

  Signal.prototype.endWindowSelection = function(s) {
    this.window.to = s;
    return this;
  };

  return Signal;

})();

module.exports = Signal;


},{}],4:[function(require,module,exports){
"use strict";
var $, App, Sidebar, Signal, app, samplerate;

App = require('./App.coffee');

Signal = require('./Signal.coffee');

Sidebar = require('./Sidebar.coffee');

$ = document.querySelector.bind(document);

samplerate = 48000;

app = new App($('#graph'), samplerate);

app.sidebar = new Sidebar($('#sidebar'), 250);

app.sidebar.bindButton($('#sidebar-toggle'));

app.setSignalColors(["#b58900", "#dc322f", "#d33682", "#6c71c4", "#268bd2", "#2aa198", "#cb4b16", "#859900"]).setLineWidth(3);

$('#fn-input').onkeypress = function(event) {
  var signal;
  if (event.keyCode === 13) {
    signal = new Signal(this.value, samplerate);
    return app.add(signal);
  }
};


},{"./App.coffee":1,"./Sidebar.coffee":2,"./Signal.coffee":3}]},{},[4])