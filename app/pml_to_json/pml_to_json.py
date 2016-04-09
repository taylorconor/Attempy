from pyparsing import MatchFirst, cStyleComment, Suppress,Combine,ParseSyntaxException, ParseException,Forward, QuotedString, ZeroOrMore, OneOrMore, Optional, Word, Literal, Or, Keyword, Group, alphas, alphanums, nums, printables
import sys, pprint, copy, re

level = "1"

template = {
    "id": level,
    "type": None,
    "position": {"x": 50, "y": 100},
    "angle": 0,
    "size": {"width": 300, "height": 300},
    "inPorts": [],
    "outPorts": [],
    "columnWidth": 1,
    "startColumn": 1,
}

glob_d = {"process": {
    "name": "",
    "type": "process",
    "contains": {}
}}
glob_arr = []
glob_cur_path = glob_d["process"]["contains"]

def add_action(string, loc, toks):
    global glob_arr
    toks = toks[0]
    #print toks
    action = copy.deepcopy(template)
    action["type"] = "html.Element"
    action["nameIn"] = toks[1]
    action["attrs"] = {}
    action["label"] = "Action"
    action["id"] = level
    action["scriptIn"] = ""
    action["AgentsIn"] = []
    action["RequiresIn"] = []
    action["ProvidesIn"] = []

    if len(level) > 1:
        action["parent"] = level[:-2]
        #arr[len(arr) - int(level[-1])]["embeds"].append(level)
        for i in glob_arr:
            if i["id"] == level[:-2]:
                i["embeds"].append(level)

    for i, item in enumerate(toks):
        if i <= 1:
            continue
        if item[0] == "script":
            action["scriptIn"] = "".join(item[1])
        elif item[0] == "agent":
            action["AgentsIn"].extend(item[1])
        elif item[0] == "requires" or item[0] == "provides":
            requires = "".join(item[1])
            requires = re.split("(&&|\|\|)", requires)

            prev = ""
            for stmt in requires:
                if stmt == "&&" or stmt == "||":
                    prev = stmt
                    continue
                d = {}
                resattr = stmt.split(".")
                if len(resattr) > 1:

                    if "==" in stmt:
                        split = resattr[1].split("==")
                        d["operator"] = "=="
                        d["attribute"] = split[0]
                        d["value"] = split[1][1:-1]
                    elif "!=" in stmt:
                        split = resattr[1].split("!=")
                        d["operator"] = "!="
                        d["attribute"] = split[0]
                        d["value"] = split[1][1:-1]
                    elif "<" in stmt:
                        split = resattr[1].split("<")
                        d["operator"] = "<"
                        d["attribute"] = split[0]
                        d["value"] = split[1][1:-1]
                    elif "<=" in stmt:
                        split = resattr[1].split("<=")
                        d["operator"] = "<="
                        d["attribute"] = split[0]
                        d["value"] = split[1][1:-1]
                    elif ">" in stmt:
                        split = resattr[1].split(">")
                        d["operator"] = ">"
                        d["attribute"] = split[0]
                        d["value"] = split[1][1:-1]
                    elif ">=" in stmt:
                        split = resattr[1].split(">=")
                        d["operator"] = ">="
                        d["attribute"] = split[0]
                        d["value"] = split[1][1:-1]

                    d["resource"] = resattr[0]

                else:
                    d = {
                        "resource": resattr[0],
                        "attribute": "",
                        "value": "",
                        "operator": ""
                    }

                d["relop"] = prev

                if item[0] == "requires":
                    action["RequiresIn"].append(copy.deepcopy(d))
                else:
                    action["ProvidesIn"].append(copy.deepcopy(d))


            #action["RequiresIn"].append("".join(item[1]))
        #elif item[0] == "provides":
        #    action["ProvidesIn"].append("".join(item[1]))


    glob_arr.append(action)
    increment_level()


def add_primary(string, loc, toks):
    global glob_arr
    primary = copy.deepcopy(template)
    primary["attrs"] = {}
    primary["embeds"] = []
    primary["childCount"] = 0
    primary["id"] = level
    if len(level) > 1:
        primary["parent"] = level[:-2]
        #arr[len(arr) - int(level[-1])]["embeds"].append(level)
        for i in glob_arr:
            if i["id"] == level[:-2]:
                i["embeds"].append(level)
    name = None
    try:
        name = toks[1]
    except:
        pass

    primary["type"] = "devs.Coupled"
    primary["name"] = name
    primary["attrs"]["text"] = {"text": toks[0]}
    primary["attrs"]["name"] = toks[0]
    primary["size"]["width"] = 300
    primary["size"]["height"] = 50


    glob_arr.append(primary)

def process_name(string, loc, toks):
    global glob_d
    glob_d["process"]["name"] = toks[0]

def start_prim():
    global level

    level = level + ".1"

def stop_prim():
    global level

    if len(level) > 1:
        level = level[:-2]
    increment_level()

def increment_level():
    global level

    if (len(level) < 2):
        level = str(int(level) + 1)
    else:
        level = level[:-1] + str(int(level[-1]) + 1)


quote = Literal("\"")
underscore = Literal("_")
open_block = Literal("{")
close_block = Literal("}")
end = Literal(";")
name = Word(alphas + "_", alphanums + "_")

manual = Keyword("manual")
executable = Keyword("executable")
action_keywords = manual | executable

"""
expr = Forward()
expr2 = Forward()
expr3 = Forward()
expr4 = Forward()
expr5 = Forward()
attrexpr = Forward()
varexpr = Forward()
valexpr = Forward()

expr = expr2.setResultsName("expression")

DisjExpr = expr2 - "||" - expr3
expr2 << Group(expr3 | DisjExpr)

ConjExpr = expr3 - "&&"  - expr4
expr3 << Group(expr4 | ConjExpr)

RelEq = valexpr - "==" - valexpr
RelNe = valexpr - "!=" - valexpr
RelLt = valexpr - "<" - valexpr
RelGt = valexpr - ">" - valexpr
RelLe = valexpr - "<=" - valexpr
RelGe = valexpr - ">=" - valexpr
RelVeq = varexpr - "==" - varexpr
RelVne = varexpr - "!=" - varexpr

expr4 << Or([QuotedString("\""), expr5, RelEq, RelNe, RelLt, RelGt, RelLe, RelGe, RelVeq, RelVne])

PrimVar = name
PrimAttr = attrexpr
PrimNot = Literal("!") + expr5
expr5 << Group(PrimVar | PrimAttr | PrimNot)

varexpr << Group(name | Literal("(") + name + Literal(")") + Optional(varexpr))
attrexpr << varexpr + Literal(".") + name
valexpr << Group(QuotedString("\"") | nums | attrexpr)
"""

provides_decl = Keyword("provides") - Suppress(open_block) - Group(ZeroOrMore(Word(printables, excludeChars="{}"))) - Suppress(close_block)
requires_decl = Keyword("requires") - Suppress(open_block) - Group(ZeroOrMore(Word(printables, excludeChars="{}"))) - Suppress(close_block)
agent_decl = Keyword("agent") + Suppress(open_block) + Group(ZeroOrMore(Word(printables, excludeChars="{}"))) + Suppress(close_block)
script_decl = Keyword("script") + Suppress(open_block) + QuotedString("\"", multiline=True) + Suppress(close_block)
tool_decl = Keyword("tool") + Suppress(open_block) + QuotedString("\"", multiline=True) + Suppress(close_block)

action_contents = Group(provides_decl ^ requires_decl ^ agent_decl ^ script_decl ^ tool_decl)
action_decl = Group(Keyword("action") + name.setResultsName("actionName") + Optional(action_keywords) + Suppress(open_block) - ZeroOrMore(action_contents) - Suppress(close_block)).setParseAction(add_action)

primary_decl = Forward()
block = Forward()
primary_keyword = Or([Keyword("branch"), Keyword("iteration"), Keyword("selection"), Keyword("sequence"), Keyword("task")])
primary_decl << Group(primary_keyword.setParseAction(add_primary) - Optional(name)("name") - Suppress(open_block).setParseAction(start_prim) - ZeroOrMore( (action_decl ^ primary_decl) ) - Suppress(close_block).setParseAction(stop_prim))


process_decl = (Keyword("process") + name.setResultsName("processName").setParseAction(process_name) + Suppress(open_block) - ZeroOrMore( (primary_decl ^ action_decl )).setResultsName("block") - Suppress(close_block))

def arr_to_json(orig_arr):
    arr = copy.deepcopy(orig_arr)
    global glob_cur_path
    global glob_d
    d = copy.deepcopy(glob_d)
    cur_path = d["process"]["contains"]
    glob_d = {"process": {"contains": {}, "type": "process", "name": ""}}
    glob_cur_path = glob_d["process"]["contains"]
    stack = []
    count = -1
    for item in arr:
        key = str(len(cur_path.keys()))
        if item["type"] == "devs.Coupled":
            cur_path[key] = {
                "type": item["attrs"]["name"],
                "name": item["name"],
                "contains": {}
            }
        else:
            requires = ""
            provides = ""
            for i in item["RequiresIn"]:
                requires += i["relop"]
                requires += i["resource"]
                if i["attribute"] != "":
                    requires +=  "." + i["attribute"]
                if i["operator"] != "":
                    requires += i["operator"] + "\"" +  i["value"] + "\""

            for i in item["ProvidesIn"]:
                provides += i["relop"]
                provides += i["resource"]
                if i["attribute"] != "":
                    provides +=  "." + i["attribute"]
                if i["operator"] != "":
                    provides += i["operator"] + "\"" + i["value"] + "\""

            cur_path[key] = {
                "type": "action",
                "name": item["nameIn"],
                "requires": requires,
                "provides": provides,
                "agents": item["AgentsIn"],
                "script": "".join(item["scriptIn"]),
                "tools": []
            }

        if "embeds" in item.keys():
            stack.append(cur_path)
            count = len(item["embeds"])
            cur_path = cur_path[key]["contains"]
        elif count == 0:
            cur_path = stack.pop()

        count -= 1


    return d

def parse(filename):
    global glob_arr
    glob_arr = []
    with open(filename, 'r') as f:
        pml = f.read()

    process_decl.ignore(cStyleComment)
    process_decl.parseString(pml)

    #pp = pprint.PrettyPrinter(indent=2)
    #pp.pprint(arr_to_json(glob_arr))

    return {"cells": glob_arr}

if __name__ == "__main__":
    pp = pprint.PrettyPrinter(indent=2)
    pp.pprint(parse(sys.argv[1]))
