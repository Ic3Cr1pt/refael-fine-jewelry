// A brilliant-cut study with a table, crown, narrow girdle and pointed pavilion.
(() => {
  const canvas = document.getElementById('gem');
  const section = document.getElementById('diamonds');
  const button = document.getElementById('turn-gem');
  const fallback = document.querySelector('.gem-fallback');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let initialized = false;
  function initialize() {
    if (initialized) return;
    initialized = true;
    const gl = canvas.getContext('webgl', {alpha: true, antialias: true, powerPreference:'low-power'});
    if (!gl) return;
    const vertex = `
      attribute vec3 position, normal;
      uniform vec2 rotation, viewport;
      varying vec3 surface, local, point;
      void main(){
        float a=rotation.x, b=rotation.y;
        mat3 yaw=mat3(cos(a),0.,-sin(a),0.,1.,0.,sin(a),0.,cos(a));
        mat3 pitch=mat3(1.,0.,0.,0.,cos(b),sin(b),0.,-sin(b),cos(b));
        vec3 p=pitch*yaw*position;
        local=position; point=p; surface=pitch*yaw*normal;
        float perspective=3.9/(4.1-p.z*.40);
        gl_Position=vec4(p.xy*perspective*vec2(viewport.y/viewport.x,1.)*1.3,-p.z*.35,1.);
      }`;
    const fragment = `
      precision mediump float;
      varying vec3 surface, local, point;
      float studio(vec3 r){
        float ribbon = smoothstep(.75,.94,abs(sin(3.4*r.x+1.3*r.y-1.1*r.z)));
        float pane = smoothstep(-.32,.05,r.y) * smoothstep(.52,.46,abs(r.x+.1));
        return .06+.63*ribbon+.61*pane;
      }
      void main(){
        vec3 n=normalize(surface), eye=normalize(vec3(0.,0.,3.8)-point);
        vec3 reflected=reflect(-eye,n);
        float mirror=studio(reflected);
        float polar=atan(local.z,local.x);
        float split=floor((polar+3.14159)*7.64);
        float inner=studio(normalize(reflected+vec3(sin(split*1.7),local.y*.9,cos(split*1.1))*.74));
        float fresnel=pow(1.-clamp(dot(n,eye),0.,1.),2.);
        float value=.06+.54*mirror+.43*inner+.18*fresnel;
        vec3 color=mix(vec3(.37,.45,.49),vec3(1.,.955,.84),clamp(value,0.,1.))*value;
        gl_FragColor=vec4(color,1.);
      }`;
    function shader(type, source) {
      const s=gl.createShader(type);
      gl.shaderSource(s,source); gl.compileShader(s);
      return s;
    }
    const program=gl.createProgram();
    gl.attachShader(program,shader(gl.VERTEX_SHADER,vertex));
    gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragment));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program,gl.LINK_STATUS)) return;
    gl.useProgram(program);
    const positions=[], normals=[];
    function triangle(a,b,c) {
      const ab=b.map((n,i)=>n-a[i]), ac=c.map((n,i)=>n-a[i]);
      const normal=[ab[1]*ac[2]-ab[2]*ac[1],ab[2]*ac[0]-ab[0]*ac[2],ab[0]*ac[1]-ab[1]*ac[0]];
      if(normal.reduce((s,n,i)=>s+n*(a[i]+b[i]+c[i]),0)<0)normal.forEach((n,i)=>normal[i]=-n);
      positions.push(...a,...b,...c);
      normals.push(...normal,...normal,...normal);
    }
    const circle=(count,r,y,offset=0)=>Array.from({length:count},(_,i)=>{
      const angle=(i+offset)*Math.PI*2/count;
      return [Math.cos(angle)*r,y,Math.sin(angle)*r];
    });
    const table=circle(8,.56,.41), stars=circle(8,.78,.265,.5);
    const edge=circle(16,1,.075), bottom=circle(16,.998,.046), lower=circle(8,.53,-.35,.5);
    for(let i=0;i<8;i++){
      const j=(i+1)%8, p=(i+7)%8, k=2*i, middle=k+1, end=(k+2)%16;
      triangle([0,.41,0],table[i],table[j]);
      triangle(table[i],stars[i],table[j]);
      triangle(table[i],edge[k],stars[i]); triangle(table[i],stars[p],edge[k]);
      triangle(stars[i],edge[k],edge[middle]); triangle(stars[i],edge[middle],edge[end]);
      triangle(bottom[k],lower[i],bottom[middle]); triangle(bottom[middle],lower[i],bottom[end]);
      triangle(bottom[k],lower[p],lower[i]); triangle(lower[p],[0,-.79,0],lower[i]);
    }
    for(let i=0;i<16;i++){
      const j=(i+1)%16;
      triangle(edge[i],bottom[i],edge[j]);triangle(edge[j],bottom[i],bottom[j]);
    }
    function buffer(name,data){
      const location=gl.getAttribLocation(program,name);
      gl.bindBuffer(gl.ARRAY_BUFFER,gl.createBuffer());
      gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.STATIC_DRAW);
      gl.enableVertexAttribArray(location);gl.vertexAttribPointer(location,3,gl.FLOAT,false,0,0);
    }
    buffer('position',positions);buffer('normal',normals);
    const rotation=gl.getUniformLocation(program,'rotation'), viewport=gl.getUniformLocation(program,'viewport');
    gl.enable(gl.DEPTH_TEST);gl.clearColor(0,0,0,0);
    let yaw=.38, pitch=.39, target=yaw, drag=null, frame=0, visible=true;
    function draw(){
      frame=0;
      if(!visible)return;
      yaw = motion.matches ? target : yaw+(target-yaw)*.13;
      const dpr=Math.min(devicePixelRatio,1.55);
      const width=Math.max(1,Math.round(canvas.clientWidth*dpr)),height=Math.max(1,Math.round(canvas.clientHeight*dpr));
      if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;}
      gl.viewport(0,0,width,height);
      gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
      const scroll=motion.matches?0:Math.max(-1,Math.min(1,section.getBoundingClientRect().top/innerHeight));
      gl.uniform2f(rotation,yaw+scroll*.22,pitch+scroll*.045);
      gl.uniform2f(viewport,width,height);
      gl.drawArrays(gl.TRIANGLES,0,positions.length/3);
      if(Math.abs(target-yaw)>.0007)requestDraw();
    }
    function requestDraw(){if(!frame&&visible)frame=requestAnimationFrame(draw);}
    new ResizeObserver(requestDraw).observe(canvas);
    new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;requestDraw();}).observe(canvas);
    window.addEventListener('scroll',requestDraw,{passive:true});
    canvas.addEventListener('pointerdown',e=>{
      drag=[e.clientX,e.clientY,target,pitch];
      canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener('pointermove',e=>{
      if(!drag)return;
      target=drag[2]+(e.clientX-drag[0])*.014;
      pitch=Math.max(-.64,Math.min(.92,drag[3]+(e.clientY-drag[1])*.008));
      requestDraw();
    });
    canvas.addEventListener('lostpointercapture',()=>{drag=null;});
    button.addEventListener('click',()=>{target+=Math.PI/3;requestDraw();});
    canvas.addEventListener('webglcontextlost',()=>{button.hidden=true;fallback.hidden=false;canvas.hidden=true;});
    draw();fallback.hidden=true;button.hidden=false;
  }
  if('IntersectionObserver' in window){
    const watcher=new IntersectionObserver(entries=>{
      if(entries.some(entry=>entry.isIntersecting)){watcher.disconnect();initialize();}
    },{rootMargin:'220px'});
    watcher.observe(section);
  } else initialize();
})();
