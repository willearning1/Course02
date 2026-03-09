// We want to write logic to handle shifting multiple selected indices up or down.
function moveOptions(options, selectedIndices, isUp) {
  // options: array of objects {value, text}
  // selectedIndices: array of indices that are currently selected (must be sorted)

  // Clone options
  let newOptions = [...options];

  if (isUp) {
    for (let i = 0; i < selectedIndices.length; i++) {
      let idx = selectedIndices[i];
      if (idx > 0 && !selectedIndices.includes(idx - 1)) {
        // Swap with the one above
        let temp = newOptions[idx - 1];
        newOptions[idx - 1] = newOptions[idx];
        newOptions[idx] = temp;
        // Update selected index reference
        selectedIndices[i] = idx - 1;
      }
    }
  } else {
    for (let i = selectedIndices.length - 1; i >= 0; i--) {
      let idx = selectedIndices[i];
      if (idx < newOptions.length - 1 && !selectedIndices.includes(idx + 1)) {
        // Swap with the one below
        let temp = newOptions[idx + 1];
        newOptions[idx + 1] = newOptions[idx];
        newOptions[idx] = temp;
        // Update selected index reference
        selectedIndices[i] = idx + 1;
      }
    }
  }

  return { newOptions, selectedIndices };
}

let opts = [
  {value: 'A'},
  {value: 'B'},
  {value: 'C'},
  {value: 'D'},
];

let sel = [1, 2]; // B, C

console.log("Original:", opts.map(o => o.value));
let res = moveOptions(opts, sel, true);
console.log("Up:", res.newOptions.map(o => o.value), "New Sel:", res.selectedIndices);

res = moveOptions(res.newOptions, res.selectedIndices, false);
console.log("Down:", res.newOptions.map(o => o.value), "New Sel:", res.selectedIndices);
