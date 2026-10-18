import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const works=JSON.parse(readFileSync('content/works.json','utf8'));
assert.equal(works.length,50,'Exactly fifty supplied studies');
assert.equal(new Set(works.map(w=>w.id)).size,50,'No duplicated studies');
assert.equal(new Set(works.map(w=>w.brand)).size,10,'Ten distinct brands');
const captions=readFileSync('content/descriptions.ts','utf8');
const logoPaths=new Set();
for(const w of works){
 for(const field of ['id','brand','concept','product','logo','small','large','lighting','palette','wardrobe'])assert.ok(w[field],`${w.id} missing ${field}`);
 assert.ok(captions.includes(`"${w.id}":`),`${w.id} missing bespoke concept copy`);
 assert.equal(w.product_status,'Concept garment','Do not present an unverified retail product');
 assert.ok(w.width>0&&w.height>0,'Intrinsic dimensions prevent layout shifts');
 for(const key of ['small','large']){const file='public'+w[key];assert.ok(existsSync(file),`${file} missing`);const bytes=readFileSync(file);assert.equal(bytes.subarray(0,4).toString(),'RIFF');assert.equal(bytes.subarray(8,12).toString(),'WEBP');}
 const svg=readFileSync('public'+w.logo,'utf8');assert.ok(svg.includes('<svg'));assert.ok(!/<script|onload=|javascript:/i.test(svg),'Brand mark must remain passive');logoPaths.add(w.logo);
}
for(const cat of ['studio','lifestyle','brutalism','locations','future'])assert.equal(works.filter(w=>w.category===cat).length,10,cat+' needs ten appropriate studies');
assert.equal(logoPaths.size,10,'Every brand has its official mark');
for(const file of ['public/fonts/manrope.woff2','public/fonts/dm-mono.woff2'])assert.equal(readFileSync(file).subarray(0,4).toString(),'wOF2','Fonts must be actual WOFF2');
assert.ok(!existsSync('public/qa-responsive.html'),'Remove temporary development review harness');
console.log('Portfolio verified: 50 unique studies, 5 categories × 10, 10 passive brand marks, 100 WebP assets, 50 bespoke captions, local WOFF2 fonts.');
