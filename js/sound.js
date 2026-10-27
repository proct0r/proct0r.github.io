/* Small synthesized sounds. Off until the visitor turns them on. */
(function () {
	'use strict';
	var ctx = null, on = false;
	try { on = localStorage.getItem('snd') === '1'; } catch (e) { }
	function ac() {
		if (!ctx) { var C = window.AudioContext || window.webkitAudioContext; if (!C) return null; ctx = new C(); }
		if (ctx.state === 'suspended') ctx.resume();
		return ctx;
	}
	function tone(f, t0, dur, type, vol, slide) {
		var a = ac(); if (!a) return;
		var o = a.createOscillator(), g = a.createGain(), t = a.currentTime + (t0 || 0);
		o.type = type || 'sine'; o.frequency.setValueAtTime(f, t);
		if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
		g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || 0.08, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
		o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + dur + 0.02);
	}
	var lib = {
		tap: function () { tone(1320, 0, 0.09, 'square', 0.035); },
		ok: function () { tone(988, 0, 0.12, 'sine', 0.07); tone(1318, 0.13, 0.2, 'sine', 0.07); },
		bad: function () { tone(330, 0, 0.18, 'sawtooth', 0.04); tone(247, 0.18, 0.25, 'sawtooth', 0.04); },
		print: function () { for (var i = 0; i < 6; i++) tone(180 + i * 8, i * 0.05, 0.04, 'square', 0.015); },
		wave: function () { tone(520, 0, 0.5, 'sine', 0.05, 1040); },
		click: function () { tone(2000, 0, 0.03, 'square', 0.02); },
		fix: function () { tone(660, 0, 0.08, 'triangle', 0.06); tone(990, 0.07, 0.1, 'triangle', 0.05); }
	};
	window.Snd = {
		get on() { return on; },
		set: function (v) { on = !!v; try { localStorage.setItem('snd', on ? '1' : '0'); } catch (e) { } if (on) { ac(); lib.click(); } },
		play: function (n) { if (on && lib[n]) try { lib[n](); } catch (e) { } }
	};
})();
