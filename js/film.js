/* The film: one card payment told in seven chapters, scroll-driven, rendered with three.js.
   Day: a terminal and a card on the page. Night: a fleet of terminals, the switch ring, a globe. */
(function () {
	'use strict';
	var root = document.documentElement;
	var $ = function (s, c) { return (c || document).querySelector(s); };
	var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
	var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
	function cl(x, a, b) { return x < a ? a : x > b ? b : x; }
	function sm(a, b, x) { var t = cl((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }
	function lerp(a, b, t) { return a + (b - a) * t; }
	function phone() { return innerWidth <= 760; }

	var film = $('#top'), sticky = film.querySelector('.sticky');
	var caps = $$('.cap', sticky);
	var CH = [{ a: 0, b: 0.055 }, { a: 0.115, b: 0.19 }, { a: 0.245, b: 0.315 }, { a: 0.385, b: 0.455 }, { a: 0.515, b: 0.585 }, { a: 0.635, b: 0.705 }, { a: 0.76, b: 0.83 }, { a: 0.895, b: 1.01 }];
	var FADE = 0.035;
	var P = 0, total = 1, filmBottom = 1;
	var sky = $('#sky'), scrim = $('#scrim'), scrimDay = $('#scrimDay'), bar = $('#progress'), skipBtn = $('#skip'), nav = $('#nav'), cue = $('#cue'), countEl = $('#count');
	var railBtns = $$('#rail button');

	function measure() { total = Math.max(1, film.offsetHeight - innerHeight); }
	function readScroll() { var r = film.getBoundingClientRect(); P = cl(-r.top / total, 0, 1); filmBottom = r.bottom; }

	/* ---------------- captions, rail, chrome ---------------- */
	function capOpacity(i, p) {
		var c = CH[i];
		var a = i === 0 ? 1 : sm(c.a - FADE, c.a, p);
		var b = i === CH.length - 1 ? 1 : 1 - sm(c.b, c.b + FADE, p);
		return Math.min(a, b);
	}
	function chrome(N) {
		var best = 0, bestO = -1;
		caps.forEach(function (el, i) {
			var o = capOpacity(i, P);
			if (o > bestO) { bestO = o; best = i; }
			el.style.opacity = o.toFixed(3);
			el.style.setProperty('--y', ((1 - o) * 26 * (P < CH[i].a ? 1 : -1)).toFixed(1) + 'px');
			el.style.visibility = o < 0.01 ? 'hidden' : 'visible';
		});
		railBtns.forEach(function (b) {
			var ch = b.getAttribute('data-ch');
			b.classList.toggle('on', ch === 'work' ? P >= 0.999 : (+ch === best && bestO > 0.5));
		});
		var inFilm = filmBottom > innerHeight * 0.15;
		var night = inFilm && N > 0.5;
		if (root.getAttribute('data-tone') !== (night ? 'night' : 'day')) root.setAttribute('data-tone', night ? 'night' : 'day');
		var vis = filmBottom > 0 ? 1 : 0;
		sky.style.opacity = (N * vis).toFixed(3);
		scrim.style.opacity = (N * vis).toFixed(3);
		scrimDay.style.opacity = ((1 - N) * vis * (P > 0.002 || phone() ? 1 : 0)).toFixed(3);
		bar.classList.toggle('on', P > 0.002 && P < 0.999 && !game.on);
		bar.style.transform = 'scaleX(' + P.toFixed(4) + ')';
		skipBtn.classList.toggle('off', P > 0.985 || filmBottom < innerHeight * 0.5 || game.on);
		nav.classList.toggle('solid', filmBottom <= 72);
		if (cue) cue.style.opacity = (1 - sm(0.006, 0.03, P)).toFixed(3);
		if (countEl) countEl.textContent = String(Math.max(1, Math.round(sm(0.36, 0.43, P) * 6)));
	}
	railBtns.forEach(function (b) {
		b.addEventListener('click', function () {
			var ch = b.getAttribute('data-ch');
			if (ch === 'work') { $('#work').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); return; }
			var c = CH[+ch], mid = Math.min(0.995, (c.a + Math.min(c.b, 1)) / 2);
			scrollTo({ top: film.offsetTop + mid * total, behavior: reduce ? 'auto' : 'smooth' });
		});
	});
	skipBtn.addEventListener('click', function () { $('#work').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); });

	/* ---------------- intro ---------------- */
	var intro = $('#intro'), scan = $('#scan');
	var Intro = {
		timers: [],
		clear: function () { this.timers.forEach(clearTimeout); this.timers = []; },
		open: function () {
			if (!intro || intro.classList.contains('open')) return;
			this.clear(); intro.classList.add('seam-on');
			var self = this;
			self.timers.push(setTimeout(function () { intro.classList.add('open'); }, intro.classList.contains('quick') ? 60 : 260));
			self.timers.push(setTimeout(function () { intro.classList.add('gone'); }, 1500));
		},
		play: function (quick) {
			if (!intro) return;
			this.clear();
			intro.className = 'intro' + (quick ? ' quick' : '');
			var self = this;
			if (quick || reduce) { self.timers.push(setTimeout(function () { self.open(); }, 120)); return; }
			var lines = [
				['hd', 'sunday@switch · boot'],
				['l', 'Powering terminal <b>2058-LAG</b>'],
				['l', 'Loading keys into the HSM … <span class="ok">ok</span>'],
				['l', 'Connecting to the switch … <span class="ok">ok</span>'],
				['l', 'Routing table: <b>6 networks</b> online'],
				['l end', 'Ready. Tap in. <span class="caret"></span>']
			];
			scan.innerHTML = lines.map(function (l, i) {
				return '<div class="' + l[0] + '"' + (i ? ' style="animation-delay:' + (0.12 + i * 0.3).toFixed(2) + 's"' : '') + '>' + l[1] + '</div>';
			}).join('');
			self.timers.push(setTimeout(function () { self.open(); }, 2350));
		}
	};
	window.Intro = Intro;
	var seen = false;
	try { seen = sessionStorage.getItem('introSeen') === '1'; sessionStorage.setItem('introSeen', '1'); } catch (e) { }
	Intro.play(seen);
	function skipIntro() { if (intro && !intro.classList.contains('open')) Intro.open(); }
	addEventListener('keydown', skipIntro);
	addEventListener('pointerdown', skipIntro);

	/* ---------------- three.js scene ---------------- */
	var ok3d = false;
	try {
		if (window.THREE) { var tc = document.createElement('canvas'); ok3d = !!(tc.getContext('webgl') || tc.getContext('experimental-webgl')); }
	} catch (e) { ok3d = false; }
	var game = { on: false };

	if (!ok3d) {
		root.classList.add('no-gl');
		var tick0 = function () { readScroll(); chrome(sm(0.33, 0.4, P)); requestAnimationFrame(tick0); };
		measure(); addEventListener('resize', measure); requestAnimationFrame(tick0);
		window.Film = { startGame: function () { return false; } };
		return;
	}

	var T = THREE, canvas = $('#scene');
	var renderer = new T.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
	renderer.setClearColor(0x000000, 0);
	renderer.outputEncoding = T.sRGBEncoding;
	renderer.toneMapping = T.ACESFilmicToneMapping;
	renderer.toneMappingExposure = 1.08;
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = T.PCFSoftShadowMap;
	var scene = new T.Scene();
	scene.fog = new T.FogExp2(0x06080A, 0);
	var camera = new T.PerspectiveCamera(32, 1, 0.1, 500);
	var W = 1, H = 1;
	var low = (navigator.hardwareConcurrency || 8) <= 4 || phone();

	function sizeAll() {
		W = canvas.clientWidth || innerWidth; H = canvas.clientHeight || innerHeight;
		renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, low ? 1.5 : 2));
		renderer.setSize(W, H, false);
		camera.aspect = W / H; camera.updateProjectionMatrix();
		measure();
	}

	/* lights */
	var hemi = new T.HemisphereLight(0xffffff, 0x9aa39a, 0.75); scene.add(hemi);
	var key = new T.DirectionalLight(0xffffff, 1.5); key.position.set(-3, 6, 4); key.castShadow = true;
	key.shadow.mapSize.set(2048, 2048); key.shadow.camera.left = -2.6; key.shadow.camera.right = 2.6; key.shadow.camera.top = 2.6; key.shadow.camera.bottom = -2.6; key.shadow.camera.near = 0.5; key.shadow.camera.far = 20; key.shadow.radius = 6; key.shadow.bias = -0.0004;
	scene.add(key);
	var rim = new T.DirectionalLight(0xbfefff, 0.45); rim.position.set(4, 3, -5); scene.add(rim);
	var moon = new T.DirectionalLight(0x9db8ff, 0); moon.position.set(14, 30, 12); scene.add(moon);
	var screenLight = new T.PointLight(0x5fe3da, 0, 2.4); scene.add(screenLight);

	var desk = new T.Mesh(new T.PlaneGeometry(40, 40), new T.ShadowMaterial({ opacity: 0.16 }));
	desk.rotation.x = -Math.PI / 2; desk.receiveShadow = true; scene.add(desk);

	/* helpers */
	function rrShape(w, d, r) {
		var s = new T.Shape(), x = -w / 2, y = -d / 2;
		s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + d - r); s.quadraticCurveTo(x + w, y + d, x + w - r, y + d);
		s.lineTo(x + r, y + d); s.quadraticCurveTo(x, y + d, x, y + d - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s;
	}
	function slab(w, d, h, r, bev) {
		var g = new T.ExtrudeGeometry(rrShape(w, d, r), { depth: h, bevelEnabled: true, bevelThickness: bev, bevelSize: bev, bevelSegments: 3, curveSegments: 10 });
		g.rotateX(-Math.PI / 2); g.translate(0, bev, 0); g.computeVertexNormals(); return g;
	}
	function canvasTex(w, h, draw) {
		var c = document.createElement('canvas'); c.width = w; c.height = h;
		var t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; t.anisotropy = 4;
		t.userData = { c: c, g: c.getContext('2d') };
		if (draw) draw(t.userData.g, w, h);
		return t;
	}
	function rrPath(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }

	/* ---------- the hero terminal ---------- */
	var ALPHA = Math.atan2(0.26, 0.86);
	var rig = new T.Group(); scene.add(rig);
	var term = new T.Group(); rig.add(term);
	var bodyMat = new T.MeshStandardMaterial({ color: 0x1d2327, roughness: 0.5, metalness: 0.25 });
	var base = new T.Mesh(slab(0.92, 1.9, 0.14, 0.14, 0.035), bodyMat); base.castShadow = true; base.receiveShadow = true; term.add(base);
	var hs = new T.Shape(); hs.moveTo(-0.92, 0.16); hs.lineTo(-0.02, 0.16); hs.lineTo(-0.06, 0.40); hs.lineTo(-0.92, 0.66); hs.lineTo(-0.92, 0.16);
	var hg = new T.ExtrudeGeometry(hs, { depth: 0.84, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 3 });
	hg.rotateY(-Math.PI / 2); hg.translate(0.42, 0, 0); hg.computeVertexNormals();
	var head = new T.Mesh(hg, bodyMat); head.castShadow = true; term.add(head);
	var keyGeo = slab(0.2, 0.12, 0.012, 0.03, 0.01);
	var keyMat = new T.MeshStandardMaterial({ color: 0xe3e6e2, roughness: 0.62 });
	var fnMats = [new T.MeshStandardMaterial({ color: 0xd8463b, roughness: 0.55 }), new T.MeshStandardMaterial({ color: 0xe8b93a, roughness: 0.55 }), new T.MeshStandardMaterial({ color: 0x2fa66a, roughness: 0.55 })];
	var KX = [-0.26, 0, 0.26], KZ = [0.16, 0.33, 0.5, 0.67, 0.84];
	KZ.forEach(function (z, r) { KX.forEach(function (x, c) { var m = new T.Mesh(keyGeo, r === 4 ? fnMats[c] : keyMat); m.position.set(x, 0.21, z); m.castShadow = true; term.add(m); }); });
	var keyLabels = canvasTex(512, 550, function (g, w, h) {
		var labs = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#', '✕', '‹', '✓'];
		g.clearRect(0, 0, w, h); g.textAlign = 'center'; g.textBaseline = 'middle';
		labs.forEach(function (l, i) {
			var r = Math.floor(i / 3), c = i % 3, x = (KX[c] + 0.4) / 0.8 * w, y = (KZ[r] - 0.07) / 0.86 * h;
			g.font = '600 46px "IBM Plex Mono", monospace'; g.fillStyle = r === 4 ? '#ffffff' : '#2a3034'; g.fillText(l, x, y);
		});
	});
	var labelPlane = new T.Mesh(new T.PlaneGeometry(0.8, 0.86), new T.MeshBasicMaterial({ map: keyLabels, transparent: true, depthWrite: false }));
	labelPlane.rotation.x = -Math.PI / 2; labelPlane.position.set(0, 0.244, 0.5); term.add(labelPlane);

	var nrm = new T.Vector3(0, Math.cos(ALPHA), Math.sin(ALPHA));
	var screenC = new T.Vector3(0, 0.53, -0.49).addScaledVector(nrm, 0.034);
	var bezel = new T.Mesh(new T.PlaneGeometry(0.78, 0.62), new T.MeshStandardMaterial({ color: 0x07090a, roughness: 0.25, metalness: 0.1 }));
	bezel.rotation.x = -(Math.PI / 2 - ALPHA); bezel.position.copy(screenC).addScaledVector(nrm, -0.002); term.add(bezel);
	var scrTex = canvasTex(640, 485);
	var scr = new T.Mesh(new T.PlaneGeometry(0.66, 0.5), new T.MeshBasicMaterial({ map: scrTex, toneMapped: false }));
	scr.rotation.x = bezel.rotation.x; scr.position.copy(screenC).addScaledVector(nrm, 0.002); term.add(scr);
	screenLight.position.copy(screenC).addScaledVector(nrm, 0.35);
	var slot = new T.Mesh(new T.BoxGeometry(0.62, 0.02, 0.05), new T.MeshStandardMaterial({ color: 0x050607, roughness: 0.9 }));
	slot.position.set(0, 0.672, -0.82); slot.rotation.x = ALPHA; term.add(slot);
	var rcpTex = canvasTex(256, 600);
	var rgeo = new T.PlaneGeometry(0.5, 1); rgeo.translate(0, 0.5, 0);
	var receipt = new T.Mesh(rgeo, new T.MeshStandardMaterial({ map: rcpTex, roughness: 0.85, side: T.DoubleSide }));
	receipt.position.set(0, 0.675, -0.83); receipt.rotation.x = -0.42; receipt.scale.y = 0.0001; receipt.castShadow = true; term.add(receipt);
	var RCP_MAX = 0.72;

	/* ---------- the card ---------- */
	var cardTex = canvasTex(512, 322, function (g, w, h) {
		var gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#1AA39A'); gr.addColorStop(0.55, '#0B5E62'); gr.addColorStop(1, '#06302F');
		g.fillStyle = gr; g.fillRect(0, 0, w, h);
		g.globalAlpha = 0.1; g.fillStyle = '#fff'; g.beginPath(); g.arc(w * 0.95, h * 0.05, h * 0.9, 0, 7); g.fill(); g.globalAlpha = 1;
		var cg = g.createLinearGradient(40, 110, 110, 170); cg.addColorStop(0, '#F0DC9A'); cg.addColorStop(1, '#B9963C');
		g.fillStyle = cg; rrPath(g, 44, 112, 70, 54, 9); g.fill();
		g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 5; g.lineCap = 'round';
		[16, 28, 40].forEach(function (r) { g.beginPath(); g.arc(150, 139, r, -0.7, 0.7); g.stroke(); });
		g.fillStyle = '#fff'; g.font = '600 30px "IBM Plex Mono", monospace'; g.fillText('5061  ••••  ••••  4821', 44, 226);
		g.font = '600 22px "Hanken Grotesk", sans-serif'; g.fillText('SUNDAY OGUNLEYE', 44, 276);
		g.font = '700 26px "Hanken Grotesk", sans-serif'; g.textAlign = 'right'; g.fillText('DEBIT', w - 36, 276);
	});
	var edge = new T.MeshStandardMaterial({ color: 0x0b4d50, roughness: 0.4 });
	var card = new T.Mesh(new T.BoxGeometry(0.86, 0.014, 0.54), [edge, edge, new T.MeshStandardMaterial({ map: cardTex, roughness: 0.35, metalness: 0.1 }), new T.MeshStandardMaterial({ color: 0x0a3b3c, roughness: 0.5 }), edge, edge]);
	card.castShadow = true; rig.add(card);
	var cardRest = { p: new T.Vector3(0.98, 0.008, 0.92), r: new T.Euler(0, -0.42, 0) };
	var cardTap = { p: screenC.clone().addScaledVector(nrm, 0.2), r: new T.Euler(ALPHA, 0.08, 0) };
	var qRest = new T.Quaternion().setFromEuler(cardRest.r), qTap = new T.Quaternion().setFromEuler(cardTap.r);
	rig.rotation.y = -0.28;

	/* ---------- screen + receipt drawing ---------- */
	var scrMode = '', scrKey = '';
	var visitor = (function () {
		var d = new Date(), tz = '';
		try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) { }
		return {
			time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
			date: d.toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' }),
			tz: tz.replace(/_/g, ' ') || 'your timezone',
			screen: (screen.width || innerWidth) + ' × ' + (screen.height || innerHeight),
			lang: (navigator.language || 'en').toUpperCase(),
			ref: 'SV-' + String(Math.floor(1000 + Math.random() * 8999))
		};
	})();
	function drawScreen(mode, k) {
		var keyStr = mode + ':' + (mode === 'auth' ? Math.round(k * 40) : '');
		if (keyStr === scrKey) return; scrKey = keyStr;
		var g = scrTex.userData.g, w = 640, h = 485;
		var bg = g.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, '#0E1A1E'); bg.addColorStop(1, '#081013');
		g.fillStyle = bg; g.fillRect(0, 0, w, h);
		g.fillStyle = 'rgba(255,255,255,.55)'; g.font = '500 20px "IBM Plex Mono", monospace'; g.textAlign = 'left'; g.fillText('SW · LAGOS', 26, 38);
		g.textAlign = 'right'; g.fillText(visitor.time, w - 26, 38);
		g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(0, 56, w, 2);
		g.textAlign = 'center';
		if (mode === 'idle') {
			g.fillStyle = '#fff'; g.font = '300 76px "Hanken Grotesk", sans-serif'; g.fillText('₦2,500.00', w / 2, 190);
			g.strokeStyle = '#5FE3DA'; g.lineWidth = 7; g.lineCap = 'round';
			[22, 40, 58].forEach(function (r) { g.beginPath(); g.arc(w / 2 - 30, 300, r, -0.75, 0.75); g.stroke(); });
			g.fillStyle = 'rgba(234,242,242,.8)'; g.font = '500 26px "Hanken Grotesk", sans-serif'; g.fillText('Tap, insert or swipe', w / 2, 410);
		} else if (mode === 'auth') {
			g.strokeStyle = 'rgba(255,255,255,.12)'; g.lineWidth = 10; g.beginPath(); g.arc(w / 2, 210, 70, 0, 7); g.stroke();
			g.strokeStyle = '#5FE3DA'; g.lineCap = 'round'; g.beginPath(); var a0 = -Math.PI / 2 + k * 9; g.arc(w / 2, 210, 70, a0, a0 + 1.6 + k * 2.6); g.stroke();
			g.fillStyle = '#fff'; g.font = '500 34px "Hanken Grotesk", sans-serif'; g.fillText('Authorizing…', w / 2, 340);
			var hops = ['TERMINAL', 'SWITCH', 'HSM', 'ISSUER'], n = Math.floor(k * 4.999);
			g.font = '500 18px "IBM Plex Mono", monospace';
			hops.forEach(function (hp, i) { g.fillStyle = i <= n ? '#5FE3DA' : 'rgba(255,255,255,.3)'; g.fillText(hp, 110 + i * 140, 410); });
		} else if (mode === 'ok') {
			g.fillStyle = '#1F9D61'; g.beginPath(); g.arc(w / 2, 180, 72, 0, 7); g.fill();
			g.strokeStyle = '#fff'; g.lineWidth = 12; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); g.moveTo(w / 2 - 32, 182); g.lineTo(w / 2 - 8, 206); g.lineTo(w / 2 + 36, 158); g.stroke();
			g.fillStyle = '#4FE09A'; g.font = '700 46px "Hanken Grotesk", sans-serif'; g.fillText('APPROVED', w / 2, 320);
			g.fillStyle = '#fff'; g.font = '300 34px "Hanken Grotesk", sans-serif'; g.fillText('₦2,500.00', w / 2, 370);
			g.fillStyle = 'rgba(255,255,255,.55)'; g.font = '500 20px "IBM Plex Mono", monospace'; g.fillText('00 · 182 ms round trip', w / 2, 425);
		} else if (mode === 'you') {
			g.fillStyle = '#5FE3DA'; g.font = '600 22px "IBM Plex Mono", monospace'; g.fillText('YOUR VISIT', w / 2, 110);
			g.fillStyle = '#fff'; g.font = '300 52px "Hanken Grotesk", sans-serif'; g.fillText(visitor.time + ' · ' + visitor.date, w / 2, 180);
			g.font = '500 22px "IBM Plex Mono", monospace'; g.fillStyle = 'rgba(234,242,242,.75)';
			g.fillText(visitor.tz, w / 2, 245); g.fillText('screen ' + visitor.screen + ' · ' + visitor.lang, w / 2, 285);
			g.fillStyle = '#4FE09A'; g.font = '700 40px "Hanken Grotesk", sans-serif'; g.fillText('APPROVED', w / 2, 370);
			g.fillStyle = 'rgba(255,255,255,.5)'; g.font = '500 18px "IBM Plex Mono", monospace'; g.fillText('read on this page only · nothing sent', w / 2, 420);
		}
		scrTex.needsUpdate = true;
	}
	var rcpMode = '';
	function drawReceipt(mode) {
		if (mode === rcpMode) return; rcpMode = mode;
		var g = rcpTex.userData.g, w = 256, h = 600;
		g.fillStyle = '#FBFAF6'; g.fillRect(0, 0, w, h);
		g.fillStyle = '#23272a'; g.textAlign = 'center';
		var L = mode === 'you'
			? [['600 24px', 'YOUR VISIT'], ['500 15px', visitor.date], ['500 15px', visitor.time], ['500 13px', visitor.tz], ['500 13px', 'SCREEN ' + visitor.screen], ['600 20px', 'APPROVED'], ['500 13px', 'REF ' + visitor.ref], ['500 13px', 'NOTHING LEFT THIS PAGE'], ['500 13px', 'THANK YOU']]
			: [['600 24px', 'SW · LAGOS'], ['500 15px', 'TERMINAL 2058-LAG'], ['500 15px', 'SALE'], ['600 26px', '₦2,500.00'], ['500 14px', 'CONTACTLESS'], ['600 20px', 'APPROVED'], ['500 13px', 'RESP 00 · 182 MS'], ['500 13px', 'CUSTOMER COPY'], ['500 13px', 'THANK YOU']];
		var y = 46;
		L.forEach(function (l) { var px = parseInt(l[0].split(' ')[1], 10); g.font = l[0] + ' "IBM Plex Mono", monospace'; g.fillText(l[1], w / 2, y); y += px + 30; });
		g.strokeStyle = 'rgba(0,0,0,.25)'; g.setLineDash([6, 6]); g.beginPath(); g.moveTo(20, y - 20); g.lineTo(w - 20, y - 20); g.stroke(); g.setLineDash([]);
		rcpTex.needsUpdate = true;
	}
	drawScreen('idle', 0); drawReceipt('sale');

	/* ---------- fleet ---------- */
	var NF = low ? 420 : 900;
	var fleetMat = new T.MeshStandardMaterial({ color: 0x1b2125, roughness: 0.55, metalness: 0.3 });
	var fBodyG = new T.BoxGeometry(0.92, 0.21, 1.9); fBodyG.translate(0, 0.105, 0);
	var fHeadG = new T.BoxGeometry(0.86, 0.36, 0.9); fHeadG.translate(0, 0.37, -0.47);
	var fScrG = new T.PlaneGeometry(0.66, 0.5); fScrG.rotateX(-(Math.PI / 2 - ALPHA)); fScrG.translate(0, 0.565, -0.47);
	var fBody = new T.InstancedMesh(fBodyG, fleetMat, NF), fHead = new T.InstancedMesh(fHeadG, fleetMat, NF);
	var fScr = new T.InstancedMesh(fScrG, new T.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }), NF);
	[fBody, fHead, fScr].forEach(function (m) { m.instanceMatrix.setUsage(T.DynamicDrawUsage); m.frustumCulled = false; scene.add(m); });
	for (var ci = 0; ci < NF; ci++) fScr.setColorAt(ci, new T.Color(0x0a1214));
	var dotTex = canvasTex(64, 64, function (g) { var r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.25, 'rgba(255,255,255,.55)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); });
	dotTex.encoding = T.LinearEncoding;
	var haloPos = new Float32Array(NF * 3), haloCol = new Float32Array(NF * 3);
	var haloG = new T.BufferGeometry(); haloG.setAttribute('position', new T.BufferAttribute(haloPos, 3)); haloG.setAttribute('color', new T.BufferAttribute(haloCol, 3));
	var halo = new T.Points(haloG, new T.PointsMaterial({ size: 2.2, map: dotTex, vertexColors: true, transparent: true, depthWrite: false, blending: T.AdditiveBlending, sizeAttenuation: true }));
	halo.frustumCulled = false; scene.add(halo);

	var COLS = low ? 22 : 34, SP = 2.35, RS = 2.7, dev = [], grid = {};
	for (var r = 0; dev.length < NF; r++) {
		for (var c = 0; c < COLS && dev.length < NF; c++) {
			var x = (c - (COLS - 1) / 2) * SP + (r % 2 ? SP * 0.25 : 0), z = 4.6 - r * RS;
			if (Math.abs(x) < 3.3 && z > -3.6 && z < 4.2) continue;
			var d = { gp: new T.Vector3(x + (Math.random() - 0.5) * 0.3, 0, z + (Math.random() - 0.5) * 0.3), gq: new T.Quaternion().setFromEuler(new T.Euler(0, (Math.random() - 0.5) * 0.3, 0)), r: r, c: c };
			d.dist = Math.hypot(d.gp.x, d.gp.z);
			grid[r * 1000 + c] = dev.length; dev.push(d);
		}
	}
	var maxDist = 0; dev.forEach(function (d) { maxDist = Math.max(maxDist, d.dist); });
	var order = dev.map(function (d, i) { return i; }).sort(function (a, b) { return dev[a].dist - dev[b].dist; });
	var GA = Math.PI * (3 - Math.sqrt(5));
	order.forEach(function (idx, k) {
		var y = 1 - (k + 0.5) / NF * 2, rad = Math.sqrt(1 - y * y), th = GA * k;
		dev[idx].n = new T.Vector3(Math.cos(th) * rad, y, Math.sin(th) * rad);
		dev[idx].nq = new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 1, 0), dev[idx].n);
		dev[idx].delay = k / NF;
		dev[idx].emerge = dev[idx].dist / maxDist;
		dev[idx].wave = -99; dev[idx].fail = false; dev[idx].fix = -99; dev[idx].next = 0;
	});
	var G_GLOBE = new T.Vector3(0, 15, -46), G_YOU = new T.Vector3(1.5, 5.5, -40), RG = 12;
	var spin = 0, spinVel = 0, spinUser = false;

	/* ---------- switch ring, arcs, pulses ---------- */
	var ringGroup = new T.Group(); scene.add(ringGroup);
	var ringMat = new T.MeshBasicMaterial({ color: new T.Color(0x5fe3da).multiplyScalar(1.8), transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false, toneMapped: false, fog: false });
	var ringMat2 = ringMat.clone(); ringMat2.color = new T.Color(0x5fe3da);
	var ring = new T.Mesh(new T.TorusGeometry(1, 0.0016, 6, 200), ringMat); ring.rotation.x = Math.PI / 2; ringGroup.add(ring);
	var ringSoft = new T.Mesh(new T.TorusGeometry(1, 0.008, 6, 200), ringMat2); ringSoft.rotation.x = Math.PI / 2; ringGroup.add(ringSoft);
	var RING_C = new T.Vector3(0, 5.5, -16), RING_R = 10;
	var NA = low ? 18 : 30, arcs = [];
	var arcMat = new T.LineBasicMaterial({ color: 0x5fe3da, transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false, toneMapped: false });
	var near = order.filter(function (i) { return dev[i].gp.z < -2 && dev[i].gp.z > -34 && Math.abs(dev[i].gp.x) < 26; });
	for (var a = 0; a < NA; a++) {
		var di = near[Math.floor((a + 0.5) / NA * near.length * 0.97)] || order[a];
		var start = dev[di].gp.clone().add(new T.Vector3(0, 0.6, -0.4));
		var ang = a / NA * Math.PI * 2, end = RING_C.clone().add(new T.Vector3(Math.cos(ang) * RING_R, 0, Math.sin(ang) * RING_R));
		var ctrl = start.clone().lerp(end, 0.5).add(new T.Vector3(0, 6, 0));
		var curve = new T.QuadraticBezierCurve3(start, ctrl, end);
		var line = new T.Line(new T.BufferGeometry().setFromPoints(curve.getPoints(32)), arcMat);
		line.frustumCulled = false; scene.add(line); arcs.push(curve);
	}
	var NPUL = low ? 40 : 80, pul = [], pulPos = new Float32Array(NPUL * 3), pulCol = new Float32Array(NPUL * 3);
	var PC = { ok: new T.Color(0x5fe3da), cd: new T.Color(0xffb04a), sd: new T.Color(0xff6b5e) };
	function pType() { var r = Math.random(); return r < 0.78 ? 'ok' : r < 0.94 ? 'cd' : 'sd'; }
	for (var q = 0; q < NPUL; q++) pul.push({ a: q % NA, u: Math.random(), s: 0.25 + Math.random() * 0.35, t: pType() });
	var pulG = new T.BufferGeometry(); pulG.setAttribute('position', new T.BufferAttribute(pulPos, 3)); pulG.setAttribute('color', new T.BufferAttribute(pulCol, 3));
	var pulMat = new T.PointsMaterial({ size: 1.3, map: dotTex, vertexColors: true, transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending, sizeAttenuation: true });
	var pulses = new T.Points(pulG, pulMat); pulses.frustumCulled = false; scene.add(pulses);

	/* ---------- country pins ---------- */
	var PINS = [[6.5, 3.4], [8.5, -13.2], [3.9, 11.5], [-15.4, 28.3]];
	var pinMeshes = PINS.map(function (ll, i) {
		var lat = ll[0] * Math.PI / 180, lon = (ll[1] - 10) * Math.PI / 180;
		var v = new T.Vector3(Math.cos(lat) * Math.sin(lon), Math.sin(lat), Math.cos(lat) * Math.cos(lon));
		var m = new T.Mesh(new T.SphereGeometry(i === 0 ? 0.3 : 0.24, 16, 12), new T.MeshBasicMaterial({ color: i === 0 ? 0xffd27a : 0x5fe3da, transparent: true, opacity: 0, toneMapped: false, fog: false }));
		m.userData.v = v; scene.add(m); return m;
	});
	var pinLabels = $$('.pin-label'), ringLabel = $('#ringLabel');

	/* ---------- camera timeline ---------- */
	function V(x, y, z) { return new T.Vector3(x, y, z); }
	var KF = [
		[0, V(0, 0.38, -0.05), V(-2.6, 2.45, 4.1)], [0.055, V(0, 0.38, -0.05), V(-2.6, 2.45, 4.1)],
		[0.115, V(0, 0.5, -0.25), V(-1.7, 2.3, 3.4)], [0.19, V(0, 0.5, -0.25), V(-1.7, 2.3, 3.4)],
		[0.245, V(0, 0.5, -0.3), V(-0.95, 2.75, 3.35)], [0.315, V(0, 0.5, -0.3), V(-0.95, 2.75, 3.35)],
		[0.385, V(0, 0, -18), V(10, 26, 34)], [0.455, V(0, 0, -18), V(14, 24, 34)],
		[0.515, V(0, 0, -14), V(4, 17, 25)], [0.585, V(0, 0, -14), V(4, 17, 25)],
		[0.635, V(0, 4, -16), V(0, 11, 30)], [0.705, V(0, 4, -16), V(0, 11, 30)],
		[0.76, V(0, 15, -46), V(0, 5, 38)], [0.83, V(0, 15, -46), V(0, 5, 38)],
		[0.895, V(0.2, 0.7, -0.3), V(-1.2, 1.15, 3.9)], [1, V(0.2, 0.7, -0.3), V(-1.2, 1.15, 3.9)]
	];
	var camT = new T.Vector3(), camO = new T.Vector3(), tmpV = new T.Vector3();
	function camAt(p) {
		var i = 0; while (i < KF.length - 2 && p > KF[i + 1][0]) i++;
		var A = KF[i], B = KF[i + 1], t = sm(A[0], B[0], p);
		camT.copy(A[1]).lerp(B[1], t); camO.copy(A[2]).lerp(B[2], t);
		var near = p < 0.34 || p > 0.86;
		var asp = W / H, k = asp < 1 ? (near ? Math.max(1, 0.98 / asp) : Math.max(1, 0.82 / asp)) : 1;
		camO.multiplyScalar(k);
	}
	function viewOffset(on) {
		if (!on) { camera.clearViewOffset(); return; }
		if (phone()) camera.setViewOffset(W, H, 0, -H * 0.17, W, H);
		else camera.setViewOffset(W, H, -W * 0.19, 0, W, H);
	}

	/* ---------- interaction ---------- */
	var manual = -1, userYaw = 0, yawVel = 0, waveStart = -99, waveOrigin = new T.Vector3(), autoWaved = false, clock = 0;
	var ray = new T.Raycaster(), ndc = new T.Vector2(), plane = new T.Plane(new T.Vector3(0, 1, 0), 0);
	var drag = null;
	function toNdc(e) { var r = canvas.getBoundingClientRect(); ndc.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); }
	canvas.addEventListener('pointerdown', function (e) {
		if (game.on) { gameClick(e); return; }
		drag = { x: e.clientX, y: e.clientY, lx: e.clientX, t: performance.now(), moved: 0, mode: P < 0.09 ? 'yaw' : (P > 0.73 && P < 0.86 ? 'spin' : 'none') };
		if (drag.mode !== 'none') try { canvas.setPointerCapture(e.pointerId); } catch (x) { }
	});
	canvas.addEventListener('pointermove', function (e) {
		if (!drag) return;
		var dx = e.clientX - drag.lx; drag.lx = e.clientX; drag.moved += Math.abs(dx);
		if (drag.mode === 'yaw') { userYaw += dx * 0.009; yawVel = dx * 0.009; }
		if (drag.mode === 'spin') { spin += dx * 0.006; spinVel = dx * 0.006; spinUser = true; }
	});
	canvas.addEventListener('pointerup', function (e) {
		if (!drag) return;
		var d = drag; drag = null;
		if (d.moved > 6) return;
		toNdc(e); ray.setFromCamera(ndc, camera);
		if (P < 0.09) {
			var hit = ray.intersectObjects([card, base, head, scr], false);
			if (hit.length && manual < 0) { manual = 0; Snd.play('tap'); }
		} else if (P > 0.48 && P < 0.62) {
			if (ray.ray.intersectPlane(plane, tmpV)) { waveOrigin.copy(tmpV); waveStart = clock; Snd.play('wave'); }
		}
	});

	/* ---------- game: Incident ---------- */
	var gEl = $('#game'), gScore = $('#gScore'), gLevel = $('#gLevel'), gFail = $('#gFail'), gLimit = $('#gLimit'), gBest = $('#gBest'), gCount = $('#gCount'), gEnd = $('#gEnd'), gEndText = $('#gEndText'), gHint = $('#gHint');
	var LEVELS = [0, 6, 14, 24, 36, 50];
	function best() { try { return +localStorage.getItem('incidentBest') || 0; } catch (e) { return 0; } }
	function startGame() {
		dev.forEach(function (d) { d.fail = false; d.fix = -99; });
		game = { on: true, score: 0, level: 1, failing: 0, limit: phone() ? 9 : 14, t: 0, spawn: 0.8, count: 3, over: false };
		root.classList.add('locked', 'gaming'); gEl.hidden = false; gEnd.hidden = true; gCount.hidden = false; gHint.hidden = false;
		gLimit.textContent = game.limit; gBest.textContent = best(); hud();
		return true;
	}
	function endGame() {
		game.over = true; var b = best();
		if (game.score > b) { b = game.score; try { localStorage.setItem('incidentBest', String(b)); } catch (e) { } }
		gEndText.textContent = 'You restored ' + game.score + ' terminal' + (game.score === 1 ? '' : 's') + ' and reached level ' + game.level + '. Best: ' + b + '.';
		gEnd.hidden = false; gHint.hidden = true; Snd.play('bad');
	}
	function quitGame() {
		game.on = false; dev.forEach(function (d) { d.fail = false; });
		root.classList.remove('locked', 'gaming'); gEl.hidden = true;
	}
	function hud() { gScore.textContent = game.score; gLevel.textContent = game.level; gFail.textContent = game.failing; }
	function screenOf(d, out) { out.copy(d.wp).project(camera); return out; }
	function onScreen(v) { return v.z < 1 && Math.abs(v.x) < 0.92 && v.y > -0.88 && v.y < 0.7; }
	function infect(d) { if (d.fail) return; d.fail = true; d.next = Math.max(1.1, 3.8 - game.level * 0.42) * (0.7 + Math.random() * 0.6); game.failing++; }
	function gameStep(dt) {
		if (game.count > 0) {
			game.count -= dt; gCount.textContent = Math.ceil(game.count);
			if (game.count <= 0) gCount.hidden = true; return;
		}
		if (game.over) return;
		game.t += dt; game.spawn -= dt;
		if (game.spawn <= 0) {
			for (var tries = 0; tries < 40; tries++) { var d = dev[Math.floor(Math.random() * NF)]; if (!d.fail && onScreen(screenOf(d, tmpV))) { infect(d); break; } }
			game.spawn = Math.max(0.5, 2.1 - game.level * 0.28);
		}
		dev.forEach(function (d) {
			if (!d.fail) return;
			d.next -= dt;
			if (d.next <= 0) {
				var nb = [[0, 1], [0, -1], [1, 0], [-1, 0]][Math.floor(Math.random() * 4)];
				var j = grid[(d.r + nb[0]) * 1000 + d.c + nb[1]];
				if (j !== undefined && onScreen(screenOf(dev[j], tmpV))) infect(dev[j]);
				d.next = Math.max(1.1, 3.8 - game.level * 0.42);
			}
		});
		var lv = 1; LEVELS.forEach(function (s, i) { if (game.score >= s) lv = i + 1; }); game.level = Math.min(6, lv);
		hud();
		if (game.failing >= game.limit) endGame();
	}
	function gameClick(e) {
		if (game.count > 0 || game.over) return;
		var r = canvas.getBoundingClientRect(), px = e.clientX - r.left, py = e.clientY - r.top, bestD = e.pointerType === 'touch' ? 80 : 60, pick = null;
		dev.forEach(function (d) {
			if (!d.fail) return; screenOf(d, tmpV);
			var sx = (tmpV.x + 1) / 2 * r.width, sy = (1 - tmpV.y) / 2 * r.height, dd = Math.hypot(sx - px, sy - py);
			if (dd < bestD) { bestD = dd; pick = d; }
		});
		if (pick) { pick.fail = false; pick.fix = clock; game.failing--; game.score++; Snd.play('fix'); hud(); }
	}
	$('#gQuit').addEventListener('click', quitGame);
	$('#gBack').addEventListener('click', quitGame);
	$('#gAgain').addEventListener('click', startGame);
	addEventListener('keydown', function (e) { if (e.key === 'Escape' && game.on) quitGame(); });
	$$('[data-game]').forEach(function (b) { b.addEventListener('click', function () { startGame(); }); });
	window.Film = { startGame: startGame };

	/* ---------- per-frame world ---------- */
	var M = new T.Matrix4(), S3 = new T.Vector3(), Pq = new T.Quaternion(), Pv = new T.Vector3(), spinQ = new T.Quaternion(), sv = new T.Vector3(), col = new T.Color();
	var SCR_LOCAL = new T.Vector3(0, 0.62, -0.47);
	var BASE_C = new T.Color(0x3cc2bf), WAVE_C = new T.Color(0xc8ffff), FAIL_C = new T.Color(0xff3b2e), FIX_C = new T.Color(0x4fe09a), DARK_C = new T.Color(0x0a1214);
	var gNow = new T.Vector3(), lastDirty = '';
	function world(N, dt) {
		var gT = game.on ? 0 : sm(0.71, 0.79, P);
		var you = sm(0.84, 0.9, P);
		gNow.copy(G_GLOBE).lerp(G_YOU, you);
		if (!spinUser && !drag) spin += dt * 0.05 * (gT > 0.5 ? 1 : 0);
		spin += spinVel; spinVel *= 0.92;
		spinQ.setFromAxisAngle(new T.Vector3(0, 1, 0), spin);
		var showFleet = N > 0.01 || game.on;
		fBody.visible = fHead.visible = fScr.visible = halo.visible = showFleet;
		if (showFleet) {
			var glow = game.on ? 1 : N;
			for (var i = 0; i < NF; i++) {
				var d = dev[i];
				var e = game.on ? 1 : cl(N * 1.9 - d.emerge * 0.9, 0, 1); e = e * e * (3 - 2 * e);
				var t = cl(gT * 1.6 - d.delay * 0.6, 0, 1); t = t * t * (3 - 2 * t);
				if (t <= 0) { Pv.copy(d.gp); Pq.copy(d.gq); }
				else {
					sv.copy(d.n).applyQuaternion(spinQ).multiplyScalar(RG).add(gNow);
					Pv.copy(d.gp).lerp(sv, t); Pv.y += Math.sin(t * Math.PI) * 7;
					Pq.copy(spinQ).multiply(d.nq); Pq.copy(d.gq).slerp(Pq, t);
				}
				S3.setScalar(Math.max(0.0001, e));
				M.compose(Pv, Pq, S3);
				fBody.setMatrixAt(i, M); fHead.setMatrixAt(i, M); fScr.setMatrixAt(i, M);
				d.wp = d.wp || new T.Vector3(); d.wp.copy(SCR_LOCAL).applyMatrix4(M);
				haloPos[i * 3] = d.wp.x; haloPos[i * 3 + 1] = d.wp.y + 0.1; haloPos[i * 3 + 2] = d.wp.z;
				// colour
				col.copy(DARK_C).lerp(BASE_C, glow * 0.85);
				if (t > 0) {
					var lit = cl(0.35 + 0.65 * Math.max(0, sv.copy(d.n).applyQuaternion(spinQ).dot(tmpV.set(0.55, 0.35, 0.75))), 0, 1);
					col.multiplyScalar(lerp(1, 0.45 + lit * 0.9, t));
				}
				if (waveStart > -50) {
					var w = clock - waveStart - Math.hypot(d.gp.x - waveOrigin.x, d.gp.z - waveOrigin.z) / 26;
					if (w > 0 && w < 0.9) col.lerp(WAVE_C, Math.sin(w / 0.9 * Math.PI));
				}
				if (game.on && d.fail) col.copy(FAIL_C).multiplyScalar(0.8 + 0.3 * Math.sin(clock * 9 + i));
				else if (clock - d.fix < 0.7) col.lerp(FIX_C, 1 - (clock - d.fix) / 0.7);
				fScr.setColorAt(i, col);
				haloCol[i * 3] = col.r * 0.55 * e; haloCol[i * 3 + 1] = col.g * 0.55 * e; haloCol[i * 3 + 2] = col.b * 0.55 * e;
			}
			fBody.instanceMatrix.needsUpdate = fHead.instanceMatrix.needsUpdate = fScr.instanceMatrix.needsUpdate = true;
			if (fScr.instanceColor) fScr.instanceColor.needsUpdate = true;
			haloG.attributes.position.needsUpdate = true; haloG.attributes.color.needsUpdate = true;
		}
		// ring
		var ringV = game.on ? 0 : sm(0.6, 0.64, P);
		ringMat.opacity = ringV * 0.95; ringMat2.opacity = ringV * 0.35;
		ringGroup.visible = ringV > 0.001;
		var rc = tmpV.copy(RING_C).lerp(gNow, gT);
		ringGroup.position.copy(rc); ringGroup.scale.setScalar(lerp(RING_R, RG * 1.12, gT));
		var arcV = game.on ? 0 : sm(0.6, 0.64, P) * (1 - sm(0.705, 0.735, P));
		arcMat.opacity = arcV * 0.32; pulMat.opacity = arcV;
		pulses.visible = arcV > 0.001;
		if (pulses.visible) {
			pul.forEach(function (p, k) {
				p.u += dt * p.s; if (p.u > 1) { p.u -= 1; p.t = pType(); p.a = Math.floor(Math.random() * NA); }
				var pt = arcs[p.a].getPoint(p.u);
				pulPos[k * 3] = pt.x; pulPos[k * 3 + 1] = pt.y; pulPos[k * 3 + 2] = pt.z;
				var cc = PC[p.t]; pulCol[k * 3] = cc.r; pulCol[k * 3 + 1] = cc.g; pulCol[k * 3 + 2] = cc.b;
			});
			pulG.attributes.position.needsUpdate = true; pulG.attributes.color.needsUpdate = true;
		}
		// pins
		var pinV = game.on ? 0 : sm(0.745, 0.78, P) * (1 - sm(0.835, 0.865, P));
		pinMeshes.forEach(function (m, i) {
			m.position.copy(m.userData.v).applyQuaternion(spinQ).multiplyScalar(RG * 1.04).add(gNow);
			m.material.opacity = pinV; m.visible = pinV > 0.001;
			var lab = pinLabels[i]; if (!lab) return;
			var facing = sv.copy(m.position).sub(gNow).normalize().dot(tmpV.copy(camera.position).sub(m.position).normalize());
			var o = pinV * cl((facing - 0.1) * 4, 0, 1);
			if (o > 0.01) { sv.copy(m.position).project(camera); lab.style.left = ((sv.x + 1) / 2 * W).toFixed(1) + 'px'; lab.style.top = ((1 - sv.y) / 2 * H).toFixed(1) + 'px'; }
			lab.style.opacity = o.toFixed(3);
		});
		// ring label
		var rlo = ringV * (1 - sm(0.705, 0.73, P));
		if (rlo > 0.01) { sv.copy(RING_C).add(tmpV.set(0, 0, RING_R)).project(camera); ringLabel.style.left = ((sv.x + 1) / 2 * W).toFixed(1) + 'px'; ringLabel.style.top = ((1 - sv.y) / 2 * H).toFixed(1) + 'px'; }
		ringLabel.style.opacity = rlo.toFixed(3);
	}

	function hero(N, dt) {
		// card + screen state
		var e, mode, k = 0, rl;
		if (manual >= 0 && P < 0.09) {
			manual += dt;
			e = manual < 2.6 ? sm(0, 0.7, manual) : 1 - sm(2.6, 3.4, manual);
			mode = manual < 0.75 ? 'idle' : manual < 1.7 ? 'auth' : manual < 3.4 ? 'ok' : 'idle';
			k = cl((manual - 0.75) / 0.95, 0, 1);
			if (manual >= 1.7 && manual - dt < 1.7) Snd.play('ok');
			rl = sm(1.75, 2.3, manual) * (1 - sm(2.8, 3.4, manual));
			if (manual > 3.5) manual = -1;
		} else {
			if (P >= 0.09) manual = -1;
			e = sm(0.075, 0.15, P) * (1 - sm(0.19, 0.235, P));
			mode = P < 0.1 ? 'idle' : P < 0.205 ? 'auth' : P < 0.86 ? 'ok' : 'you';
			k = sm(0.115, 0.2, P);
			rl = P < 0.86 ? sm(0.265, 0.305, P) : sm(0.885, 0.94, P);
		}
		drawScreen(mode, k + (mode === 'auth' ? clock * 0.02 : 0));
		drawReceipt(P >= 0.86 ? 'you' : 'sale');
		card.position.copy(cardRest.p).lerp(cardTap.p, e); card.position.y += Math.sin(e * Math.PI) * 0.5;
		card.quaternion.copy(qRest).slerp(qTap, e);
		var len = Math.max(0.0001, rl * RCP_MAX); receipt.scale.y = len;
		rcpTex.repeat.set(1, len / RCP_MAX); rcpTex.offset.set(0, 1 - len / RCP_MAX);
		receipt.visible = len > 0.002;
		// spin
		if (!drag) { userYaw += yawVel; yawVel *= 0.93; if (P > 0.09) userYaw *= 0.94; }
		rig.rotation.y = -0.28 + userYaw;
		// lights by night
		hemi.intensity = lerp(0.75, 0.1, N); hemi.color.setHSL(0.5, lerp(0, 0.3, N), lerp(1, 0.75, N));
		key.intensity = lerp(1.5, 0.28, N); rim.intensity = lerp(0.45, 0.75, N); moon.intensity = lerp(0, 0.95, N);
		screenLight.intensity = lerp(0, 0.9, N);
		desk.material.opacity = 0.16 * (1 - N);
		scene.fog.density = N * 0.012;
	}

	/* ---------- loop ---------- */
	var last = performance.now(), running = true;
	function frame(now) {
		requestAnimationFrame(frame);
		var dt = Math.min(0.05, (now - last) / 1000); last = now; clock += dt;
		readScroll();
		var N = game.on ? 1 : sm(0.33, 0.4, P);
		chrome(N);
		if (document.hidden) return;
		if (!game.on && filmBottom < -40) return; // page sections cover the canvas
		if (game.on) gameStep(dt);
		// auto wave once when the change chapter arrives
		if (!autoWaved && P > 0.52 && P < 0.6) { autoWaved = true; waveOrigin.set(0, 0, -6); waveStart = clock; }
		if (P < 0.45) autoWaved = false;
		hero(N, dt);
		if (game.on) { camT.set(0, 0, -15); camO.set(0, 27, 21).multiplyScalar(W / H < 1 ? Math.max(1, 0.8 / (W / H)) : 1); }
		else camAt(P);
		camera.position.copy(camT).add(camO); camera.lookAt(camT);
		viewOffset(!game.on);
		world(N, dt);
		renderer.render(scene, camera);
	}
	sizeAll();
	addEventListener('resize', sizeAll);
	requestAnimationFrame(frame);
})();
