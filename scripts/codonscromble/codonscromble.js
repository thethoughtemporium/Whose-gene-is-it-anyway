function codonMapping(reverse) {
  let mapLines = document.getElementById("codondict").innerText.split("\n");
  let mapping = {};
  for (let line of mapLines) {
    if (/^\s*$/.test(line)) continue;
    let split = line.split(':', 3);
    let codon = split[0].trim().toUpperCase();
    let triplets = [];
    for (let triplet of split[1].split(',')) {
      triplets.push(triplet.trim().toLowerCase());
    }
    mapping[codon] = triplets;
  }

  if (reverse) {
    let reverseMapping = {};
    for (let codon in mapping) {
      for (let triplet of mapping[codon]) {
        if (triplet in reverseMapping) {
          alert("Duplicate triplet \"" + triplet + "\" for codon " + codon);
        }
        reverseMapping[triplet] = codon;
      }
    }
    mapping = reverseMapping;
  }
  return mapping;
}

function scrambleCodons(mapping, codons, rng) {
  let dna = "";
  let stats = { 'a': 0, 'c': 0, 't': 0, 'g': 0, 'codons': {} };

  for (let i in codons) {
    let codon = codons[i];
    if (!(codon in mapping)) {
      alert("The character \"" + codon + "\" at position " + i + " is invalid.");
      return null;
    }

    stats.codons[codon] = (stats.codons[codon] || 0) + 1;
    let options = mapping[codon];
    let choice = options[Math.floor(rng() * options.length)];

    dna += choice;
    for (let j = 0; j < choice.length; j++) {
      stats[choice[j]] = (stats[choice[j]] || 0) + 1;
    }
  }

  return {
    'dna': dna,
    'stats': stats,
    'gcRatio': (stats.g + stats.c) / (stats.a + stats.t + stats.g + stats.c)
  };
}

function displayDNA(result) {
  if (result == null)
    return;
  document.getElementById("DNA").value = result.dna;
  let analytics = "<table>"
    + "<tr><td>Letter</td><td>Occurrences</td></tr>"
    + "<tr><td>a</td><td>" + result.stats.a + "</td></tr>"
    + "<tr><td>c</td><td>" + result.stats.c + "</td></tr>"
    + "<tr><td>t</td><td>" + result.stats.t + "</td></tr>"
    + "<tr><td>g</td><td>" + result.stats.g + "</td></tr>"
    + "</table>"
    + "<p>GC ratio: " + (result.gcRatio * 100).toFixed(2) + "%</p>";
  document.getElementById("analytics").innerHTML = analytics;
}

function codonsToDNA() {
  let mapping = codonMapping(false);
  let codons = document.getElementById("codons").value.replace(/[\s\d]/g, "").toUpperCase();

  displayDNA(scrambleCodons(mapping, codons, new Math.seedrandom()));
}

let scanState = {
  'mapping': {},
  'codons': '',
  'result': null
};

// direction: -1 to minimize, +1 to maximize. 
function runGCScan(direction) {
  let mapping = codonMapping(false);
  let codons = document.getElementById("codons").value.replace(/[\s\d]/g, "").toUpperCase();
  let rng = new Math.seedrandom(); // rng shared between runs is effectively random per run.

  let result;
  // continue from the last result if nothing changed.
  if(JSON.stringify(mapping) === JSON.stringify(scanState.mapping) && codons === scanState.codons) {
    result = scanState.result
  } else {
    result = scrambleCodons(mapping, codons, rng);
  }
  if(result == null)
    return;
  
  // run another 100 iterations
  for(let i = 0; i < 100; i++) {
    let newresult = scrambleCodons(mapping, codons, rng);
    if((newresult.gcRatio - result.gcRatio) * direction > 0) {
      result = newresult;
    }
  }

  // save the state to resume later
  scanState = {
    'mapping': mapping,
    'codons': codons,
    'result': result
  };
  displayDNA(result);
}

function DNAToCodons() {
  let mapping = codonMapping(true);
  let dna = document.getElementById("DNA").value.replace(/[\s\d]/g, "").toLowerCase();
  let codons = "";
  let stats = {};

  for (let i = 0; i < dna.length;) {
    let triplet = "" + dna[i] + dna[i + 1] + dna[i + 2];
    if (!(triplet in mapping)) {
      //we have not found any codon for the DNA triplet
      alert("The DNA triplet \"" + triplet + "\" at position " + i + " is invalid. Maybe try Selecting the \"Pichia\" preset at the top since it supports all codons.");
      return;
    }

    let codon = mapping[triplet];
    stats[codon] = (stats[codon] || 0) + 1;
    codons += codon;
    i += 3;
  }

  document.getElementById("codons").value = codons;


  let sorted = [];
  for (let codon in stats) {
    sorted.push([codon, stats[codon]]);
  }
  sorted.sort((a, b) => b[1] - a[1]); // sort descending by occurrences
  let analytics = "<table><tr><td>Letter</td><td>Occurrences</td></tr>";
  for (let stat of sorted) {
    analytics += "<tr><td>" + stat[0] + "</td><td>" + stat[1] + "</td></tr>";
  }
  analytics += "</table>";
  document.getElementById("analytics").innerHTML = analytics;
}

function checkForRepeats() {
  let dna = document.getElementById("DNA").value.replace(/[\s\d]/g, "");
  let minrep = parseInt(document.getElementById("minrep").value);
  let maxrep = parseInt(document.getElementById("maxrep").value);

  let repetitions = {}; //count the repetitions of all occurrences 10+bp long
  for (let r = maxrep; r >= minrep; r--) {
    //dna.length/2 is picked as things have to repeat at least twice.
    for (let i = 0; i + r <= dna.length; i++) {
      let selection = dna.slice(i, i + r);
      //increment the count of the selection
      repetitions[selection] = (repetitions[selection] || 0) + 1;
    }
    for (let sequence in repetitions) {
      //delete all sequences that do not repeat
      if (repetitions[sequence] == 1) {
        delete repetitions[sequence];
      }
    }
  }
  let sorted = [];
  for (let sequence in repetitions) {
    sorted.push([sequence, repetitions[sequence]]);
  }
  sorted.sort((a, b) => (b[1] - a[1]) * 1000 + b[0].length - a[0].length); // sort descending by occurrences, then length

  let analytics = "<table><tr><td>Sequence</td><td>Length</td><td>Occurrences</td></tr>";
  for (let repetition of sorted) {
    analytics += "<tr><td class=\"mono\">" + repetition[0] + "</td><td>" + repetition[0].length + "</td><td>" + repetition[1] + "</td></tr>";
  }
  analytics += "</table>";

  document.getElementById("repeats").innerHTML = analytics;
}

window.presets = {
  'human':
    `A: gct,gcc,gca
R: cgg,aga,agg
N: aat,aac
D: gat,gac
C: tgt,tgc
Q: caa,cag
E: gaa,gag
G: ggt,ggc,gga,ggg
H: cat,cac
I: att,atc
L: ctt,ctc,ctg,ttg
K: aaa,aag
M: atg
F: ttt,ttc
P: cct,ccc,cca
S: tct,tcc,tca,agt,agc
T: act,acc,aca
W: tgg
Y: tat,tac
V: gtt,gtc,gtg
*: taa,tga,tag`,
  'drosophila':
    `A: gct,gcc,gca,gcg
R: cgt,cgc
N: aat,aac
D: gat,gac
C: tgt,tgc
Q: caa,cag
E: gaa,gag
G: ggt,ggc,gga
H: cat,cac
I: att,atc
L: ctc,ctg,ttg
K: aaa,aag
M: atg
F: ttt,ttc
P: ccc,cca,ccg
S: tcc,tcg,agt,agc
T: act,acc,aca,acg
W: tgg
Y: tat,tac
V: gtt,gtc,gtg
*: taa,tga,tag`,
  'mouse':
    `A: gct,gcc,gca
R: cgc,cgg,aga,agg
N: aat,aac
D: gat,gac
C: tgt,tgc
Q: caa,cag
E: gaa,gag
G: ggt,ggc,gga,ggg
H: cat,cac
I: att,atc
L: ctt,ctc,ctg,ttg
K: aaa,aag
M: atg
F: ttt,ttc
P: cct,ccc,cca
S: tct,tcc,tca,agt,agc
T: act,acc,aca
W: tgg
Y: tat,tac
V: gtt,gtc,gtg
*: taa,tga,tag`,
  'saccharomyces':
    `A: gct,gcc,gca
R: aga,agg
N: aat,aac
D: gat,gac
C: tgt,tgc
Q: caa,cag
E: gaa,gag
G: ggt,ggc,gga
H: cat,cac
I: att,atc,ata
L: ctt,cta,ctg,tta,ttg
K: aaa,aag
M: atg
F: ttt,ttc
P: cct,cca
S: tct,tcc,tca,agt,agc
T: act,acc,aca
W: tgg
Y: tat,tac
V: gtt,gtc,gta,gtg
*: taa,tga,tag`,
  'arabidopsis':
    `A: gct,gcc,gca
R: aga,agg
N: aat,aac
D: gat,gac
C: tgt,tgc
Q: caa,cag
E: gaa,gag
G: ggt,ggc,gga,ggg
H: cat,cac
I: att,atc,ata
L: ctt,ctc,cta,ctg,tta,ttg
K: aaa,aag
M: atg
F: ttt,ttc
P: cct,cca
S: tct,tcc,tca,tcg,agt,agc
T: act,acc,aca
W: tgg
Y: tat,tac
V: gtt,gtc,gta,gtg
*: taa,tga,tag`,
  'all':
    `A: gct,gcc,gca,gcg
R: cgt,cgc,cga,cgg,aga,agg
N: aat,aac
D: gat,gac
C: tgt,tgc
Q: caa,cag
E: gaa,gag
G: ggt,ggc,gga,ggg
H: cat,cac
I: att,atc,ata
L: ctt,ctc,cta,ctg,tta,ttg
K: aaa,aag
M: atg
F: ttt,ttc
P: cct,ccc,cca,ccg
S: tct,tcc,tca,tcg,agt,agc
T: act,acc,aca,acg
W: tgg
Y: tat,tac
V: gtt,gtc,gta,gtg
*: taa,tga,tag`
};

function loadPreset(presetName) {
  document.getElementById("codondict").innerHTML = presets[presetName];
}