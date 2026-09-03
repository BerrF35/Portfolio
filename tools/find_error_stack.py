import json

with open(r'C:\Users\Admin\.gemini\antigravity-ide\brain\6efff75f-7869-4a15-8290-341ed1d85759\.system_generated\logs\transcript_full.jsonl', 'r', encoding='utf-8') as f:
    for line in f:
        if 'Cannot read properties of undefined' in line:
            print(line[:300])
            print('...')
