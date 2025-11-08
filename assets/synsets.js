(function(){
  const sets = [
    ["scissors","knife","box cutter","cutter","tapetkniv","kniv","saks"],
    ["tape","duct tape","gaffa","gaffatape","teip","tejp"],
    ["multimeter","voltmeter","ammeter","spenningstester","spenningsmåler"],
    ["alarm clock","vekkerklokke","vekkeklokke"],
    ["box","crate","eske","boks"]
  ];
  function normalize(s){
    return (s||"").toString().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  }
  const map = new Map();
  sets.forEach(g=>{
    const norm = g.map(normalize);
    norm.forEach(w=>map.set(w, new Set(norm)));
  });
  window.SYNSETS = {
    expand(term){
      const t = normalize(term);
      const set = map.get(t);
      return set ? Array.from(set) : [t];
    },
    normalize
  };
})();
