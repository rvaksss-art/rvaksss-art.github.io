import {test} from 'node:test';
import assert from 'node:assert/strict';
import {advance,repel,collide} from '../src/physics.js';
const bounds={left:0,right:1000,top:0,bottom:1000};
const body=(x,y,vx,vy)=>({x,y,vx,vy,r:30,spin:0});
test('a throw decelerates consistently at 30, 60 and 120 Hz',()=>{
 const results=[30,60,120].map(hz=>{const b=body(300,300,200,100);for(let i=0;i<hz;i++)advance(b,1/hz,bounds);return b;});
 for(const b of results){assert.ok(b.vx<100&&b.vx>90);assert.ok(Math.abs(b.x-results[1].x)<2);}
});
test('boundary bounce keeps cube inside and reduces energy',()=>{
 const b=body(965,500,1000,0);advance(b,.033,bounds);assert.equal(b.x,970);assert.ok(b.vx<0&&Math.abs(b.vx)<1000);
});
test('head-on collision exchanges direction without adding energy',()=>{
 const a=body(400,500,200,0),b=body(450,500,-200,0);collide(a,b);
 assert.ok(a.vx<0&&b.vx>0);assert.ok(b.x-a.x>=60);assert.ok(a.vx*a.vx+b.vx*b.vx<=80000);
});
test('coincident centres do not produce NaN',()=>{
 const a=body(400,500,20,0),b=body(400,500,-20,0);collide(a,b);assert.ok(Number.isFinite(a.x+b.x+a.vx+b.vx));
});
test('text avoidance pushes outward even from inside text',()=>{
 const b=body(105,150,0,0);assert.ok(repel(b,{left:100,right:400,top:100,bottom:200},.016));assert.ok(b.vx<0);
});
