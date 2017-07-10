import subprocess
import pymysql
import json
import codecs
import os

def diff(first, second):
    second = set(second)
    return [item for item in first if item not in second]

def renderTree(fileName, picName):
    subprocess.call(["C:\\Program Files (x86)\\Graphviz2.38\\bin\\dot.exe", "-Tplain", fileName, "-o", picName])

def makeFile(tree, fileName):
    file = codecs.open(fileName, 'w', 'utf-8')
    file.write('digraph G {\n')

    for nodeId in tree:
        node = tree[nodeId]
        name = node['rus_name'] if node['rus_name'] else node['name']
        name = str(node['id'])
        file.write('N' + str(node['id']) + ' [shape=ellipse]\n')

    for nodeId in tree:
        node = tree[nodeId]

        if int(node['parent_id']) == 0:
            continue
        file.write('N' + str(node['parent_id']) + ' -> N' + str(node['id']) + ';\n')

    file.write("overlap=false\
        }")
    file.close()    

def fillCSV(prefix, tree, nodeId, file):
    if tree[nodeId]['name'] == '':
        name = 'N' + str(nodeId)
    else:
        name = tree[nodeId]['name']

    file.write(prefix + name + ',\n')
    for childId in tree[nodeId]['children']:
        fillCSV(prefix + name + '.', tree, childId, file)

def makeCSV(tree, fileName):
    file = codecs.open(fileName, 'w', 'utf-8')
    file.write('id,value\n')

    rootId = findRoot(tree)

    fillCSV('', tree, rootId, file)
    file.close()    

def findRoot(tree):
    for nodeId in tree:
        if not tree[nodeId]['parent_id']:
            return nodeId
    return False

def buildTree(species):
    newNodes = getNodesByIds(species)
    nodes = newNodes

    while True:
        parentIds = [newNodes[node]['parent_id'] for node in newNodes]
        parentIds = diff(list(set(parentIds)), nodes.keys())
        if not parentIds:
            break
        newNodes = getNodesByIds(parentIds)

        nodes = {**nodes, **newNodes}

        if len(parentIds) == 1 and parentIds[0] == 0:
            break

    for nodeId in nodes:
        if nodes[nodeId]['parent_id']:
            nodes[nodes[nodeId]['parent_id']]['children'].append(nodeId)
        nodes[nodeId]['best_name'] = nodes[nodeId]['rus_name'] if nodes[nodeId]['rus_name'] else nodes[nodeId]['name']

    for nodeId in list(nodes):
        if len(nodes[nodeId]['children']) == 1 and nodes[nodeId]['parent_id'] != 0:
            nodes[nodes[nodeId]['children'][0]]['parent_id'] = nodes[nodeId]['parent_id']
            nodes[nodes[nodeId]['parent_id']]['children'].remove(nodeId)
            nodes[nodes[nodeId]['parent_id']]['children'].append(nodes[nodeId]['children'][0])
            del nodes[nodeId]

    return nodes

def getNodesByIds(ids):
    cursor.execute('SELECT * FROM tree WHERE id IN (' + ','.join([str(id) for id in ids]) + ')')

    nodes = {}
    for row in cursor.fetchall():
        nodes[row['id']] = row
        nodes[row['id']]['children'] = []

    return nodes

def getSpecies(limit):
    cursor.execute('SELECT id FROM tree WHERE wiki_image IS NOT NULL and rus_name IS NOT NULL ORDER BY refs DESC LIMIT ' + str(limit))
    return [row['id'] for row in cursor.fetchall()]

connection = pymysql.connect(host='localhost', user='root', password='', db='tree', charset='utf8mb4', cursorclass=pymysql.cursors.DictCursor)
cursor = connection.cursor()

species = getSpecies(500)
tree = buildTree(species)

makeFile(tree, 'tree.gv')
renderTree('tree.gv', 'computed.txt')
os.remove('tree.gv')

file = open('computed.txt', 'r')
lines = file.read().strip().split('\n')
file.close()
os.remove('computed.txt')

firstLine = lines[0].split(' ')
width = float(firstLine[2])
height = float(firstLine[3])

for line in lines:
    parts = line.split(' ')
    if parts[0] == 'node':
        nodeId = int(parts[1][1:])
        tree[nodeId]['x'] = float(parts[2]) / width
        tree[nodeId]['y'] = float(parts[3]) / height


data = {};
for nodeId in tree:
    node = tree[nodeId]
    data[nodeId] = {}
    data[nodeId]['id'] = nodeId
    data[nodeId]['x'] = node['x'] * 2 - 0.5
    data[nodeId]['y'] = node['y']
    data[nodeId]['name'] = node['name']
    data[nodeId]['children'] = node['children']
    data[nodeId]['parent'] = node['parent_id']

file = open('tree.js', 'w')
file.write('const TREE_DATA = ' + json.dumps(data))
file.close()

connection.close()