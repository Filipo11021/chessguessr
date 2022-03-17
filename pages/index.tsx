import type { NextPage } from "next";
import React, {
  ReactFragment,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import Chess, { ChessInstance } from "chess.js";
import pgnParser from "pgn-parser";
import { Chessboard } from "react-chessboard";

type Game = {
  pgn: string;
  black_elo: number;
  white_elo: number;
  game_url: string;
};

type Info = {
  score: number;
  avgElo: number;
};

type Moves = {
  move: string;
  move_number?: number;
};

const Home: NextPage = () => {
  const [gameData, setGameData] = useState<Game>();
  const [game, setGame] = useState<ChessInstance>();
  const [moves, setMoves] = useState<Moves[]>([]);
  const [currentMoves, setCurrentMoves] = useState<any>([]);
  const [fen, setFen] = useState<any>();
  const gameElement = useRef<HTMLDivElement>(null);
  const [boardWidth, setBoardWidth] = useState(0);
  const [elo, setElo] = useState<number | "">("");
  const [info, setInfo] = useState<Info>();
  const [showMoves, setShowMoves] = useState(true);
  const matchResult = useRef("");

  const fetchGame = async () => {
    const res = await fetch("/api/game");
    const data = await res.json();

    setGameData(data);
  };

  useEffect(() => {
    fetchGame();
  }, []);

  useEffect(() => {
    const changeWidth = () => {
      if (gameElement.current) {
        setBoardWidth(gameElement.current.offsetWidth);
      }
    };

    changeWidth();

    window.addEventListener("resize", changeWidth);
    return () => {
      window.removeEventListener("resize", changeWidth);
    };
  }, [showMoves]);

  useEffect(() => {
    if (gameData) {
      const [result, a] = pgnParser.parse(gameData.pgn);
      matchResult.current = result.result;
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

  const prevHandler = useCallback(() => {
    console.log(currentMoves.length, "<=", 0);
    if (currentMoves.length <= 0) return;
    setCurrentMoves((m: string[]) => moveHandler(m, "prev"));
  }, [currentMoves.length]);

  const nextHandler = useCallback(() => {
    console.log(currentMoves.length, ">=", moves.length);
    console.log("current", currentMoves.length);
    if (currentMoves.length >= moves.length) return;
    setCurrentMoves((m: string[]) => moveHandler(m, "next"));
  }, [currentMoves.length, moves.length]);

  const moveHandler = (
    current: string[] | number,
    option: "next" | "prev" | "target"
  ) => {
    console.log("current", currentMoves.length);
    const copyAll = [...moves];

    if (option === "prev" && Array.isArray(current)) {
      copyAll.length = current.length - 1;
    } else if (option === "next" && Array.isArray(current)) {
      copyAll.length = current.length + 1;
    } else if (option === "target" && Number.isInteger(current)) {
      console.log(current);
      copyAll.length = current as number;
    }
    console.log(moves);
    const parsed = copyAll
      .map((e: any) => {
        return `${e.move_number ? `${e.move_number}.` : ""} ${e.move}`;
      })
      .join(" ");

    game?.load_pgn(parsed);
    setFen(game?.fen());
    console.log(copyAll.length);
    return copyAll;
  };

  const getResult = (userInput: number) => {
    if (!gameData) return;

    const avgElo = (gameData.white_elo + gameData.black_elo) / 2;
    const x = Math.max(Math.min(userInput - avgElo, 1000), -1000);
    const score = Math.round(
      2500 * (Math.sin((x * Math.PI) / 1000 + Math.PI / 2) + 1)
    );
    return { score, avgElo };
  };

  const submitHandler = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!elo || elo > 3500 || elo <= 0) return;
    console.log(typeof elo);
    const result = getResult(elo as number);
    setInfo(result);
  };

  const newGameHandler = async () => {
    setElo("");
    setInfo(undefined);
    await fetchGame();
  };

  useEffect(() => {
    const arrowNavigation = (e: KeyboardEvent) => {
      console.log("okok");
      console.log(e.key);
      if (e.key === "ArrowLeft") {
        console.log("left");
        prevHandler();
      } else if (e.key === "ArrowRight") {
        nextHandler();
      }
    };

    window.addEventListener("keydown", arrowNavigation);

    return () => {
      window.removeEventListener("keydown", arrowNavigation);
    };
  }, [nextHandler, prevHandler]);

  return (
    <div className="bg-slate-600 py-5 px-3 min-h-screen flex justify-center items-center">
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

        <div className="flex flex-col justify-center items-center w-full max-w-[initial] mx-0 lg:max-w-[400px] lg:mx-5  mt-3">
          <div className="bg-slate-400 w-full px-5 py-3">
            <h3 className="font-bold text-xl">Guess the ELO</h3>
            {info ? (
              <>
                <p className="text-lg my-1">Your score is {info.score}/5000</p>
                <p className="text-lg mb-1">You guessed {elo}. The correct elo is {info.avgElo}</p>
                <a
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold underline mb-2 block text-lg"
                  href={gameData?.game_url}
                >
                  game
                </a>
                <button
                  onClick={newGameHandler}
                  className="text-white bg-black py-2 px-4 mt-2 w-full"
                >
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
            )}
          </div>
          <div className="w-full">
            {/* boardMoves */}

            <div className="flex flex-wrap overflow-y-scroll bg-slate-400 mt-4 p-2 max-h-96">
              {moves && showMoves ? (
                <>
                  {moves.map((m, index) => (
                    <React.Fragment key={index}>
                      {m.move_number && `${m.move_number}.`}
                      <button
                        onClick={() =>
                          setCurrentMoves((m: string[]) =>
                            moveHandler((index + 1) as number, "target")
                          )
                        }
                        key={index}
                        className={`px-1 hover:bg-slate-200 font-bold ${
                          index + 1 === currentMoves.length && "bg-slate-500"
                        }`}
                      >
                        {m.move}
                      </button>
                    </React.Fragment>
                  ))}
                  {matchResult.current}
                </>
              ) : (
                <span className="text-center w-full">
                  move: {Math.round(currentMoves.length / 2)}
                </span>
              )}
            </div>

            <button
              onClick={() => setShowMoves((s) => !s)}
              className="text-white bg-black py-2 px-4 mt-2 w-full"
            >
              {showMoves ? "hide moves" : "show moves"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
