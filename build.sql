CREATE TABLE "games" (
	"date"	INTEGER,
	"gameid"	INTEGER,
	"stageid"	INTEGER,
	"playerid"	INTEGER,
	"hit_time"	TEXT,
	"hit_object"	INTEGER,
	"run_pattern"	INTEGER,
	"whether"	INTEGER,
	"car_type"	TEXT,
	"sex"	INTEGER,
	"age"	INTEGER,
	"license"	INTEGER,
	"finish_time"	TEXT
);

CREATE TABLE "objectlog" (
	"gameid"	INTEGER,
	"timestamp"	TEXT,
	"carID"	INTEGER,
	"posX"	INTEGER,
	"posZ"	INTEGER,
	"carSpeed"	INTEGER,
	"carType"	TEXT
);

CREATE TABLE "playerlog" (
	"gameid"	INTEGER,
	"timestamp"	TEXT,
	"posX"	REAL,
	"posY"	REAL,
	"posZ"	REAL,
	"rotX"	REAL,
	"rotY"	REAL,
	"rotZ"	REAL
);
