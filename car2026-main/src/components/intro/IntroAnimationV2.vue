<template>
  <div class="intro" :class="{hide: done}">
    <div class="stage">
      <img class="car side" :class="{drive: started, disappear: rotate}" :src="sideCar" />
      <img class="car front" :class="{enter: rotate, rush: crash, vanish: dissolving}" :src="frontCar" />
      <canvas ref="particleCanvas" class="particle-canvas"></canvas>
      <div class="flash" :class="{active: crash}"></div>
      <div class="brand" :class="{show: logo}">
        <strong>AutoInsight</strong>
        <span>汽车行业数据智能分析与决策平台</span>
      </div>
    </div>
    <button @click="finish">SKIP</button>
  </div>
</template>

<script setup lang="ts">
import {onMounted, onBeforeUnmount, ref} from 'vue'
import sideCar from '@/assets/intro/car-side.svg'
import frontCar from '@/assets/intro/car-front.svg'

const emit = defineEmits(['complete'])
const done=ref(false), started=ref(false), rotate=ref(false), crash=ref(false), dissolving=ref(false), logo=ref(false)
const particleCanvas=ref<HTMLCanvasElement|null>(null)
let raf=0

interface Particle { x:number; y:number; sx:number; sy:number; tx:number; ty:number; vx:number; vy:number; size:number; delay:number }

function finish(){ done.value=true; cancelAnimationFrame(raf); emit('complete') }

function resizeCanvas(canvas:HTMLCanvasElement){
  const dpr=Math.min(window.devicePixelRatio||1,2)
  canvas.width=innerWidth*dpr; canvas.height=innerHeight*dpr
  canvas.style.width=innerWidth+'px'; canvas.style.height=innerHeight+'px'
  const ctx=canvas.getContext('2d')!; ctx.setTransform(dpr,0,0,dpr,0,0)
}

function buildParticles(){
  const canvas=particleCanvas.value; if(!canvas) return
  const ctx=canvas.getContext('2d')!
  resizeCanvas(canvas)
  const w=innerWidth,h=innerHeight
  const sample=document.createElement('canvas'); sample.width=700; sample.height=350
  const sctx=sample.getContext('2d')!
  const img=new Image(); img.src=frontCar
  img.onload=()=>{
    sctx.clearRect(0,0,700,350); sctx.drawImage(img,0,25,700,300)
    const data=sctx.getImageData(0,0,700,350).data
    const source:{x:number,y:number}[]=[]
    for(let y=0;y<350;y+=5) for(let x=0;x<700;x+=5){
      const a=data[(y*700+x)*4+3], r=data[(y*700+x)*4]
      if(a>80 && r<180) source.push({x,y})
    }
    const target=document.createElement('canvas'); target.width=1100; target.height=240
    const tctx=target.getContext('2d')!; tctx.fillStyle='#111'; tctx.textAlign='center'; tctx.textBaseline='middle'
    tctx.font='900 108px Arial'; tctx.fillText('AutoInsight',550,120)
    const td=tctx.getImageData(0,0,1100,240).data, dest:{x:number,y:number}[]=[]
    for(let y=0;y<240;y+=4) for(let x=0;x<1100;x+=4){
      if(td[(y*1100+x)*4+3]>100) dest.push({x,y})
    }
    const particles:Particle[]=[]
    const count=Math.min(source.length,1800)
    for(let i=0;i<count;i++){
      const a=source[i], b=dest[Math.floor(i*dest.length/count)]
      const sx=w/2+(a.x-350)*1.15, sy=h/2+(a.y-175)*1.15
      const tx=w/2+(b.x-550), ty=h/2-15+(b.y-120)
      particles.push({x:sx,y:sy,sx,sy,tx,ty,vx:(Math.random()-.5)*18,vy:(Math.random()-.5)*18,size:Math.random()*2+.7,delay:Math.random()*.18})
    }
    const start=performance.now()
    function draw(now:number){
      const p=Math.min((now-start)/1250,1)
      ctx.clearRect(0,0,w,h)
      particles.forEach(q=>{
        const local=Math.max(0,Math.min(1,(p-q.delay)/.72)), e=1-Math.pow(1-local,3)
        q.x=q.sx+(q.tx-q.sx)*e+q.vx*(1-e)*Math.sin(local*8)
        q.y=q.sy+(q.ty-q.sy)*e+q.vy*(1-e)*Math.sin(local*7)
        ctx.fillStyle='rgba(15,15,15,'+(0.95*(.35+e*.65))+')'
        ctx.fillRect(q.x,q.y,q.size,q.size)
      })
      if(p<1){ raf=requestAnimationFrame(draw) } else { logo.value=true; ctx.clearRect(0,0,w,h) }
    }
    raf=requestAnimationFrame(draw)
  }
}

onMounted(()=>{
  started.value=true
  // 侧面车先完整驶入，随后彻底离场。正面车不与它同屏。
  setTimeout(()=>rotate.value=true,2200)
  // 正面视角锁定后立即冲屏，不再停顿。
  setTimeout(()=>crash.value=true,3450)
  // 冲屏尾段直接把前车轮廓拆成粒子并变成 AutoInsight。
  setTimeout(()=>{ dissolving.value=true; buildParticles() },4000)
  setTimeout(finish,8500)
})

onBeforeUnmount(()=>cancelAnimationFrame(raf))
</script>

<style scoped>
.intro{position:fixed;inset:0;background:#fff;z-index:99999;overflow:hidden;transition:opacity .8s}.hide{opacity:0;pointer-events:none}
.stage{width:100%;height:100%;position:relative;perspective:1800px}
.car{position:absolute;left:50%;top:50%;object-fit:contain;transform-origin:center;will-change:transform,opacity,filter}
.side{width:min(75vw,1000px);height:340px;transform:translate(-150vw,-50%)}
.side.drive{animation:drive 2.2s cubic-bezier(.2,.8,.2,1) forwards}
.side.disappear{animation:sideOut .5s cubic-bezier(.7,0,1,.45) forwards}
.front{width:min(80vw,1100px);height:550px;opacity:0;transform:translate(-50%,-50%) rotateY(-90deg) scale(.85)}
.front.enter{animation:cameraTurn 1.25s cubic-bezier(.2,.7,.1,1) forwards;opacity:1}
.front.rush{animation:rush .55s cubic-bezier(.55,0,1,.35) forwards}
.front.dissolving{opacity:0;transition:opacity .12s}
@keyframes drive{to{transform:translate(-50%,-50%)}}
@keyframes sideOut{0%{opacity:1;transform:translate(-50%,-50%) rotateY(0) scale(1)}100%{opacity:0;transform:translate(-50%,-50%) rotateY(90deg) scale(.82)}}
@keyframes cameraTurn{0%{opacity:0;transform:translate(-50%,-50%) rotateY(-90deg) scale(.9)}100%{opacity:1;transform:translate(-50%,-50%) rotateY(0) scale(1)}}
@keyframes rush{0%{transform:translate(-50%,-50%) scale(1);filter:blur(0)}35%{transform:translate(-50%,-50%) scale(2.1);filter:blur(1px)}100%{transform:translate(-50%,-50%) scale(8);filter:blur(18px)}}
.particle-canvas{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
.flash{position:absolute;inset:0;background:#fff;opacity:0;pointer-events:none}.flash.active{animation:flash .34s ease-out forwards}@keyframes flash{0%{opacity:0}40%{opacity:1}100%{opacity:0}}
.brand{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;flex-direction:column;opacity:0;pointer-events:none}.brand.show{animation:brand 1s forwards}@keyframes brand{to{opacity:1}}
.brand strong{font:900 100px Arial;letter-spacing:-4px}.brand span{margin-top:25px;color:#666;letter-spacing:8px}
button{position:absolute;right:30px;bottom:30px;background:none;border:0;color:#888;z-index:5}
</style>
