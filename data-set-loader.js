function getGraphDataSets() {

    // Color brewer paired set
    const colors = ['#a6cee3','#1f78b4','#b2df8a','#33a02c','#fb9a99','#e31a1c','#fdbf6f','#ff7f00','#cab2d6','#6a3d9a','#ffff99','#b15928'];

    const loadMiserables = function(Graph) {
        qwest.get('LTB.json').then((_, data) => {
            const nodes = {};
        data.nodes.forEach(node => { nodes[node.label] = node }); // Index by ID

        console.log(data);
        console.log(nodes);

        console.log(data.links.map(link => [link.source, link.target]));

        Graph
            .coolDownTicks(2000)
            .nameAccessor(node => node.label)
      // .nodeRelSize(1)
      //  .lineOpacity(<between [0,1]>)
      //  .valAccessor(<function(node) to extract numeric value. default: node.val>)
      //  .nameAccessor(<function(node) to extract name string. default: node.name>)
      //  .colorAccessor(node => parseInt(colors[node.group%colors.length].slice(1),16))

        .graphData({
            nodes: nodes,
            links: data.links.map(link => [link.source, link.target])
    });
    });
    };
    loadMiserables.description = "<em>Les Miserables</em> data (<a href='https://bl.ocks.org/mbostock/4062045'>4062045</a>)";

    //

    const loadBlocks = function(Graph) {
        qwest.get('blocks.json').then((_, data) => {
            const userColors = {};
        Array.from(new Set(data.nodes.map(node => node.user || null))).forEach((user, idx) => {
            userColors[user] = colors[idx%colors.length]; // Rotate colors
    });

        const nodes = {};
        data.nodes.forEach(node => { nodes[node.id] = node }); // Index by ID

        Graph
            .coolDownTicks(600)
            .nameAccessor(node => `${node.user?node.user+': ':''}${node.description || node.id}`)
        .colorAccessor(node => parseInt(userColors[node.user || null].slice(1), 16))
        .graphData({
            nodes: nodes,
            links: data.links.map(link => [link.source, link.target])
    });
    });
    };
    loadBlocks.description = "<em>Blocks</em> data (<a href='https://bl.ocks.org/mbostock/afecf1ce04644ad9036ca146d2084895'>afecf1ce04644ad9036ca146d2084895</a>)";

    //

    const loadD3Dependencies = function(Graph) {
        qwest.get('d3.csv').then((_, csvData) => {
            const { data: [, ...data] } = Papa.parse(csvData); // Parse csv
        data.pop(); // Remove last empty row

        const nodes = {}, links = [], modules = new Set();
        data.forEach(([size, path]) => {
            const levels = path.split('/'),
            module = levels.length > 1 ? levels[1] : null,
            leaf = levels.pop(),
            parent = levels.join('/');

        modules.add(module);

        nodes[path] = {
            leaf: leaf,
            module: module,
            path: path,
            size: +size || 1
        };

        if (parent) {
            links.push([parent, path]);
        }
    });

        const moduleColors = {};
        Array.from(modules).forEach((module, idx) => {
            moduleColors[module] = colors[idx%colors.length]; // Rotate colors
    });

        Graph
            .coolDownTicks(300)
            .nodeRelSize(0.5)
            .valAccessor(node => node.size)
        .nameAccessor(node => node.path)
        .colorAccessor(node => parseInt(moduleColors[node.module || null].slice(1), 16))
        .graphData({ nodes: nodes, links: links });
    });
    };
    loadD3Dependencies.description = "<em>D3 dependencies</em> data (<a href='https://bl.ocks.org/mbostock/9a8124ccde3a4e9625bc413b48f14b30'>9a8124ccde3a4e9625bc413b48f14b30</a>)";

    const tunnel = function(Graph) {

        const perimeter = 12, length = 30;

        const getId = (col, row) => `${col},${row}`;

        let nodes = {}, links = [];
        for (let colIdx=0; colIdx<perimeter; colIdx++) {
            for (let rowIdx=0; rowIdx<length; rowIdx++) {
                const id = getId(colIdx, rowIdx);
                nodes[id] = {};

                // Link vertically
                if (rowIdx>0) {
                    links.push([getId(colIdx, rowIdx-1), id]);
                }

                // Link horizontally
                links.push([getId((colIdx || perimeter) - 1, rowIdx), id]);
            }
        }

        Graph
            .warmUpTicks(200)
            .alphaDecay(0.001)
            .graphData({ nodes: nodes, links: links });
    };
    tunnel.description = "fabric data for a cyllindrical tunnel shape";

    //

    return [loadMiserables, loadBlocks, loadD3Dependencies, tunnel];
}