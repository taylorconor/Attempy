# -*- coding: utf-8 -*-
import json
import time

# Used as decorator
def print_test_time_elapsed(method):
    """
    Utility method for print verbalizing test suite, prints out
    time taken for test and functions name, and status
    """

    def run(*args, **kw):
        ts = time.time()
        print('\n[..] Testing function: %r' % method.__name__)
        method(*args, **kw)
        te = time.time()
        print('[OK] in %r %2.2f sec' % (method.__name__, te - ts))

    return run

# test if a string is valid JSON
def is_json(myjson):
    try:
        json_object = json.loads(myjson)
    except (ValueError, e):
        return False
    return True
