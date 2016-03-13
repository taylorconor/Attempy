#!/usr/bin/env python
from StringIO import StringIO
from lxml import etree
from pyparsing import nestedExpr
import json, re, sys, subprocess, os

###Usage: ./pml_to_json.py <filename.pml>
###Prints the dumped json representation
#TODO: Ensure the output from the parser is ok before attempting to parse
#Possibility of unsafe user input? Problems?

#Mapping of primary constructs which can be nested and will have the same json structure
PRIMARY_NESTED = {
    "PrimBr": "branch",
    "PrimSeln": "selection",
    "PrimIter": "iteration",
    "PrimSeq": "sequence",
    "PrimTask": "task"
}

def format_xml(xml):
    #Remove null elements
    for elem in xml.xpath('//OpNmNull | //OptNull'):
        elem.getparent().remove(elem)

    return xml

def build_dict(root, source, level=None):
    d = {}
    count = 0
    prefix = ""
    if level != None:
        prefix = str(level) + "."

    if root.tag == "Process":
        process = {
            "type": "process",
            "name": root.xpath('./ID/@value')[0],
            "contains": {}
        }
#        prefix = ""
#        if level != None:
#            prefix = str(level) + "." # if level is 0, 0., if 1, 1. etc
        for child in root.getchildren():
            if child.tag != "ID":
                process["contains"][str(count)] = build_dict(child, source, 1)
                count += 1

        d["process"] = process
        return d

    if root.tag in PRIMARY_NESTED.keys():
        iteration = {
            "type": PRIMARY_NESTED[root.tag],
            "name": None,
            "contains": {}
        }
        name = root.xpath('./OpNmId/ID/@value')
        if name:
            iteration["name"] = name[0]
        for child in root.getchildren():
            if child.tag != "ID":
                iteration["contains"][str(count)] = build_dict(child, source, level + 1)
                count += 1
        return iteration

    if root.tag == "PrimAct":
        name = root.xpath('./ID/@value')[0]
        action = {
            "type": "action",
            "name": name,
            "script": None,
            "agent": None,
            "requires": None,
            "provides": None
        }
        script = root.xpath('./SpecScript/STRING/@value')
        agent = root.xpath('./SpecAgent//VarId/ID/@value')


        action_split = source.split(name, 1)[-1]
        nested = nestedExpr('{', '}').parseString(action_split).asList()[0]
        requires = None
        provides = None

        try:
            requires_index = nested.index("requires")
            requires = "".join(nested[requires_index + 1])
            provides_index = nested.index("provides")
            provides = "".join(nested[provides_index + 1])
        except: #There are no requires or provides
            pass

        if script:
            action["script"] = script[0]
        if agent:
            action["agent"] = agent
        action["requires"] = requires
        action["provides"] = provides
        #let the rest just be empty lists until figured out how to parse expressions
        return action

def strip_comments(text):
    def replacer(match):
        s = match.group(0)
        if s.startswith('/'):
            return " " # note: a space and not an empty string
        else:
            return s
    pattern = re.compile(
        r'//.*?$|/\*.*?\*/|\'(?:\\.|[^\\\'])*\'|"(?:\\.|[^\\"])*"',
        re.DOTALL | re.MULTILINE
    )
    return re.sub(pattern, replacer, text)

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print "Usage: ./pml_to_json.py <filename.pml>"
        sys.exit(2)

    #run the parser from this script
    filename = sys.argv[1]
    tmp_filename = filename+".tmp"
    #pre_processed = subprocess.check_output(["cpp", "-P", filename])
    stripped = ""
    with open(filename, 'r') as f:
        stripped = strip_comments(f.read())
    with open(tmp_filename, 'w') as f:
        f.write(stripped)

    xml = subprocess.check_output(["parser/TestPML", tmp_filename])
    os.remove(tmp_filename)


    #Uncomment the following line to instead receive input from piping
    #xml = sys.stdin.read()
    #remove first line
    xml = xml.split('\n', 1)[-1]
    if xml.find('\n') == -1:
        xml = ""
    xml = xml.rsplit('\n', 1)[0]

    split = xml.split('[Linearized tree]')
    xml = split[0]
    source = split[1]
    source = source.split('\n', 1)[-1]

    #remove escaped quotes - these break the xml parser
    xml = xml.replace("\\\"", "")
    xml = xml.replace("\\\'", "")

    parser = etree.XMLParser(recover=True)
    tree = etree.parse(StringIO(xml), parser)
    root = format_xml(tree.getroot())


    print json.dumps(build_dict(root, source), indent = 2, sort_keys = True)

    #print( json.dumps (etree_to_dict(root) , indent = 1 ))

