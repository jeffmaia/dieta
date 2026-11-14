const http=require('http'),fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const T={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8'};
http.createServer((q,s)=>{
  let p=path.join(root,decodeURIComponent(q.url.split('?')[0]));
  if(!p.startsWith(root)){s.writeHead(403);return s.end();}
  if(fs.existsSync(p)&&fs.statSync(p).isDirectory())p=path.join(p,'index.html');
  fs.readFile(p,(e,d)=>{if(e){s.writeHead(404);return s.end('404');}
    s.writeHead(200,{'Content-Type':T[path.extname(p)]||'application/octet-stream','Cache-Control':'no-store'});s.end(d);});
}).listen(process.env.PORT||8080,'0.0.0.0');
