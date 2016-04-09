# -*- coding: utf-8 -*-
#!flask/bin/python

import os
import unittest
import sys
sys.path.append('..')
import sample_strings
from app.views.home import allowed_file
from utils import print_test_time_elapsed
from app.pml_to_json.pml_to_json import parse

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
        pass


if __name__ == '__main__':
    unittest.main()
