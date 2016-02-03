#!/usr/bin/env python
#the above line will use python in virtualenv if set

from app import app
app.run(host="0.0.0.0", debug=True)
