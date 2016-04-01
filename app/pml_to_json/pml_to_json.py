from pyparsing import MatchFirst, cStyleComment, Suppress,Combine,ParseSyntaxException, ParseException,Forward, QuotedString, ZeroOrMore, OneOrMore, Optional, Word, Literal, Or, Keyword, Group, alphas, alphanums, nums, printables
import sys
import pprint
import copy

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
    "embeds": []
}

d = {}
arr = []

def add_action(string, loc, toks):
    toks = toks[0]
    #print toks
    action = copy.deepcopy(template)
    action["type"] = "html.Element"
    action["nameIn"] = toks[1]
    action["attrs"] = {}
    action["label"] = "Action"
    action["id"] = level
    action["scriptsIn"] = ""
    action["AgentsIn"] = []
    action["RequiresIn"] = []
    action["ProvidesIn"] = []

    if len(level) > 1:
        action["parent"] = level[:-2]
        arr[len(arr) - int(level[-1])]["embeds"].append(level)

    for i, item in enumerate(toks):
        if i <= 1:
            continue
        if item[0] == "script":
            action["scriptIn"] = "".join(item[1])
        elif item[0] == "agent":
            action["AgentsIn"].append("".join(item[1]))
        elif item[0] == "requires":
            action["RequiresIn"].append("".join(item[1]))
        elif item[0] == "provides":
            action["ProvidesIn"].append("".join(item[1]))

    arr.append(action)
    increment_level()


def add_primary(string, loc, toks):
    primary = copy.deepcopy(template)
    primary["attrs"] = {}
    primary["childCount"] = 0
    primary["id"] = level
    if len(level) > 1:
        primary["parent"] = level[:-2]
        arr[len(arr) - int(level[-1])]["embeds"].append(level)
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

    arr.append(primary)


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


process_decl = (Keyword("process") + name.setResultsName("processName") + Suppress(open_block) - ZeroOrMore( (primary_decl ^ action_decl )).setResultsName("block") - Suppress(close_block))


def parse(filename):
    d = {}

    with open(filename, 'r') as f:
        pml = f.read()

    process_decl.ignore(cStyleComment)
    process_decl.parseString(pml)

    return {"cells": arr}

if __name__ == "__main__":
    pp = pprint.PrettyPrinter(indent=2)
    pp.pprint(parse(sys.argv[1]))
