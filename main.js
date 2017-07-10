var ctx, treeRoot, allNodes = {}, center, gui, holdingNode = false;

var settings = {
    spring: 60,
    repulsion: 0.0001,
    limit: 0.6,
    mass: 1000,
    center: 0,
    springLen: 0.01,
    isRepulsing: true,
    mouseRadius: 8
};

class TreeNode {
    constructor(id, name) {
        this.parent = false;
        this.id = id;
        this.name = name;
        this.children = [];
        this.pos = new Vector(Math.random(), Math.random());
        this.force = new Vector();
    }

    addChild(child) {
        child.parent = this;
        this.children.push(child);
        return child;
    }

    distance(node, trace1, trace2) {
        let tmp;
        trace1 = trace1 || [];
        trace2 = trace2 || [];

        if (this === node) {
            return trace1.length + trace2.length;
        }
        if ((tmp = trace1.indexOf(node)) !== -1) {
            return tmp + trace2.length;
        }
        if ((tmp = trace2.indexOf(this)) !== -1) {
            return tmp + trace1.length;
        }
        if (this.parent) {
            trace1.push(this);
        }
        if (node.parent) {
            trace2.push(node);
        }
        return (this.parent || this).distance(node.parent || node, trace1, trace2);
    }
}

class Vector {
    constructor(x, y) {
        this.x = x || 0;
        this.y = y || 0;
    }

    len() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    mul(k) {
        return new Vector(this.x * k, this.y * k);
    }

    div(k) {
        return new Vector(this.x / k, this.y / k);
    }

    add(v) {
        return new Vector(this.x + v.x, this.y + v.y);
    }

    sub(v) {
        return new Vector(this.x - v.x, this.y - v.y);
    }

    unit() {
        return this.div(this.len());
    }

    mul_(k) {
        this.x *= k;
        this.y *= k;
        return this;
    }

    div_(k) {
        this.x /= k;
        this.y /= k;
        return this;
    }

    add_(v) {
        this.x += v.x;
        this.y += v.y;
        return this;
    }

    sub_(v) {
        this.x -= v.x;
        this.y -= v.y;
        return this;
    }

    unit() {
        return this.div(this.len());
    }

    unit_() {
        return this.div_(this.len());
    }
}

function w(x) {
    return x * window.innerWidth;
}

function h(y) {
    return y * window.innerHeight;
}

function drawNode(node, isRoot) {
    if (node === holdingNode) {
        ctx.strokeStyle = '#00F';
    } else if (node === treeRoot) {
        ctx.strokeStyle = '#F00';
    } else {
        ctx.strokeStyle = '#000';
    }
    // ctx.strokeText(node.name, w(node.pos.x), h(node.pos.y));
    ctx.beginPath();
    ctx.ellipse(w(node.pos.x), h(node.pos.y), 3, 3, 0, 0, 2 * Math.PI);
    ctx.stroke();
    for (const i in node.children) {
        ctx.strokeStyle = isRoot ? '#F00' : '#000';
        ctx.beginPath();
        ctx.moveTo(w(node.pos.x), h(node.pos.y));
        ctx.lineTo(w(node.children[i].pos.x), h(node.children[i].pos.y));
        ctx.stroke();

        drawNode(node.children[i], false);
    }
}

function simulatePhysics() {
    for (const j in allNodes) {
        const node = allNodes[j];
        const centerDir = center.sub(node.pos);

        node.force.add_(centerDir.unit().mul_(settings.center * Math.max(Math.abs(centerDir.x), Math.abs(centerDir.y))));

        for (const i in allNodes) {
            if (i >= j) {
                continue;
            }
            const r = allNodes[i].pos.sub(node.pos);
            const len = r.len();

            if ((node.parent === allNodes[i]) || (node === allNodes[i].parent)) {
                const diff = len - settings.springLen;
                const s = r.unit().mul_(diff * settings.spring);

                node.force.add_(s);
                allNodes[i].force.sub_(s);
            } else if (settings.isRepulsing && len < settings.limit) {
                const s = r.mul_(-settings.repulsion / (len * len * len));

                node.force.add_(s);
                allNodes[i].force.sub_(s);
            }
        }
    }
}

function applyForces() {
    for (const i in allNodes) {
        if (allNodes[i] !== holdingNode) {
            allNodes[i].pos.add_(allNodes[i].force.div(settings.mass));
            // allNodes[i].vel.add_(allNodes[i].force.mul(settings.mass));
            // allNodes[i].pos.add_(allNodes[i].vel);
        }

        allNodes[i].force.x = 0;
        allNodes[i].force.y = 0;
    }
}

function step() {
    simulatePhysics();
    applyForces();
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    drawNode(treeRoot, true);
}

function onMouseDown(e) {
    const mouse = new Vector(e.pageX, e.pageY);
    for (const i in allNodes) {
        let pos = new Vector(w(allNodes[i].pos.x), h(allNodes[i].pos.y));
        if (pos.sub_(mouse).len() <= settings.mouseRadius) {
            holdingNode = allNodes[i];
            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp);
            return;
        }
    }
}

function onMouseMove(e) {
    holdingNode.pos.x = e.pageX / window.innerWidth;
    holdingNode.pos.y = e.pageY / window.innerHeight;
}

function onMouseUp(e) {
    holdingNode = false;
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
}

function init() {
    let canvas = document.createElement('canvas');
    document.getElementsByTagName('body')[0].appendChild(canvas);
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    ctx = canvas.getContext('2d');
    center = new Vector(0.5, 0.5);

    gui = new dat.GUI();

    for (const n in settings) {
        gui.add(settings, n);
    }

    window.addEventListener('mousedown', onMouseDown);
}

function createNode(id) {
    if (allNodes[id]) {
        return allNodes[id];
    }

    allNodes[id] = new TreeNode(id, TREE_DATA[id].name);
    allNodes[id].pos.x = TREE_DATA[id].x;
    allNodes[id].pos.y = TREE_DATA[id].y;

    if (TREE_DATA[id].parent) {
        createNode(TREE_DATA[id].parent).addChild(allNodes[id]);
    } else {
        treeRoot = allNodes[id];
    }

    return allNodes[id];
}

function loadTree() {
    for (const id in TREE_DATA) {
        createNode(id);
    }
}

function main() {
    drawNode(treeRoot, true);
}

window.onload = function () {
    init();
    loadTree();
    main();
    setInterval(step, 1);
};
