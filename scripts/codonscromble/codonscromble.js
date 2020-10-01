function codonsToDNA() { var dict = JSON.parse(document.getElementById("codondict").value);
  var input = document.getElementById("codons").value.replace(/\s/g,"");
  input = input.toUpperCase();
  var out = "";
  var as = 0;
  var cs = 0;
  var ts = 0;
  var gs = 0;
  for (var i=0; i < input.length ; i++) {
    if (input[i] < "0" || input[i] > "9") {
      if (!(input[i] in dict)) {
        alert("The character \"" + input[i] + "\" at position " + i + " is invalid.");
        return;
      }
      var choices = dict[input[i]];
      var chnum = Math.floor(Math.random() * choices.length);

      out += choices[chnum];
      for (var j=0; j < choices[chnum].length; j++) {
        if (choices[chnum][j] == 'a') { as++; }
        if (choices[chnum][j] == 'c') { cs++; }
        if (choices[chnum][j] == 't') { ts++; }
        if (choices[chnum][j] == 'g') { gs++; }
      }
      document.getElementById("DNA").innerHTML = out;
    }
  }
  document.getElementById("analytics").innerHTML = "<table><tr><td>Letter</td>"
    + "<td>Occourences</td></tr><tr><td>a</td><td>" + as + "</td></tr>"
    + "<tr><td>c</td><td>" + cs + "</td></tr><tr><td>t</td><td>"
    + ts + "</td></tr><tr><td>g</td><td>" + gs + "</td></tr></table>"
    + "<p>GC ratio: " + ((gs + cs) / (as + ts) * 100) + "%</p>";
}