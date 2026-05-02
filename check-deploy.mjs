const base = 'https://editor.agiltime.com.br';

// 1. Version
const ver = await fetch(base + '/api/version').then(r => r.json());
console.log('version:', ver.version);

// 2. Check / without following redirects
const raw = await fetch(base + '/', { redirect: 'manual' });
console.log('\n--- sem redirect ---');
console.log('status:', raw.status);
console.log('location:', raw.headers.get('location'));
console.log('x-nextjs-cache:', raw.headers.get('x-nextjs-cache'));
console.log('cache-control:', raw.headers.get('cache-control'));

// 3. Check / following redirects (normal)
const page = await fetch(base + '/');
console.log('\n--- seguindo redirect ---');
console.log('final url status:', page.status);
console.log('x-nextjs-cache:', page.headers.get('x-nextjs-cache'));
console.log('cache-control:', page.headers.get('cache-control'));
const html = await page.text();
console.log('html bytes:', html.length);
console.log('landing page (data-page)?', html.includes('data-page="sales-landing-v2"'));
console.log('has Planos/Starter?', html.includes('Starter') || html.includes('Planos'));
console.log('has "Envie seu video"?', html.includes('Envie seu v'));

// 4. Check /app directly (the editor page)
const appPage = await fetch(base + '/app', { redirect: 'manual' });
console.log('\n--- /app sem redirect ---');
console.log('status:', appPage.status);
console.log('location:', appPage.headers.get('location'));
