// preparing data for this https://github.com/d3/d3-hierarchy

// vpcs.json should be the output of `aws ec2 describe-vpcs`
// subnets.json should be the output of `aws ec2 describe-subnets`
tree = parse('data/vpcs.json', 'data/subnets.json')

function loadJSON(file, callback) {   

  var xobj = new XMLHttpRequest();
      xobj.overrideMimeType("application/json");
  xobj.open('GET', file, true);
  xobj.onreadystatechange = function () {
        if (xobj.readyState == 4 && xobj.status == "200") {
          // Required use of an anonymous callback as .open will NOT return a value but simply returns undefined in asynchronous mode
          callback(xobj.responseText);
        }
  };
  xobj.send(null);  
}

function parse(vpcs, subnets) {
  loadJSON(vpcs, function(response) {
    // Parse JSON string into object
    var vpc_data = JSON.parse(response).Vpcs;
    loadJSON(subnets, function(response) {
      // Parse JSON string into object
      var subnet_data = JSON.parse(response).Subnets;
      var tree = toHierarchy(vpc_data, subnet_data);
      // console.log(tree) // now works!
      drawGraph(tree);
    });
  });
}

function toHierarchy(vpcs, subnets) {
  console.log(vpcs)
  console.log(subnets)
  // Make root object
  var root = {
    name: 'ROOT',
    children: []
  };

  // Start from root.children
  rootChildren = root.children;

  for (vpc of vpcs) {
    // all vpcs are children of the root for the region
    var cidr = vpc.CidrBlock;
    var cidrMask = cidr.split('/')[1];
    var size = Math.pow(2, (32 - cidrMask));
    rootChildren.push({ 'name': vpc.VpcId, 'size': (size / 300), 'meta': vpc, 'children': [] });
  };

  for (subnet of subnets) {
    for (child of rootChildren) {
      if (child.name == subnet.VpcId) {
        // subnets, on the other hand, belong to a specific VPC.
        child.children.push({ 'name': subnet.SubnetId, 'size': (subnet.AvailableIpAddressCount / 200), 'meta': subnet, 'children': [] });
      }
    }
  };
  return root
}

function drawGraph(tree) {
  console.log("Plotting a graph with the contents of: ")
  console.log(tree)

  var svg = d3.select("#canvas"),
      margin = 20,
      diameter = +svg.attr("width"),
      g = svg.append("g").attr("transform", "translate(2,2)");

    var format = d3.format(",d");

    var color = d3.scaleSequential(d3.interpolateMagma)
        .domain([-4, 4]);

    var pack = d3.pack()
        .size([diameter - 2, diameter - 2])
        .padding(2);

    // reads in the hierarchy the script above made.
    vpcData = d3.hierarchy(tree)
      .sum(function(d) { return d.size })
      .sort(function(a, b) { return b.value - a.value; });

    var node = g.selectAll(".node")
      .data(pack(vpcData).descendants())
      .enter() // d3 magic ensures an svg group exists for vpcData node. 
      .append("g")
        .attr("class", function(d) { return d.children ? "node" : "leaf node"; })
        .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

    node.append("title")
        .text(function(d) { return d.data.name });

    node.append("circle")
        .attr("r", function(d) { return d.value });

    node.append("title")
        .text(function(d) { return d.data.name });

}
