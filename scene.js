// Self-contained WebGL renderer. No CDN, external model, or build step.
const TAU=Math.PI*2, rad=x=>x*Math.PI/180;
const V=(x=0,y=0,z=0)=>[x,y,z], sub=(a,b)=>a.map((v,i)=>v-b[i]), dot=(a,b)=>a.reduce((n,v,i)=>n+v*b[i],0), cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]], norm=a=>{let l=Math.hypot(...a)||1;return a.map(v=>v/l)};
const I=()=>[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];
function mul(a,b){let c=new Array(16);for(let j=0;j<4;j++)for(let i=0;i<4;i++)c[j*4+i]=a[i]*b[j*4]+a[i+4]*b[j*4+1]+a[i+8]*b[j*4+2]+a[i+12]*b[j*4+3];return c}
function translate(x,y,z){let m=I();m[12]=x;m[13]=y;m[14]=z;return m}function scale(x,y,z){let m=I();m[0]=x;m[5]=y;m[10]=z;return m}function rx(a){let c=Math.cos(a),s=Math.sin(a);return [1,0,0,0,0,c,s,0,0,-s,c,0,0,0,0,1]}function ry(a){let c=Math.cos(a),s=Math.sin(a);return[c,0,-s,0,0,1,0,0,s,0,c,0,0,0,0,1]}function rz(a){let c=Math.cos(a),s=Math.sin(a);return[c,s,0,0,-s,c,0,0,0,0,1,0,0,0,0,1]}
function perspective(fov,a,n,f){let t=1/Math.tan(fov/2);return[t/a,0,0,0,0,t,0,0,0,0,(f+n)/(n-f),-1,0,0,2*f*n/(n-f),0]}
function look(eye,at){let z=norm(sub(eye,at)),x=norm(cross([0,1,0],z)),y=cross(z,x);return[x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-dot(x,eye),-dot(y,eye),-dot(z,eye),1]}
function project(m,p){let q=[...p,1],r=[0,1,2,3].map(i=>m[i]*q[0]+m[i+4]*q[1]+m[i+8]*q[2]+m[i+12]);return[r[0]/r[3],r[1]/r[3],r[2]/r[3],r[3]]}
function color(hex){let h=parseInt(hex.replace('#',''),16);return[(h>>16&255)/255,(h>>8&255)/255,(h&255)/255]}
function tri(a,b,c,out,na,nb,nc){let n=norm(cross(sub(b,a),sub(c,a)));for(const [p,k] of [[a,na||n],[b,nb||n],[c,nc||n]])out.push(...p,...k)}function quad(a,b,c,d,out){tri(a,b,c,out);tri(a,c,d,out)}
function box(){let o=[],p=[[-.5,-.5,-.5],[.5,-.5,-.5],[.5,.5,-.5],[-.5,.5,-.5],[-.5,-.5,.5],[.5,-.5,.5],[.5,.5,.5],[-.5,.5,.5]];for(let f of [[0,3,2,1],[4,5,6,7],[0,4,7,3],[1,2,6,5],[3,7,6,2],[0,1,5,4]])quad(...f.map(i=>p[i]),o);return o}
function cylinder(n=40){let o=[];for(let i=0;i<n;i++){let a=i/n*TAU,b=(i+1)/n*TAU,p=[Math.cos(a),-.5,Math.sin(a)],q=[Math.cos(b),-.5,Math.sin(b)],r=[q[0],.5,q[2]],s=[p[0],.5,p[2]],np=[p[0],0,p[2]],nq=[q[0],0,q[2]];tri(p,s,r,o,np,np,nq);tri(p,r,q,o,np,nq,nq);tri([0,.5,0],r,s,o);tri([0,-.5,0],p,q,o)}return o}
function torus(R=1,r=.035,n=48,m=6){let o=[];function pt(i,j){let a=i/n*TAU,b=j/m*TAU;return[(R+r*Math.cos(b))*Math.cos(a),r*Math.sin(b),(R+r*Math.cos(b))*Math.sin(a)]}for(let i=0;i<n;i++)for(let j=0;j<m;j++)quad(pt(i,j),pt(i,j+1),pt(i+1,j+1),pt(i+1,j),o);return o}
function crystal(n=6){let o=[],top=[0,1.2,0],bot=[0,-1.1,0];for(let i=0;i<n;i++){let a=i/n*TAU,b=(i+1)/n*TAU,p=[.58*Math.cos(a),.12,.58*Math.sin(a)],q=[.58*Math.cos(b),.12,.58*Math.sin(b)];tri(top,q,p,o);tri(bot,p,q,o)}return o}
function sphere(n=20,m=12){let o=[];function pt(i,j){let a=i/n*TAU,b=j/m*Math.PI;return[Math.sin(b)*Math.cos(a),Math.cos(b),Math.sin(b)*Math.sin(a)]}for(let i=0;i<n;i++)for(let j=0;j<m;j++){let a=pt(i,j),b=pt(i+1,j),c=pt(i+1,j+1),d=pt(i,j+1);tri(a,b,c,o,a,b,c);tri(a,c,d,o,a,c,d)}return o}
function plane(){let o=[];quad([-1,0,-1],[-1,0,1],[1,0,1],[1,0,-1],o);return o}
const vs=`
attribute vec3 aP,aN;
uniform mat4 uM,uVP;
uniform mediump float uMode;
uniform float uTime,uPointScale;
varying mediump vec3 vP,vN,vLocal;
void main(){
  vLocal=aP;
  if(uMode>7.5){
    gl_Position=vec4(aP.x,-aP.z,0.,1.);
    return;
  }
  vec4 p=uM*vec4(aP,1.);
  if(uMode>6.75){
    p.x+=sin(uTime*.26+aP.z)*.35;
    p.y+=cos(uTime*.32+aP.x)*.24;
  }
  vP=p.xyz;
  vN=normalize(mat3(uM)*aN);
  gl_Position=uVP*p;
  if(uMode>6.25)gl_PointSize=clamp(44./gl_Position.w,1.25,3.3)*uPointScale;
}`;
const fs=`
precision mediump float;
varying mediump vec3 vP,vN,vLocal;
uniform vec3 uColor,uEye;
uniform vec2 uHazeShift;
uniform float uMode,uAlpha;
float haze(vec2 uv,vec2 center,vec2 radius){
  float edge=max(0.,1.-length((uv-center)/radius));
  return edge*edge;
}
void main(){
  if(uMode>7.5){
    vec2 uv=vLocal.xz*.5+.5;
    vec2 shift=uHazeShift;
    vec3 sky=uColor;
    sky+=vec3(.135,.052,.236)*haze(uv,vec2(.27,.34)+shift,vec2(.76,.55));
    sky+=vec3(.17,.052,.128)*haze(uv,vec2(.77,.39)+shift*.55,vec2(.63,.38));
    sky+=vec3(.053,.032,.125)*haze(uv,vec2(.54,.55)-shift*.35,vec2(.86,.44));
    gl_FragColor=vec4(sky,1.);
    return;
  }
  vec3 c=uColor;
  float d=length(uEye-vP);
  if(uMode>5.5){
    float fade=(1.-smoothstep(16.,58.,d))*smoothstep(3.,9.,d);
    if(uMode>6.25)fade*=1.-smoothstep(.14,.5,length(gl_PointCoord-.5));
    gl_FragColor=vec4(c,uAlpha*fade);
    return;
  }
  if(uMode>4.5){
  float a=max(0.,1.-length(vLocal.xz));
  gl_FragColor=vec4(c,pow(a,2.2)*uAlpha);return;
}if(uMode>3.5){
  float y=vLocal.z*.5+.5;
  float x=abs(vLocal.x)/(1.-.65*y);
  float broad=pow(max(0.,1.-x),2.);
  float core=pow(max(0.,1.-x),12.);
  float tip=1.-smoothstep(.68,1.,y);
  gl_FragColor=vec4(mix(c,vec3(.8,.94,1.),core*.5),(broad*.44+core*.56)*tip*uAlpha);return;
  }
  if(uMode>2.5){float a=max(0.,1.-length(vLocal.xz));gl_FragColor=vec4(c,pow(a,1.85)*uAlpha);return;}
  if(uMode>1.5){
    vec2 p=vP.xz;
    vec2 minor=abs(fract(p/1.5+.5)-.5)*1.5;
    vec2 major=abs(fract(p/6.+.5)-.5)*6.;
    float aa=.025+d*.002;
    float fineLine=1.-smoothstep(.008,aa,min(minor.x,minor.y));
    float majorLine=1.-smoothstep(.018,aa*1.35,min(major.x,major.y));
    float fade=(1.-smoothstep(17.,58.,d))*(1.-smoothstep(18.,57.,length(p)));
    float grid=majorLine*.33+fineLine*.18*(1.-smoothstep(22.,39.,d));
    gl_FragColor=vec4(c,grid*fade);
    return;
  }
  if(uMode>.5){gl_FragColor=vec4(mix(c,vec3(1.),.17)*(.85+.15*exp(-d*.04)),uAlpha);return;}
  vec3 n=normalize(vN),view=normalize(uEye-vP);
  vec3 l1=normalize(vec3(-.65,.85,.4)),l2=normalize(vec3(.8,.55,-.65));
  float a=max(dot(n,l1),0.),b=max(dot(n,l2),0.);
  float spec=pow(max(dot(n,normalize(l1+view)),0.),28.);
  float spec2=pow(max(dot(n,normalize(l2+view)),0.),20.);
  float rim=pow(1.-max(dot(n,view),0.),2.);
  vec3 lit=c*(.32+a*.73+b*.4)+vec3(.95,.32,.72)*spec*.75+vec3(.29,.65,1.)*spec2*.6+rim*(c*.55+vec3(.12,.07,.20));
  float fog=1.-exp(-d*.025);
  gl_FragColor=vec4(mix(lit,vec3(.045,.028,.075),fog*.65),uAlpha);
}`;
export function createScene(config, onSelect, onRendererChange) {
  const labels = document.getElementById('labels');
  let session, renderer, selected = -1, paused = false, low = false;

  function switchRenderer(choice) {
    const candidates = choice === 'canvas'
      ? [['Canvas 3D', createSoftwareScene]]
      : [['WebGL', createWebGLScene], ['Canvas 3D', createSoftwareScene]];
    const diagnostics = [];

    function stop() {
      // Mark the old session inactive before releasing its context.
      const previous = session;
      session = renderer = null;
      previous?.dispose();
      labels.replaceChildren();
    }

    function tryNext() {
      stop();
      const candidate = candidates.shift();
      if (!candidate) {
        onRendererChange('', diagnostics.join(' '));
        return;
      }

      const [mode, create] = candidate;
      const previousCanvas = document.getElementById('world');
      // Canvas contexts are tied to their element, including after context loss.
      const canvas = previousCanvas.cloneNode(false);
      canvas.removeAttribute('style');
      canvas.classList.remove('dragging');
      previousCanvas.replaceWith(canvas);
      const cleanups = [];
      const current = { dispose() { for (const cleanup of cleanups.reverse()) cleanup(); } };
      session = current;
      function fail(error) {
        if (session !== current) return;
        console.warn(`Gallery ${mode} failed:`, error);
        diagnostics.push(`${mode}: ${error.message || error}.`);
        tryNext();
      }

      try {
        renderer = create(config, onSelect, fail, canvas, cleanup => cleanups.push(cleanup));
        renderer.focus(selected);
        renderer.pause(paused);
        renderer.quality(low);
        onRendererChange(mode, diagnostics.length ? `${diagnostics.join(' ')} Using ${mode}.` : '');
      } catch (error) {
        fail(error);
      }
    }

    tryNext();
  }

  return {
    switchRenderer,
    focus(i) { selected = i; renderer?.focus(i); },
    reset() { renderer?.reset(); },
    pause(value) { paused = value; renderer?.pause(value); },
    quality(value) { low = value; renderer?.quality(value); }
  };
}

function watchSize(wrap, resize, onDispose) {
  if (typeof ResizeObserver === 'function') {
    const observer = new ResizeObserver(resize);
    observer.observe(wrap);
    onDispose(() => observer.disconnect());
  } else {
    window.addEventListener('resize', resize);
    onDispose(() => window.removeEventListener('resize', resize));
  }
  resize();
}

function animate(frame, onFail, onDispose) {
  let id;
  function tick(now) {
    try {
      frame(now);
      id = requestAnimationFrame(tick);
    } catch (error) {
      onFail(error);
    }
  }
  id = requestAnimationFrame(tick);
  onDispose(() => cancelAnimationFrame(id));
}

const floatHeight = (time, i) => 1.53 + Math.sin(time * 1.5 + i) * .12;

// World-space points keep the backdrop anchored as the existing camera orbits.
const neuralPaths = [
  [[-24,2.6,-15],[-16,3.1,-13],[-11,1.8,-9],[-6,2.8,-11],[-2,1.6,-18]],
  [[-19,3.8,-24],[-13,1.5,-19],[-6,2.8,-11],[-4,3.1,-20],[3,1.5,-28]],
  [[-2,1.6,-18],[3,1.2,-15],[8,2.5,-16],[12,3,-10],[22,3,-19]],
  [[8,2.5,-16],[11,3.4,-21],[18,2.1,-26],[26,3.1,-22]],
  [[-22,1.3,3],[-16,2.8,0],[-11,1.8,-9]],
  [[12,3,-10],[17,2.5,-7],[22,2.2,-4],[29,3.2,-9]]
];
const octahedron = [[0,1,0],[1,0,0],[0,0,1],[-1,0,0],[0,0,-1],[0,-1,0]];
const wireframes = [
  [-8,1.9,-12,1], [-3,2,-22,1.2], [4,1.8,-15,.9],
  [10,2.5,-10,1.15], [-16,2.4,-5,1.25], [17,2.5,-21,1.35]
].flatMap(([x,y,z,size], i) => {
  const angle = i * .67;
  const vertices = octahedron.map(([a,b,c]) => [
    x + size * (a * Math.cos(angle) - c * Math.sin(angle)),
    y + size * b * 1.15,
    z + size * (a * Math.sin(angle) + c * Math.cos(angle))
  ]);
  return [1,2,3,4].flatMap(j => [
    [vertices[0],vertices[j]], [vertices[j],vertices[j%4+1]], [vertices[j],vertices[5]]
  ]);
});
const traces = [-1,1].flatMap(side => [
  [[6.3,6],[6.3,-6],[8.4,-8.1],[8.4,-17],[12,-20.6],[12,-36]],
  [[9.2,4],[9.2,-4],[11.4,-6.2],[11.4,-13],[14.7,-16.3],[21,-16.3]]
].map(points => points.map(([x,z]) => [side * x,.024,z])));
const segments = paths => paths.flatMap(path => path.slice(1).map((point,i) => [path[i],point]));
const voidDetail = [
  { lines: segments(neuralPaths), tint: '#9a70d9', opacity: .30 },
  { lines: wireframes, tint: '#d78cba', opacity: .33 },
  { lines: segments(traces), tint: '#777bc7', opacity: .41 }
];
const nodes = Array.from(new Map(neuralPaths.flat().map(point => [point.join(),point])).values());
const dust = Array.from({length:48}, (_,i) => [
  (i * 7.21) % 34 - 17,
  .45 + (i * .67) % 7,
  5 - (i * 3.71) % 34
]);
const glowDepth = d => {
  const depth = Math.max(0,Math.min(1,(d - 16)/42));
  const front = Math.max(0,Math.min(1,(d - 3)/6));
  return (1 - depth * depth * (3 - 2 * depth)) * front;
};

function hazeShift(eye, at) {
  const [x,y] = norm(sub(eye,at));
  return [-x * .14,(y - .42) * .17];
}

function billboard(x, y, z, width, height, eye) {
  const [dx,,dz] = norm([eye[0] - x, 0, eye[2] - z]);
  return [dz * width,0,-dx * width,0, dx,0,dz,0, 0,height,0,0, x,y,z,1];
}

function createWebGLScene(config,onSelect,onFail,canvas,onDispose){
const wrap=document.getElementById('gallery'),labels=document.getElementById('labels');
const attributes={alpha:false,antialias:true,powerPreference:'low-power'};
const gl=canvas.getContext('webgl',attributes) || canvas.getContext('experimental-webgl',attributes);
if(!gl)throw Error('context unavailable (browser or graphics driver blocked WebGL)');
onDispose(() => gl.getExtension('WEBGL_lose_context')?.loseContext());
function shader(type,src){let s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){const log=gl.getShaderInfoLog(s);gl.deleteShader(s);throw Error('shader compilation failed: '+log)}return s}let pr=gl.createProgram();onDispose(() => gl.deleteProgram(pr));
for (const [type, source] of [[gl.VERTEX_SHADER, vs], [gl.FRAGMENT_SHADER, fs]]) {
  const compiled = shader(type, source);
  gl.attachShader(pr, compiled);
  gl.deleteShader(compiled);
}gl.linkProgram(pr);if(!gl.getProgramParameter(pr,gl.LINK_STATUS))throw Error('shader link failed: '+gl.getProgramInfoLog(pr));gl.useProgram(pr);
const loc={};for(let n of ['uM','uVP','uColor','uEye','uMode','uAlpha','uTime','uPointScale','uHazeShift'])loc[n]=gl.getUniformLocation(pr,n);const pLoc=gl.getAttribLocation(pr,'aP'),nLoc=gl.getAttribLocation(pr,'aN');gl.enableVertexAttribArray(pLoc);gl.enableVertexAttribArray(nLoc);gl.enable(gl.DEPTH_TEST);gl.clearColor(...color(config.theme.background),1);
function buffer(arr){let b=gl.createBuffer();onDispose(() => gl.deleteBuffer(b));gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(arr),gl.STATIC_DRAW);return {b,count:arr.length/6}}
const geo={box:buffer(box()),cyl:buffer(cylinder()),ring:buffer(torus()),crystal:buffer(crystal()),orb:buffer(sphere()),plane:buffer(plane())};
function pointBuffer(points) {
  return buffer(points.flatMap(p => [...p,0,1,0]));
}
const voidBatches=voidDetail.map(({lines,tint,opacity}) => ({
  mesh:pointBuffer(lines.flat()), tint:color(tint), opacity
}));
const voidNodes=pointBuffer(nodes), voidDust=pointBuffer(dust);
const skyTint=color(config.theme.background), gridTint=color('#7951a6');
const nodeTint=color('#c0a2fa'), dustTint=color('#b393da');
const identity=I(), farFloor=scale(64,1,64);
let lastGeo=null;
function draw(g,m,c,mode=0,alpha=1,primitive=gl.TRIANGLES,count){let obj=geo[g]||g;if(lastGeo!==obj){gl.bindBuffer(gl.ARRAY_BUFFER,obj.b);gl.vertexAttribPointer(pLoc,3,gl.FLOAT,false,24,0);gl.vertexAttribPointer(nLoc,3,gl.FLOAT,false,24,12);lastGeo=obj}gl.uniformMatrix4fv(loc.uM,false,m);gl.uniform3fv(loc.uColor,c);gl.uniform1f(loc.uMode,mode);gl.uniform1f(loc.uAlpha,alpha);gl.drawArrays(primitive,0,count??obj.count)}
let w=1,h=1,low=false,paused=false,selected=-1,hover=-1,yaw=0,pitch=0,time=0,drag=null,targets=[];let eye=[0,8.3,13],at=[0,0,-.9],vp=I();const dark=color('#29213b'),rim=color('#56416b'),cyan=color(config.theme.cyan);
const items=config.artifacts.map((a,i)=>{let l=document.createElement('button');l.type='button';l.hidden=true;l.className='artifact-label';l.textContent=a.short||a.name;l.title=a.name;l.setAttribute('aria-label','Open '+a.name);l.setAttribute('aria-pressed','false');l.addEventListener('click',()=>onSelect(i));l.addEventListener('pointerenter',()=>hover=i);l.addEventListener('pointerleave',()=>hover=-1);labels.append(l);return{...a,c:color(a.color),label:l}});
function resize(){w=Math.max(1,wrap.clientWidth);h=Math.max(1,wrap.clientHeight);let d=low?1:Math.min(devicePixelRatio||1,1.5);canvas.width=Math.round(w*d);canvas.height=Math.round(h*d);gl.viewport(0,0,canvas.width,canvas.height);gl.uniform1f(loc.uPointScale,d)}watchSize(wrap,resize,onDispose);
function tr(parent,x,y,z,sx=1,sy=sx,sz=sx,rot=null){let m=mul(parent,translate(x,y,z));if(rot)m=mul(m,rot);return mul(m,scale(sx,sy,sz))}
function part(parent,g,x,y,z,sx,sy,sz,c,mode=0,rot=null){draw(g,tr(parent,x,y,z,sx,sy,sz,rot),c,mode)}
function ring(p,y,r,c,t=1){part(p,'ring',0,y,0,r,t*r,r,c,1)}
function artifact(a,p,i){let c=a.c,bright=selected===i||hover===i?cyan:c;switch(a.model){case'crystal':part(p,'crystal',0,0,0,.78,.78,.78,c);for(let s of [-1,1]){part(p,'crystal',s*.68,-.22,0,.29,.42,.29,bright,0,rz(-s*.3))}for(let j=0;j<2;j++)part(p,'ring',0,0,0,.82,.82,.82,bright,1,mul(rx(rad(55+j*65)),ry(time*.25)));break;
case'network':{for(let x of [-1,1])for(let y of [-1,1])for(let z of [-1,1]){part(p,'orb',x*.49,y*.49,z*.49,.11,.11,.11,bright,1);if(x===-1)part(p,'box',0,y*.49,z*.49,.98,.035,.035,c,1);if(y===-1)part(p,'box',x*.49,0,z*.49,.035,.98,.035,c,1);if(z===-1)part(p,'box',x*.49,y*.49,0,.035,.035,.98,c,1)}part(p,'orb',0,0,0,.32,.32,.32,c);part(p,'ring',0,0,0,.86,.86,.86,bright,1,rx(.6));break}
case'terminal':{part(p,'box',0,.16,0,1.54,1,.16,dark);part(p,'box',0,.16,.095,1.39,.85,.025,c);part(p,'box',0,.16,.118,1.26,.73,.02,[.045,.025,.09]);for(let j=0;j<5;j++)part(p,'box',-.15,.43-j*.13,.14,.8-j*.08,.024,.02,j===0?cyan:c,1);part(p,'box',0,-.43,.25,1.48,.1,.67,rim);for(let j=0;j<5;j++)part(p,'box',-.48+j*.24,-.367,.25,.15,.02,.25,bright,1);break}
case'chip':{let q=mul(p,rx(.65));part(q,'box',0,0,0,1.08,.22,1.08,dark);part(q,'box',0,.17,0,.75,.13,.75,c);part(q,'box',0,.245,0,.42,.04,.42,rim);for(let j=0;j<6;j++)for(let s of [-1,1]){part(q,'box',s*.63,0,-.43+j*.17,.25,.055,.065,bright,1);part(q,'box',-.43+j*.17,0,s*.63,.065,.055,.25,bright,1)}break}
case'beacon':part(p,'cyl',0,-.08,0,.24,.88,.24,dark);part(p,'crystal',0,.39,0,.32,.42,.32,c);for(let j=0;j<3;j++)ring(p,-.38+j*.32,.38+j*.12,bright);part(p,'orb',0,.85,0,.12,.12,.12,bright,1);break;default:part(p,'crystal',0,0,0,.7,.7,.7,c)}}
function drawVoid() {
  gl.disable(gl.DEPTH_TEST);
  gl.uniform2fv(loc.uHazeShift,hazeShift(eye,at));
  draw('plane',identity,skyTint,8);
  gl.enable(gl.DEPTH_TEST);

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
  draw('plane',farFloor,gridTint,2);
  gl.depthMask(false);
  for (const batch of voidBatches) {
    draw(batch.mesh,identity,batch.tint,6,batch.opacity,gl.LINES);
  }
  draw(voidNodes,identity,nodeTint,6.5,.59,gl.POINTS);
  gl.uniform1f(loc.uTime,time);
  draw(voidDust,identity,dustTint,7,.48,gl.POINTS,low?24:dust.length);
  gl.depthMask(true);
  gl.disable(gl.BLEND);
}
function frame(now){if(document.hidden||now-lastDraw<(paused?66:low?33:0))return;lastDraw=now;let dt=Math.min(.05,(now-prev)/1000);prev=now;if(!paused&&!document.hidden)time+=dt;let aspect=w/h,focus=selected>=0,center=focus?items[selected].position:[0,0,-1.2];let dist=focus?5.6:Math.max(12.6,15.0/Math.max(aspect,.65));let angle=yaw+.12;let height=focus?2.5:8.2;let targetEye=[center[0]+Math.sin(angle)*dist,center[1]+height+pitch,center[2]+Math.cos(angle)*dist],targetAt=[center[0],focus?1.14:.65,center[2]];let k=paused?1:1-Math.exp(-dt*5);eye=eye.map((v,i)=>v+(targetEye[i]-v)*k);at=at.map((v,i)=>v+(targetAt[i]-v)*k);vp=mul(perspective(rad(47),aspect,.1,85),look(eye,at));gl.uniformMatrix4fv(loc.uVP,false,vp);gl.uniform3fv(loc.uEye,eye);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);drawVoid();targets=[];
for(let i=0;i<items.length;i++){let a=items[i],base=translate(...a.position),active=i===selected||i===hover,c=active?cyan:a.c;part(base,'cyl',0,.10,0,1.28,.22,1.28,dark);part(base,'cyl',0,.23,0,1.14,.10,1.14,rim);part(base,'cyl',0,.29,0,1.04,.055,1.04,[.07,.045,.13]);ring(base,.27,1.22,c);ring(base,.33,.99,c,.65);ring(base,.035,1.47,a.c,.35);for(let j=0;j<12;j++){let ang=j*TAU/12;part(base,'box',Math.sin(ang)*1.1,.325,Math.cos(ang)*1.1,.055,.025,.16,c,1,ry(ang))}let obj=mul(translate(a.position[0],floatHeight(time,i),a.position[2]),ry(time*.38+i*.8+(focus&&i===selected?yaw*.4:0)));artifact(a,obj,i);if(active){ring(base,.41,1.35,c,.55)}
let p=project(vp,[a.position[0],.12,a.position[2]+.35]),hit=project(vp,[a.position[0],floatHeight(time,i),a.position[2]]);let x=(p[0]+1)*w/2,y=(1-p[1])*h/2;let hx=(hit[0]+1)*w/2,hy=(1-hit[1])*h/2;let show=p[3]>0&&Math.abs(p[0])<.9&&p[1]<.82&&p[1]>-.77&&(!focus||i===selected);a.label.hidden=!show;a.label.style.left=x+'px';a.label.style.top=(y+13)+'px';if(hit[3]>0&&Math.abs(hit[0])<1&&Math.abs(hit[1])<1)targets.push({i,x:hx,y:hy,r:Math.max(24,Math.min(75,w/(focus?8:15))),px:x,py:y});}
// One additive pass supplies the floor spill, beam and halo without a bloom framebuffer.
gl.enable(gl.BLEND);
gl.blendFunc(gl.SRC_ALPHA,gl.ONE);
gl.depthMask(false);
for (const [i, a] of items.entries()) {
  const [x,,z] = a.position;
  const active = i === selected || i === hover;
  const accent = active ? cyan : a.c;
  const y = floatHeight(time,i);
  const beamHeight = (y - .32) / 2;
  draw('plane',tr(I(),x,.018,z,3.25,1,3.25),accent,3,active ? .87 : .59);
  draw('plane',billboard(x,.32 + beamHeight,z,.57,beamHeight,eye),accent,4,active ? .84 : .6);
  draw('plane',billboard(x,y,z,1.38,1.4,eye),accent,5,active ? .44 : .28);
}

gl.depthMask(true);
gl.disable(gl.BLEND);
if (!lastDrawChecked) {
  lastDrawChecked = true;
  const error = gl.getError();
  if (error !== gl.NO_ERROR) throw Error('initial draw failed (WebGL error '+error+')');
}
}
let prev=performance.now(),lastDraw=0,lastDrawChecked=false;
animate(frame,onFail,onDispose);
function local(e){let r=canvas.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top}}function pick(e){let p=local(e);return targets.map(t=>({...t,d:Math.min(Math.hypot(t.x-p.x,t.y-p.y),Math.hypot(t.px-p.x,t.py-p.y))})).filter(t=>t.d<t.r).sort((a,b)=>a.d-b.d)[0]?.i}
canvas.addEventListener('pointerdown',e=>{if(e.button!==0)return;drag={id:e.pointerId,x:e.clientX,y:e.clientY,sx:e.clientX,sy:e.clientY,moved:false};canvas.setPointerCapture(e.pointerId)});canvas.addEventListener('pointermove',e=>{if(drag&&drag.id===e.pointerId){if(Math.hypot(e.clientX-drag.sx,e.clientY-drag.sy)>6)drag.moved=true;if(drag.moved){yaw=Math.max(-.85,Math.min(.85,yaw-(e.clientX-drag.x)*.005));pitch=Math.max(-1.4,Math.min(2,pitch+(e.clientY-drag.y)*.014));canvas.classList.add('dragging')}drag.x=e.clientX;drag.y=e.clientY}else{hover=pick(e)??-1;canvas.style.cursor=hover>=0?'pointer':'grab'}});canvas.addEventListener('pointerup',e=>{if(drag&&!drag.moved){let i=pick(e);if(i!==undefined)onSelect(i)}drag=null;canvas.classList.remove('dragging')});for(let event of ['pointercancel','lostpointercapture'])canvas.addEventListener(event,()=>{drag=null;canvas.classList.remove('dragging')});canvas.addEventListener('pointerleave',()=>hover=-1);function contextLost(event) {
  event.preventDefault();
  onFail(Error('graphics context lost'));
}
canvas.addEventListener('webglcontextlost',contextLost);
onDispose(() => canvas.removeEventListener('webglcontextlost',contextLost));
return{focus(i){selected=i;yaw=0;pitch=0;items.forEach((a,j)=>a.label.setAttribute('aria-pressed',String(i===j)))},reset(){yaw=0;pitch=0},pause(v){paused=v},quality(v){low=v;resize()}};
}

// GPU-independent 3D projection. The same positions, labels and camera controls
// remain available when WebGL is unsupported. Low-poly meshes keep it lightweight.
function createSoftwareScene(config,onSelect,onFail,canvas,onDispose){
 const wrap=document.getElementById('gallery'),labels=document.getElementById('labels'),ctx=canvas.getContext('2d');if(!ctx)throw Error('2D canvas context unavailable');
 let w=1,h=1,selected=-1,hover=-1,yaw=0,pitch=0,paused=false,low=false,time=0,drag=null,targets=[],eye=[0,8.3,13],at=[0,.65,-1.2],vp=I(),prev=performance.now(),lastDraw=0;
 const items=config.artifacts.map((a,i)=>{let label=document.createElement('button');label.type='button';label.hidden=true;label.className='artifact-label';label.textContent=a.short||a.name;label.setAttribute('aria-label','Open '+a.name);label.setAttribute('aria-pressed','false');label.onclick=()=>onSelect(i);label.onpointerenter=()=>hover=i;label.onpointerleave=()=>hover=-1;labels.append(label);return {...a,label}});
 function resize(){w=Math.max(1,wrap.clientWidth);h=Math.max(1,wrap.clientHeight);let d=low?1:Math.min(devicePixelRatio||1,1.5);canvas.width=Math.round(w*d);canvas.height=Math.round(h*d);ctx.setTransform(d,0,0,d,0,0)}watchSize(wrap,resize,onDispose);
 function screen(p){let q=project(vp,p);return{x:(q[0]+1)*w/2,y:(1-q[1])*h/2,z:q[2],depth:q[3]}}function path(ps,fill,stroke,lw=1){if(ps.some(p=>p.depth<=.1))return;ctx.beginPath();ps.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));if(fill){ctx.closePath();ctx.fillStyle=fill;ctx.fill()}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=lw;ctx.stroke()}}
 function traceLine(from,to) {
   let a=screen(from), b=screen(to);
   const near=.25;
   if(a.depth<near && b.depth<near)return;
   if(a.depth<near || b.depth<near) {
     const t=(near-a.depth)/(b.depth-a.depth);
     const clipped=screen(from.map((v,i) => v+(to[i]-v)*t));
     if(a.depth<near)a=clipped;
     else b=clipped;
   }
   ctx.moveTo(a.x,a.y);
   ctx.lineTo(b.x,b.y);
 }

 function paintHaze(x,y,rx,ry,tint) {
   ctx.save();
   ctx.translate(x*w,y*h);
   ctx.scale(rx*w,ry*h);
   const g=ctx.createRadialGradient(0,0,0,0,0,1);
   g.addColorStop(0,tint+'ff');
   g.addColorStop(.5,tint+'40');
   g.addColorStop(1,tint+'00');
   ctx.fillStyle=g;
   ctx.fillRect(-1,-1,2,2);
   ctx.restore();
 }

 function drawVoid() {
   ctx.fillStyle=config.theme.background;
   ctx.fillRect(0,0,w,h);
   const [dx,dy]=hazeShift(eye,at);
   ctx.globalCompositeOperation='lighter';
   paintHaze(.27+dx,.34+dy,.76,.55,'#220d3c');
   paintHaze(.77+dx*.55,.39+dy*.55,.63,.38,'#2b0d21');
   paintHaze(.54-dx*.35,.55-dy*.35,.86,.44,'#0e0820');
   ctx.globalCompositeOperation='source-over';

   // Clip at the near plane and fade both grid scales into the same open backdrop.
   const center=screen([0,0,-1]);
   const grid=ctx.createRadialGradient(w*.5,center.y,0,w*.5,center.y,Math.max(w,h)*.74);
   grid.addColorStop(0,'#7951a6a8');
   grid.addColorStop(.52,'#7951a655');
   grid.addColorStop(1,'#7951a600');
   ctx.strokeStyle=grid;
   for(const step of [1.5,6]) {
     const extent=step===6?60:33;
     ctx.lineWidth=step===6?.95:.65;
     ctx.globalAlpha=step===6?.64:.44;
     ctx.beginPath();
     for(let i=-extent;i<=extent;i+=step) {
       if(step===1.5 && i%6===0)continue;
       traceLine([i,0,-extent],[i,0,extent]);
       traceLine([-extent,0,i],[extent,0,i]);
     }
     ctx.stroke();
   }

   ctx.lineWidth=.85;
   for(const {lines,tint,opacity} of voidDetail) {
     ctx.strokeStyle=tint;
     for(const [a,b] of lines) {
       ctx.globalAlpha=opacity*(glowDepth(Math.hypot(...sub(eye,a)))+glowDepth(Math.hypot(...sub(eye,b))))/2;
       ctx.beginPath();
       traceLine(a,b);
       ctx.stroke();
     }
   }
   function point(position, opacity) {
     const p=screen(position);
     if(p.depth<=.25 || p.x<0 || p.x>w || p.y<0 || p.y>h)return;
     const size=Math.max(.7,Math.min(2.1,42/p.depth));
     ctx.globalAlpha=opacity*glowDepth(Math.hypot(...sub(eye,position)));
     ctx.fillRect(p.x-size/2,p.y-size/2,size,size);
   }
   ctx.fillStyle='#c0a2fa';
   for(const position of nodes)point(position,.57);
   ctx.fillStyle='#b393da';
   for(let i=0;i<(low?24:dust.length);i++) {
     const [x,y,z]=dust[i];
     point([x+Math.sin(time*.26+z)*.35,y+Math.cos(time*.32+x)*.24,z],.46);
   }
   ctx.globalAlpha=1;
 }
 function circle(x,y,z,r,c,fill,weight=1,glow=0){let ps=Array.from({length:49},(_,i)=>screen([x+Math.cos(i*TAU/48)*r,y,z+Math.sin(i*TAU/48)*r]));ctx.shadowColor=c||'transparent';ctx.shadowBlur=glow;path(ps,fill,c,weight);ctx.shadowBlur=0;return ps}
 function rgb(c,k=1){let a=color(c).map(v=>Math.round(Math.min(255,v*255*k+9)));return `rgb(${a.join(',')})`}
 function artifactGlow(x,z,top,r,c,active) {
   const bottom=screen([x,.3,z]);
   if (top.depth<=.1 || bottom.depth<=.1) return;
   const halo=ctx.createRadialGradient(top.x,top.y,0,top.x,top.y,r*1.35);
   halo.addColorStop(0,c+(active?'66':'45'));
   halo.addColorStop(1,c+'00');
   ctx.fillStyle=halo;
   ctx.fillRect(top.x-r*1.35,top.y-r*1.35,r*2.7,r*2.7);

   const beam=ctx.createLinearGradient(bottom.x,bottom.y,top.x,top.y);
   beam.addColorStop(0,c+(active?'80':'5c'));
   beam.addColorStop(.72,c+'33');
   beam.addColorStop(1,c+'00');
   const baseWidth=r*.34, tipWidth=r*.11;
   path([
     {...bottom,x:bottom.x-baseWidth}, {...top,x:top.x-tipWidth},
     {...top,x:top.x+tipWidth}, {...bottom,x:bottom.x+baseWidth}
   ],beam);
   ctx.shadowColor=c;
   ctx.shadowBlur=active?15:8;
   path([bottom,top],null,c+(active?'b0':'80'),active?2:1.25);
   ctx.shadowBlur=0;
 }
 function transform(m,p){return[0,1,2].map(i=>m[i]*p[0]+m[i+4]*p[1]+m[i+8]*p[2]+m[i+12])}
 const keyLight=norm([-.6,1,.8]),fillLight=norm([.8,.5,-.4]);
 const meshes={box:box(),crystal:crystal(),orb:sphere(8,5),cyl:cylinder(12)};
 function model(a,i){let [x,_,z]=a.position,c=a.color,accent=i===selected||i===hover?config.theme.cyan:c,base=mul(translate(x,floatHeight(time,i),z),ry(time*.4+i*.5+yaw*.25)),faces=[];
 function add(g,x,y,z,sx,sy,sz,hex,glow=false,rot=null){let m=mul(base,translate(x,y,z));if(rot)m=mul(m,rot);m=mul(m,scale(sx,sy,sz));let arr=meshes[g];for(let j=0;j<arr.length;j+=18){let p=[0,6,12].map(k=>transform(m,arr.slice(j+k,j+k+3))),n=norm(cross(sub(p[1],p[0]),sub(p[2],p[0])));let ps=p.map(screen);if(ps.some(q=>q.depth<=.1))continue;let light=.43+.63*Math.max(0,dot(n,keyLight))+.35*Math.max(0,dot(n,fillLight));if(glow)light=1.15;faces.push({ps,d:ps.reduce((s,p)=>s+p.depth,0)/3,fill:rgb(hex,light),stroke:glow?hex+'aa':hex+'35'})}}
 switch(a.model){case'network':for(let x of [-1,1])for(let y of [-1,1])for(let z of [-1,1]){add('orb',x*.5,y*.5,z*.5,.10,.10,.10,accent,true);if(x===-1)add('box',0,y*.5,z*.5,1,.035,.035,c,true);if(y===-1)add('box',x*.5,0,z*.5,.035,1,.035,c,true);if(z===-1)add('box',x*.5,y*.5,0,.035,.035,1,c,true)}add('orb',0,0,0,.32,.32,.32,c);break;
 case'terminal':add('box',0,.15,0,1.5,1,.2,'#4e3e68');add('box',0,.15,.115,1.32,.79,.04,'#201433');for(let j=0;j<5;j++)add('box',-.14,.42-j*.13,.15,.85-j*.09,.027,.025,j===0?config.theme.cyan:accent,true);add('box',0,-.43,.24,1.48,.12,.7,'#6d537c');for(let j=0;j<5;j++)add('box',-.48+j*.24,-.36,.24,.15,.025,.24,accent,true);break;
 case'chip':add('box',0,0,0,1.1,.23,1.1,'#55456d',false,rx(.7));add('box',0,.12,.10,.72,.15,.72,c,false,rx(.7));for(let j=0;j<6;j++)for(let s of [-1,1])add('box',s*.63,0,-.4+j*.16,.26,.06,.06,accent,true,rx(.7));break;
 case'beacon':add('cyl',0,-.05,0,.24,.84,.24,'#5f456e');add('crystal',0,.4,0,.31,.45,.31,c);add('orb',0,.94,0,.12,.12,.12,accent,true);for(let j=0;j<3;j++)add('cyl',0,-.34+j*.32,0,.36+j*.12,.045,.36+j*.12,accent,true);break;
 default:add('crystal',0,0,0,.8,.8,.8,c);for(let s of [-1,1])add('crystal',s*.65,-.22,0,.28,.42,.28,accent,false,rz(-s*.3));break;}
 faces.sort((a,b)=>b.d-a.d);for(let f of faces)path(f.ps,f.fill,f.stroke,.55);
 }
 function frame(now){if(document.hidden||now-lastDraw<(paused?100:low?50:30))return;lastDraw=now;let dt=Math.min((now-prev)/1000,.05);prev=now;if(!paused&&!document.hidden)time+=dt;let aspect=w/h,focused=selected>=0,center=focused?items[selected].position:[0,0,-1.2],dist=focused?5.6:Math.max(12.5,15/Math.max(aspect,.65)),angle=yaw+.1,k=paused?1:1-Math.exp(-dt*6),desired=[center[0]+Math.sin(angle)*dist,(focused?2.7:8.1)+pitch,center[2]+Math.cos(angle)*dist],aim=[center[0],focused?1.1:.65,center[2]];eye=eye.map((v,i)=>v+(desired[i]-v)*k);at=at.map((v,i)=>v+(aim[i]-v)*k);vp=mul(perspective(rad(47),aspect,.1,85),look(eye,at));drawVoid();
 targets=[];let order=items.map((a,i)=>({a,i,d:screen(a.position).depth})).sort((a,b)=>b.d-a.d);for(let {a,i} of order){let [x,_,z]=a.position,c=i===selected||i===hover?config.theme.cyan:a.color,p=screen([x,.1,z]);if(p.depth<=.1)continue;let edge=screen([x+1.3,.1,z]),r=Math.max(8,Math.hypot(edge.x-p.x,edge.y-p.y)),g=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,r*2.5);g.addColorStop(0,c+(i===selected||i===hover?'88':'68'));g.addColorStop(1,c+'00');ctx.save();ctx.translate(p.x,p.y);ctx.scale(1,.48);ctx.translate(-p.x,-p.y);ctx.fillStyle=g;ctx.fillRect(p.x-r*2.5,p.y-r*2.5,r*5,r*5);ctx.restore();circle(x,.06,z,1.29,'#58416f','#171022',1);circle(x,.23,z,1.28,c,'#241a38',2,i===selected||i===hover?20:12);circle(x,.27,z,1.02,c+'99','#120d20',1,5);circle(x,.015,z,1.48,c+'88',null,1,7);if(i===selected||i===hover)circle(x,.35,z,1.37,c+'b0',null,1.3,12);for(let j=0;j<12;j++){let a=j*TAU/12;path([screen([x+Math.cos(a)*1.08,.25,z+Math.sin(a)*1.08]),screen([x+Math.cos(a)*1.17,.25,z+Math.sin(a)*1.17])],null,c,1.6)}let top=screen([x,floatHeight(time,i),z]);artifactGlow(x,z,top,r,c,i===selected||i===hover);model(a,i);if(a.model==='crystal'||a.model==='network'){circle(x,floatHeight(time,i),z,.83,c+'a0',null,1,8)}let l=screen([x,.12,z+.35]);let show=l.depth>0&&l.x>22&&l.x<w-22&&l.y>50&&l.y<h-55&&(!focused||i===selected);a.label.hidden=!show;a.label.style.left=l.x+'px';a.label.style.top=(l.y+13)+'px';if(top.depth>0&&top.x>0&&top.x<w&&top.y>0&&top.y<h)targets.push({i,x:top.x,y:top.y,px:p.x,py:p.y,r:Math.max(25,r)});}
 }
 animate(frame,onFail,onDispose);
 function contextLost() { onFail(Error('2D canvas context lost')); }
 canvas.addEventListener('contextlost',contextLost);
 onDispose(() => canvas.removeEventListener('contextlost',contextLost));
 function pick(e){let b=canvas.getBoundingClientRect(),x=e.clientX-b.left,y=e.clientY-b.top;return targets.map(t=>({...t,d:Math.min(Math.hypot(t.x-x,t.y-y),Math.hypot(t.px-x,t.py-y))})).filter(t=>t.d<t.r).sort((a,b)=>a.d-b.d)[0]?.i}
 canvas.onpointerdown=e=>{if(e.button!==0)return;drag={x:e.clientX,y:e.clientY,sx:e.clientX,sy:e.clientY,moved:false};canvas.setPointerCapture(e.pointerId)};canvas.onpointermove=e=>{if(drag){if(Math.hypot(e.clientX-drag.sx,e.clientY-drag.sy)>6)drag.moved=true;if(drag.moved){yaw=Math.max(-.85,Math.min(.85,yaw-(e.clientX-drag.x)*.005));pitch=Math.max(-1.4,Math.min(2,pitch+(e.clientY-drag.y)*.014));canvas.classList.add('dragging')}drag.x=e.clientX;drag.y=e.clientY}else{hover=pick(e)??-1;canvas.style.cursor=hover>=0?'pointer':'grab'}};canvas.onpointerup=e=>{if(drag&&!drag.moved){let i=pick(e);if(i!==undefined)onSelect(i)}drag=null;canvas.classList.remove('dragging')};canvas.onpointercancel=canvas.onlostpointercapture=()=>{drag=null;canvas.classList.remove('dragging')};canvas.onpointerleave=()=>hover=-1;
 return{focus(i){selected=i;yaw=pitch=0;items.forEach((a,j)=>a.label.setAttribute('aria-pressed',String(i===j)))},reset(){yaw=pitch=0},pause(v){paused=v},quality(v){low=v;resize()}};
}
