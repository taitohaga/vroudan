# 3D Visualization of VR Crosswalking Project

## How to use


```
# Clone the repo and enter the directory
git clone https://github.com/taitohaga/vroudan.git
cd vroudan

# Build DB by executing the python script and the SQL script
# included in the repo.
# You have to give the path to the VR Crosswalking data.
python build_db.py path/to/data

# And then start up your web server
# such as python's built-in http.server
python -m http.server
```

