// preparing data for this https://github.com/d3/d3-hierarchy

// these are outputs of describe-vpc, describe-subnets. 
// should be loaded from external files.

vpcData = {
    "Vpcs": [
        {
            "VpcId": "vpc-a01106c2",
            "InstanceTenancy": "default",
            "Tags": [
                {
                    "Value": "MyVPC",
                    "Key": "Name"
                }
            ],
            "State": "available",
            "DhcpOptionsId": "dopt-7a8b9c2d",
            "CidrBlock": "10.0.0.0/20",
            "IsDefault": false
        },
        {
            "VpcId": "vpc-67ff1c03",
            "InstanceTenancy": "dedicated",
            "State": "available",
            "DhcpOptionsId": "dopt-97eb5efa",
            "CidrBlock": "10.50.0.0/16",
            "IsDefault": false
        }
    ]
}

subnetData = {
    "Subnets": [
        {
            "CidrBlock": "172.31.0.0/20",
            "AvailabilityZone": "eu-west-1a",
            "SubnetId": "subnet-c08a40a4",
            "DefaultForAz": true,
            "VpcId": "vpc-67ff1c03",
            "AvailableIpAddressCount": 4091,
            "State": "available",
            "MapPublicIpOnLaunch": true
        },
        {
            "CidrBlock": "172.31.32.0/20",
            "AvailabilityZone": "eu-west-1c",
            "SubnetId": "subnet-986e65c1",
            "DefaultForAz": true,
            "VpcId": "vpc-67ff1c03",
            "AvailableIpAddressCount": 4091,
            "State": "available",
            "MapPublicIpOnLaunch": true
        },
        {
            "CidrBlock": "172.31.16.0/20",
            "AvailabilityZone": "eu-west-1b",
            "SubnetId": "subnet-3a66954c",
            "DefaultForAz": true,
            "VpcId": "vpc-67ff1c03",
            "AvailableIpAddressCount": 4090,
            "State": "available",
            "MapPublicIpOnLaunch": true
        },
        {
            "CidrBlock": "10.0.0.0/24",
            "AvailabilityZone": "eu-west-1c",
            "SubnetId": "subnet-ccce65c1",
            "DefaultForAz": true,
            "VpcId": "vpc-a01106c2",
            "AvailableIpAddressCount": 32,
            "State": "available",
            "MapPublicIpOnLaunch": true
        },
        {
            "CidrBlock": "10.0.1.0/24",
            "AvailabilityZone": "eu-west-1c",
            "SubnetId": "subnet-cbce65c1",
            "DefaultForAz": true,
            "VpcId": "vpc-a01106c2",
            "AvailableIpAddressCount": 32,
            "State": "available",
            "MapPublicIpOnLaunch": true
        },
        {
            "CidrBlock": "10.0.2.0/24",
            "AvailabilityZone": "eu-west-1c",
            "SubnetId": "subnet-fbce65c1",
            "DefaultForAz": true,
            "VpcId": "vpc-a01106c2",
            "AvailableIpAddressCount": 32,
            "State": "available",
            "MapPublicIpOnLaunch": true
        },
    ]
}

function toHierarchy(obj) {

  // Get appropriate arrays.
  var vpcs = vpcData.Vpcs;
  var subnets = subnetData.Subnets

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
      rootChildren.push({ 'name': vpc.VpcId, 'size': (size / 300), 'children': [] });
    };

    for (subnet of subnets) {
      for (child of rootChildren) {
        if (child.name == subnet.VpcId) {
          // subnets, on the other hand, belong to a specific VPC.
          child.children.push({ 'name': subnet.SubnetId, 'size': (subnet.AvailableIpAddressCount / 200), 'children': [] });
        }
      }
    };

  return root;
  }

var tree = toHierarchy(vpcData);

console.log("the whole hierarchiser thing ran");
console.log("the hierarchy came out as:")
console.log(tree)
