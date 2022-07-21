import sqlite3
import pandas as pd
import glob
import os
import sys

dbname = "vroudan.sqlite3"

if os.path.exists(dbname):
    os.remove(dbname)
con = sqlite3.connect(dbname)

with open("build.sql", 'r') as f:
    sql = f.read()
    con.executescript(sql)


root = "VR道路横断/データ"
if len(sys.argv) < 2:
    root = input("データへのパス: ")
else:
    root = sys.argv[1]
root_path = os.path.join(root, "**/games.csv")

print("Root Path:", root_path)
for game_path in glob.glob(root_path, recursive=True):
    game_dir = os.path.dirname(game_path)
    print("Game Dir:", game_dir)
    games = pd.read_csv(game_path)
    for idx, row in games.iterrows():
        row = row.tolist()
        con.execute("""INSERT INTO games
                VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);""",
                row)
        id_ = str(row[1])[-3:]
        objectlog = pd.read_csv(
                os.path.join(game_dir, "objectlog" + id_ + ".csv"))
        for idx, row in objectlog.iterrows():
            row = row.tolist()
            row[0] = row[0] * 1000 + int(id_)
            con.execute("""INSERT INTO objectlog
                VALUES(?, ?, ?, ?, ?, ?, ?);""",
                row)
        playerlog = pd.read_csv(
                os.path.join(game_dir, "playerlog" + id_ + ".csv"))
        for idx, row in playerlog.iterrows():
            row = row.tolist()
            row[0] = row[0] * 1000 + int(id_)
            con.execute("""INSERT INTO playerlog
                VALUES(?, ?, ?, ?, ?, ?, ?, ?);""",
                row)


con.commit()
con.close()
