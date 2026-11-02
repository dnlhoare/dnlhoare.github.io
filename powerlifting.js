(() => {
  const $ = id => document.getElementById(id);
  const form = $('liftForm');
  const unit = $('unitSelect');
  const display = value => Number.isInteger(value) ? String(value) : value.toFixed(1).replace(/\.0$/, '');
  const roundedLoad = value => {
    const increment = Number($('roundSelect').value.split(',')[unit.value === 'kg' ? 0 : 1]);
    return Math.round(value / increment) * increment;
  };
  function estimate(weight, reps, formula) {
    if (reps === 1) return weight;
    return formula === 'brzycki' ? weight * 36 / (37 - reps) : weight * (1 + reps / 30);
  }
  function render() {
    const weight = Number($('weightInput').value), reps = Number($('repsInput').value);
    if (!Number.isFinite(weight) || weight <= 0 || !Number.isInteger(reps) || reps < 1 || reps > 15) return;
    let low = Number($('minReps').value), high = Number($('maxReps').value);
    if (low > high) { [low, high] = [high, low]; $('minReps').value = low; $('maxReps').value = high; }
    const formula = $('formulaSelect').value, max = estimate(weight, reps, formula), targetReps = Array.from({length:high-low+1}, (_,i) => low+i);
    const loadFor = r => roundedLoad(r === 1 ? max : formula === 'brzycki' ? max * (37-r) / 36 : max / (1+r/30));
    const precision = Number($('roundSelect').value.split(',')[unit.value === 'kg' ? 0 : 1]) % 1 ? 1 : 0;
    const weightText = x => display(Number(x.toFixed(precision)));
    $('oneRm').textContent = weightText(max);
    $('maxUnit').textContent = unit.value;
    $('chartUnit').textContent = unit.value;
    $('maxContext').textContent = `${weightText(weight)} ${unit.value} × ${reps} reps · ${formula === 'epley' ? 'Epley' : 'Brzycki'}`;
    $('compareTitle').textContent = `${$('liftSelect').value} · ${low}–${high} reps`;
    $('formulaBadge').textContent = formula.toUpperCase();
    $('loadRows').innerHTML = targetReps.map(r => `<tr><td>${r} reps</td><td>${weightText(loadFor(r))} ${unit.value}</td><td>${Math.round(loadFor(r)/max*100)}%</td><td>${weightText(max)} ${unit.value} est. 1RM</td></tr>`).join('');
    const loads = targetReps.map(loadFor), min = Math.min(...loads), maxLoad = Math.max(...loads), spread = maxLoad-min || 1;
    $('loadChart').innerHTML = targetReps.map(r => { const load=loadFor(r), height=22+((load-min)/spread)*59; return `<div class="chart-column"><span class="chart-value">${weightText(load)}</span><i class="chart-bar" style="height:${height}%"></i><span class="chart-reps">${r}</span></div>`; }).join('');
    $('loadChart').setAttribute('aria-label', `Estimated equivalent loads from ${low} to ${high} reps, in ${unit.value}`);
  }
  form.addEventListener('input', render);
  form.addEventListener('change', render);
  $('year').textContent = new Date().getFullYear();
  render();
})();
