import json, sys

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

def parse_action(action_obj, indent_amt):
    output = ""
    indent = "\t"*indent_amt
    if not action_obj.has_key("name"):
        return False,"Attribute 'name' missing from Action object"

    output += indent+"action "+action_obj["name"]+" {\n"
    if action_obj.has_key("script"):
        output += indent+"\tscript {"+action_obj["script"]+"}\n"
    if action_obj.has_key("agents"):
        output += indent+"\tagents {"+action_obj["agents"]+"}\n"
    if action_obj.has_key("requires"):
        output += indent+"\trequires {"+action_obj["requires"]+"}\n"
    if action_obj.has_key("provides"):
        output += indent+"\tprovides {"+action_obj["provides"]+"}\n"
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
    elif type == "action":
        return parse_action(json_obj, indent_amt)
    else:
        return False, "Unknown type '"+type+"'"

def json_to_pml(json_str):
    json_obj = json.loads(json_str)
    if not "process" in json_obj:
        return False, ""
    return parse_process(json_obj["process"], 0)

if __name__ == '__main__':
    file_name = sys.argv[1]
    fp = open(file_name)
    contents = fp.read()
    valid,output = json_to_pml(contents)
    if not valid:
        print "ERROR: "+output
    else:
        print output