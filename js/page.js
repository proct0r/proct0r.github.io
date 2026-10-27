/* Everything after the film. */
(function () {
	'use strict';
	var root = document.documentElement;
	var $ = function (s, c) { return (c || document).querySelector(s); };
	var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
	var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
	var io = 'IntersectionObserver' in window;
	function css(v) { return getComputedStyle(root).getPropertyValue(v).trim(); }
	var fmt = function (n) { return '₦' + n.toLocaleString('en-NG'); };

	/* ---------- reveal ---------- */
	if (io && !reduce) {
		var rvObs = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); rvObs.unobserve(e.target); } }); }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
		$$('.rv').forEach(function (el) { rvObs.observe(el); });
	} else $$('.rv').forEach(function (el) { el.classList.add('in'); });

	/* ---------- sound + console buttons ---------- */
	var snd = $('#snd');
	if (snd && window.Snd) {
		snd.setAttribute('aria-pressed', Snd.on ? 'true' : 'false');
		snd.addEventListener('click', function () { Snd.set(!Snd.on); snd.setAttribute('aria-pressed', Snd.on ? 'true' : 'false'); });
	}

	/* ---------- work rows ---------- */
	$$('.work details').forEach(function (d) {
		d.addEventListener('toggle', function () {
			var b = $('.w-b', d), r = $('.rollout', d);
			if (!d.open) { b.classList.remove('rolled'); r.classList.remove('go'); return; }
			r.classList.remove('go'); void r.offsetWidth; r.classList.add('go');
			if (window.Snd) Snd.play('click');
			setTimeout(function () { b.classList.add('rolled'); if (window.Snd) Snd.play('ok'); }, reduce ? 0 : 1650);
		});
	});

	/* ---------- SoidPay swipe game ---------- */
	var gate = $('#tvGate'), badge = $('#tvBadge'), st = $('#tvStatus'), role = $('#tvRole');
	if (gate && badge) (function () {
		var chat = $('#waChat'), rows = $('#ledRows'), balOk = $('#balOk'), topUp = $('#topUp'), fx = $('#payFx');
		var who = 'Ada', amt = 5000, wallet = 20000, debits = 0, credits = 0, n = 0, bestSwipe = 0, ref = 4100, busy = false;
		var sx = 0, x = 0, dragging = false, samples = [], t0 = 0;
		var REPLIES = {
			Ada: ['Received! You\'re a legend.', 'Omo, alert don land 🙌', 'Thanks! Lunch is on me.', 'That was fast. Like, really fast.'],
			Tunde: ['Boss! Thank you sir 🙏', 'Seen. Na you be the real MVP.', 'Alert received. Suya tonight?', 'Ah, you paid back early? Respect.'],
			Mum: ['God bless you my son ❤️', 'Received. Have you eaten?', 'Thank you. Call me later.', 'Ah! My son is a big man now 😄']
		};
		var SLOW = ['Card read timed out. Swipe like you mean it.', 'Too slow. The reader fell asleep.'];
		var FAST = ['Whoa, slow down. Even the switch needs a second.', 'Too fast to read. Smooth and steady wins.'];
		function label() {
			role.textContent = fmt(amt) + ' to ' + who + ' · pending';
			badge.setAttribute('aria-label', 'Payment card. Drag it through the reader, or press Enter, to pay ' + fmt(amt) + ' to ' + who);
		}
		function bal() { $('#tvBal').textContent = fmt(wallet); topUp.hidden = wallet >= 1000; }
		$$('.pay .who').forEach(function (b) { b.addEventListener('click', function () { who = b.getAttribute('data-who'); $$('.pay .who').forEach(function (o) { o.setAttribute('aria-pressed', o === b ? 'true' : 'false'); }); label(); if (window.Snd) Snd.play('click'); }); });
		$$('.pay .amt').forEach(function (b) { b.addEventListener('click', function () { amt = +b.getAttribute('data-amt'); $$('.pay .amt').forEach(function (o) { o.setAttribute('aria-pressed', o === b ? 'true' : 'false'); }); label(); if (window.Snd) Snd.play('click'); }); });
		function say(cls, html) {
			var first = $('.sys', chat); if (first && first.textContent.indexOf('Swipe the card') === 0) first.remove();
			var d = document.createElement('div'); d.className = 'bub ' + cls; d.innerHTML = html; chat.appendChild(d); chat.scrollTop = chat.scrollHeight; return d;
		}
		function post(entries) {
			var e = $('.empty', rows); if (e) e.remove();
			entries.forEach(function (en) {
				var tr = document.createElement('tr'); tr.className = 'new';
				tr.innerHTML = '<td>' + en[0] + '</td><td class="' + (en[1] === 'DEBIT' ? 'd' : 'c') + '">' + en[1] + '</td><td>' + en[2].toLocaleString('en-NG') + '</td>';
				rows.appendChild(tr); if (en[1] === 'DEBIT') debits += en[2]; else credits += en[2];
			});
			while (rows.children.length > 6) rows.removeChild(rows.firstChild);
			balOk.textContent = 'Σ ' + debits.toLocaleString('en-NG') + ' = Σ ' + credits.toLocaleString('en-NG') + ' ✓';
			balOk.classList.remove('pop'); void balOk.offsetWidth; balOk.classList.add('pop');
		}
		/* coins + confetti */
		var parts = [], fxOn = false, g = fx.getContext && fx.getContext('2d');
		function burst() {
			if (!g || reduce) return;
			var r = fx.getBoundingClientRect(), rd = $('.tv-reader', gate).getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
			fx.width = r.width * dpr; fx.height = r.height * dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0);
			var ox = rd.left - r.left + rd.width / 2, oy = rd.top - r.top + rd.height * 0.4;
			var cols = ['#5FE3DA', '#3DD47A', '#FFD27A', '#E2687B', '#5B8DEF'];
			for (var i = 0; i < 70; i++) {
				var coin = i % 3 === 0, a = -Math.PI / 2 + (Math.random() - 0.5) * 2.6, sp = 260 + Math.random() * 420;
				parts.push({ x: ox, y: oy, vx: Math.cos(a) * sp - 120, vy: Math.sin(a) * sp, r: coin ? 9 + Math.random() * 4 : 4 + Math.random() * 3, coin: coin, c: cols[i % cols.length], rot: Math.random() * 6, vr: (Math.random() - 0.5) * 12, life: 1.6 + Math.random() * 0.6 });
			}
			if (!fxOn) { fxOn = true; var last = performance.now(); requestAnimationFrame(function loop(t) {
				var dt = Math.min(0.033, (t - last) / 1000); last = t;
				g.clearRect(0, 0, fx.width, fx.height);
				parts = parts.filter(function (p) { return (p.life -= dt) > 0; });
				parts.forEach(function (p) {
					p.vy += 900 * dt; p.vx *= 0.99; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
					g.save(); g.globalAlpha = Math.min(1, p.life * 1.5); g.translate(p.x, p.y); g.rotate(p.rot);
					if (p.coin) {
						g.scale(Math.abs(Math.cos(p.rot * 1.3)) * 0.8 + 0.2, 1);
						g.fillStyle = '#E8B93A'; g.beginPath(); g.arc(0, 0, p.r, 0, 7); g.fill();
						g.strokeStyle = '#B9963C'; g.lineWidth = 2; g.stroke();
						g.fillStyle = '#7A5A12'; g.font = '700 ' + Math.round(p.r * 1.2) + 'px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('₦', 0, 1);
					} else { g.fillStyle = p.c; g.fillRect(-p.r, -p.r / 2.5, p.r * 2, p.r / 1.25); }
					g.restore();
				});
				if (parts.length) requestAnimationFrame(loop); else { fxOn = false; g.clearRect(0, 0, fx.width, fx.height); }
			}); }
		}
		/* swipe mechanics */
		function maxX() { var r = gate.getBoundingClientRect(), b = badge.getBoundingClientRect(); return r.width - b.width * 0.35; }
		function setX(v) { x = v; badge.style.setProperty('--x', v.toFixed(1) + 'px'); }
		function settle(msg, ms) { gate.classList.remove('reading', 'dragging'); setX(0); if (msg) { st.textContent = msg; setTimeout(function () { if (!busy) st.textContent = 'Swipe to pay'; }, ms || 1800); } }
		function deny(msg, chatMsg) {
			gate.classList.remove('reading'); gate.classList.add('denied'); if (window.Snd) Snd.play('bad');
			setTimeout(function () { gate.classList.remove('denied'); }, 600);
			settle(msg); if (chatMsg) say('bot', chatMsg);
		}
		function pay(swipeMs) {
			if (busy) return;
			if (wallet < amt) {
				deny('Declined · 51', '✕ <b>Declined: insufficient funds.</b> You have ' + fmt(wallet) + ' and this needs ' + fmt(amt) + '. ' + who + ' will have to wait.<small>RESP 51</small>');
				topUp.hidden = false; return;
			}
			busy = true; gate.classList.remove('reading', 'dragging', 'denied'); gate.classList.add('granted');
			var ms = 140 + Math.floor(Math.random() * 110), r = ++ref, amount = amt, to = who;
			st.textContent = 'Approved'; role.textContent = fmt(amount) + ' to ' + to + ' · paid';
			wallet -= amount; bal(); burst(); if (window.Snd) Snd.play('ok');
			if (navigator.vibrate) try { navigator.vibrate(30); } catch (e) { }
			n++; $('#stN').textContent = n; $('#stMs').textContent = ms + ' ms';
			if (swipeMs) { if (!bestSwipe || swipeMs < bestSwipe) bestSwipe = swipeMs; $('#stBest').textContent = (bestSwipe / 1000).toFixed(2) + ' s'; }
			say('me', 'SEND ' + amount + ' TO ' + to.toUpperCase());
			setTimeout(function () { say('bot', '✓ <b>Sent ' + fmt(amount) + ' to ' + to + '.</b> Balance ' + fmt(wallet) + '.<small>Ref SP-' + r + ' · ' + ms + ' ms</small>'); post([['Your wallet', 'DEBIT', amount], [to + ' · wallet', 'CREDIT', amount]]); }, reduce ? 0 : 450);
			setTimeout(function () {
				var t = say('them', '<b>' + to + '</b><span class="typing"><i></i><i></i><i></i></span>');
				setTimeout(function () { var list = REPLIES[to]; t.innerHTML = '<b>' + to + '</b>' + list[Math.floor(Math.random() * list.length)]; chat.scrollTop = chat.scrollHeight; if (window.Snd) Snd.play('tap'); }, reduce ? 0 : 1100);
			}, reduce ? 0 : 1100);
			setTimeout(function () { setX(0); }, 900);
			setTimeout(function () { gate.classList.remove('granted'); st.textContent = 'Swipe to pay'; busy = false; label(); }, 2600);
		}
		topUp.addEventListener('click', function () {
			wallet += 20000; bal(); post([['Card top-up', 'DEBIT', 20000], ['Your wallet', 'CREDIT', 20000]]);
			say('bot', '✓ Wallet funded with ' + fmt(20000) + '. Balance ' + fmt(wallet) + '.'); if (window.Snd) Snd.play('fix');
		});
		badge.addEventListener('pointerdown', function (e) {
			if (busy) return;
			dragging = true; sx = e.clientX - x; t0 = performance.now(); samples = [{ x: e.clientX, t: t0 }];
			gate.classList.add('dragging'); try { badge.setPointerCapture(e.pointerId); } catch (er) { }
		});
		badge.addEventListener('pointermove', function (e) {
			if (!dragging) return;
			var v = Math.max(0, Math.min(maxX(), e.clientX - sx)); setX(v);
			samples.push({ x: e.clientX, t: performance.now() }); if (samples.length > 6) samples.shift();
			var reading = v > maxX() * 0.55;
			if (reading && !gate.classList.contains('reading') && window.Snd) Snd.play('tap');
			gate.classList.toggle('reading', reading); st.textContent = reading ? 'Reading…' : 'Swipe to pay';
		});
		badge.addEventListener('pointerup', function () {
			if (!dragging) return; dragging = false;
			var a = samples[0], b = samples[samples.length - 1], speed = b && a && b.t > a.t ? Math.abs(b.x - a.x) / (b.t - a.t) * 1000 : 0, took = performance.now() - t0;
			if (x > maxX() * 0.82) {
				if (speed > 4200) deny('Too fast', FAST[Math.floor(Math.random() * FAST.length)]);
				else if (took > 4000) deny('Timed out', SLOW[Math.floor(Math.random() * SLOW.length)]);
				else pay(took);
			} else if (x > maxX() * 0.4) deny('Swipe all the way');
			else settle();
		});
		badge.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pay(0); } });
		label(); bal();
	})();

	/* ---------- toolbox ---------- */
	var GROUPS = [
		['Payments', '#3CC2BF', ['Postilion', 'ISO 8583', 'BankWorld', 'SmartVista', 'FEP routing', 'EMV', 'Scheme certs', 'Card management']],
		['Reliability', '#5B8DEF', ['SRE', 'High availability', 'Active-Active', 'Disaster recovery', 'Load balancing', 'Change mgmt', 'RCA']],
		['Observability', '#E0A23A', ['Prometheus', 'Grafana', 'Alertmanager', 'Exporters', 'Windows Exporter', 'SLOs']],
		['Security', '#E2687B', ['Thales HSM', 'PCI DSS', 'Passkeys', 'Argon2id', 'Encryption', 'Semgrep', 'Trivy', 'OWASP ZAP', 'STRIDE']],
		['Build', '#9B7BEA', ['Node.js', 'TypeScript', 'NestJS', 'Fastify', 'Express', 'Next.js', 'React', 'REST APIs', 'Playwright', 'Vitest']],
		['Data & infra', '#4CC97F', ['SQL Server', 'PostgreSQL', 'PostGIS', 'Redis', 'RabbitMQ', 'Docker', 'Kubernetes', 'GitHub Actions', 'Cloudflare', 'VMware']]
	];
	var USED = {
		'Postilion': 'The 5.5 → 5.6 production upgrade, routing changes, and the exporters that read from it.',
		'ISO 8583': 'The FEP desk: diagnosing live card failures field by field. Every scheme integration since.',
		'BankWorld': 'Card management at Access Bank, watched by the observability platform.',
		'SmartVista': 'Card and payment processing support at the bank.',
		'FEP routing': 'Tuning routing and FEP configuration to raise success rates.',
		'EMV': 'Chip transactions in production; EMV and card-not-present fraud training.',
		'Scheme certs': 'AfrigoCard launch and the Moniepoint and Hydrogen onboarding.',
		'Card management': 'CMS migrations for the bank and three subsidiaries, with zero downtime.',
		'SRE': 'Level 3 support, change, monitoring and incident review for the payments platform.',
		'High availability': 'Active-Active payment services and HSM pairs.',
		'Active-Active': 'HSM upgrade validation between production and DR.',
		'Disaster recovery': 'Every switch and HSM change proven on DR first.',
		'Load balancing': 'Draining HSM units one at a time during firmware upgrades.',
		'Change mgmt': 'Production changes with zero unplanned downtime. ITIL v4 certified.',
		'RCA': 'Critical incidents with Visa, Mastercard, Verve, NIBSS and Interswitch.',
		'Prometheus': 'The bank\'s observability platform and my open-source POP repo.',
		'Grafana': 'Eight KPI dashboards at the bank; a 13-panel dashboard in POP.',
		'Alertmanager': 'Approval-rate, availability and error-budget alerts in POP.',
		'Exporters': 'Node.js exporters reading Postilion\'s SQL Server into Prometheus.',
		'Windows Exporter': 'Host metrics for the payment servers.',
		'SLOs': 'Availability and approval-rate SLOs with error-budget burn alerts.',
		'Thales HSM': 'Firmware upgrades in production and DR with no processing interruption.',
		'PCI DSS': 'Remediation across the payment infrastructure; PCI DSS training.',
		'Passkeys': 'Every attendance-portal clock-in is signed with a device-bound passkey.',
		'Argon2id': 'Password and PIN hashing in SoidPay and the attendance portal.',
		'Encryption': 'SoidPay PII and webhook payloads; attendance coordinates at rest.',
		'Semgrep': 'Static analysis gate in the attendance portal\'s CI.',
		'Trivy': 'Container image scanning in CI; fails on fixable HIGH or CRITICAL.',
		'OWASP ZAP': 'Baseline and API scans of the attendance portal in CI.',
		'STRIDE': 'The attendance portal\'s threat model, with evidence for each mitigation.',
		'Node.js': 'Bank exporters, AccessNotify, POP, SoidPay and the attendance portal.',
		'TypeScript': 'SoidPay, the attendance portal and the SoidPay website.',
		'NestJS': 'SoidPay\'s API and worker: 91 endpoints across 20 modules.',
		'Fastify': 'The attendance portal API: 49 documented paths.',
		'Express': 'AccessNotify and the POP exporter.',
		'Next.js': 'The attendance portal\'s staff app and admin portal.',
		'React': 'The SoidPay website and the attendance portal.',
		'REST APIs': 'AccessNotify, SoidPay and the attendance portal.',
		'Playwright': 'End-to-end tests in real Chrome with a virtual authenticator.',
		'Vitest': 'Part of the attendance portal\'s 303 automated tests.',
		'SQL Server': 'Postilion data for the exporters and AccessNotify.',
		'PostgreSQL': 'SoidPay\'s ledger across 36 migrations.',
		'PostGIS': 'Attendance geofences: radius and polygon checks on every clock-in.',
		'Redis': 'Sessions, rate limits and replay protection.',
		'RabbitMQ': 'SoidPay\'s worker queues with delayed retries.',
		'Docker': 'Every Soid product and POP ship with Docker Compose.',
		'Kubernetes': 'SoidPay deployment manifests.',
		'GitHub Actions': 'CI for SoidPay, the attendance portal and POP.',
		'Cloudflare': 'SoidPay website hosting and security headers.',
		'VMware': 'Virtualised payment infrastructure at the bank.'
	};
	var tbList = $('#tbList');
	if (tbList) tbList.innerHTML = GROUPS.map(function (g) { return '<li>' + g[0] + ': ' + g[2].join(', ') + '</li>'; }).join('');

	var cv = $('#tbCanvas'), tip = $('#tbTip');
	if (cv && cv.getContext) (function () {
		var g = cv.getContext('2d'), Wc = 0, Hc = 0, dpr = 1, buckets = [], balls = [], segs = [], started = false, running = false, held = null, last = 0, inView = false;
		function layout() {
			var r = cv.getBoundingClientRect(); dpr = Math.min(2, window.devicePixelRatio || 1);
			Wc = r.width; Hc = r.height; cv.width = Wc * dpr; cv.height = Hc * dpr;
			var cols = Wc < 760 ? 3 : 6, rows = 6 / cols, gap = Wc < 760 ? 12 : 18, bw = (Wc - gap * (cols - 1)) / cols, bh = Wc < 760 ? 190 : 190;
			buckets = []; segs = [];
			GROUPS.forEach(function (gr, i) {
				var c = i % cols, rr = Math.floor(i / cols), x = c * (bw + gap), yb = Hc - 34 - (rows - 1 - rr) * (bh + 70);
				var b = { x: x + 4, w: bw - 8, y: yb - bh, h: bh, name: gr[0], color: gr[1], n: gr[2].length };
				buckets.push(b);
				segs.push([b.x, b.y, b.x + 6, yb], [b.x + 6, yb, b.x + b.w - 6, yb], [b.x + b.w - 6, yb, b.x + b.w, b.y]);
			});
			segs.push([0, Hc - 2, Wc, Hc - 2], [1, 0, 1, Hc], [Wc - 1, 0, Wc - 1, Hc]);
		}
		function makeBalls() {
			balls = [];
			g.font = '500 12.5px ' + css('--f-sans');
			GROUPS.forEach(function (gr, gi) {
				gr[2].forEach(function (name, k) {
					var tw = g.measureText(name).width, r = Math.max(23, Math.min(40, tw / 2 + 9));
					var b = buckets[gi];
					balls.push({ name: name, g: gi, r: r, x: b.x + 20 + Math.random() * (b.w - 40), y: b.y - 60 - k * 46 - Math.random() * 30, vx: 0, vy: 0 });
				});
			});
		}
		function tidy() {
			var count = {};
			balls.forEach(function (b) {
				var bk = buckets[b.g]; count[b.g] = (count[b.g] || 0) + 1;
				b.x = bk.x + bk.w / 2 + (Math.random() - 0.5) * (bk.w - 2 * b.r - 10); b.y = bk.y - 40 - count[b.g] * 42; b.vx = 0; b.vy = 0;
			});
			wake();
		}
		function shake() { balls.forEach(function (b) { b.vy -= 520 + Math.random() * 520; b.vx += (Math.random() - 0.5) * 520; }); wake(); }
		function segHit(b, s) {
			var ax = s[0], ay = s[1], bx = s[2], by = s[3], dx = bx - ax, dy = by - ay;
			var t = Math.max(0, Math.min(1, ((b.x - ax) * dx + (b.y - ay) * dy) / (dx * dx + dy * dy)));
			var px = ax + dx * t, py = ay + dy * t, ex = b.x - px, ey = b.y - py, d = Math.hypot(ex, ey), R = b.r + 3;
			if (d < R && d > 0.0001) {
				var nx = ex / d, ny = ey / d, pen = R - d; b.x += nx * pen; b.y += ny * pen;
				var vn = b.vx * nx + b.vy * ny; if (vn < 0) { b.vx -= 1.35 * vn * nx; b.vy -= 1.35 * vn * ny; b.vx *= 0.985; }
			}
		}
		function step(dt) {
			var sub = 3, h = dt / sub;
			for (var s = 0; s < sub; s++) {
				balls.forEach(function (b) {
					if (b === held) return;
					b.vy += 1500 * h; b.vx *= 0.999; b.x += b.vx * h; b.y += b.vy * h;
				});
				for (var i = 0; i < balls.length; i++) for (var j = i + 1; j < balls.length; j++) {
					var A = balls[i], B = balls[j], dx = B.x - A.x, dy = B.y - A.y, d = Math.hypot(dx, dy), R = A.r + B.r;
					if (d < R && d > 0.0001) {
						var nx = dx / d, ny = dy / d, pen = (R - d) / 2;
						if (A !== held) { A.x -= nx * pen; A.y -= ny * pen; }
						if (B !== held) { B.x += nx * pen; B.y += ny * pen; }
						var rv = (B.vx - A.vx) * nx + (B.vy - A.vy) * ny;
						if (rv < 0) { var imp = -1.2 * rv / 2; if (A !== held) { A.vx -= imp * nx; A.vy -= imp * ny; } if (B !== held) { B.vx += imp * nx; B.vy += imp * ny; } }
					}
				}
				balls.forEach(function (b) { if (b !== held) segs.forEach(function (sg) { segHit(b, sg); }); if (b.y < -400) b.y = -400; });
			}
		}
		function draw() {
			var fg = css('--fg'), muted = css('--muted'), line = css('--line-2'), bg = css('--bg');
			g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, Wc, Hc);
			buckets.forEach(function (b) {
				g.strokeStyle = line; g.lineWidth = 3; g.lineCap = 'round'; g.lineJoin = 'round';
				g.beginPath(); g.moveTo(b.x, b.y); g.lineTo(b.x + 6, b.y + b.h); g.lineTo(b.x + b.w - 6, b.y + b.h); g.lineTo(b.x + b.w, b.y); g.stroke();
				g.fillStyle = b.color; g.beginPath(); g.arc(b.x + 10, b.y + b.h + 20, 4, 0, 7); g.fill();
				g.fillStyle = muted; g.font = '500 11px ' + css('--f-mono'); g.textAlign = 'left'; g.textBaseline = 'middle';
				g.fillText(b.name.toUpperCase() + ' · ' + b.n, b.x + 20, b.y + b.h + 20);
			});
			balls.forEach(function (b) {
				var c = GROUPS[b.g][1];
				g.fillStyle = mix(c, bg, 0.16); g.strokeStyle = c; g.lineWidth = b === held ? 2.5 : 1.5;
				g.beginPath(); g.arc(b.x, b.y, b.r, 0, 7); g.fill(); g.stroke();
				g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
				g.font = '500 12.5px ' + css('--f-sans');
				var fs = Math.min(12.5, 12.5 * (b.r * 2 - 10) / Math.max(1, g.measureText(b.name).width));
				g.font = '500 ' + fs.toFixed(1) + 'px ' + css('--f-sans');
				g.fillText(b.name, b.x, b.y + 0.5);
			});
		}
		function mix(hex, bgc, a) {
			function rgb(h) { if (h.indexOf('#') !== 0) return [16, 19, 21]; h = h.slice(1); if (h.length === 3) h = h.replace(/./g, '$&$&'); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; }
			var A = rgb(hex), B = rgb(bgc);
			return 'rgb(' + A.map(function (v, i) { return Math.round(B[i] + (v - B[i]) * a); }).join(',') + ')';
		}
		var sleepT = 0;
		function loop(t) {
			if (!running) return;
			var dt = Math.min(0.033, (t - last) / 1000 || 0.016); last = t;
			step(dt); draw();
			var moving = balls.some(function (b) { return Math.abs(b.vx) + Math.abs(b.vy) > 70; }) || held;
			sleepT = moving ? 0 : sleepT + dt;
			if (sleepT > 1.2 || !inView) { running = false; return; }
			requestAnimationFrame(loop);
		}
		function wake() { if (!running) { running = true; sleepT = 0; last = performance.now(); requestAnimationFrame(loop); } }
		function start() { if (started) return; started = true; layout(); makeBalls(); if (reduce) { for (var i = 0; i < 400; i++) step(0.016); draw(); } else wake(); }
		var pick = null;
		function pos(e) { var r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
		cv.addEventListener('pointerdown', function (e) {
			var p = pos(e), hit = null;
			balls.forEach(function (b) { if (Math.hypot(b.x - p.x, b.y - p.y) < b.r) hit = b; });
			tip.hidden = true;
			if (!hit) return;
			held = hit; pick = { b: hit, x: p.x, y: p.y, moved: 0, hist: [{ x: p.x, y: p.y, t: performance.now() }] };
			cv.classList.add('grabbing'); try { cv.setPointerCapture(e.pointerId); } catch (er) { }
			e.preventDefault(); wake();
		});
		cv.addEventListener('pointermove', function (e) {
			if (!pick) return; var p = pos(e);
			pick.moved += Math.hypot(p.x - pick.x, p.y - pick.y); pick.x = p.x; pick.y = p.y;
			held.x = p.x; held.y = p.y; held.vx = 0; held.vy = 0;
			pick.hist.push({ x: p.x, y: p.y, t: performance.now() }); if (pick.hist.length > 5) pick.hist.shift();
		});
		function release() {
			if (!pick) return;
			var b = pick.b, h = pick.hist, a = h[0], z = h[h.length - 1], dt = Math.max(16, z.t - a.t) / 1000;
			cv.classList.remove('grabbing');
			if (pick.moved < 6) {
				tip.hidden = false;
				$('b', tip).textContent = b.name; $('.g i', tip).style.background = GROUPS[b.g][1]; $('.g em', tip).textContent = GROUPS[b.g][0];
				$('p', tip).textContent = USED[b.name] || 'Part of my day-to-day toolkit.';
				tip.style.left = Math.max(150, Math.min(Wc - 150, b.x)) + 'px'; tip.style.top = (b.y - b.r) + 'px';
				if (window.Snd) Snd.play('click');
			} else { b.vx = (z.x - a.x) / dt; b.vy = (z.y - a.y) / dt; }
			held = null; pick = null; wake();
		}
		cv.addEventListener('pointerup', release); cv.addEventListener('pointercancel', release);
		$('#tbShake').addEventListener('click', function () { start(); shake(); });
		$('#tbTidy').addEventListener('click', function () { start(); tidy(); });
		if (io) new IntersectionObserver(function (es) { inView = es[0].isIntersecting; if (inView) { start(); wake(); } }, { threshold: 0.25 }).observe(cv);
		else { inView = true; start(); }
		var rt; addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { if (started) { layout(); tidy(); } }, 200); });
		var mq = matchMedia('(prefers-color-scheme: dark)'); if (mq.addEventListener) mq.addEventListener('change', function () { if (started) draw(); });
	})();

	/* ---------- experience ---------- */
	var ROLES = [
		{ y: '2017', h: 'B.Tech, Meteorology & Climate Science', o: 'Federal University of Technology, Akure', p: 'Second Class Honours. A quantitative degree where measuring everything became a habit.', st: 'Completed' },
		{ y: '2021', h: 'FEP Support Engineer', o: 'Card payments', p: 'Monitored front-end processors for ATM, POS and web card transactions. Resolved live failures through <strong>ISO 8583</strong> analysis, logs and switch diagnostics with <strong>6 networks</strong>.', st: 'Aug 2021 — Sep 2022' },
		{ y: '2022', h: 'Implementation Engineer', o: 'Payment infrastructure', p: 'Implemented <strong>AfrigoCard</strong>, onboarded <strong>Moniepoint</strong> and <strong>Hydrogen</strong>, tuned routing and FEP configuration, and delivered <strong>zero-downtime</strong> migrations for subsidiaries in Sierra Leone, Zambia and Cameroon.', st: 'Oct 2022 — Sep 2023' },
		{ y: '2023', h: 'Technical Support Engineer, Payments Platform', o: 'Access Bank Plc', p: 'Level 3 support for card platforms. Led Postilion <strong>5.5 → 5.6</strong> with <strong>zero customer impact</strong>, upgraded production and DR HSMs, and built the <strong>8-dashboard</strong> observability platform.', st: 'Current', now: true },
		{ y: '2026', h: 'Product & Platform Engineer', o: 'Soid Technologies Limited', p: 'SoidPay: <strong>91 endpoints</strong>, <strong>32 of 38</strong> security findings closed, npm audit <strong>13 → 0</strong>. Attendance portal: <strong>74 ms p95</strong> at 2,000 clock-ins, 0 lost, <strong>303 tests</strong>. SoidPay website to <strong>v1.8</strong>.', st: 'Current', now: true }
	];
	var ports = $('#ports'), card = $('#careerCard'), track = $('#track'), plug = $('#plug'), wireOn = $('#wireOn'), cur = ROLES.length - 1;
	function portX(i) { return 6 + i * (88 / (ROLES.length - 1)); }
	if (ports) {
		ports.innerHTML = ROLES.map(function (r, i) { return '<button class="port on" type="button" data-i="' + i + '" style="left:' + portX(i) + '%"><i></i><span>' + r.y + '</span></button>'; }).join('');
		$('#pathList').innerHTML = ROLES.slice().reverse().map(function (r) { return '<div><span class="y">' + r.y + '</span><div><h3>' + r.h + '</h3><div class="o">' + r.o + '</div><p>' + r.p + '</p></div><span class="st' + (r.now ? ' now' : '') + '">' + r.st + '</span></div>'; }).join('');
	}
	function setRole(i, quiet) {
		cur = Math.max(0, Math.min(ROLES.length - 1, i)); var r = ROLES[cur];
		$$('.port', ports).forEach(function (p, k) { p.classList.toggle('on', k <= cur); p.classList.toggle('cur', k === cur); });
		plug.style.left = portX(cur) + '%'; wireOn.style.width = portX(cur) + '%';
		card.classList.remove('swap'); void card.offsetWidth; card.classList.add('swap');
		card.innerHTML = '<div class="cy">' + r.y + '</div><div><h3>' + r.h + '</h3><div class="o">' + r.o + '</div><p>' + r.p + '</p></div><span class="st' + (r.now ? ' now' : '') + '">' + r.st + '</span>';
		track.setAttribute('aria-valuenow', cur); track.setAttribute('aria-valuetext', r.y + ', ' + r.h);
		if (!quiet && window.Snd) Snd.play('tap');
	}
	if (track) {
		setRole(cur, true);
		var tdrag = null;
		function nearest(clientX) { var r = track.getBoundingClientRect(), pct = (clientX - r.left) / r.width * 100, b = 0, bd = 1e9; ROLES.forEach(function (x, i) { var d = Math.abs(portX(i) - pct); if (d < bd) { bd = d; b = i; } }); return { i: b, pct: Math.max(0, Math.min(100, pct)) }; }
		track.addEventListener('pointerdown', function (e) { tdrag = { moved: 0, x: e.clientX }; track.classList.add('dragging'); try { track.setPointerCapture(e.pointerId); } catch (er) { } });
		track.addEventListener('pointermove', function (e) { if (!tdrag) return; tdrag.moved += Math.abs(e.clientX - tdrag.x); tdrag.x = e.clientX; var n = nearest(e.clientX); plug.style.left = n.pct + '%'; wireOn.style.width = n.pct + '%'; });
		track.addEventListener('pointerup', function (e) { if (!tdrag) return; tdrag = null; track.classList.remove('dragging'); setRole(nearest(e.clientX).i); });
		track.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') { setRole(cur + 1); e.preventDefault(); } if (e.key === 'ArrowLeft') { setRole(cur - 1); e.preventDefault(); } });
		$('#careerAll').addEventListener('click', function () {
			var b = this, open = b.getAttribute('aria-expanded') === 'true';
			$('#pathList').hidden = open; b.setAttribute('aria-expanded', open ? 'false' : 'true'); b.textContent = open ? 'Show the whole list ›' : 'Show one year ‹';
		});
	}
	var CERTS = [
		['ACI', 'Postilion Basic & ISO 8583', 'ACI Worldwide', 'Postilion switch architecture and configuration, and the ISO 8583 standard behind card authorization.'],
		['MC', 'Mastercard Academy', 'Mastercard · Dubai', 'Mastercard network operations, transaction flows and scheme rules.'],
		['PCI', 'PCI DSS & Card Payment Security', 'Phillips Consulting', 'PCI DSS requirements for protecting cardholder data across payment systems.'],
		['EMV', 'EMV, eCommerce & CNP Fraud', 'Smart Commerce International · UK', 'EMV chip transactions, eCommerce payments and card-not-present fraud controls.'],
		['CBCI', 'Business Continuity', 'BCT London · UK', 'Business impact analysis, continuity strategy and recovery planning.'],
		['ITIL<br>v4', 'ITIL v4 Foundation', 'Service management', 'The service value system and practices for incident, problem and change management.'],
		['ACPP<br>1', 'Associate Cards & Payments Professional 1', 'Retail Banking Association', 'Cards and payments fundamentals: products, schemes, processing and settlement.'],
		['B.<br>Tech', 'Meteorology & Climate Science', 'FUT Akure · 2017', 'Second Class Honours. A quantitative, data-heavy science degree.']
	];
	var certs = $('#certs');
	if (certs) {
		certs.innerHTML = CERTS.map(function (c) {
			return '<button class="cert" type="button" aria-pressed="false"><span class="face front"><span class="seal">' + c[0] + '</span><b>' + c[1] + '</b><span class="m">' + c[2] + '</span><span class="hint">Flip ↻</span></span><span class="face back"><b>What it covers</b><span>' + c[3] + '</span><span class="m">' + c[2] + '</span></span></button>';
		}).join('');
		$$('.cert', certs).forEach(function (b) {
			b.addEventListener('click', function () { b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') === 'true' ? 'false' : 'true'); if (window.Snd) Snd.play('click'); });
			if (reduce) return;
			b.addEventListener('pointermove', function (e) {
				if (e.pointerType === 'touch') return;
				var r = b.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
				b.classList.add('tilting'); b.style.setProperty('--ry', ((px - 0.5) * 14).toFixed(2) + 'deg'); b.style.setProperty('--rx', ((0.5 - py) * 12).toFixed(2) + 'deg');
				b.style.setProperty('--mx', (px * 100).toFixed(1) + '%'); b.style.setProperty('--my', (py * 100).toFixed(1) + '%');
			});
			b.addEventListener('pointerleave', function () { b.classList.remove('tilting'); b.style.setProperty('--rx', '0deg'); b.style.setProperty('--ry', '0deg'); });
		});
	}

	/* ---------- console ---------- */
	var ps = $('#ps'), out = $('#termOut'), inp = $('#termIn'), form = $('#termForm'), lastFocus = null, hist = [], hi = 0;
	function print(html) { var d = document.createElement('div'); d.innerHTML = html; out.appendChild(d); out.scrollTop = out.scrollHeight; }
	var cmds = {
		help: function () { return '<span class="k">whoami</span>      who runs this switch\n<span class="k">uptime</span>      career so far\n<span class="k">projects</span>    what I\'ve shipped\n<span class="k">soid</span>        what I\'m building\n<span class="k">stats</span>       numbers worth knowing\n<span class="k">authorize</span>   authorize &lt;amount&gt;, e.g. authorize 2500\n<span class="k">incident</span>    play the Incident game\n<span class="k">contact</span>     how to reach me\n<span class="k">clear</span>       clear the screen\n<span class="k">exit</span>        close the console'; },
		whoami: function () { return 'sunday.ogunleye · payments · sre · builder\nLagos, Nigeria · open to opportunities'; },
		uptime: function () { return 'up 5+ years on production card payments\n<span class="o">0</span> customer-impact upgrades · <span class="o">0</span> min unplanned downtime'; },
		projects: function () { return '01 observability platform     8 live KPIs\n02 postilion 5.5 → 5.6        0 customer impact\n03 hsm prod + dr              0 interruptions\n04 afrigocard + fintechs      2 live\n05 subsidiaries               3 countries\n06 attendance portal          74 ms p95 @ 2,000\n07 soidpay platform           32/38 findings closed'; },
		soid: function () { return 'Soid Technologies Limited · 2026 — present\nsoidpay      whatsapp payments · 91 endpoints · npm audit 13 → 0\nattendance   74 ms p95 · 0 of 2,000 lost · 303 tests\nwebsite      v1.8 on cloudflare'; },
		stats: function () { return '5+    years in payments\n6     networks: visa mastercard verve nibss interswitch upsl\n3     countries rolled out\n8     live grafana kpis\n74    ms p95, attendance portal\n13→0  npm audit vulns, soidpay'; },
		contact: function () { return 'email     fidalex09@gmail.com\nlinkedin  linkedin.com/in/ogunleye-sunday-solomon-psce-005b8a101\ngithub    github.com/proct0r'; },
		ls: function () { return 'projects/  soid/  cv.pdf  coffee.txt'; },
		'cat coffee.txt': function () { return 'Required for every 2 a.m. change window.'; },
		cv: function () { return 'CV: <a href="Sunday_Ogunleye_CV.pdf" target="_blank" rel="noopener">Sunday_Ogunleye_CV.pdf ↗</a>'; }
	};
	function run(raw) {
		var c = raw.trim(); if (!c) return;
		print('<span class="k">SW&gt;</span> ' + c.replace(/</g, '&lt;'));
		var low = c.toLowerCase();
		if (low === 'clear') { out.innerHTML = ''; return; }
		if (low === 'exit' || low === 'quit') { closePs(); return; }
		if (low === 'incident' || low === 'play') { closePs(); if (window.Film) Film.startGame(); return; }
		if (low.indexOf('sudo') === 0) { print('<span class="w">sunday is not in the sudoers file. This incident will be reported.</span>\n<span class="d">(It went to the change advisory board. They said no.)</span>'); return; }
		if (/^authorize\b/.test(low)) {
			var amt = parseInt(low.replace(/[^0-9]/g, ''), 10);
			if (!amt) { print('usage: authorize &lt;amount&gt;'); return; }
			var ok = amt <= 500000, ms = 150 + Math.floor(Math.random() * 90);
			print('<span class="d">0100 → switch → hsm → scheme → issuer</span>');
			setTimeout(function () { print(ok ? '<span class="o">0110 · 00 Approved</span> · ' + fmt(amt) + ' · ' + ms + ' ms' : '<span class="w">0110 · 61 Exceeds withdrawal limit</span> · ' + fmt(amt)); if (window.Snd) Snd.play(ok ? 'ok' : 'bad'); }, reduce ? 0 : 420);
			return;
		}
		var f = cmds[low]; print(f ? f() : 'command not found: ' + c.replace(/</g, '&lt;') + ' · type <span class="k">help</span>');
	}
	function openPs() {
		lastFocus = document.activeElement; ps.hidden = false; root.classList.add('locked');
		if (!out.childNodes.length) print('<span class="d">Sunday\'s switch console. Nothing here leaves your browser.</span>\nType <span class="k">help</span> to begin.');
		setTimeout(function () { inp.focus(); }, 30);
	}
	function closePs() { ps.hidden = true; root.classList.remove('locked'); if (lastFocus && lastFocus.focus) lastFocus.focus(); }
	form.addEventListener('submit', function (e) { e.preventDefault(); hist.push(inp.value); hi = hist.length; run(inp.value); inp.value = ''; });
	inp.addEventListener('keydown', function (e) {
		if (e.key === 'ArrowUp' && hi > 0) { hi--; inp.value = hist[hi]; e.preventDefault(); }
		if (e.key === 'ArrowDown') { hi = Math.min(hist.length, hi + 1); inp.value = hist[hi] || ''; e.preventDefault(); }
	});
	$$('#psOpen, [data-console]').forEach(function (b) { b.addEventListener('click', openPs); });
	$('#psClose').addEventListener('click', closePs);
	ps.addEventListener('click', function (e) { if (e.target === ps) closePs(); });

	/* ---------- geofence ---------- */
	var geoModal = $('#geoModal');
	function openGeo() { geoModal.hidden = false; root.classList.add('locked'); $('#geoClose').focus(); }
	function closeGeo() { geoModal.hidden = true; root.classList.remove('locked'); }
	$$('[data-geo]').forEach(function (b) { b.addEventListener('click', openGeo); });
	$('#geoClose').addEventListener('click', closeGeo);
	geoModal.addEventListener('click', function (e) { if (e.target === geoModal) closeGeo(); });
	(function () {
		var svg = $('#geo svg'), pin = $('#geoPin'), gs = $('#geoStatus'), cx = 150, cy = 100, R = 56, drag = false;
		function pt(e) { var p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); }
		function place(x, y) {
			x = Math.max(12, Math.min(288, x)); y = Math.max(26, Math.min(196, y));
			pin.setAttribute('transform', 'translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ')');
			var d = Math.hypot(x - cx, y - cy);
			if (d <= R) { gs.className = 'geo-status'; $('span', gs).textContent = 'Recorded · inside the fence'; }
			else { gs.className = 'geo-status flag'; $('span', gs).textContent = 'Recorded and flagged · ' + Math.round((d - R) * 5) + ' m outside, sent for supervisor review'; }
		}
		pin.addEventListener('pointerdown', function (e) { drag = true; try { pin.setPointerCapture(e.pointerId); } catch (er) { } e.preventDefault(); });
		pin.addEventListener('pointermove', function (e) { if (drag) { var p = pt(e); place(p.x, p.y + 8); } });
		pin.addEventListener('pointerup', function () { drag = false; });
		svg.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('#geoPin')) return; var p = pt(e); place(p.x, p.y + 8); });
	})();

	/* ---------- keys ---------- */
	document.addEventListener('keydown', function (e) {
		if (e.key === 'Escape') { if (!ps.hidden) closePs(); if (!geoModal.hidden) closeGeo(); return; }
		var tag = (e.target.tagName || '').toLowerCase();
		if (e.key === '`' && ps.hidden && tag !== 'input' && tag !== 'textarea') { e.preventDefault(); openPs(); }
	});

	/* ---------- contact + footer ---------- */
	var cp = $('#copyMail');
	cp.addEventListener('click', function () {
		var em = 'fidalex09@gmail.com';
		var done = function () { cp.textContent = 'Copied ✓'; setTimeout(function () { cp.textContent = 'Copy email'; }, 1600); };
		var sel = function () { var r = document.createRange(); r.selectNodeContents($('#mail')); var s = getSelection(); s.removeAllRanges(); s.addRange(r); cp.textContent = 'Press Ctrl+C'; };
		try { navigator.clipboard.writeText(em).then(done, sel); } catch (e) { sel(); }
	});
	$('#again').addEventListener('click', function () {
		scrollTo({ top: 0, behavior: 'auto' });
		if (window.Intro) Intro.play(false);
	});
	var y = $('#year'); if (y) y.textContent = new Date().getFullYear();
})();
