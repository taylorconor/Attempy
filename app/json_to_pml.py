import json, sys, copy

def joint_to_json(arr, name):
	d = {"process": {
		"type": "process",
		"name": name,
		"contains" : {} 
		}
	}
	contains = {}
	count = 0
	#keep track of processed ID's. map them to the path in the main dictionary
	processed = {}
	def actionString(items, action_type):
		res = ""
		if(action_type is "agent"):
				res += "\""
		for item in items:
			if("relOp" in item):
				res += " " + item["relOp"] + " "
			if(action_type is "requires" or action_type is "provides"):
				res += item["resource"] + "." + item["attribute"] + " " + item["operator"] + " \"" + item["value"]	+ "\""	
			else:
				res += item["resource"] + "." + item["attribute"] + " " + item["operator"] + " " + item["value"]		
		if(action_type is "agent"):
				res += "\""
		return res

	def action(item):
		script = "\"" + "".join(item["scriptIn"]) + "\"" #Expects string below, convert to string
		# agents = ",".join(item["AgentsIn"]) #Expects string too... potential conflict with representations
				# requires = "".join(item["RequiresIn"])
		# provides = "".join(item["ProvidesIn"])
		agents = actionString(item["AgentsIn"], "agent") 
		requires = actionString(item["RequiresIn"], "requires")
		provides = actionString(item["ProvidesIn"], "provides")

		return {
			"type": "action",
			"name": item["nameIn"],
			"contains": {},
			"script": script,
			"agents": agents,
			"requires": requires,
			"provides": provides
		}

	def other(item):
		item = copy.deepcopy(item)
		name = ""
		itemtype = ""
		try: 
			itemtype = item["elType"]
		except:
			pass
		try:
			name = item["nameIn"]
		except:
			pass
		return {
			"type": itemtype,
			"name": name,
			"contains": {}
		}
	while arr:
            delete = []
            for i, item in enumerate(arr):	
                itemDict = {}
                if item["elType"] == "action":
                    itemDict = action(item)					
                else:
                    itemDict = other(item)
                if "parent" in item.keys():
                    if item["parent"] in processed.keys():
                        key = str(len(processed[item["parent"]].keys()))
                        processed[item["parent"]][key] = copy.deepcopy(itemDict)
                        processed[item["id"]] = processed[item["parent"]][key]["contains"]
                    else:
                        continue
                else: #root level 
                    key = str(len(d["process"]["contains"].keys()))
                    d["process"]["contains"][key] = itemDict
                    if "embeds" in item.keys():
                        processed[item["id"]] = d["process"]["contains"][key]["contains"]

                delete.append(i)
            for x in delete[::-1]:
                arr.pop(x)
        
	return json.dumps(d)		

def parse_process(proc_obj, indent_amt):
    output = ""
    indent = "\t"*indent_amt
    if not "name" in proc_obj:
        return False, "Object 'process' requires 'name' attribute"
    output += indent+"process "+proc_obj["name"]+" {\n"
    iter = 0
    while True:
        # return successfully if the end of the process has been reached
        if not str(iter) in proc_obj["contains"]:
            return True, output+indent+"}\n"
        valid,sub_output = switchboard(proc_obj["contains"][str(iter)], indent_amt+1)
        if not valid:
            return False, sub_output
        output += sub_output
        iter += 1

def parse_generic_container(generic_obj, indent_amt, generic_name):
    output = ""
    indent = "\t"*indent_amt
    name = ""
    if generic_obj.has_key("name"):
        name = generic_obj["name"]+" "
    if not generic_obj.has_key("contains"):
        return False,"Object '"+generic_name+"' requires 'contains' attribute"

    output += indent+generic_name+" "+name+"{\n"
    iter = 0
    while True:
        # return successfully if the end of the process has been reached
        if not str(iter) in generic_obj["contains"]:
            return True, output+indent+"}\n"
        valid,sub_output = switchboard(generic_obj["contains"][str(iter)], indent_amt+1)
        if not valid:
            return False, sub_output
        output += sub_output
        iter += 1

def parse_iteration(iter_obj, indent_amt):
    return parse_generic_container(iter_obj, indent_amt, "iteration")

def parse_branch(branch_obj, indent_amt):
    return parse_generic_container(branch_obj, indent_amt, "branch")

def parse_sequence(seq_obj, indent_amt):
    return parse_generic_container(seq_obj, indent_amt, "sequence")

def parse_selection(sel_obj, indent_amt):
	return parse_generic_container(sel_obj, indent_amt, "selection")

def parse_action(action_obj, indent_amt):
    output = ""
    indent = "\t"*indent_amt
    if not action_obj.has_key("name"):
        return False,"Attribute 'name' missing from Action object"

    output += indent+"action "+action_obj["name"]+" {\n"
    if action_obj.has_key("requires"):
        output += indent+"\trequires {"+action_obj["requires"]+"}\n"
    if action_obj.has_key("provides"):
        output += indent+"\tprovides {"+action_obj["provides"]+"}\n"
    if action_obj.has_key("agents"):
        output += indent+"\tagent {"+action_obj["agents"]+"}\n"
    if action_obj.has_key("script"):
        output += indent+"\tscript {"+action_obj["script"]+"}\n"
    if action_obj.has_key("tool"):
        output += indent+"\ttool {"+action_obj["tool"]+"}\n"
    output += indent+"}\n"
    return True,output

# subparser switchboard; calls the necesarry subparser
# json_obj:     dictionary  internal representation of the sub object
# indent_amt:   int         current indentation level
def switchboard(json_obj, indent_amt):
    if not "type" in json_obj:
        return False, "Object has no attribute 'type'"
    type = json_obj["type"]
    if type == "process":
        return parse_process(json_obj, indent_amt)
    elif type == "branch":
        return parse_branch(json_obj, indent_amt)
    elif type == "iteration":
        return parse_iteration(json_obj, indent_amt)
    elif type == "sequence":
        return parse_sequence(json_obj, indent_amt)
    elif type == "selection":
		return parse_selection(json_obj, indent_amt)
    elif type == "action":
        return parse_action(json_obj, indent_amt)
    else:
        return False, "Unknown type '"+type+"'"

def json_to_pml(json_str):
    json_obj = json.loads(json_str)
    if not "process" in json_obj:
        return False, "Root object 'process' not found"
    return parse_process(json_obj["process"], 0)

def parse(arr, name):
    json_obj = joint_to_json(arr, name)
    return json_to_pml(json_obj)
	
if __name__ == '__main__':
	test = [
{"type":"devs.Coupled","size":{"width":300,"height":110},"inPorts":[],"outPorts":[],"position":{"x":89.99996948242188,"y":90},"angle":0,"verticalChildCount":1,"id":"dd5b87fd-dc2a-406d-bdd9-fea0376430b8","column":"","z":2,"embeds":["a8f85853-30f6-4d3f-93e3-d049d22a68e0"],"attrs":{"text":{"text":"branch"}}},
{"type":"html.Element","position":{"x":109.99996948242188,"y":130},"size":{"width":260,"height":50},"angle":0,"label":"Action","nameIn":"Action","scriptIn":[],"RequiresIn":[],"ProvidesIn":[],"AgentsIn":[],"id":"a8f85853-30f6-4d3f-93e3-d049d22a68e0","column":"","z":3,"parent":"dd5b87fd-dc2a-406d-bdd9-fea0376430b8","attrs":{}},
{"type":"devs.Coupled","size":{"width":300,"height":50},"inPorts":[],"outPorts":[],"position":{"x":440,"y":90},"angle":0,"verticalChildCount":0,"id":"064c3e32-2953-4875-bc20-acba96246141","column":"","z":3,"attrs":{"text":{"text":"iteration"}}},
{"type":"devs.Coupled","size":{"width":300,"height":50},"inPorts":[],"outPorts":[],"position":{"x":790,"y":90},"angle":0,"verticalChildCount":0,"id":"81abd23f-0d27-493f-84cf-04dbbd9d9a15","column":"","z":4,"attrs":{"text":{"text":"selection"}}}] 

        broken_test = [{"type":"devs.Coupled","size":{"width":730,"height":240},"inPorts":[],"outPorts":[],"position":{"x":54,"y":83},"angle":0,"class":"body branch","nameIn":"branch","elType":"branch","verticalChildCount":0,"id":"7ba82fc7-a220-47ba-98c8-7d12db944efe","column":"","z":900,"embeds":["90dab2df-c5ce-4bdc-9e0d-8d63dd7bb926","bba5ea5d-f148-43e9-871a-2a3f779af72d"],"attrs":{"text":{"text":"branch","class":"label branch"},"rect":{"class":"body branch","fill":"#ffffff"}}},
{"type":"devs.Coupled","size":{"width":690,"height":110},"inPorts":[],"outPorts":[],"position":{"x":74,"y":193},"angle":0,"class":"body sequence","nameIn":"sequence","elType":"sequence","verticalChildCount":0,"id":"bba5ea5d-f148-43e9-871a-2a3f779af72d","column":"","z":901,"parent":"7ba82fc7-a220-47ba-98c8-7d12db944efe","embeds":["f5a6d8e4-28d7-4d06-aa9a-7b05acb137e4","a9cab37b-7c38-4e93-a122-cfd5d00c154a"],"attrs":{"text":{"text":"sequence","class":"label sequence"},"rect":{"class":"body sequence","fill":"#ffffff"}}},
{"type":"devs.Coupled","size":{"width":300,"height":50},"inPorts":[],"outPorts":[],"position":{"x":74,"y":123},"angle":0,"label":"Action","elType":"action","nameIn":"","scriptIn":[],"RequiresIn":[],"ProvidesIn":[],"AgentsIn":[],"ToolsIn":[],"id":"90dab2df-c5ce-4bdc-9e0d-8d63dd7bb926","column":"","z":901,"parent":"7ba82fc7-a220-47ba-98c8-7d12db944efe","attrs":{"text":{"text":"action"},"rect":{"fill":"rgb(255,255,255)"}}},
{"type":"devs.Coupled","size":{"width":300,"height":50},"inPorts":[],"outPorts":[],"position":{"x":444,"y":233},"angle":0,"label":"Action","elType":"action","nameIn":"","scriptIn":[],"RequiresIn":[],"ProvidesIn":[],"AgentsIn":[],"ToolsIn":[],"id":"a9cab37b-7c38-4e93-a122-cfd5d00c154a","column":"","z":902,"parent":"bba5ea5d-f148-43e9-871a-2a3f779af72d","attrs":{"text":{"text":"action"},"rect":{"fill":"rgb(255,255,255)"}}},
{"type":"devs.Coupled","size":{"width":300,"height":50},"inPorts":[],"outPorts":[],"position":{"x":94,"y":233},"angle":0,"label":"Action","elType":"action","nameIn":"","scriptIn":[],"RequiresIn":[],"ProvidesIn":[],"AgentsIn":[],"ToolsIn":[],"id":"f5a6d8e4-28d7-4d06-aa9a-7b05acb137e4","column":"","z":902,"parent":"bba5ea5d-f148-43e9-871a-2a3f779af72d","attrs":{"text":{"text":"action"},"rect":{"fill":"rgb(255,255,255)"}}}]	
	json_str = joint_to_json(broken_test, "test")
	#print json_str
    
        print json_to_pml(json_str)


	"""file_name = sys.argv[1]
    fp = open(file_name)
    contents = fp.read()
    valid,output = json_to_pml(contents)
    if not valid:
        print "ERROR: "+output
    else:
        print output"""
