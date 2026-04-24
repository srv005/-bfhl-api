const express = require("express");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.send("API running 🚀");
});

app.post("/bfhl", (req, res) => {
  const data = req.body.data || [];
  let valid = [];
  let invalid = [];
  let duplicates = [];
  let seen = new Set();

  data.forEach(item => {
    const trimmed = typeof item === "string" ? item.trim() : item;
    if (seen.has(trimmed)) {
      if (!duplicates.includes(trimmed)) duplicates.push(trimmed);
      return;
    }
    seen.add(trimmed);
    if (/^[A-Z]->[A-Z]$/.test(trimmed) && trimmed[0] !== trimmed[3]) {
      valid.push(trimmed);
    } else {
      invalid.push(trimmed);
    }
  });

  let map = {};
  let childrenSet = new Set();
  let parentMap = {};

  valid.forEach(edge => {
    let [parent, child] = edge.split("->");
    if (parentMap[child]) return; 
    parentMap[child] = parent;
    if (!map[parent]) map[parent] = [];
    map[parent].push(child);
    childrenSet.add(child);
  });

  
  let allNodes = new Set();
  valid.forEach(edge => {
    let [parent, child] = edge.split("->");
    allNodes.add(parent);
    allNodes.add(child);
  });

  let roots = [...allNodes].filter(node => !childrenSet.has(node));

 
  function getConnected(start) {
    let visited = new Set();
    let queue = [start];
    while (queue.length) {
      let node = queue.shift();
      if (visited.has(node)) continue;
      visited.add(node);
      if (map[node]) map[node].forEach(c => queue.push(c));
     
      Object.keys(parentMap).forEach(child => {
        if (parentMap[child] === node && !visited.has(child)) queue.push(child);
      });
    }
    return visited;
  }

  function buildTree(node, visited = new Set()) {
    if (visited.has(node)) return { cycle: true };
    visited.add(node);
    let obj = {};
    if (map[node]) {
      for (let child of map[node]) {
        let res = buildTree(child, new Set(visited));
        if (res.cycle) return { cycle: true };
        obj[child] = res;
      }
    }
    return obj;
  }

  function getDepth(node) {
    if (!map[node] || map[node].length === 0) return 1;
    let depths = map[node].map(child => getDepth(child));
    return 1 + Math.max(...depths);
  }

  let hierarchies = [];
  let total_cycles = 0;
  let processedNodes = new Set();

  
  roots.forEach(root => {
    if (processedNodes.has(root)) return;
    let treeObj = buildTree(root);
    if (treeObj.cycle) {
      total_cycles++;
      hierarchies.push({ root, tree: {}, has_cycle: true });
    } else {
      let depth = getDepth(root);
      let tree = {};
      tree[root] = treeObj;
      hierarchies.push({ root, tree, depth });
    }
    let connected = getConnected(root);
    connected.forEach(n => processedNodes.add(n));
  });

 
  allNodes.forEach(node => {
    if (!processedNodes.has(node)) {
      let connected = getConnected(node);
      let cycleRoot = [...connected].sort()[0];
      if (!processedNodes.has(cycleRoot)) {
        total_cycles++;
        hierarchies.push({ root: cycleRoot, tree: {}, has_cycle: true });
        connected.forEach(n => processedNodes.add(n));
      }
    }
  });

 
  let largestRoot = "";
  let maxDepth = 0;
  hierarchies.forEach(h => {
    if (!h.has_cycle) {
      if (
        h.depth > maxDepth ||
        (h.depth === maxDepth && h.root < largestRoot)
      ) {
        maxDepth = h.depth;
        largestRoot = h.root;
      }
    }
  });

  res.json({
    user_id: "sauravagrawal_04102003",
    email_id: "agrawalsaurav546@gmail.com",
    college_roll_number: "RA2311003030251",
    hierarchies,
    invalid_entries: invalid,
    duplicate_edges: duplicates,
    summary: {
      total_trees: hierarchies.filter(h => !h.has_cycle).length,
      total_cycles,
      largest_tree_root: largestRoot
    }
  });
});

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});