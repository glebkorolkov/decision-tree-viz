# Decision Tree Visualization with D3.js and force layout

### General information
This is yet another visualization of a decision tree. It is built using [d3.js](https://d3js.org) and utilizes the so-called force layout which enables the user to drag tree nodes and change the shape of the tree.

The default tree displayed here is from [this scikit-learn example](https://scikit-learn.org/stable/modules/generated/sklearn.tree.export_graphviz.html). You can replace it with any other scikit-learn decision tree representation in .dot format. It was designed to work with classification trees. I did not try it with regression trees.

Each tree node is a pie chart indicating proportions of different classes at respective branch. You can hover over the node of interest to see the exact number of data points from each class in the bottom left corner. Similarly, you can hover over tree links to see splitting conditions.

**You can view the visualization live here:** http://decision-tree-viz.s3-website-us-east-1.amazonaws.com/