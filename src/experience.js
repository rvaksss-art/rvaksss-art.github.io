import {gsap} from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);
const reduce=matchMedia('(prefers-reduced-motion: reduce)');
const cards=[...document.querySelectorAll('.portal')];
const drawings=[
`<g transform="translate(40 7)"><path d="M3 94 104 132 221 85 122 48Z" stroke="currentColor" opacity=".12"/><g class="layer layer-c"><path d="M22 69 104 103 187 68 105 35Z" fill="var(--surface)" stroke="currentColor" opacity=".3"/><path d="m22 69 82 34 83-35v7l-83 35-82-34Z" fill="currentColor" opacity=".07"/></g><g class="layer"><path d="M22 49 104 83 187 48 105 15Z" fill="var(--surface)" stroke="currentColor" opacity=".5"/></g><g class="layer layer-a"><path d="M22 29 104 63 187 28 105-5Z" fill="var(--surface)" stroke="currentColor" opacity=".85"/><path d="m61 29 44 18 45-19-45-18Z" stroke="currentColor" opacity=".3"/><path d="M83 27 105 18 127 27 105 36Z" fill="none" stroke="#e4a15f" stroke-width="1.5" stroke-linejoin="round"/><circle cx="105" cy="27" r="3" fill="var(--gold)"/></g><path class="flow" d="M104 63v40m-82-74v40m165-41v40" stroke="currentColor" opacity=".4"/></g>`,
`<g transform="translate(0 0)"><ellipse cx="150" cy="70" rx="111" ry="49" stroke="currentColor" opacity=".12"/><g class="orbit"><ellipse cx="150" cy="70" rx="91" ry="43" stroke="currentColor" opacity=".28" transform="rotate(-30 150 70)"/><circle cx="229" cy="27" r="4" fill="var(--gold)"/><circle cx="71" cy="113" r="3" fill="currentColor"/></g><path class="flow" d="M39 70h61m100 0h61M150 13v27m0 60v27" stroke="currentColor" opacity=".5"/><path d="m150 36 49 34-49 34-49-34Z" fill="var(--surface)" stroke="currentColor"/><path class="core" d="m150 50 29 20-29 20-29-20Z" fill="currentColor" fill-opacity=".08" stroke="var(--gold)"/><circle cx="150" cy="70" r="4" fill="var(--gold)"/><circle cx="39" cy="70" r="5" stroke="currentColor"/><circle cx="261" cy="70" r="5" stroke="currentColor"/></g>`,
`<g transform="translate(47 3)"><g class="layer layer-c" opacity=".25"><rect x="26" y="2" width="158" height="100" rx="3" fill="var(--surface)" stroke="currentColor"/></g><g class="layer" opacity=".5"><rect x="13" y="15" width="158" height="100" rx="3" fill="var(--surface)" stroke="currentColor"/></g><g class="layer layer-a"><rect x="0" y="28" width="158" height="100" rx="3" fill="var(--surface)" stroke="currentColor"/><path d="M0 46h158M34 46v82" stroke="currentColor" opacity=".3"/><circle cx="10" cy="37" r="1.6" fill="var(--gold)"/><path d="M18 37h16M10 58h14m-14 10h9m-9 10h14" stroke="currentColor" opacity=".4"/><rect x="46" y="58" width="44" height="22" rx="2" fill="currentColor" opacity=".12"/><rect x="98" y="58" width="44" height="22" rx="2" fill="currentColor" opacity=".06"/><path d="M46 96h36m-36 9h27" stroke="currentColor" opacity=".4"/><path class="flow" d="m95 112 14-14 11 5 22-18" stroke="var(--gold)"/><circle cx="142" cy="85" r="2" fill="var(--gold)"/></g></g>`
];
cards.forEach((card,i)=>{const svg=card.querySelector('.glyph');svg.setAttribute('viewBox','0 0 300 140');svg.innerHTML=drawings[i];});
const motion=document.querySelector('#motion-toggle');
let paused=reduce.matches;
let scene;
function syncMotion(){document.body.classList.toggle('paused',paused||reduce.matches);motion.setAttribute('aria-pressed',String(paused));motion.setAttribute('aria-label',document.documentElement.lang==='en'?(paused?'Play animation':'Pause animation'):(paused?'Включить анимацию':'Приостановить анимацию'));motion.querySelector('path').setAttribute('d',paused?'M5 3l8 5-8 5Z':'M5 3v10M11 3v10');scene?.setPaused(paused||reduce.matches);}
motion.addEventListener('click',()=>{paused=!paused;syncMotion();});
new MutationObserver(syncMotion).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
reduce.addEventListener('change',()=>{paused=reduce.matches;syncMotion();});
syncMotion();
const mm=gsap.matchMedia();
mm.add('(prefers-reduced-motion: no-preference)',()=>{
 gsap.from('.hero>div:first-child',{y:24,opacity:0,duration:1.25,ease:'power3.out'});
 gsap.from('.instrument',{opacity:0,duration:1.6,delay:.15});
 gsap.to('.reading-progress',{scaleX:1,ease:'none',scrollTrigger:{trigger:document.body,start:'top top',end:'bottom bottom',scrub:.2}});
 cards.forEach((card,i)=>{gsap.from(card,{y:35,opacity:0,duration:.9,delay:i*.08,ease:'power3.out',scrollTrigger:{trigger:card,start:'top 94%',once:true}});gsap.fromTo(card.querySelector('.glyph'),{y:14},{y:-6,ease:'none',scrollTrigger:{trigger:card,start:'top bottom',end:'bottom top',scrub:1}});});
});
// The primary document is usable before the separately bundled WebGL module arrives.
const stage=document.querySelector('#cube-stage');
import('./scene.js').then(({createScene})=>{scene=createScene(stage,reduce);syncMotion();}).catch(()=>{stage.parentElement.classList.remove('webgl-ready');});
ScrollTrigger.create({start:20,onUpdate:self=>document.querySelector('.header').classList.toggle('is-scrolled',self.scroll()>20)});
const cardVisibility=new IntersectionObserver(entries=>entries.forEach(entry=>entry.target.classList.toggle('is-outside',!entry.isIntersecting)));
cards.forEach(card=>cardVisibility.observe(card));
