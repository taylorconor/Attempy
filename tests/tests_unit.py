# -*- coding: utf-8 -*-
#!flask/bin/python

import os
import unittest
import sys
sys.path.append('..')
import sample_strings
from app.views.home import allowed_file
from utils import print_test_time_elapsed
import app.pml_to_json.pml_to_json as pml_to_json

class TestCase(unittest.TestCase):


    def tearDown(self):
        pass

    @print_test_time_elapsed
    def test_00_allowed_file(self):
        """
        Test allowed Filenames
        """
        assert allowed_file("test.pml")
        assert not allowed_file("test.html")
        assert not allowed_file("test")
        assert not allowed_file("test.pml.txt")
        assert not allowed_file("test.")
        assert not allowed_file("")
        assert not allowed_file(".........")

    def test_01_pml_to_json(self):
        test_dir = "pml_testfiles"
        for i in os.listdir(test_dir):
            if i.endswith(".pml"):
                path = os.path.join(test_dir, i)
                try:
                    print "Testing parser can load file: " + i
                    pml_to_json.parse(path)
                except:
                    self.fail("Parser broken on parsing file: " + i)

        output = pml_to_json.parse(os.path.join(test_dir, "test_parser.pml"))
        print "Testing that the parser output matches expected output"
        try:
            assert "cells" in output.keys()
            assert output["cells"][0]["type"] == "html.Element"
            assert output["cells"][0]["nameIn"] == "a1"
            assert output["cells"][0]["RequiresIn"][0] == {
                "attribute": "",
                "operator": "",
                "relOp": "",
                "resource": "require1",
                "value": ""
            }
            assert output["cells"][0]["ProvidesIn"][0] == {
                "resource": "provide1",
                "attribute": "attr",
                "operator": "==",
                "value": "val",
                "relOp": ""
            }
            assert output["cells"][0]["ProvidesIn"][1] == {
                "resource": "provide2",
                "attribute": "attr",
                "operator": "==",
                "value": "val2",
                "relOp": "&&"
            }

            #test that it has only one child
            assert len(output["cells"][1]["embeds"]) == 1
            #test that embeds embeds the right element id
            assert output["cells"][1]["embeds"][0] == output["cells"][2]["id"]
            #test that nested items have the right children
            assert len(output["cells"][3]["embeds"]) == 2
            assert output["cells"][3]["embeds"][0] == output["cells"][4]["id"]
            assert output["cells"][4]["attrs"]["name"] == "branch"

            #test that last action is correct
            assert output["cells"][-1]["nameIn"] == "a5"
            assert output["cells"][-1]["RequiresIn"][0]["resource"] == "require2"
            assert output["cells"][-1]["AgentsIn"][0]["resource"] == "carer"
        except:
            self.fail("Parser output does not match expected output")


if __name__ == '__main__':
    unittest.main()
