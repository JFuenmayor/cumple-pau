import Confetti from "react-confetti"; // import the Confetti component
import styles from "./App.module.css";
import Otter from "./assets/otter.svg";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  a,
  animated,
  to as interpolate,
  useSpring,
  useSprings,
  useTransition,
} from "@react-spring/web";
import { useDrag } from "react-use-gesture";

function handleState(currentState: number) {
  if (currentState < 3) {
    // Advance to the next state
    return currentState + 1;
  } else if (currentState === 3) {
    // Cannot advance beyond state 4, go back to state 3
    return 2;
  } else if (currentState === 2) {
    // Can only go to state 4 from state 3
    return 3;
  } else {
    // Invalid state, return current state
    return currentState;
  }
}

const to = (i: number) => ({
  x: 0,
  y: i * -4,
  scale: 1,
  rot: -10 + Math.random() * 20,
  delay: i * 100,
});
const from = (_i: number) => ({ x: 0, rot: 0, scale: 1.5, y: -1000 });
// This is being used down there in the view, it interpolates rotation and scale into a css transform
const trans = (r: number, s: number) =>
  `perspective(1500px) rotateX(30deg) rotateY(${
    r / 10
  }deg) rotateZ(${r}deg) scale(${s})`;

const messages = [
  { title: "Felis cumpliaños", message: "dalee click para avanzar guapa" },
  { title: "", message: "" },
  { title: "Val says", message: "" },
  {
    title: "Jorge Says",
    message:
      "Hail Friendship, hoy más que nunca y sobre todas las cosas: hail friendship para siempre cumpleañera, le agradezco a la vida por tenerte en ella... hagamos que esa pila de fotos sea infinita",
  },
];

const cards = [
  "/hf1.jpg",
  "/hf2.jpg",
  "/hf3.jpg",
  "/hf4.jpg",
  "/hf5.jpg",
  "/hf6.jpg",
  "/hf7.jpg",
  "/hf8.jpg",
  "/hf9.jpg",
  "/hf10.jpg",
  "/hf11.jpg",
  "/hf12.jpg",
  "/hf13.jpg",
  "/hf14.jpg",
  "/hf15.jpg",
];

const Message = (props: { current: number }) => {
  console.log(props.current);
  return (
    <div
      style={{
        width: "100%",
        height: "50%",
        paddingTop: "2rem",
        color: "#302A38",
        display: "grid",
        placeItems: "center",
      }}
    >
      <div style={{ fontSize: "2.5rem", fontWeight: "800" }}>
        {messages[props.current].title}
      </div>
      <div style={{ width: "60%", paddingTop: "1rem" }}>
        {messages[props.current].message}
      </div>
    </div>
  );
};

function App() {
  const [flipped, setFlipped] = useState(false);
  const [currentState, setCurrentState] = useState(0);
  const [gone] = useState(() => new Set());
  const [props, api] = useSprings(cards.length, (i) => ({
    ...to(i),
    from: from(i),
  }));
  const { transform, opacity } = useSpring({
    opacity: flipped ? 1 : 0,
    transform: `perspective(600px) rotateX(${flipped ? 180 : 0}deg)`,
    config: { mass: 5, tension: 500, friction: 80 },
  });

  const ref = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [items, set] = useState<string[]>([]);
  const otterTransition = useSpring({
    from: {
      transform: "translateY(0) rotate(0deg)",
    },
    to: async (next) => {
      while (currentState > 1) {
        await next({
          transform: "translateX(15%) translateY(-7%) rotate(12deg)",
        });
        await next({
          transform: "translateX(-15%) translateY(0%) rotate(0deg)",
        });
        await next({
          transform: "translateX(0%) translateY(0%) rotate(0deg)",
        });
        await next({
          transform: "translateX(15%) translateY(0%) rotate(0deg)",
        });
        await next({
          transform: "translateX(-15%) translateY(7%) rotate(-12deg)",
        });
      }
    },
    config: {
      tension: 100,
      friction: 20,
      mass: 2,
    },
  });
  const transitions = useTransition(items, {
    from: {
      opacity: 0,
      height: 0,
      innerHeight: 0,
      transform: "perspective(600px) rotateX(0deg)",
      color: "#8fa5b6",
    },
    enter: [
      { opacity: 1, height: 40, innerHeight: 40 },
      { transform: "perspective(600px) rotateX(180deg)", color: "#28d79f" },
      { transform: "perspective(600px) rotateX(0deg)" },
    ],
    leave: [
      { color: "#c23369" },
      { innerHeight: 0 },
      { opacity: 0, height: 0 },
    ],
    update: { color: "#28b4d7" },
  });

  const reset = useCallback(() => {
    if (currentState > 1) {
      ref.current.forEach(clearTimeout);
      ref.current = [];
      set([]);
      ref.current.push(
        setTimeout(() => set(["Happy", "Birthday", "PAULAA!"]), 2000)
      );
      ref.current.push(setTimeout(() => set(["Te", "Amamos"]), 6000));
      ref.current.push(setTimeout(() => set(["Hail", "Friendship"]), 10000));
    }
  }, [currentState]);

  const bind = useDrag(
    ({ args: [index], down, movement: [mx], direction: [xDir], velocity }) => {
      const trigger = velocity > 0.2; // If you flick hard enough it should trigger the card to fly out
      const dir = xDir < 0 ? -1 : 1; // Direction should either point left or right
      if (!down && trigger) gone.add(index); // If button/finger's up and trigger velocity is reached, we flag the card ready to fly out
      api.start((i) => {
        if (index !== i) return; // We're only interested in changing spring-data for the current spring
        const isGone = gone.has(index);
        const x = isGone ? (200 + window.innerWidth) * dir : down ? mx : 0; // When a card is gone it flys out left or right, otherwise goes back to zero
        const rot = mx / 100 + (isGone ? dir * 10 * velocity : 0); // How much the card tilts, flicking it harder makes it rotate faster
        const scale = down ? 1.1 : 1; // Active cards lift up a bit
        return {
          x,
          rot,
          scale,
          delay: undefined,
          config: { friction: 50, tension: down ? 800 : isGone ? 200 : 500 },
        };
      });
      if (!down && gone.size === cards.length)
        setTimeout(() => {
          gone.clear();
          api.start((i) => to(i));
        }, 600);
    }
  );

  useEffect(() => {
    reset();
    return () => ref.current.forEach(clearTimeout);
  }, [reset]);

  useEffect(() => {
    if (currentState === 1) {
      // Play audio on state 2
      const audio = new Audio("/blue-lobster-meme-4k-high-quality-audio.mp3");
      audio.play();
      return () => {
        // Cleanup audio when component unmounts or state changes
        audio.pause();
        audio.currentTime = 0;
      };
    }
  }, [currentState]);

  useEffect(() => {
    if (currentState === 2) {
      // Play audio on state 2
      const audio = new Audio("/chichi-peralta-procura.mp3");
      audio.play();
    }
  }, [currentState]);

  console.log(currentState);
  return (
    <div className={styles.container}>
      <div className={styles.main}>
        {currentState > 1 && <Confetti />}
        {currentState > 1 &&
          transitions(({ innerHeight, ...rest }, item) => (
            <animated.div
              className={styles.transitionsItem}
              style={rest}
              onClick={reset}
            >
              <animated.div style={{ overflow: "hidden", height: innerHeight }}>
                {item}
              </animated.div>
            </animated.div>
          ))}
        <div
          className={styles["container-card"]}
          onClick={() => {
            setFlipped((state) => !state);
            setCurrentState((x) => handleState(x));
          }}
        >
          {currentState > 1 && (
            <>
              <animated.div style={otterTransition} className={styles.otter}>
                <img src={Otter} />
              </animated.div>
            </>
          )}

          <a.div
            className={`${styles.c} ${styles.back}`}
            style={{ opacity: opacity.to((o) => 1 - o), transform }}
          >
            <Message current={currentState} />
          </a.div>
          <a.div
            className={`${styles.c}  ${
              currentState !== 1 ? styles.front : styles.lobster
            }`}
            style={{
              opacity,
              transform,
              rotateX: "180deg",
            }}
          >
            <Message current={currentState} />
          </a.div>
        </div>
        {currentState > 1 && (
          <>
            {props.map(({ x, y, rot, scale }, i) => (
              <animated.div className={styles.deck} key={i} style={{ x, y }}>
                {/* This is the card itself, we're binding our gesture to it (and inject its index so we know which is which) */}
                <animated.div
                  {...bind(i)}
                  style={{
                    transform: interpolate([rot, scale], trans),
                    backgroundImage: `url(${cards[i]})`,
                  }}
                />
              </animated.div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

export default App;
