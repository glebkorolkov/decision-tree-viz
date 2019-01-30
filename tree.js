// Tree visualization

var tooltip = document.getElementById('tooltip')
var svg = d3.select('svg')
var g = svg.append('g')

var color = d3.scaleOrdinal(d3.schemeCategory10)

var zoom = d3.zoom()
	.scaleExtent([1, 10])
	.on('zoom', zoomed)
svg.call(zoom)

var graph
var dot
if (getData())
	update()
else {
	document.getElementById('alert-modal').style.display = 'flex'
}

function update() {
	// Function that (re-)draws the tree

	d3.selectAll('svg g g').remove()

	var w = document.getElementById('content').offsetWidth
	var h = document.getElementById('content').offsetHeight
	var rootRadius = h * 0.1 // Radius of root node in px

	var simulation = d3.forceSimulation()
		.force('charge', d3.forceManyBody().strength(-30))
		.force('collide', d3.forceCollide().radius(function(d) {return d.radius*1.2 }))
		.force('x', d3.forceX(w/2).strength(0.005))
		.force('y', d3.forceY(h).strength(0.02))
		.force('link', d3.forceLink().strength(1).distance(function(d) {
			return d.source.radius + d.target.radius
		}))
	
	var nodes = graph.nodes
	nodes[0].fx = w/2
	nodes[0].fy = h*0.15
	var totalSamples = nodes[0].samples;
	for (i=0;i<nodes.length;i++){
		nodes[i].x = w/2
		nodes[i].y = h/2
		nodes[i].radius = Math.sqrt(nodes[i].samples/totalSamples) * rootRadius
		pie = new Array()
		for (j=0;j<nodes[i].value.length;j++) {
			pie[j] = {
				color: j + 1,
				percent: (nodes[i].value[j] / nodes[i].samples) * 100
			}
		}
		nodes[i].pieChart = pie
	}

	var links = graph.links

	var link = g
		.append('g')
		.attr('id', 'links')
		.selectAll('.link')
		.data(links)
		.enter()
		.append('g')
		.attr('class', 'link')
		.append('line')

	link.exit().remove()

	var node = g
		.append('g')
		.attr('class', 'nodes')
		.selectAll('.node')
		.data(nodes)
		.enter()
		.append('g')
		.attr('class', 'node')
		.call(d3.drag()
			.on('start', dragstarted)
			.on('drag', dragged)
			.on('end', dragended))
		.on('mouseover', function(d) {
			tooltip.innerHTML = '[' + d.value + '] gini: ' + d.gini
			tooltip.style.display = 'block'
		})
		.on('mouseout', function(d) {
			tooltip.innerHTML = ''
			tooltip.style.display = 'none'
		})

	node.exit().remove()

	node.each(function (d) {
		NodePieBuilder.drawNodePie(d3.select(this), d.pieChart, {
			radius: d.radius,
			outerStrokeWidth: 0,
			showPieChartBorder: true,
			pieChartBorderWidth: 2
		})
	})

	var linkText = g
		.append('g')
		.attr('class', 'link-labels')
		.selectAll('.link-label')
		.data(links)
		.enter()
    .append('text')
    .attr('class', 'link-label')
    .attr("dy", "-6px")
    .text(function(d) {
        return d.rule.feature + d.rule.operator + d.rule.value
    })
    .on('mouseover', function(d) {
			tooltip.innerHTML = d.rule.feature + d.rule.operator + d.rule.value
			tooltip.style.display = 'block'
		})
		.on('mouseout', function(d) {
			tooltip.innerHTML = ''
			tooltip.style.display = 'none'
		})

		linkText.exit().remove()

	simulation
		.nodes(nodes)
		.on('tick', ticked)

	simulation
		.force('link')
		.links(links)

	function ticked() {
	  link.attr("x1", function(d) { return d.source.x; })
	      .attr("y1", function(d) { return d.source.y; })
	      .attr("x2", function(d) { return d.target.x; })
	      .attr("y2", function(d) { return d.target.y; });

	  node.attr('transform', function(d) {return 'translate(' + d.x + ',' + d.y + ')'})

	  linkText.attr('transform', function(d) {
	  	var x = (d.source.x + d.target.x)/2
	  	var y = (d.source.y + d.target.y)/2
	  	var dx = d.target.x - d.source.x
	  	var dy = d.target.y - d.source.y
	  	var angle_rad = Math.atan2(dy, dx)
	  	var adj_dir = 1
	  	if (angle_rad > Math.PI/2) {
	  		angle_rad = angle_rad - Math.PI
	  		adj_dir = -1
	  	} else if (angle_rad < -Math.PI/2) {
	  		angle_rad = angle_rad + Math.PI
	  		adj_dir = -1
	  	}
	  	var angle = angle_rad * (180 / Math.PI)
	  	var r_1 = d.source.radius 
	  	var r_2 = d.target.radius
	  	var dist = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2)) - r_1 - r_2
	  	// Hack around Firefox error related to calculation of bbox
	  	var scale = 1.0
	  	try {
	  		var text_width = this.getBBox().width
	  		scale = Math.min(1, dist/text_width * 0.8)
	  	}
	  	catch(err) {
	  		// console.log(err)
	  	}
	  	var x_adj = x + adj_dir * Math.cos(angle_rad) * Math.abs(r_1 - r_2)/2
	  	var y_adj = y + adj_dir * Math.sin(angle_rad) * Math.abs(r_1 - r_2)/2
	  	return 'translate(' + x_adj + ',' + y_adj + ') rotate(' + angle + ') scale(' + scale + ')'
	  })
	}

	function dragstarted(d) {
	  if (!d3.event.active) simulation.alphaTarget(0.3).restart();
	  d.fx = d.x, d.fy = d.y;	
	}

	function dragged(d) {
	  d.fx = d3.event.x, d.fy = d3.event.y;
	}

	function dragended(d) {
	  if (!d3.event.active) simulation.alphaTarget(0);
	  if (d.id != 0) {
	  	d.fx = null, d.fy = null;	
	  }
	}

}

function zoomed(d) {
	var currentTransform = d3.event.transform;
  g.attr("transform", currentTransform);
}

function getData() {
	var input_dot = document.getElementById('input-textarea').value
	input_data = parseDot(input_dot)
	if (input_data['nodes'].length > 0) {
		graph = input_data
		dot = input_dot
		document.getElementById('input-textarea').value = dot
		return true
	} else {
		document.getElementById('alert-modal').style.display = 'flex'
		document.getElementById('input-textarea').value = dot
		return false
	}
}


// Controls

var info_btn = document.getElementById('info-btn')
info_btn.onclick = function() {
	document.getElementById('info-modal').style.display = 'flex'
}

var upload_btn = document.getElementById('upload-btn')
upload_btn.onclick = function() {
	document.getElementById('input-modal').style.display = 'flex'
}

var submit_btn = document.getElementById('submit-btn')
submit_btn.onclick = function() {
	document.getElementById('input-modal').style.display = 'none'
	if (getData()) update()
}


// Detect end of window resize event
// https://stackoverflow.com/questions/5489946/jquery-how-to-wait-for-the-end-of-resize-event-and-only-then-perform-an-ac
var rtime
var timeout = false
var delta = 200

window.onresize = function() {
    rtime = new Date()
    if (timeout === false) {
        timeout = true
        setTimeout(resizeend, delta)
    }
}

function resizeend() {
    if (new Date() - rtime < delta) {
        setTimeout(resizeend, delta)
    } else {
        timeout = false
        update()
    }               
}
