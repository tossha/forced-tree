var ctx, nodeCount = 0, treeRoot, allNodes = [];

var koeff = {
    spring: 20,
    repulsion: 0.1,
    mass: 0.01
};

class TreeNode {
    constructor(name) {
        this.parent = false;
        this.id = nodeCount++;
        this.name = name;
        this.children = [];
        this.pos = new Vector(Math.random(), Math.random());
        this.vel = new Vector();
        allNodes.push(this);
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

function drawNode(node) {
    ctx.strokeText(node.name, w(node.pos.x), h(node.pos.y));
    ctx.beginPath();
    ctx.ellipse(w(node.pos.x), h(node.pos.y), 5, 5, 0, 0, 2 * Math.PI);
    ctx.stroke();
    for (const i in node.children) {
        ctx.beginPath();
        ctx.moveTo(w(node.pos.x), h(node.pos.y));
        ctx.lineTo(w(node.children[i].pos.x), h(node.children[i].pos.y));
        ctx.stroke();

        drawNode(node.children[i]);
    }
}

function simulatePhysics(node) {
    let force = new Vector();

    for (const i in allNodes) {
        const dist = node.distance(allNodes[i]);
        const r = allNodes[i].pos.sub(node.pos);

        if (dist === 1) {
            force.add_(r.mul(koeff.spring));
        } else {
            const len = r.len();
            force.add_(r.mul(-1/(len*len*len) * koeff.repulsion));
        }
    }

    for (const i in node.children) {
        simulatePhysics(node.children[i]);
    }

    node.force = force;
}

function applyForces() {
    for (const i in allNodes) {
        allNodes[i].pos.add_(allNodes[i].force.mul(koeff.mass));
        // allNodes[i].vel.add_(allNodes[i].force.mul(koeff.mass));
        // allNodes[i].pos.add_(allNodes[i].vel);
    }
}

function step() {
    simulatePhysics(treeRoot);
    applyForces();
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    drawNode(treeRoot);
}

function init() {
    let canvas = document.createElement('canvas');
    document.getElementsByTagName('body')[0].appendChild(canvas);
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    ctx = canvas.getContext('2d');
}

function createTree() {
    treeRoot = new TreeNode('root');

    let ch1 = treeRoot.addChild(new TreeNode('node1'));

    ch1.addChild(new TreeNode('node1-1'));
    ch1.addChild(new TreeNode('node1-2'));
    ch1.addChild(new TreeNode('node1-3')).addChild(new TreeNode('node1-3-1'));

    let ch2 = treeRoot.addChild(new TreeNode('node2'));

    ch2.addChild(new TreeNode('node2-1'));
    ch2.addChild(new TreeNode('node2-2'));
}

function main() {
    drawNode(treeRoot);
}

window.onload = function () {
    init();
    createTree();
    main();
    setInterval(step, 50);
};
