#!/usr/bin/env python3
import re, sys, json
def parse(path):
    text = open(path, encoding="utf-8").read()
    rows = []
    row_pat = re.compile(r"^\|\s*([A-Z]\d+)\s*\|\s*([^|]+?)\s*\|.*?\|\s*`([^`]+)`\s*\|\s*(YES|NO|TBD|NEWLY-DISCOVERED)\s*\|", re.MULTILINE)
    for m in row_pat.finditer(text):
        rows.append({"id": m.group(1).strip(),"name": m.group(2).strip(),"verify": m.group(3).strip(),"required": m.group(4).strip()})
    return rows
if __name__ == "__main__":
    if len(sys.argv) < 2: sys.exit(2)
    json.dump(parse(sys.argv[1]), sys.stdout)
