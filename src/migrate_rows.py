import json
import os

filepath = 'data/courses.json'
with open(filepath, 'r') as f:
    data = json.load(f)

# The row indices in data/courses.json are still old (e.g. 0, 1, 2, 3...)
# It seems the previous run updated the in-memory object but maybe
# not the right properties or something, let's verify if they actually changed.
# Actually, the file above shows row: 1, row: 2, row: 3...
# Year 1 Sem 1: 0 -> new 0
# Year 1 Sem 2: 1 -> new 1
# Year 2 Sem 1: 2 -> new 3
# Year 2 Sem 2: 3 -> new 4

def new_row(old_row):
    year = old_row // 2
    sem = old_row % 2
    return year * 3 + sem

# Let's check if they were already migrated. EGB125 is row 1.
# Wait, EGB214 is row 2. If it was already migrated it would be 3.
# This means my previous script did not write to data/courses.json or it got overwritten.

count = 0
for node in data.get('NODES', []):
    if 'row' in node:
        # Check if we should migrate. If any row > 2 and it's a known unit, we know.
        # But wait, EGB214 is Year 2 Sem 1. It should be row 3.
        # Right now it's row 2. So it hasn't been migrated.
        node['row'] = new_row(node['row'])
        count += 1
    if 'manualRow' in node:
        node['manualRow'] = new_row(node['manualRow'])

with open(filepath, 'w') as f:
    json.dump(data, f, indent=2)

print(f"Migrated {count} nodes")
