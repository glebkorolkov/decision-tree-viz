function parseDot(dot_text) {
	var lines = dot_text.split('\n')
	var nodes = []
	var links = []

	for (i=0;i<lines.length;i++) {
		var line = lines[i].replace(/;$/, '').trim()
		var link_match = line.match(/\d+\s->\s\d+/)
		if (link_match !== null) {
			var link = {'source': parseInt(link_match[0].split(' -> ')[0].trim()),
									'target': parseInt(link_match[0].split(' -> ')[1].trim())}
			links.push(link)
		}

		var node_match = line.match(/(\d+)\s\[label="(.+)"\]/)
		if (node_match !== null) {
			var node = {'id': parseInt(node_match[1])}
			var labels = node_match[2].split("\\n")
			for (j=0;j<labels.length;j++) {
				var label = labels[j]
				if (label.substr(0,4) == 'gini') {
					node['gini'] = parseFloat(label.split(' = ')[1])
				}
				else if (label.substr(0,7) == 'entropy') {
					node['entropy'] = parseFloat(label.split(' = ')[1])
				}
				else if (label.substr(0,7) == 'samples') {
					node['samples'] = parseInt(label.split(' = ')[1])
				}
				else if (label.substr(0,5) == 'value') {
					var values = label.split(" = ")[1].replace(/[\[\]]/g, '').split(',')
					for (k=0;k<values.length;k++) {
						values[k] = parseInt(values[k].trim())
					}
					node['value'] = values
				} else {
					var rule_match = label.match(/([\w\d\[\]]+)\s([<=>]+)\s([0-9.]+)/)
					if (rule_match !== null) {
						var rule = {
							'feature': rule_match[1].trim(),
							'operator': rule_match[2].trim(),
							'value': parseFloat(rule_match[3].trim())
						}
						node['rule'] = rule
					}
				}
			}
			nodes.push(node)
		}
	}

	links.sort(function(a, b){
		if (a['source'] > b['source']) return 1
		else if (a['source'] < b['source']) return -1
		else return 0
	})

	nodes.sort(function(a, b){
		if (a['id'] > b['id']) return 1
		else if (a['id'] < b['id']) return -1
		else return 0
	})

	for (i=0;i<nodes.length;i++) {
		var children_links = []
		for (j=0;j<links.length;j++) {
			if (links[j]['source'] == nodes[i]['id'])
				children_links.push([j, links[j]])
		}
		if (children_links.length == 0)
			continue
		if (!('rule' in nodes[i]))
			continue

		links[children_links[0][0]]['rule'] = nodes[i]['rule']
		links[children_links[0][0]]['rule_yes'] = true
		links[children_links[1][0]]['rule'] = reverse_rule(nodes[i]['rule'])
		links[children_links[1][0]]['rule_yes'] = false
	}

	data = {'links': links, 'nodes': nodes}
	return data
}

function reverse_rule(rule) {
	var opposites = {
		'<=': '>',
    '<': '>=',
    '>=': '<',
    '>': '<=',
    '=': '!=',
    '==': '!=='}
  var reversed_rule = JSON.parse(JSON.stringify(rule))
  reversed_rule['operator'] = opposites[rule['operator']]
  return reversed_rule
}