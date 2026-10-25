"""Offline checks of the published evidence. No model imports or network calls."""
import hashlib
import json
from pathlib import Path
import sys
import tempfile
import unittest

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'scripts'))
import rescore
import run_inference

class EvidenceTests(unittest.TestCase):
    def test_complete_runs_and_totals(self):
        for strategy,hits,calls in [('oneshot',966,1272),('reground1024',984,2544)]:
            with self.subTest(strategy=strategy):
                rows=[json.loads(x)for x in (ROOT/'predictions'/f'atom_fourbit_{strategy}.jsonl').read_text().splitlines()]
                self.assertEqual(len(rows),1272)
                self.assertEqual(len({r['id']for r in rows}),1272)
                self.assertEqual(sum(r['hit']for r in rows),hits)
                self.assertEqual(sum(r['model_calls']for r in rows),calls)
                self.assertEqual(sum(r['runtime_errors']for r in rows),0)

    def test_refinement_matches_all_saved_traces(self):
        rows=(ROOT/'predictions/atom_fourbit_reground1024.jsonl').read_text().splitlines()
        for text in rows:
            r=json.loads(text)
            with self.subTest(example=r['id']):
                first,second=r['trace']
                w,h=r['image_width'],r['image_height']
                self.assertEqual(list(run_inference.crop_box(w,h,first['mapped'])),second['crop'])
                point=run_inference.decode(second['raw'])
                self.assertEqual(run_inference.map_point(point,second['crop'],w,h),r['pred_norm1000'])
                self.assertEqual(second['mapped'],r['pred_norm1000'])

    def test_scoring_boundaries_and_missing_point(self):
        box=[10,20,30,40]
        self.assertTrue(rescore.in_box([100,200],box,100,100))
        self.assertTrue(rescore.in_box([400,600],box,100,100))
        self.assertFalse(rescore.in_box([401,600],box,100,100))
        self.assertFalse(rescore.in_box(None,box,100,100))

    def test_rejects_modified_annotations(self):
        with tempfile.TemporaryDirectory()as directory:
            (Path(directory)/'screenspot_desktop_v2.json').write_text('[]')
            with self.assertRaisesRegex(ValueError,'Annotation mismatch'):
                rescore.load_ground_truth(directory)

    def test_integrity_manifest(self):
        for line in (ROOT/'SHA256SUMS').read_text().splitlines():
            expected,name=line.split('  ',1)
            with self.subTest(file=name):
                self.assertEqual(hashlib.sha256((ROOT/name).read_bytes()).hexdigest(),expected)

if __name__=='__main__':unittest.main()
