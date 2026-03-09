// graphMath.js
// Handles all logical calculations: Topological sorting, prerequisite checking, and edge layout

import { appState } from './state.js';

export const getRowSemester = (rIdx) => {
  return (rIdx % 3) + 1;
};

export const getTotalUnlockedCP = (completed, nodes) => {
  let total = 0;
  completed.forEach(id => {
    const node = nodes.find(n => n.id === id);
    if (node && node.id !== "WIL" && node.title !== "EGB499") {
      total += 12; // Standard 12cp per unit
    }
  });
  return total;
};

export const checkPrereqsMet = (nodeId, completed, nodes, edges) => {
  const unlockedCP = getTotalUnlockedCP(completed, nodes);
  if (nodeId === "EGH404" && unlockedCP < 144) return false;
  if (nodeId === "EGH490_1" && unlockedCP < 240) return false;
  if (nodeId === "WIL" && unlockedCP < 192) return false;

  const prereqEdges = edges.filter(e => e.to === nodeId);
  const requiredEdges = prereqEdges.filter(e => !e.dashed);

  if (requiredEdges.length === 0) return true;
  return requiredEdges.every(e => completed.has(e.from));
};

export const isNodeDimmed = (nodeId, activeNode, completed, nodes, edges) => {
  // Dim if not unlocked (prereqs not met) and not completed
  if (!completed.has(nodeId) && !checkPrereqsMet(nodeId, completed, nodes, edges)) {
    if (activeNode === nodeId) return false; // Keep fully visible if active
    return true;
  }

  // If active, highlight tree branches
  if (activeNode) {
    if (nodeId === activeNode) return false;
    const isConnected = edges.some(
      (e) =>
        (e.from === activeNode && e.to === nodeId) ||
        (e.to === activeNode && e.from === nodeId),
    );
    return !isConnected;
  }
  return false;
};

export const getNodeTerminalCounts = (nodes, edges) => {
  const counts = {};
  nodes.forEach((n) => {
    counts[n.id] = { inGroups: new Set(), outGroups: new Set() };
  });
  edges.forEach((e) => {
    if (counts[e.from]) counts[e.from].outGroups.add(e.outGroup);
    if (counts[e.to]) counts[e.to].inGroups.add(e.inGroup);
  });

  // Convert sets to sorted arrays
  Object.keys(counts).forEach((id) => {
    counts[id].inGroups = Array.from(counts[id].inGroups).sort((a, b) => a - b);
    counts[id].outGroups = Array.from(counts[id].outGroups).sort((a, b) => a - b);
  });
  return counts;
};

export const getTerminalColor = (hex, idx = 0) => {
  hex = hex.replace(/^#/, '');
  let r = parseInt(hex.substring(0, 2), 16) / 255;
  let g = parseInt(hex.substring(2, 4), 16) / 255;
  let b = parseInt(hex.substring(4, 6), 16) / 255;

  let cmin = Math.min(r, g, b),
      cmax = Math.max(r, g, b),
      delta = cmax - cmin,
      h = 0,
      s = 0,
      l = 0;

  if (delta === 0) h = 0;
  else if (cmax === r) h = ((g - b) / delta) % 6;
  else if (cmax === g) h = (b - r) / delta + 2;
  else h = (r - g) / delta + 4;

  h = Math.round(h * 60);
  if (h < 0) h += 360;

  l = (cmax + cmin) / 2;
  s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

  if (l < 0.5) l = Math.min(1, l + 0.35);
  else l = Math.max(0, l - 0.35);

  const hueShift = (idx % 3) * -5;
  const lightShift = (idx % 3) * 0.04;

  h = (h + hueShift + 360) % 360;
  l = Math.max(0, Math.min(1, l + (l > 0.5 ? -lightShift : lightShift)));

  s = +(s * 100).toFixed(1);
  l = +(l * 100).toFixed(1);

  return `hsl(${h}, ${s}%, ${l}%)`;
};

export const getInactiveColor = (idx = 0) => {
  let h = 214;
  let s = 32;
  let l = 0.85;

  const hueShift = (idx % 3) * -5;
  const lightShift = (idx % 3) * 0.04;

  h = (h + hueShift + 360) % 360;
  l = Math.max(0, Math.min(1, l - lightShift));
  l = +(l * 100).toFixed(1);

  return `hsl(${h}, ${s}%, ${l}%)`;
};

export const calculateEdges = (containerRect, nodes, edges, nodeTypes) => {
  const counts = getNodeTerminalCounts(nodes, edges);

  return edges.map((edge, i) => {
    const fromEl = document.getElementById(`node-${edge.from}`);
    const toEl = document.getElementById(`node-${edge.to}`);
    if (!fromEl || !toEl) return null;

    const fromRect = fromEl.getBoundingClientRect();
    const toRect = toEl.getBoundingClientRect();

    const outCount = counts[edge.from].outGroups.length;
    const outIndex = counts[edge.from].outGroups.indexOf(edge.outGroup);

    const inCount = counts[edge.to].inGroups.length;
    const inIndex = counts[edge.to].inGroups.indexOf(edge.inGroup);

    const startX = fromRect.left + (fromRect.width / (outCount + 1)) * (outIndex + 1) - containerRect.left;
    const startY = fromRect.bottom - containerRect.top;

    const endX = toRect.left + (toRect.width / (inCount + 1)) * (inIndex + 1) - containerRect.left;
    const endY = toRect.top - containerRect.top;

    const toNode = nodes.find(n => n.id === edge.to);
    const style = toNode ? nodeTypes[toNode.type] : { bg: "#FFFFFF" };
    const destColor = getTerminalColor(style.bg, i);

    return { ...edge, startX, startY, endX, endY, color: destColor, edgeIdx: i };
  }).filter(Boolean);
};

export const getPathData = (edge) => {
  const dy = edge.endY - edge.startY;
  const dx = edge.endX - edge.startX;
  const tensionY = Math.max(Math.abs(dy) * 0.4, 30);
  const curveOffsetX = dx > 0 ? 10 : dx < 0 ? -10 : 0;

  return `M ${edge.startX},${edge.startY}
    C ${edge.startX + curveOffsetX},${edge.startY + tensionY}
      ${edge.endX},${edge.endY - tensionY}
      ${edge.endX},${edge.endY}`;
};

export const isMoveValid = (nodeId, targetSemester, nodes, edges) => {
  const node = nodes.find(n => n.id === nodeId);
  if (!node) return false;

  const prereqs = edges.filter(e => e.to === nodeId).map(e => e.from);
  let maxPrereqRow = -1;
  prereqs.forEach(pId => {
    const pNode = nodes.find(n => n.id === pId);
    if (pNode && pNode.row > maxPrereqRow) {
      maxPrereqRow = pNode.row;
    }
  });

  const postreqs = edges.filter(e => e.from === nodeId).map(e => e.to);
  let minPostreqRow = 999;
  postreqs.forEach(pId => {
    const pNode = nodes.find(n => n.id === pId);
    if (pNode && pNode.row < minPostreqRow) {
      minPostreqRow = pNode.row;
    }
  });

  for (let r = maxPrereqRow + 1; r < minPostreqRow; r++) {
    if (getRowSemester(r) === targetSemester) return true;
  }
  return false;
};

export const refreshLayout = (nodes, edges, rowPreferences, rowCapacity) => {
  let newNodes = [...nodes];

  const inDegree = {};
  const adjList = {};
  newNodes.forEach(n => {
    inDegree[n.id] = 0;
    adjList[n.id] = [];
  });

  edges.forEach(e => {
    if (adjList[e.from]) adjList[e.from].push(e.to);
    if (inDegree[e.to] !== undefined) {
      if (!e.dashed) inDegree[e.to]++;
    }
  });

  const queue = [];
  Object.keys(inDegree).forEach(id => {
    if (inDegree[id] === 0) queue.push(id);
  });

  const sortedIds = [];
  while (queue.length > 0) {
    const currId = queue.shift();
    sortedIds.push(currId);

    adjList[currId].forEach(neighbor => {
      if (inDegree[neighbor] !== undefined) {
        inDegree[neighbor]--;
        if (inDegree[neighbor] === 0) queue.push(neighbor);
      }
    });
  }

  if (sortedIds.length < newNodes.length) {
    newNodes.forEach(n => {
      if (!sortedIds.includes(n.id)) sortedIds.push(n.id);
    });
  }

  const rowCounts = {};
  const assignedRows = {};

  sortedIds.forEach(id => {
    const node = newNodes.find(n => n.id === id);

    const prereqs = edges.filter(e => e.to === id && !e.dashed).map(e => e.from);
    let maxPrereqRow = -1;
    prereqs.forEach(pId => {
      if (assignedRows[pId] !== undefined && assignedRows[pId] > maxPrereqRow) {
        maxPrereqRow = assignedRows[pId];
      }
    });

    let targetRow = maxPrereqRow + 1;
    let placed = false;

    // Check for manual row preference
    if (node.manualRow !== undefined && node.manualRow > maxPrereqRow) {
      const sem = getRowSemester(node.manualRow);
      const capacity = rowPreferences[node.manualRow] !== undefined ? rowPreferences[node.manualRow] : rowCapacity;
      const currentCount = rowCounts[node.manualRow] || 0;

      if (node.avail.includes(sem) && currentCount < capacity) {
        targetRow = node.manualRow; // Preference is valid and respects constraints
      }
    }

    while (!placed) {
      const sem = getRowSemester(targetRow);
      const capacity = rowPreferences[targetRow] !== undefined ? rowPreferences[targetRow] : rowCapacity;
      const currentCount = rowCounts[targetRow] || 0;

      // Only assign if sem is in node.avail AND (it is not a Summer row (sem 3) OR it is manually forced)
      // Allow Summer if it's the ONLY availability
      const isSummerAllowed = sem !== 3 || node.avail.length === 1 || targetRow === node.manualRow;

      if (node.avail.includes(sem) && isSummerAllowed && currentCount < capacity) {
        assignedRows[id] = targetRow;
        rowCounts[targetRow] = currentCount + 1;
        placed = true;
      } else {
        targetRow++;
      }
    }
  });

  newNodes = newNodes.map(n => ({
    ...n,
    row: assignedRows[n.id] !== undefined ? assignedRows[n.id] : n.row
  }));

  const finalMaxRow = Math.max(...newNodes.map(n => n.row));
  const wilNode = newNodes.find(n => n.id === 'WIL');
  if (wilNode && wilNode.row < finalMaxRow) {
    wilNode.row = finalMaxRow;
  }

  const maxAssignedRow = Math.max(...Object.values(assignedRows));
  for (let r = 0; r <= maxAssignedRow; r++) {
    const nodesInRow = newNodes.filter(n => n.row === r);
    if (nodesInRow.length > 0) {
      nodesInRow.forEach(n => {
        if (n.manualColIndex !== undefined) {
           // We map the manualColIndex directly to a barycenter score.
           // E.g. manualColIndex 0 is -100, 1 is -99 etc. to force it to the left side
           // However, if we want to respect the actual index position, we can just sort by manualColIndex first.
           // Let's use a very strong sorting bias for manual cols.
           n.barycenter = n.manualColIndex - 1000;
           return;
        }

        const parents = edges.filter(e => e.to === n.id).map(e => e.from);
        let parentSum = 0;
        let parentCount = 0;
        parents.forEach(pId => {
          const pNode = newNodes.find(pn => pn.id === pId);
          if (pNode && pNode.row < r) {
            const pNodesInRow = newNodes.filter(pn => pn.row === pNode.row);
            const colIdx = pNodesInRow.findIndex(pn => pn.id === pId);
            parentSum += colIdx;
            parentCount++;
          }
        });
        n.barycenter = parentCount > 0 ? parentSum / parentCount : 0;
      });

      nodesInRow.sort((a, b) => a.barycenter - b.barycenter);

      let idx = 0;
      newNodes = newNodes.map(n => {
        if (n.row === r) {
          const sortedNode = nodesInRow[idx++];
          return { ...n, id: sortedNode.id, title: sortedNode.title, name: sortedNode.name, type: sortedNode.type, avail: sortedNode.avail, desc: sortedNode.desc, row: sortedNode.row, manualRow: sortedNode.manualRow, manualColIndex: sortedNode.manualColIndex };
        }
        return n;
      });
    }
  }

  return newNodes;
};
