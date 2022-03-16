import type { NextPage } from "next";
import { useEffect, useRef, useState } from "react";
import Chess from "chess.js";
import pgnParser from "pgn-parser";

import { Chessboard } from "react-chessboard";


type Game = {
  pgn: string;
  black_elo: number;
  white_elo: number;
  game_url: string;
};

const Home: NextPage = () => {
  const [gameData, setGameData] = useState<Game>();
  const [game, setGame] = useState<any>();
  const [moves, setMoves] = useState<any>([]);
  const [currentMoves, setCurrentMoves] = useState<any>([]);
  const [fen, setFen] = useState<any>();
  const gameElement = useRef();
  const [boardWidth, setBoardWidth] = useState(0);
  const [elo, setElo] = useState<number>();
  const [info, setInfo] = useState("");

  const fetchGame = async () => {
    const res = await fetch("/api/game");
    const data = await res.json();

    setGameData(data);
  };

  useEffect(() => {
    setBoardWidth(gameElement?.current?.offsetWidth);
    const changeWidth = () => {
      setBoardWidth(gameElement?.current?.offsetWidth);
    };

    window.addEventListener("resize", changeWidth);
    fetchGame();

    return () => window.removeEventListener("resize", changeWidth);
  }, []);

  useEffect(() => {
    if (gameData) {
      const [result] = pgnParser.parse(gameData.pgn);

      setMoves(result.moves);
      setCurrentMoves([]);

      const p = result.moves
        .map((e) => {
          return `${e.move_number ? `${e.move_number}.` : ""} ${e.move}`;
        })
        .join(" ");
      const ch = new Chess();
      ch.load_pgn("");
      setFen(ch.fen());

      setGame(ch);
    }
  }, [gameData]);

  const prevHandler = () => {
    if (currentMoves.length <= 0) return;
    setCurrentMoves((m: string[]) => moveHandler(m, "prev"));
  };

  const nextHandler = () => {
    if (currentMoves.length >= moves.length) return;
    setCurrentMoves((m: string[]) => moveHandler(m, "next"));
  };

  const moveHandler = (current: string[], option: "next" | "prev") => {
    const copyAll = [...moves];

    if (option === "prev") {
      copyAll.length = current.length - 1;
    } else if (option === "next") {
      copyAll.length = current.length + 1;
    }

    const parsed = copyAll
      .map((e: any) => {
        return `${e.move_number ? `${e.move_number}.` : ""} ${e.move}`;
      })
      .join(" ");

    game.load_pgn(parsed);
    setFen(game.fen());

    return copyAll;
  };

  const getResult = (userInput:number) => {
    const realElo = (gameData?.white_elo + gameData?.black_elo ) /2
    const x = Math.max(Math.min(userInput - realElo, 1000), -1000);
    const score = Math.round(
      2500 * (Math.sin((x * Math.PI) / 1000 + Math.PI / 2) + 1)
    );
    return {score, avg:realElo}
  };

  const submitHandler = (e) => {
    e.preventDefault();
    const {avg, score} = getResult(elo as number)
    setInfo(`${score}/5000 avg elo: ${avg}`)
  };

  const newGameHandler = async () => {
    setElo(undefined)
    setInfo('')
    await fetchGame()
  }

  return (
    <div className="bg-slate-600 min-h-screen flex justify-center items-center">
      <div className="container mx-auto flex flex-col max-w-[600px]  lg:flex-row lg:max-w-[1100px]">
        <div className="w-full">
          <div ref={gameElement} className="w-full">
            {fen && <Chessboard boardWidth={boardWidth} position={fen} />}
          </div>
          <div className="flex">
            {currentMoves.length > 0 && (
              <button
                className="px-6 py-3 mx-2 bg-black text-white flex-1"
                onClick={prevHandler}
              >
                prev
              </button>
            )}
            {currentMoves.length < moves.length && (
              <button
                className="px-6 py-3 bg-black mx-2 text-white flex-1"
                onClick={nextHandler}
              >
                next
              </button>
            )}
          </div>
        </div>

        <div className="flex justify-center items-center mx-5 min-w-0 sm:min-w-[300px] mt-3">
          <div className="bg-slate-400 w-full px-5 py-3">
            <h3 className="font-bold text-xl">Guess the ELO</h3>
            {info ? (
              <>
              <p className="my-2">{info}</p>
              <a  target='_blank' rel="noreferrer"  className="font-bold underline mb-2 block text-lg" href={gameData?.game_url}>game</a>
              <button onClick={newGameHandler} className="text-white bg-black py-2 px-4 mt-2 w-full">
                new game
              </button>
              </>
            ) : (
              <form onSubmit={submitHandler}>
              <div className="">
                <label htmlFor="elo-input" className="my-2 block">
                  ELO (between 0 and 3500):
                </label>
                <input
                  id="elo-input"
                  className="w-full"
                  type="number"
                  required
                  value={elo}
                  onChange={(e) => setElo(+e.target.value)}
                />
              </div>
              <button className="text-white bg-black py-2 px-4 mt-2 w-full">
                submit
              </button>
            </form>
            )
          }
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
