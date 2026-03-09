const fs = require('fs');

function testTimeSelectUI(infoUnitDetails, maxPrereqRow, searchLimit) {
  let html = '';

  const validRows = [];
  for (let r = maxPrereqRow + 1; r < searchLimit; r++) {
    const rowSem = (r % 3) + 1; // getRowSemester
    if (infoUnitDetails.avail.includes(rowSem)) {
      validRows.push(r);
    }
  }

  // Get distinct years
  const validYears = [...new Set(validRows.map(r => Math.floor(r / 3) + 1))];

  html += `
        <div class="mb-6">
          <div class="flex items-center gap-2">
            <h3 class="text-xs font-bold text-[#616161] uppercase tracking-wider">TIME</h3>
            <select
              data-action="change-time-year"
              data-node-id="${infoUnitDetails.id}"
              class="flex-1 text-sm p-2 rounded border border-[#DBDBDB] bg-white text-[#1C1C1C] outline-none hover:bg-gray-50 cursor-pointer shadow-sm"
            >
              <option value="" ${infoUnitDetails.manualRow === undefined ? 'selected' : ''}>-- Auto (Optimized) --</option>
  `;

  const currentYear = infoUnitDetails.manualRow !== undefined ? Math.floor(infoUnitDetails.manualRow / 3) + 1 : null;
  const currentSem = infoUnitDetails.manualRow !== undefined ? (infoUnitDetails.manualRow % 3) + 1 : null;

  validYears.forEach(y => {
    const isSelected = currentYear === y ? 'selected' : '';
    html += `<option value="${y}" ${isSelected}>Year ${y}</option>\n`;
  });

  html += `
            </select>
  `;

  // Only show semester dropdown if unit is available in multiple semesters
  if (infoUnitDetails.avail.length > 1) {
    html += `
            <select
              data-action="change-time-sem"
              data-node-id="${infoUnitDetails.id}"
              class="w-24 text-sm p-2 rounded border border-[#DBDBDB] bg-white text-[#1C1C1C] outline-none hover:bg-gray-50 cursor-pointer shadow-sm"
              ${infoUnitDetails.manualRow === undefined ? 'disabled' : ''}
            >
    `;

    // List available semesters
    infoUnitDetails.avail.forEach(sem => {
      const label = sem === 3 ? 'Summer' : `Sem ${sem}`;
      const isSelected = currentSem === sem ? 'selected' : '';
      html += `<option value="${sem}" ${isSelected}>${label}</option>\n`;
    });

    html += `
            </select>
    `;
  }

  html += `
          </div>
        </div>
  `;
  return html;
}
console.log(testTimeSelectUI({id: 'TEST', avail: [1, 2], manualRow: 4}, -1, 10));
