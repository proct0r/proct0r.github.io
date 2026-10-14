(function () {
	const root = document.documentElement;

	// Theme toggle (remembered per browser)
	const themeBtn = document.getElementById('themeToggle');
	const setTheme = (t) => {
		root.setAttribute('data-theme', t);
		themeBtn.innerHTML = '<svg class="ico"><use href="#i-' + (t === 'dark' ? 'sun' : 'moon') + '"/></svg>';
		try { localStorage.setItem('theme', t); } catch (e) { }
	};
	let saved = null;
	try { saved = localStorage.getItem('theme'); } catch (e) { }
	setTheme(saved || 'dark');
	themeBtn.addEventListener('click', () => setTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'));

	// Mobile menu
	const burger = document.getElementById('burger');
	const links = document.getElementById('navLinks');
	burger.addEventListener('click', () => links.classList.toggle('is-open'));
	links.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => links.classList.remove('is-open')));

	// Nav border on scroll
	const nav = document.getElementById('nav');
	const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 10);
	window.addEventListener('scroll', onScroll, { passive: true });
	onScroll();

	// Active nav link
	const navMap = {};
	links.querySelectorAll('a').forEach((a) => { navMap[a.getAttribute('href').slice(1)] = a; });
	if ('IntersectionObserver' in window) {
		const sectionObserver = new IntersectionObserver((entries) => {
			entries.forEach((e) => {
				if (e.isIntersecting && navMap[e.target.id]) {
					Object.values(navMap).forEach((a) => a.classList.remove('is-active'));
					navMap[e.target.id].classList.add('is-active');
				}
			});
		}, { rootMargin: '-45% 0px -50% 0px' });
		document.querySelectorAll('section[id]').forEach((s) => sectionObserver.observe(s));
	}

	// Typed roles
	const roles = ['Site Reliability Engineer', 'Full-Stack Product Engineer', 'Payment Infrastructure Engineer', 'Fintech Platform Builder'];
	const typed = document.getElementById('typed');
	const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	if (!reduce) {
		let r = 0, i = roles[0].length, deleting = true;
		const tick = () => {
			const word = roles[r];
			i += deleting ? -1 : 1;
			typed.textContent = word.slice(0, i);
			let delay = deleting ? 40 : 75;
			if (!deleting && i === word.length) { deleting = true; delay = 1800; }
			else if (deleting && i === 0) { deleting = false; r = (r + 1) % roles.length; delay = 300; }
			setTimeout(tick, delay);
		};
		setTimeout(tick, 2000);
	}

	// Project filters
	const cards = document.querySelectorAll('.card');
	document.querySelectorAll('.filter').forEach((btn) => {
		btn.addEventListener('click', () => {
			document.querySelectorAll('.filter').forEach((b) => b.classList.remove('is-active'));
			btn.classList.add('is-active');
			const f = btn.dataset.filter;
			cards.forEach((c) => c.classList.toggle('is-hidden', f !== 'all' && !c.dataset.tags.split(' ').includes(f)));
		});
	});

	// Reveal on scroll
	if ('IntersectionObserver' in window) {
		const revealEls = document.querySelectorAll('.section__head, .about, .focus, .skill-group, .card, .timeline__item, .cert, .edu__item, .stat, .contact__inner');
		revealEls.forEach((el) => el.classList.add('reveal'));
		const revealObserver = new IntersectionObserver((entries) => {
			entries.forEach((e) => {
				if (e.isIntersecting) { e.target.classList.add('is-visible'); revealObserver.unobserve(e.target); }
			});
		}, { threshold: 0.08 });
		revealEls.forEach((el) => revealObserver.observe(el));
	}

	document.getElementById('year').textContent = new Date().getFullYear();
})();
