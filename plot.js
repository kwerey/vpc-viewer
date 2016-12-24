
// preparing data for this https://github.com/d3/d3-hierarchy

// vpcs.json should be the output of `aws ec2 describe-vpcs`
// subnets.json should be the output of `aws ec2 describe-subnets`
var tree = parseJson('data/vpcs.json', 'data/subnets.json');

function loadJson(file, callback) {
  return new Promise(function(resolve, reject) {
    var request = new XMLHttpRequest();
    request.open('GET', file, true);
    request.responseType = 'json';
    request.onload = function() {
      if (request.status === 200) {
        resolve(request.response);
      } else {
        reject(Error('Didn\'t load successfully; error code:' + request.statusText));
      }
    };
    request.onerror = function() {
        reject(Error('There was a network error.'));
    };
    request.send();
  });
}

function parseJson(vpcs, subnets) {
  Promise.all([loadJson(vpcs), loadJson(subnets)]).then(function(responses) {
    // responses contains the parsed JSON objects in the order of requests

    // I should verify that they're valid json before doing the next bit.
    var parsedJson = toHierarchy(responses[0].Vpcs, responses[1].Subnets);
  }).catch(function(error) {
      // do error processing here if any promise was rejected
  });
}

function toHierarchy(vpcs, subnets) {
  console.log("To hierarchy:");
  // console.log(vpcs);
  // console.log(subnets);

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
    rootChildren.push({ 'name': vpc.VpcId, 'meta': vpc, 'children': [] });
  };

  for (subnet of subnets) {
    for (child of rootChildren) {
      if (child.name == subnet.VpcId) {
        // subnets, on the other hand, belong to a specific VPC.
        child.children.push({ 'name': subnet.SubnetId, 'meta': subnet, 'children': [] });
      }
    }
  }
  console.log("Now we have a hierarchy. draw a graph!");
  drawGraph(root);
}

function drawGraph(tree) {
  console.log("Plotting a graph with the contents of: ");
  console.log(tree['children']);

  // thanks SO - https://stackoverflow.com/questions/18147915/get-width-height-of-svg-element
  var canvas = document.getElementById('canvas').getBoundingClientRect();
  var width = canvas.width;
  var height = canvas.height;
  var vpcs = tree.children;
  var vpcWidth = ( width / vpcs.length );
  // i think this'll save a third of the canvas for padding/edges.

  console.log("The max size to allocate to each vpc is " + vpcWidth + "px");

  var vpcNode = d3.select("#canvas").selectAll(".vpc")
  .data(vpcs)
  .enter()
  .append("g")
  .attr("class", "vpc")
  .attr("id", function(d) {
    return d.meta.VpcId;
  })
  .attr("title", function(d) {
    return d.meta.CidrBlock;
  })
  // do something more robust in the line below to get name - "if a tag with key Name exists, then..."

  vpcNode.append("text")
  .attr("class", "vpc-name")
  // per https://www.dashingd3js.com/svg-text-element
  .html(function(d) {
    if (d.meta.Tags != null) {
      return d.meta.Tags[0].Value
    } else {
      return "unnamed vpc"
    }
  })
  .attr("x", function(d) {
    return ((vpcs.indexOf(d) * vpcWidth) + 30)
  }) // ugly but approximately functional!
  .attr("y", 40)

  vpcNode.append("rect")
  .attr("width", vpcWidth - 40)
  .attr("height", height - 40)
  .attr("x", function(d) {
    return (vpcs.indexOf(d) * (vpcWidth) + 10)
  }) // ugly but approximately functional!
  .attr("y", 20)

}
