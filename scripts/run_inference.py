"""New reference implementation of the locked protocol. Requires explicit --run-model.

This script was syntax/geometry checked, but no model inference was run during
package preparation. It does not install, download, train, select or tune anything.
"""
import argparse
import hashlib
import importlib.metadata
import json
import platform
import re
import struct
import sys
import tempfile
import time
import zipfile
from pathlib import Path
from rescore import ROOT, image_index, in_box, load_ground_truth

def sha(p):
    with Path(p).open('rb')as f:return hashlib.file_digest(f,'sha256').hexdigest()

def crop_box(width,height,point,size=1024):
    side=int(min(size,width,height))
    cx,cy=point[0]/1000*width,point[1]/1000*height
    x=int(round(min(max(cx-side/2,0),width-side)))
    y=int(round(min(max(cy-side/2,0),height-side)))
    return x,y,x+side,y+side

def map_point(point,crop,width,height):
    x0,y0,x1,y1=crop
    return [(x0+point[0]/1000*(x1-x0))/width*1000,
            (y0+point[1]/1000*(y1-y0))/height*1000]

def decode(text):
    loc=[float(x)for x in re.findall(r'<loc_(\d+)>',text)]
    if len(loc)>=4:return [(loc[0]+loc[2])/2,(loc[1]+loc[3])/2]
    if len(loc)>=2:return loc[:2]
    return None

def main():
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--run-model',action='store_true')
    ap.add_argument('--checkpoint',required=True,help='Exact separately supplied 13-file local model directory')
    ap.add_argument('--data',required=True,help='Pinned annotation directory')
    ap.add_argument('--images-zip',required=True,help='Pinned OS-Copilot image archive')
    ap.add_argument('--strategy',choices=['oneshot','reground1024'],required=True)
    ap.add_argument('--out',required=True,help='New JSONL, must not exist')
    args=ap.parse_args()
    if not args.run_model:ap.error('Explicit --run-model required; no inference performed')
    out=Path(args.out);meta=out.with_suffix(out.suffix+'.metadata.json')
    if out.exists()or meta.exists():ap.error('Output already exists; choose a fresh path')
    cfg=json.loads((ROOT/'config.json').read_text())
    ckpt=json.loads((ROOT/'metadata/checkpoint.json').read_text())
    for f in ckpt['files']:
        p=Path(args.checkpoint)/f['name']
        if p.stat().st_size!=f['bytes']or sha(p)!=f['sha256']:ap.error('Checkpoint file mismatch: '+f['name'])
    da=json.loads((ROOT/'metadata/dataset_authentication.json').read_text())
    if sha(args.images_zip)!=da['image_archive']['expected_and_actual_sha256']:ap.error('Image archive hash mismatch')
    gt=load_ground_truth(args.data);images=image_index()
    # Import model and image libraries only after explicit permission and data/config locks.
    from PIL import Image
    from mlx_vlm import load,generate
    from mlx_vlm.prompt_utils import apply_chat_template
    import mlx.core as mx
    model,processor=load(args.checkpoint)
    env={'python':platform.python_version(),'os':platform.platform(),'versions':{n:importlib.metadata.version(n)for n in ['mlx','mlx-vlm','transformers','Pillow','numpy','tokenizers','huggingface-hub','safetensors']}}
    metadata={'status':'fresh inference, separate from historical saved runs','strategy':args.strategy,'locked_config':cfg,'checkpoint_sha256':ckpt['weight_sha256'],'environment':env,'completed':False,'rows_completed':0}
    with meta.open('x')as f:json.dump(metadata,f,indent=2)
    archive=zipfile.ZipFile(args.images_zip)
    by_name={Path(i).name:i for i in archive.namelist()if not i.endswith('/')}
    def predict(path,instruction,crop,width,height):
        trace=[]
        for attempt in range(2):
            begin=time.perf_counter();point=None;error=None;raw=''
            try:
                q=cfg['prompt_template'].format(instruction=instruction.strip()).lower()
                try:q=apply_chat_template(processor,model.config,q,num_images=1)
                except Exception:pass
                result=generate(model,processor,q,str(path),max_tokens=32,temperature=0.0,verbose=False)
                raw=result.text if hasattr(result,'text')else str(result)
                point=decode(raw)
            except Exception as e:error=type(e).__name__+': '+str(e)
            mapped=map_point(point,crop,width,height)if point is not None and crop is not None else point
            trace.append({'crop':list(crop)if crop else None,'ms':round((time.perf_counter()-begin)*1000,1),'raw':raw[:160],'error':error,'mapped':mapped})
            if not error:break
            if attempt==0:
                try:mx.metal.clear_cache()
                except Exception:pass
                time.sleep(1)
        return trace
    with tempfile.TemporaryDirectory(prefix='atom-fixed-eval-')as temporary,out.open('x')as output:
        tmp=Path(temporary)
        for identity,g in gt.items():
            imeta=images[g['img_filename']];width,height=imeta['width'],imeta['height']
            original=tmp/g['img_filename'];original.write_bytes(archive.read(by_name[g['img_filename']]))
            if sha(original)!=imeta['sha256']:raise ValueError('Image mismatch')
            start=time.perf_counter();trace=predict(original,g['instruction'],None,width,height);point=trace[-1]['mapped']
            if args.strategy=='reground1024'and point is not None:
                crop=crop_box(width,height,point)
                if crop!=(0,0,width,height):
                    cut=tmp/'refinement.png'
                    with Image.open(original)as im:im.crop(crop).save(cut)
                    more=predict(cut,g['instruction'],crop,width,height);trace.extend(more)
                    if more[-1]['mapped']is not None:point=more[-1]['mapped']
            row={'id':identity,'image':g['img_filename'],'instruction':g['instruction'],'platform':g['platform'],'target_type':g['data_type'],'image_width':width,'image_height':height,'pred_norm1000':point,'pred_pixel':[point[0]/1000*width,point[1]/1000*height]if point else None,'hit':in_box(point,g['bbox'],width,height),'model_calls':len(trace),'runtime_errors':sum(bool(t['error'])for t in trace),'latency_ms':round((time.perf_counter()-start)*1000,1),'trace':trace}
            output.write(json.dumps(row,allow_nan=False)+'\n');output.flush()
            metadata['rows_completed']+=1
            original.unlink()
            if metadata['rows_completed']%100==0:print(metadata['rows_completed'],'/1272',flush=True)
    metadata['completed']=True;meta.write_text(json.dumps(metadata,indent=2)+'\n')

if __name__=='__main__':main()
