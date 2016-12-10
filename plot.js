
// preparing data for this https://github.com/d3/d3-hierarchy

// vpcs.json should be the output of `aws ec2 describe-vpcs`
// subnets.json should be the output of `aws ec2 describe-subnets`
var tree = parse('data/vpcs.json', 'data/subnets.json')

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

  vpcs = tree['children'];

  d3.select("#canvas").selectAll("div")
  .data(vpcs)
  .enter()
  .append("div")
  .attr("class", "vpc")
  .attr("id", function(d) { return d.VpcId; })
  .attr("title", function(d) { return d.CidrBlock; })
  .html(function(d) { return d.Tags[0].Value })

}
