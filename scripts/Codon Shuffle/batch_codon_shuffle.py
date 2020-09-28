#!/usr/bin/env python3

import sys
import random
import re

if len(sys.argv) == 3:
    # Utility for generating a seed line quickly
    seedcount = None

    try:
        seedcount = int(sys.argv[2])
    except ValueError:
        pass
    
    if(sys.argv[1] == 'generate-seeds' and seedcount):
        print('Generate seeds')
        seedrng = random.Random()
        seedrng.seed()

        seeds = set()

        while(len(seeds) < seedcount):
            seeds.add(random.randint(1000000000000000, 9999999999999999))
        
        print(f'#SEED:{",".join([str(s) for s in seeds])}')

        sys.exit(-1)

if len(sys.argv) < 4:
    print(f'Usage: {sys.argv[0]} generate-seeds <count>')
    print(f'Usage: {sys.argv[0]} <codons> <input> <output>')
    print('Reads the passed codon file to translate the input genes into the output dna')
    sys.exit(-1)    

arg_script, arg_codons, arg_input, arg_output = sys.argv

codon_file_pattern = re.compile(r'^([A-Z]):\s*([A-Z,]+)\s*$')

errors = False
codons = {}
with open(arg_codons) as f:
    for i, line in enumerate(f):
        split_line = line.strip().split('#', 1)
        if len(split_line[0]) == 0 or split_line[0].isspace():
            continue
        match = codon_file_pattern.match(split_line[0])
        if match:
            codons[match.group(1)] = match.group(2).split(',')
        else:
            print(f'Illegal codon definition on line {i}')
            errors = True
            break

if errors:
    print('Encountered errors reading codons file. Aborting')
    exit

unknown_acids = set()

rng = random.Random()

def translate_acid(acid):
    if acid.isspace():
        return acid
    elif acid in codons:
        return rng.choice(codons[acid])
    else:
        unknown_acids.add(acid)
        return '!!!'

seeds = set()

input_lines = []

with open(arg_input) as infile:
    for line in infile:
        if line.startswith('#SEED:'):
            seedinputs = line.replace('#SEED:', '').split(',')

            for seedinput in seedinputs:
                seeds.add(int(seedinput))
        
            continue

        input_lines.append(line)
    
if not len(seeds):
    seeds.add(None)

with open(arg_output, 'w') as outfile:
    for seed in seeds:
        rng.seed(seed)
        outfile.write(f'#SEED:{seed}\n')
        for line in input_lines:
            if line.startswith('#SEED:'):
                continue
            split_line = line.split('#', 1)
            split_line[0] = ''.join([translate_acid(c) for c in split_line[0]])
            outfile.write('#'.join(split_line))

if len(unknown_acids) != 0:
    print('Encountered unknown amino acids: ' + ','.join(unknown_acids))