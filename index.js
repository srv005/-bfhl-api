const express = require("express");
const cors = require("cors");

const app = express();

const PORT = process.env.PORT || 10000;

app.use(express.json());
app.use(cors());


// app.get("/", (req, res) => {
//   res.send("API running 🚀");
// });


app.post("/", (req, res) => {
  const data = req.body.data || [];

  let valid = [];
  let invalid = [];
  let duplicates = [];
  let seen = new Set();

  data.forEach(item => {
    if (seen.has(item)) {
      if (!duplicates.includes(item)) duplicates.push(item);
      return;
    }
    seen.add(item);

    if (/^[A-Z]->[A-Z]$/.test(item) && item[0] !== item[3]) {
      valid.push(item);
    } else {
      invalid.push(item);
    }
  });

  let map = {};
  let childrenSet = new Set();
  let parentMap = {};

  valid.forEach(edge => {
    let [parent, child] = edge.split("->");

    // multi-parent handling (ignore if already has parent)
    if (parentMap[child]) return;
    parentMap[child] = parent;

    if (!map[parent]) map[parent] = [];
    map[parent].push(child);

    childrenSet.add(child);
  });

  let roots = Object.keys(map).filter(node => !childrenSet.has(node));

  if (roots.length === 0 && Object.keys(map).length > 0) {
    roots = [Object.keys(map).sort()[0]];
  }

  function buildTree(node, visited = new Set()) {
    if (visited.has(node)) return { cycle: true };
    visited.add(node);

    let obj = {};
    if (map[node]) {
      map[node].forEach(child => {
        let res = buildTree(child, new Set(visited));
        if (res.cycle) obj = {};
        else obj[child] = res;
      });
    }
    return obj;
  }

  function getDepth(node) {
    if (!map[node]) return 1;
    let depths = map[node].map(child => getDepth(child));
    return 1 + Math.max(...depths);
  }

  let hierarchies = [];
  let total_cycles = 0;
  let maxDepth = 0;
  let largestRoot = "";

  roots.forEach(root => {
    let treeObj = buildTree(root);
    let hasCycle = JSON.stringify(treeObj) === "{}" && map[root];

    if (hasCycle) {
      total_cycles++;
      hierarchies.push({
        root,
        tree: {},
        has_cycle: true
      });
    } else {
      let depth = getDepth(root);
      if (depth > maxDepth) {
        maxDepth = depth;
        largestRoot = root;
      }

      let tree = {};
      tree[root] = treeObj;

      hierarchies.push({
        root,
        tree,
        depth
      });
    }
  });

  res.json({
    user_id: "yourname_01012000",
    email_id: "your@email.com",
    college_roll_number: "123",
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
// app.get("/", (req, res) => {
//   res.send("BFHL GET working");
// });

app.use(cors({
  origin: "*", 
}));
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});