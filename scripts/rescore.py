"""Rescore saved points only. Standard library; no model imports or calls."""
import argparse
import collections
import hashlib
import json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]

def load_ground_truth(data):
    auth=json.loads((ROOT/'metadata/dataset_authentication.json').read_text())
    expected={r['file']:r for r in auth['annotation_files']}
    rows={}
    for split in ['desktop','web','mobile']:
        name=f'screenspot_{split}_v2.json'
        b=(Path(data)/name).read_bytes()
        actual=hashlib.sha1(b'blob '+str(len(b)).encode()+b'\0'+b).hexdigest()
        if actual!=expected[name]['pinned_oid']:raise ValueError(f'Annotation mismatch: {name}')
        for i,r in enumerate(json.loads(b)):
            rows[f'{split}:{i}']=dict(r,platform=split)
    if len(rows)!=1272:raise ValueError('Expected all 1272 examples')
    return rows

def image_index():
    d=json.loads((ROOT/'metadata/image_hashes_dimensions.json').read_text())
    return {r['image']:r for r in d['images']}

def in_box(point, box, width, height):
    if point is None:return False
    x,y,w,h=box
    return x<=point[0]/1000*width<=x+w and y<=point[1]/1000*height<=y+h

def rescore(path,gt,images):
    rows=[json.loads(s)for s in Path(path).read_text().splitlines()if s.strip()]
    if len(rows)!=1272 or len({r['id']for r in rows})!=1272:raise ValueError('Incomplete or duplicate predictions')
    if {r['id']for r in rows}!=set(gt):raise ValueError('Prediction IDs differ from dataset')
    counts=collections.defaultdict(lambda:[0,0]);disagreements=[]
    for r in rows:
        g=gt[r['id']];im=images[g['img_filename']]
        if r['image']!=g['img_filename'] or r['instruction']!=g['instruction']:raise ValueError('Example identity mismatch')
        hit=in_box(r['pred_norm1000'],g['bbox'],im['width'],im['height'])
        if hit!=r['hit']:disagreements.append(r['id'])
        for key in ['overall','platform/'+g['platform'],'target_type/'+g['data_type'],'platform_type/'+g['platform']+'/'+g['data_type'],'source/'+g['data_source']]:
            counts[key][0]+=int(hit);counts[key][1]+=1
    return {'prediction_file':Path(path).name,'saved_hit_disagreements':disagreements,'breakdowns':{k:{'hits':h,'n':n,'accuracy':h/n}for k,(h,n)in sorted(counts.items())}}

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--data',required=True,help='Directory containing the three pinned annotation JSON files')
    p.add_argument('--predictions',nargs='+',help='Defaults to both bundled JSONL files')
    p.add_argument('--out',help='Optional new result JSON; refuses to overwrite')
    a=p.parse_args();gt=load_ground_truth(a.data);images=image_index()
    paths=a.predictions or sorted((ROOT/'predictions').glob('*.jsonl'))
    result=[rescore(x,gt,images)for x in paths]
    if any(x['saved_hit_disagreements']for x in result):raise ValueError('Saved hit disagreement')
    text=json.dumps(result,indent=2)+'\n'
    if a.out:
        with Path(a.out).open('x')as f:f.write(text)
    print(text,end='')

if __name__=='__main__':main()
