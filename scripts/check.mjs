import {readFileSync,existsSync,readdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {strict as assert} from 'node:assert';
import {gzipSync} from 'node:zlib';
const html=readFileSync('index.html','utf8');
let original=execFileSync('git',['show','origin/main:index.html'],{encoding:'utf8'});
original=original.replaceAll("<strong>Максим Курылёв.</strong> Исследую бизнес-процессы, нахожу возможности для улучшений и проектирую решения. Веду разработку от идеи до запуска. Использую AI для создания прототипов, разработки и развития продуктов.","<strong>Максим Курылёв.</strong> Анализирую бизнес-процессы, проектирую решения и веду продукты от идеи до запуска. Использую AI для прототипирования и разработки.").replaceAll("<strong>Maxim Kurylev.</strong> I research business processes, identify opportunities for improvement and design solutions. I lead development from idea to launch. I use AI to prototype, build and evolve products.","<strong>Maxim Kurylev.</strong> I analyze business processes, design solutions and lead products from idea to launch. I use AI for prototyping and development.");
const links=s=>[...s.matchAll(/href="(https:[^"]+)"/g)].map(x=>x[1]).sort();
assert.deepEqual(links(html),links(original),'All external destination URLs preserved');
const copy=s=>[...s.matchAll(/data-copy="(\d+)"[^>]*>([\s\S]*?)<\/(?:h1|h2|h3|p|span|a)>/g)].map(x=>[x[1],x[2]]);
assert.deepEqual(copy(html),copy(original),'Original Russian content preserved');
assert.equal(html.match(/const copy=([\s\S]+?);let lang/)[1],original.match(/const copy=([\s\S]+?);let lang/)[1],'Both complete language dictionaries preserved');
for(const path of [...html.matchAll(/(?:src|href)="\.\/([^"]+)"/g)].map(x=>x[1]))assert(existsSync(path.split('?')[0]),`Missing ${path}`);
for(const name of readdirSync('assets').filter(s=>s.endsWith('.js')))console.log(`${name}: ${(gzipSync(readFileSync('assets/'+name)).length/1024).toFixed(1)} KiB gzip`);
console.log('PASS: all original links, visible copy, bilingual dictionaries, and entry assets preserved.');

