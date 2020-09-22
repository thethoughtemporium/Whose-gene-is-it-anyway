# Script usage
The script accepts exactly three arguments:
- a file containing the amino acids and their corresponding codons
- a file containing the amino acids you wish to convert to DNA
- a location to output the DNA

e.g.
```
./codon_shuffle.py example/codons.txt example/gene.txt example/dna.txt
```

# File formats
## Codons file
- Anything after a `#` character will be ignored as a comment
- Empty lines are ignored (including lines with only a comment)
- Each line contains an amino acid abbreviation and then a comma-separated list of codons to be used to code for that 
  amino acid  e.g. `Q: CAA,CAG # Glutamine`

## Gene file
- Any lines beginning with *exactly* `#SEED:` will reset the current random number generator seed. Setting a specific
  seed at the start of a gene will ensure that the generated DNA will be the same every time. If no seed is specified
  the DNA will change completely every time the script is run.
- Anything after a `#` character will be ignored as a comment and preserved in the output
- The script will replace every non-comment, non-whitespace character with random codons as defined in the codon file
- If the script encounters any abbreviations that aren't present in the codons file, it will use `!!!` as the codon and
  will print an error to the console with list of all the unknown abbreviations it encountered while translating.

## DNA file
The DNA file will be identical to the gene file except that the amino acids will be replaced with bases. Any comments
will be copied over verbatim.
