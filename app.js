const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const convertDbObjToPlayersResponseObj = (dbObj) => {
  return {
    playerId: dbObj.player_id,
    playerName: dbObj.player_name,
  };
};

// Get Players API

app.get("/players/", async (request, response) => {
  const getPlayersQuery = `
    SELECT
        *
    FROM 
        player_details;`;
  const dbResponse = await db.all(getPlayersQuery);
  response.send(
    dbResponse.map((eachPlayer) => convertDbObjToPlayersResponseObj(eachPlayer))
  );
});

// Get Players API

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
    SELECT
        *
    FROM 
        player_details
    WHERE
        player_id = ${playerId};`;
  const dbResponse = await db.get(getPlayerQuery);
  response.send(convertDbObjToPlayersResponseObj(dbResponse));
});

//Update Player API

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayerQuery = `
    UPDATE
        player_details
    SET
        player_name = '${playerName}'
    WHERE 
        player_id = ${playerId};`;
  const dbResponse = await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

const convertDbObjToMatchResponseObj = (dbObj) => {
  return {
    matchId: dbObj.match_id,
    match: dbObj.match,
    year: dbObj.year,
  };
};

//Get Match API

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `
    SELECT
        *
    FROM 
        match_details
    WHERE
        match_id = ${matchId};`;
  const dbResponse = await db.get(getMatchQuery);
  response.send(convertDbObjToMatchResponseObj(dbResponse));
});

const convertDbObjToPlayerMatchResponseObj = (dbObj) => {
  return {
    matchId: dbObj.match_id,
    match: dbObj.match,
    year: dbObj.year,
  };
};

// Get Player Match Detail API

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerMatchQuery = `
    SELECT 
        *
    FROM 
       player_match_score NATURAL JOIN match_details 
    WHERE 
        player_id = ${playerId};`;
  const dbResponse = await db.all(getPlayerMatchQuery);
  response.send(
    dbResponse.map((eachPlayerMatch) =>
      convertDbObjToPlayerMatchResponseObj(eachPlayerMatch)
    )
  );
});

const convertDbObjToPlayersMatchResponseObj = (dbObj) => {
  return {
    playerId: dbObj.player_id,
    playerName: dbObj.player_name,
  };
};

// Get Players of Match API

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getMatchPlayersQuery = `
    SELECT
        *
    FROM
        player_match_score NATURAL JOIN match_details AS T 
        NATURAL JOIN player_details
    WHERE
        match_id = ${matchId};`;
  const dbResponse = await db.all(getMatchPlayersQuery);
  response.send(
    dbResponse.map((eachMatchPlayers) =>
      convertDbObjToPlayersMatchResponseObj(eachMatchPlayers)
    )
  );
});

// Get Total Score of Player API

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerScoresQuery = `
    SELECT
        player_details.player_id AS playerId,
        player_details.player_name AS playerName,
        SUM(score) AS totalScore,
        SUM(fours) AS totalFours,
        SUM(sixes) AS totalSixes
    FROM
        player_match_score INNER JOIN player_details 
        ON player_match_score.player_id = player_details.player_id
    WHERE 
        player_details.player_id = ${playerId};`;
  const dbResponse = await db.get(getPlayerScoresQuery);
  response.send(dbResponse);
});

module.exports = app;
