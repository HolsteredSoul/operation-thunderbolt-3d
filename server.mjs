import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 8083);
http.createServer((req,res) => {
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url,'http://localhost').pathname); } catch {res.writeHead(400).end();return;}
  const reference = process.env.REFERENCE_QA === '1' && pathname === '/reference';
  const file = reference ? 'C:/DEV/Thunderbolt_WWII/index.html' : path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
  if (!reference && (!file.startsWith(root + path.sep) || /(?:^|[\\/])\./.test(path.relative(root,file)))) {res.writeHead(403).end();return;}
  fs.readFile(file,(err,data)=>{
    if(err){res.writeHead(404).end('Not found');return;}
    res.writeHead(200,{'Content-Type':({'html':'text/html','js':'text/javascript','mjs':'text/javascript','css':'text/css','json':'application/json','png':'image/png'})[file.split('.').pop()]||'application/octet-stream','Cache-Control':'no-cache'});res.end(data);
  });
}).listen(port,'127.0.0.1',()=>console.log(`Operation Thunderbolt: http://127.0.0.1:${port}`));
